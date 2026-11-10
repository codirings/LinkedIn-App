import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

// Notifications live under users/{recipient}/notifications. The recipient reads and marks them;
// anyone can create one that names themselves as the actor.
export type NotificationTarget = {screen: string; [param: string]: unknown};
export type NewNotification = {kind: string; text: string; icon?: string; target?: NotificationTarget};

const col = (uid: string) => collection(getFirestore(), 'users', uid, 'notifications');

export const subscribeNotifications = (uid: string, cb: (items: any[]) => void, err: (e: Error) => void) =>
  onSnapshot(
    query(col(uid), orderBy('createdAt', 'desc'), limit(100)),
    snap => cb(snap.docs.map(d => ({id: d.id, ...d.data()}))),
    err,
  );

// Best-effort: a failed notification should never fail the action that caused it.
export function notify(recipientId: string, actorId: string, n: NewNotification): Promise<void> {
  if (!recipientId || recipientId === 'catalog') return Promise.resolve();
  return addDoc(col(recipientId), {
    recipientId,
    actorId,
    kind: n.kind,
    text: n.text,
    icon: n.icon ?? 'notifications',
    target: n.target ?? null,
    read: false,
    createdAt: serverTimestamp(),
  })
    .then(() => undefined)
    .catch(() => undefined);
}

export const markNotificationRead = (uid: string, id: string) =>
  updateDoc(doc(getFirestore(), 'users', uid, 'notifications', id), {read: true}).catch(() => {});

export async function markAllNotificationsRead(uid: string, ids: string[]) {
  const db = getFirestore();
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    ids.slice(i, i + 400).forEach(id => batch.update(doc(db, 'users', uid, 'notifications', id), {read: true}));
    await batch.commit();
  }
}

export const deleteNotification = (uid: string, id: string) =>
  deleteDoc(doc(getFirestore(), 'users', uid, 'notifications', id));
