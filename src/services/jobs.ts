import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayRemove,
  arrayUnion,
} from '@react-native-firebase/firestore';
import {CATALOG_OWNER, jobPayload, slugify, type ApplicationStatus, type JobInput} from '../utils/jobs';

const db = () => getFirestore();
const BATCH_LIMIT = 400;

// Deletes refs in batches so a large cascade stays under Firestore's per-commit limit.
async function deleteRefs(refs: any[]) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db());
    refs.slice(i, i + BATCH_LIMIT).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

// ---------- Listings ----------
export const subscribeJobs = (cb: (jobs: any[]) => void, err: (e: Error) => void) =>
  onSnapshot(
    query(collection(db(), 'jobs'), orderBy('createdAt', 'desc'), limit(300)),
    snap => cb(snap.docs.map(d => ({id: d.id, ...d.data()}))),
    err,
  );

export async function createJob(uid: string, posterName: string, input: JobInput): Promise<string> {
  const ref = await addDoc(collection(db(), 'jobs'), {
    ...jobPayload(input),
    postedBy: uid,
    postedByName: posterName,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export const updateJob = (jobId: string, input: JobInput) =>
  updateDoc(doc(db(), 'jobs', jobId), {...jobPayload(input), updatedAt: serverTimestamp()});

export const setJobStatus = (jobId: string, status: 'open' | 'closed') =>
  updateDoc(doc(db(), 'jobs', jobId), {status, updatedAt: serverTimestamp()});

// Removes the listing and every application to it, so no application points at a missing job.
export async function deleteJob(uid: string, jobId: string) {
  const apps = await getDocs(
    query(collection(db(), 'applications'), where('ownerId', '==', uid), where('jobId', '==', jobId)),
  );
  await deleteRefs(apps.docs.map(d => d.ref));
  await deleteDoc(doc(db(), 'jobs', jobId));
}

// Catalog listings are written by an admin with deterministic ids, so loading twice is harmless.
export async function seedJobCatalog(catalog: JobInput[]) {
  for (let i = 0; i < catalog.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db());
    catalog.slice(i, i + BATCH_LIMIT).forEach(job => {
      const id = `catalog_${slugify(`${job.company}-${job.title}`)}`;
      batch.set(doc(db(), 'jobs', id), {
        ...jobPayload(job),
        postedBy: CATALOG_OWNER,
        postedByName: job.company,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, {merge: true});
    });
    await batch.commit();
  }
  return catalog.length;
}

// ---------- Saved jobs (on the user's own document, so they sync across devices) ----------
export const toggleSavedJob = (uid: string, jobId: string, save: boolean) =>
  updateDoc(doc(db(), 'users', uid), {savedJobs: save ? arrayUnion(jobId) : arrayRemove(jobId)});

// ---------- Applications ----------
// One document per applicant and job (id = "<uid>~<jobId>"), so a second submission from another
// device is rejected by the rules instead of creating a duplicate.
export const subscribeMyApplications = (uid: string, cb: (apps: any[]) => void, err: (e: Error) => void) =>
  onSnapshot(
    query(collection(db(), 'applications'), where('applicantId', '==', uid), limit(300)),
    snap => cb(snap.docs.map(d => ({id: d.id, ...d.data()}))),
    err,
  );

export const subscribeApplicationsToMyJobs = (uid: string, cb: (apps: any[]) => void, err: (e: Error) => void) =>
  onSnapshot(
    query(collection(db(), 'applications'), where('ownerId', '==', uid), limit(500)),
    snap => cb(snap.docs.map(d => ({id: d.id, ...d.data()}))),
    err,
  );

export const applicationId = (uid: string, jobId: string) => `${uid}~${jobId}`;

export function applyToJob(
  applicant: {uid: string; name: string},
  job: {id: string; title: string; company: string; postedBy: string},
  note: string,
) {
  return setDoc(doc(db(), 'applications', applicationId(applicant.uid, job.id)), {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    applicantId: applicant.uid,
    applicantName: applicant.name,
    ownerId: job.postedBy,
    note: note.trim(),
    status: 'Submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const withdrawApplication = (appId: string) => deleteDoc(doc(db(), 'applications', appId));

export const updateApplicationStatus = (appId: string, status: ApplicationStatus) =>
  updateDoc(doc(db(), 'applications', appId), {status, updatedAt: serverTimestamp()});
