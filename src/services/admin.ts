import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

export type SiteSettings = {
  postingEnabled: boolean;
  maintenanceMode: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  postingEnabled: true,
  maintenanceMode: false,
};

export type AdminUser = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  headline?: string;
  createdAt?: any;
  disabled?: boolean;
};

export type Metrics = {
  totalUsers: number;
  disabledUsers: number;
  newUsers7d: number;
  totalPosts: number;
  posts24h: number;
  admins: number;
};

const db = () => getFirestore();
const daysAgo = (n: number) => Timestamp.fromMillis(Date.now() - n * 86400000);

// ---------- Access control ----------
// A user is an admin when a document exists at admins/{uid}. The client check is
// only a convenience for hiding UI; Firestore rules are what actually enforce it.
export function subscribeToAdminStatus(uid: string, onChange: (isAdmin: boolean) => void) {
  return onSnapshot(
    doc(db(), 'admins', uid),
    snap => onChange(snap.exists()),
    () => onChange(false),
  );
}

// Fires when the signed-in user's own account gets disabled by an admin, so the
// app can sign them out immediately instead of at their next login.
export function subscribeToAccountDisabled(uid: string, onDisabled: () => void) {
  return onSnapshot(doc(db(), 'users', uid), snap => {
    if (snap.data()?.disabled === true) onDisabled();
  });
}

// ---------- Site settings (settings/site) ----------
export function subscribeToSettings(
  onChange: (s: SiteSettings) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    doc(db(), 'settings', 'site'),
    snap => onChange({...DEFAULT_SETTINGS, ...((snap.data() as any) ?? {})}),
    e => {
      onChange(DEFAULT_SETTINGS); // fail open: a missing/unreadable doc never locks users out
      onError?.(e);
    },
  );
}

export async function updateSettings(patch: Partial<SiteSettings>, adminUid: string) {
  await setDoc(
    doc(db(), 'settings', 'site'),
    {...patch, updatedAt: serverTimestamp(), updatedBy: adminUid},
    {merge: true},
  );
}

// ---------- Users ----------
export function subscribeToUsers(
  onData: (users: AdminUser[]) => void,
  onError: (e: Error) => void,
) {
  const q = query(collection(db(), 'users'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({id: d.id, ...(d.data() as any)}) as AdminUser)),
    onError,
  );
}

export async function setUserDisabled(uid: string, disabled: boolean) {
  await updateDoc(doc(db(), 'users', uid), {disabled});
}

// ---------- Metrics ----------
const count = async (q: any) => (await getCountFromServer(q)).data().count;

export async function fetchMetrics(): Promise<Metrics> {
  const users = collection(db(), 'users');
  const posts = collection(db(), 'posts');
  const [totalUsers, disabledUsers, newUsers7d, totalPosts, posts24h, admins] = await Promise.all([
    count(users),
    count(query(users, where('disabled', '==', true))),
    count(query(users, where('createdAt', '>=', daysAgo(7)))),
    count(posts),
    count(query(posts, where('createdAt', '>=', daysAgo(1)))),
    count(collection(db(), 'admins')),
  ]);
  return {totalUsers, disabledUsers, newUsers7d, totalPosts, posts24h, admins};
}

// ---------- Moderation ----------
export async function removePost(postId: string) {
  await deleteDoc(doc(db(), 'posts', postId));
}
