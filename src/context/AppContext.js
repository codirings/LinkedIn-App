import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '../utils/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import ENV from '../config/env.generated';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from '@react-native-firebase/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { SAMPLE_PEOPLE } from '../data/samplePeople';
import * as social from '../services/social';
import * as jobSvc from '../services/jobs';
import * as notes from '../services/notifications';
import { dismissSuggestion, patchSelf, subscribeSelf } from '../services/users';
import { setPresence, startPresence } from '../services/presence';
import { DEFAULT_SETTINGS, subscribeToAccountDisabled, subscribeToAdminStatus, subscribeToSettings } from '../services/admin';
import { RELATION, relationshipOf } from '../utils/relationship';
import { isOnline } from '../utils/presence';
import { APPLICATION_STATUSES, CATALOG_OWNER, applicationNotice, formatSalary, toMillis, validateJobInput } from '../utils/jobs';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const K_RESET_EMAIL = 'linkedin:password-reset:email';
const K_RESET_STATE = 'linkedin:password-reset:state';
const DEMO_DELAY_MS = 30000;
const PROFILE_FIELDS = ['headline', 'company', 'location', 'about', 'interests'];
const WEB_CLIENT_ID = ENV.GOOGLE_WEB_CLIENT_ID; // from .env (see .env.example)

const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const swap = (list, id, patch) => list.map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x));
const arr = (value) => (Array.isArray(value) ? value : []);
const normalizeEmail = (email) => email.trim().toLowerCase();
const asUsername = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const isUrl = (v) => typeof v === 'string' && /^https?:\/\//.test(v);
const isRemoteConversation = (cid) => String(cid).includes('~');
const storageErrorMessage = (error) => (error instanceof Error ? error.message : String(error));
const authMessage = (error) => {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
    'auth/network-request-failed': 'Could not connect. Check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase. Use Continue with Google.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
};
const postError = (verb) => (error) => Alert.alert(`Could not ${verb}`, `${error?.code ?? ''} ${error?.message ?? error}`.trim());
// A second application to the same job from another device is rejected by the rules.
const applyError = (error) => {
  if (String(error?.code || '').includes('permission-denied')) {
    throw new Error('You may have already applied, or this job is no longer open.');
  }
  throw error;
};

// Demo members that ship with the app. They live only in memory on this device, so the
// request/accept/message flows for them are simulated; real accounts always use Firestore.
const buildDemo = () => ({
  invites: [],
  connections: [],
  conversations: [],
  events: [],
  attending: [],
  people: SAMPLE_PEOPLE.map((p) => ({ ...p })),
});

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null); // { uid, email, displayName, photoURL }
  const [demo, setDemo] = useState(null); // in-memory demo members; null when signed out
  const [localAvatar, setLocalAvatar] = useState(null); // device-only photo (Storage needs the Blaze plan)
  const [self, setSelf] = useState(null); // live users/{uid}
  const [fsUsers, setFsUsers] = useState([]);
  const [fsConns, setFsConns] = useState([]);
  const [fsBlocks, setFsBlocks] = useState([]);
  const [fsConvs, setFsConvs] = useState([]);
  const [fsPosts, setFsPosts] = useState([]);
  const [fsJobs, setFsJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [ownerApps, setOwnerApps] = useState([]);
  const [fsNotes, setFsNotes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [storageError, setStorageError] = useState(null);
  const pendingName = useRef(null);
  const timers = useRef([]);
  const later = (ms, fn) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  // Creates users/{uid} on first sign-in and refuses disabled accounts.
  const hydrate = async (fu) => {
    const email = normalizeEmail(fu.email || `${fu.uid}@linkedin.app`);
    const ref = doc(getFirestore(), 'users', fu.uid);
    const startName = pendingName.current || fu.displayName || email.split('@')[0];
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          displayName: startName,
          email,
          photoURL: fu.photoURL || null,
          createdAt: serverTimestamp(),
          disabled: false,
          onboarded: false,
          online: false,
          lastActiveAt: serverTimestamp(),
          skills: [],
          experience: [],
          likedPosts: [],
          savedJobs: [],
          dismissedUsers: [],
        });
      } else if (snap.data()?.disabled === true) {
        Alert.alert('Account disabled', 'This account has been disabled by an administrator.');
        try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
        await firebaseSignOut(getAuth());
        return;
      }
    } catch (error) {
      setStorageError(storageErrorMessage(error));
    }
    pendingName.current = null;
    setDemo(buildDemo());
    setSession({ uid: fu.uid, email, displayName: startName, photoURL: fu.photoURL || null });
  };

  useEffect(() => {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    return onAuthStateChanged(getAuth(), async (fu) => {
      try {
        if (fu) await hydrate(fu);
        else { clearTimers(); setSession(null); setDemo(null); setSelf(null); }
      } catch (error) {
        setStorageError(storageErrorMessage(error));
      }
      setReady(true);
    });
  }, []);

  const uid = session?.uid ?? null;

  // Every live listener for the signed-in account. Dropping the uid tears them all down.
  useEffect(() => {
    if (!uid) {
      setSelf(null); setFsUsers([]); setFsConns([]); setFsBlocks([]); setFsConvs([]); setFsPosts([]);
      setFsJobs([]); setMyApps([]); setOwnerApps([]); setFsNotes([]); setIsAdmin(false); setSettings(DEFAULT_SETTINGS);
      return undefined;
    }
    const err = (error) => setStorageError(storageErrorMessage(error));
    const feed = query(collection(getFirestore(), 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const offs = [
      subscribeSelf(uid, setSelf, err),
      social.subscribeUsers(setFsUsers, err),
      social.subscribeConnections(uid, setFsConns, err),
      social.subscribeBlocks(uid, setFsBlocks, err),
      social.subscribeConversations(uid, setFsConvs, err),
      onSnapshot(feed, (snap) => setFsPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), err),
      jobSvc.subscribeJobs(setFsJobs, err),
      jobSvc.subscribeMyApplications(uid, setMyApps, err),
      jobSvc.subscribeApplicationsToMyJobs(uid, setOwnerApps, err),
      notes.subscribeNotifications(uid, setFsNotes, err),
      subscribeToAdminStatus(uid, setIsAdmin),
      subscribeToSettings(setSettings),
      subscribeToAccountDisabled(uid, async () => {
        Alert.alert('Account disabled', 'This account has been disabled by an administrator.');
        try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
        await firebaseSignOut(getAuth());
      }),
      startPresence(uid),
    ];
    return () => offs.forEach((off) => off());
  }, [uid]);

  // ---------- Derived, live state ----------
  const me = uid;
  const now = Date.now();
  const userMap = new Map(fsUsers.map((u) => [u.id, u]));
  const lastActiveOf = (u) => toMillis(u.lastActiveAt, 0);
  const asProfile = (u) => {
    const name = u.displayName || (u.email || '').split('@')[0] || 'Member';
    const lastActiveMs = lastActiveOf(u);
    return {
      id: u.id,
      name,
      username: u.username || asUsername(name),
      headline: u.headline || '',
      avatar: isUrl(u.photoURL) ? u.photoURL : null,
      company: u.company || '',
      location: u.location || '',
      about: u.about || '',
      experience: arr(u.experience),
      skills: arr(u.skills),
      reason: 'Member',
      tags: [],
      online: isOnline({ online: u.online, lastActiveMs }, now),
      lastActiveMs,
    };
  };
  const profOf = (id) => (userMap.has(id)
    ? asProfile(userMap.get(id))
    : { id, name: 'Member', headline: '', avatar: null, online: false, lastActiveMs: 0 });
  const short = (p) => ({ id: p.id, name: p.name, headline: p.headline, avatar: p.avatar, online: p.online, lastActiveMs: p.lastActiveMs });

  const selfFields = self || {};
  const displayName = session ? (selfFields.displayName || session.displayName || session.email.split('@')[0]) : '';
  const user = session ? {
    id: session.uid,
    email: session.email,
    name: displayName,
    username: selfFields.username || asUsername(displayName),
    headline: selfFields.headline || '',
    company: selfFields.company || '',
    location: selfFields.location || '',
    about: selfFields.about || '',
    skills: arr(selfFields.skills),
    experience: arr(selfFields.experience),
    interests: arr(selfFields.interests),
    avatar: localAvatar || (isUrl(selfFields.photoURL) ? selfFields.photoURL : null),
  } : null;
  const onboarded = !!session && (selfFields.onboarded === true || !!selfFields.headline);

  // Blocks: either direction hides the member from search, lists, posts and messages.
  const blockedByMe = new Set();
  const blockedMe = new Set();
  fsBlocks.forEach((b) => {
    const other = (b.users || []).find((x) => x !== me);
    if (other) (b.blockedBy === me ? blockedByMe : blockedMe).add(other);
  });
  const hidden = new Set([...blockedByMe, ...blockedMe]);

  // Connection documents keyed by the other member's uid.
  const links = new Map();
  fsConns.forEach((c) => {
    const other = (c.users || []).find((x) => x !== me);
    if (other) links.set(other, { ...c, other });
  });
  const linkRows = [...links.values()].filter((c) => !hidden.has(c.other));
  const linked = new Set(linkRows.map((c) => c.other));

  const localRelation = (id) => {
    if ((demo?.connections || []).some((c) => c.id === id)) return RELATION.CONNECTED;
    return (demo?.people || []).find((p) => p.id === id)?.status === 'pending' ? RELATION.OUTGOING : RELATION.NONE;
  };
  const relationFor = (id) => (userMap.has(id)
    ? relationshipOf(id, { me, links, blockedByMe, blockedMe })
    : localRelation(id));

  const dismissedReal = new Set(arr(selfFields.dismissedUsers));
  const registeredUsers = session
    ? fsUsers.filter((u) => u.id !== me && u.disabled !== true && !hidden.has(u.id)).map(asProfile)
    : [];
  const realIds = new Set(fsUsers.map((u) => u.id));
  const people = session ? [
    ...registeredUsers.map((p) => {
      const relation = relationFor(p.id);
      return { ...p, relation, status: relation === RELATION.OUTGOING ? 'pending' : null, dismissed: dismissedReal.has(p.id) };
    }),
    ...(demo?.people || []).filter((p) => !realIds.has(p.id)).map((p) => ({ ...p, relation: localRelation(p.id) })),
  ] : [];
  const fsConnList = linkRows.filter((c) => c.status === 'accepted').map((c) => short(profOf(c.other)));
  const fsInvites = linkRows.filter((c) => c.status === 'pending' && c.to === me).map((c) => short(profOf(c.other)));
  const connections = session ? [...fsConnList, ...(demo?.connections || []).filter((c) => !linked.has(c.id))] : [];
  const invites = session ? [...fsInvites, ...(demo?.invites || []).filter((i) => !linked.has(i.id))] : [];
  const blockedProfiles = [...blockedByMe].map((id) => profOf(id));

  const fsConvList = fsConvs
    .map((c) => ({ c, o: (c.users || []).find((x) => x !== me) }))
    .filter(({ o }) => o && !hidden.has(o))
    .map(({ c, o }) => {
      const p = profOf(o);
      const last = toMillis(c.lastTs, now);
      const vis = !!c.lastText && last > toMillis(c.clearedAt?.[me], 0);
      return {
        id: c.id,
        personId: o,
        name: p.name,
        headline: p.headline,
        avatar: p.avatar,
        unread: vis ? c.unread?.[me] || 0 : 0,
        hidden: !vis,
        remote: true,
        cleared: toMillis(c.clearedAt?.[me], 0),
        messages: vis ? [{ id: 'last', from: c.lastFrom === me ? 'me' : 'them', text: c.lastText, ts: last }] : [],
      };
    });

  const likedSet = new Set(arr(selfFields.likedPosts));
  const posts = session ? fsPosts.filter((p) => !hidden.has(p.authorId)).map((p) => ({
    id: p.id,
    authorId: p.authorId,
    mine: p.authorId === me,
    author: p.authorName || 'Member',
    avatar: p.authorPhotoUrl || null,
    headline: p.authorHeadline || '',
    ts: toMillis(p.createdAt, now),
    text: p.text || '',
    image: null,
    video: null,
    likes: Math.max(0, p.likeCount || 0),
    liked: likedSet.has(p.id),
    reposts: 0,
    commentCount: Math.max(0, p.commentCount || 0),
    edited: !!p.updatedAt,
  })) : [];

  const savedSet = new Set(arr(selfFields.savedJobs));
  const applicantCounts = new Map();
  ownerApps.forEach((a) => applicantCounts.set(a.jobId, (applicantCounts.get(a.jobId) || 0) + 1));
  const appliedJobIds = new Set(myApps.map((a) => a.jobId));
  const jobs = session ? fsJobs.map((j) => ({
    id: j.id,
    title: j.title || '',
    company: j.company || '',
    location: j.location || '',
    mode: j.mode || 'Remote',
    salary: formatSalary(j.salaryMin, j.salaryMax),
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    skills: arr(j.skills),
    requirements: arr(j.requirements),
    desc: j.desc || '',
    status: j.status || 'open',
    mine: j.postedBy === me,
    catalog: j.postedBy === CATALOG_OWNER,
    postedBy: j.postedBy,
    postedByName: j.postedByName || '',
    saved: savedSet.has(j.id),
    ts: toMillis(j.createdAt, now),
    applicantCount: applicantCounts.get(j.id) || 0,
  })) : [];

  const applications = myApps.map((a) => ({
    id: a.id,
    jobId: a.jobId,
    applicantId: a.applicantId,
    title: a.jobTitle || '',
    company: a.company || '',
    note: a.note || '',
    status: a.status || 'Submitted',
    ts: toMillis(a.createdAt, now),
  })).sort((a, b) => b.ts - a.ts);

  const ownerApplications = ownerApps.map((a) => ({
    id: a.id,
    jobId: a.jobId,
    title: a.jobTitle || '',
    company: a.company || '',
    applicantId: a.applicantId,
    applicantName: a.applicantName || 'Member',
    note: a.note || '',
    status: a.status || 'Submitted',
    ts: toMillis(a.createdAt, now),
  })).sort((a, b) => b.ts - a.ts);

  const notifications = session ? fsNotes.map((n) => ({
    id: n.id,
    text: n.text || '',
    icon: n.icon || 'notifications',
    kind: n.kind || '',
    target: n.target || null,
    read: n.read === true,
    ts: toMillis(n.createdAt, now),
  })) : [];

  const notifyMe = (recipientId, kind, text, icon, target) => notes.notify(recipientId, me, { kind, text, icon, target });

  // ---------- Actions ----------
  const acceptInvite = async (id) => {
    if (!me) return;
    if (userMap.has(id)) {
      await social.acceptRequest(me, id);
      notifyMe(id, 'connection_accepted', `${user.name} accepted your connection request`, 'people', { screen: 'Profile', userId: me });
      return;
    }
    const invite = (demo?.invites || []).find((item) => item.id === id);
    if (!invite) return;
    setDemo((d) => (d ? {
      ...d,
      invites: d.invites.filter((item) => item.id !== id),
      connections: d.connections.some((item) => item.id === id)
        ? d.connections
        : [{ id, name: invite.name, headline: invite.headline, avatar: invite.avatar }, ...d.connections],
    } : d));
  };

  const connect = (id) => {
    if (!me) return undefined;
    if (userMap.has(id)) {
      const rel = relationFor(id);
      if (rel === RELATION.INCOMING) return acceptInvite(id).catch(postError('accept the invitation'));
      if (rel !== RELATION.NONE) return undefined;
      return social.sendRequest(me, id)
        .then(() => notifyMe(id, 'connection_request', `${user.name} sent you a connection request`, 'person-add', { screen: 'Profile', userId: me }))
        .catch(postError('send the request'));
    }
    setDemo((d) => (d && !d.connections.some((c) => c.id === id) ? { ...d, people: swap(d.people, id, { status: 'pending' }) } : d));
    later(DEMO_DELAY_MS, () => setDemo((d) => {
      if (!d) return d;
      const person = d.people.find((p) => p.id === id);
      if (!person || person.status !== 'pending') return d;
      return {
        ...d,
        people: swap(d.people, id, { status: null }),
        connections: [{ id, name: person.name, headline: person.headline, avatar: person.avatar }, ...d.connections],
      };
    }));
    return undefined;
  };

  const demoPeople = (patch) => setDemo((d) => (d ? { ...d, people: swap(d.people, patch.id, patch.change) } : d));

  const actions = {
    // ---------- Auth ----------
    signUp: async ({ name, email, password }) => {
      try {
        pendingName.current = name.trim();
        const cred = await createUserWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
        try { await firebaseUpdateProfile(cred.user, { displayName: name.trim() }); } catch (e) { /* ignore */ }
        return null;
      } catch (error) {
        pendingName.current = null;
        return authMessage(error);
      }
    },
    signIn: async (email, password) => {
      try {
        await signInWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
        return null;
      } catch (error) {
        return authMessage(error);
      }
    },
    signInWithGoogle: async () => {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();
        if (response.type !== 'success') return null;
        const idToken = response.data.idToken;
        if (!idToken) return 'Google did not return an ID token.';
        await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
        return null;
      } catch (error) {
        return `${error?.code ?? ''} ${error?.message ?? error}`.trim();
      }
    },
    cancelPasswordReset: () => AsyncStorage.multiRemove([K_RESET_EMAIL, K_RESET_STATE]),
    signOut: async () => {
      clearTimers();
      if (me) await setPresence(me, false);
      try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
      await firebaseSignOut(getAuth());
    },
    completeOnboarding: (p) => {
      if (!me) return;
      patchSelf(me, {
        onboarded: true,
        headline: p.headline || user.headline,
        company: p.company || user.company,
        interests: p.interests || [],
      }).catch(postError('finish setting up your profile'));
    },

    // ---------- Profile (saved to users/{uid}, so every device sees the same profile) ----------
    updateProfile: (patch) => {
      if (!me) return;
      const update = {};
      PROFILE_FIELDS.forEach((k) => {
        if (patch[k] !== undefined) update[k] = typeof patch[k] === 'string' ? patch[k].trim() : patch[k];
      });
      if (patch.name !== undefined) update.displayName = patch.name.trim();
      if (patch.username !== undefined) update.username = asUsername(patch.username);
      if (patch.avatar) {
        if (isUrl(patch.avatar)) update.photoURL = patch.avatar;
        else setLocalAvatar(patch.avatar);
      }
      patchSelf(me, update).catch(postError('save your profile'));
    },
    addExperience: (e) => me && patchSelf(me, { experience: [...user.experience, { ...e, id: newId('x') }] }).catch(postError('save experience')),
    updateExperience: (id, e) => me && patchSelf(me, { experience: user.experience.map((x) => (x.id === id ? { ...x, ...e } : x)) }).catch(postError('save experience')),
    deleteExperience: (id) => me && patchSelf(me, { experience: user.experience.filter((x) => x.id !== id) }).catch(postError('remove experience')),
    addSkill: (s) => {
      if (!me || user.skills.some((x) => x.toLowerCase() === s.toLowerCase())) return;
      patchSelf(me, { skills: arrayUnion(s) }).catch(postError('save skill'));
    },
    removeSkill: (s) => me && patchSelf(me, { skills: arrayRemove(s) }).catch(postError('remove skill')),

    // ---------- Posts ----------
    refreshFeed: () => {},
    createPost: (text) => {
      if (!settings.postingEnabled && !isAdmin) {
        Alert.alert('Posting is paused', 'New posts are temporarily disabled by an administrator.');
        return;
      }
      addDoc(collection(getFirestore(), 'posts'), {
        authorId: me,
        authorName: user.name,
        authorPhotoUrl: isUrl(user.avatar) ? user.avatar : null,
        authorHeadline: user.headline || '',
        text: text.trim(),
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
      }).catch(postError('post'));
    },
    updatePost: (id, text) => {
      updateDoc(doc(getFirestore(), 'posts', id), { text: text.trim(), updatedAt: serverTimestamp() }).catch(postError('update the post'));
    },
    deletePost: (id) => {
      deleteDoc(doc(getFirestore(), 'posts', id)).catch(postError('delete the post'));
    },
    toggleLike: (id) => {
      if (me) social.toggleLike(me, id, likedSet.has(id)).catch(postError('update the like'));
    },
    addComment: (postId, text) => {
      if (!me) return;
      social.addComment(postId, { id: me, name: user.name, photo: isUrl(user.avatar) ? user.avatar : null }, text.trim())
        .catch(postError('post your comment'));
    },
    deleteComment: (postId, commentId) => social.deleteComment(postId, commentId).catch(postError('delete the comment')),

    // ---------- Jobs & applications ----------
    toggleSaveJob: (id) => { if (me) jobSvc.toggleSavedJob(me, id, !savedSet.has(id)).catch(postError('update saved jobs')); },
    createJob: async (input) => {
      const problem = validateJobInput(input);
      if (problem) throw new Error(problem);
      return jobSvc.createJob(me, user.name, input);
    },
    updateJob: async (id, input) => {
      const problem = validateJobInput(input);
      if (problem) throw new Error(problem);
      return jobSvc.updateJob(id, input);
    },
    setJobStatus: (id, status) => jobSvc.setJobStatus(id, status).catch(postError('update the job')),
    deleteJob: (id) => jobSvc.deleteJob(me, id).catch(postError('delete the job')),
    applyToJob: async (job, note) => {
      if (!me) throw new Error('Sign in to apply.');
      if (job.status !== 'open') throw new Error('This job is no longer accepting applications.');
      if (appliedJobIds.has(job.id)) throw new Error('You have already applied to this job.');
      try {
        await jobSvc.applyToJob({ uid: me, name: user.name }, job, note || '');
      } catch (error) {
        applyError(error);
      }
      notifyMe(me, 'application_sent', `Application sent to ${job.company} for ${job.title}`, 'paper-plane', { screen: 'Applications' });
      if (!job.catalog) {
        notifyMe(job.postedBy, 'application_new', `${user.name} applied for ${job.title}`, 'people', { screen: 'Applicants', jobId: job.id });
      }
    },
    withdrawApplication: (id) => jobSvc.withdrawApplication(id).catch(postError('withdraw the application')),
    // Poster-side: moves an applicant through the pipeline and tells them about it.
    setApplicationStatus: async (app, status) => {
      if (!APPLICATION_STATUSES.includes(status) || status === app.status) return;
      await jobSvc.updateApplicationStatus(app.id, status);
      if (app.applicantId !== me) {
        const notice = applicationNotice(status, app.title, app.company);
        notifyMe(app.applicantId, 'application_status', notice.text, notice.icon, { screen: 'Applications' });
      }
    },

    // ---------- Network ----------
    acceptInvite: (id) => acceptInvite(id),
    ignoreInvite: (id) => {
      if (!me) return;
      if (userMap.has(id)) social.dropConnection(me, id).catch(postError('ignore the invitation'));
      else setDemo((d) => (d ? { ...d, invites: d.invites.filter((x) => x.id !== id) } : d));
    },
    connect,
    withdrawRequest: (id) => {
      if (!me) return;
      if (userMap.has(id)) social.dropConnection(me, id).catch(postError('withdraw the request'));
      else demoPeople({ id, change: { status: null } });
    },
    dismissPerson: (id) => {
      if (!me) return;
      if (userMap.has(id)) dismissSuggestion(me, id).catch(postError('hide this suggestion'));
      else setDemo((d) => (d ? {
        ...d,
        people: d.people.filter((p) => p.id !== id || p.isSample).map((p) => (p.id === id ? { ...p, dismissed: true } : p)),
      } : d));
    },
    removeConnection: (id) => {
      if (!me) return;
      if (userMap.has(id)) social.dropConnection(me, id).catch(postError('remove the connection'));
      else setDemo((d) => (d ? {
        ...d,
        connections: d.connections.filter((x) => x.id !== id),
        people: swap(d.people, id, { status: null }),
      } : d));
    },
    // Blocking also removes any connection and hides both members from each other.
    blockPerson: (id) => {
      if (!me) return;
      if (userMap.has(id)) social.blockUser(me, id).catch(postError('block this member'));
      else setDemo((d) => (d ? {
        ...d,
        connections: d.connections.filter((x) => x.id !== id),
        people: swap(d.people, id, { status: null, dismissed: true }),
      } : d));
    },
    unblockPerson: (id) => { if (me) social.unblockUser(me, id).catch(postError('unblock this member')); },

    // ---------- Messaging ----------
    openConversation: (person) => {
      if (userMap.has(person.id)) return social.pairId(me, person.id);
      const id = `c_${person.id}`;
      setDemo((d) => (!d || d.conversations.some((c) => c.id === id) ? d : {
        ...d,
        conversations: [{ id, personId: person.id, name: person.name, headline: person.headline, avatar: person.avatar, unread: 0, messages: [] }, ...d.conversations],
      }));
      return id;
    },
    sendMessage: (cid, text) => {
      if (isRemoteConversation(cid)) {
        if (!me) return;
        if (hidden.has(social.otherOf(cid, me))) {
          Alert.alert('Message not sent', 'You can’t message this member.');
          return;
        }
        social.sendChat(me, social.otherOf(cid, me), text).catch(postError('send the message'));
        return;
      }
      setDemo((d) => (d ? { ...d, conversations: swap(d.conversations, cid, (c) => ({ messages: [...c.messages, { id: newId('m'), from: 'me', text, ts: Date.now() }] })) } : d));
    },
    deleteMessage: (cid, mid) => {
      if (isRemoteConversation(cid)) return delChat(cid, mid);
      setDemo((d) => (d ? { ...d, conversations: swap(d.conversations, cid, (c) => ({ messages: c.messages.filter((m) => m.id !== mid) })) } : d));
      return undefined;
    },
    deleteConversation: (cid) => {
      if (isRemoteConversation(cid)) { if (me) social.clearChat(me, cid).catch(postError('delete the conversation')); return; }
      setDemo((d) => (d ? { ...d, conversations: d.conversations.filter((c) => c.id !== cid) } : d));
    },
    markRead: (cid) => {
      if (isRemoteConversation(cid)) { if (me) social.readChat(me, cid); return; }
      setDemo((d) => (d ? { ...d, conversations: swap(d.conversations, cid, { unread: 0 }) } : d));
    },

    // ---------- Notifications & events ----------
    markNotificationRead: (id) => { if (me) notes.markNotificationRead(me, id); },
    markAllNotificationsRead: () => {
      if (me) notes.markAllNotificationsRead(me, notifications.filter((n) => !n.read).map((n) => n.id)).catch(postError('update notifications'));
    },
    removeNotification: (id) => { if (me) notes.deleteNotification(me, id).catch(postError('remove the notification')); },
    toggleEvent: (id) => setDemo((d) => (d ? { ...d, attending: d.attending.includes(id) ? d.attending.filter((x) => x !== id) : [...d.attending, id] } : d)),
  };

  // Local helper kept beside the messaging actions so deleteMessage can return the promise.
  function delChat(cid, mid) {
    return social.delChatMsg(cid, mid).catch(postError('delete the message'));
  }

  return <Ctx.Provider value={{
    ready,
    signedIn: !!session,
    activeEmail: session?.email ?? null,
    userId: me,
    user,
    onboarded,
    isAdmin,
    settings,
    storageError,
    clearStorageError: () => setStorageError(null),
    registeredUsers,
    people,
    connections,
    invites,
    conversations: session ? [...fsConvList, ...(demo?.conversations || [])] : [],
    posts,
    jobs,
    applications,
    ownerApplications,
    notifications,
    blockedProfiles,
    events: demo?.events || [],
    attending: demo?.attending || [],
    relationFor,
    messagingBlocked: (id) => hidden.has(id),
    profileFor: (id) => (userMap.has(id) && id !== me
      ? asProfile(userMap.get(id))
      : (demo?.people || []).find((p) => p.id === id) || null),
    ...actions,
  }}>{children}</Ctx.Provider>;
}
