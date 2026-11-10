import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';

const db = () => getFirestore();
const requireCurrentUser = (uid: string) => {
  const currentUid = getAuth().currentUser?.uid;
  if (!currentUid || currentUid !== uid) {
    throw new Error('You must be signed in with the active Firebase account to manage connections.');
  }
};

// Connections, blocks and conversations use the two uids sorted and joined with "~" as their id.
export const pairId = (a: string, b: string) => [a, b].sort().join('~');
export const otherOf = (cid: string, me: string) => cid.split('~').find(x => x !== me) || '';
const ids = (s: any) => s.docs.map((d: any) => ({id: d.id, ...d.data()}));

type Listener<T> = (items: T[]) => void;
type ErrorListener = (e: Error) => void;

// ---------- Members ----------
export const subscribeUsers = (cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(query(collection(db(), 'users'), limit(500)), s => cb(ids(s)), err);

// ---------- Connections (friend requests) ----------
export const subscribeConnections = (me: string, cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(query(collection(db(), 'connections'), where('users', 'array-contains', me)), s => cb(ids(s)), err);

export const sendRequest = (me: string, other: string) => {
  requireCurrentUser(me);
  return setDoc(doc(db(), 'connections', pairId(me, other)), {
    users: [me, other],
    from: me,
    to: other,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

export const acceptRequest = (me: string, other: string) => {
  requireCurrentUser(me);
  return updateDoc(doc(db(), 'connections', pairId(me, other)), {status: 'accepted', acceptedAt: serverTimestamp()});
};

// Used to withdraw a sent request, decline a received one, or remove a connection.
export const dropConnection = (me: string, other: string) => deleteDoc(doc(db(), 'connections', pairId(me, other)));

// ---------- Blocks ----------
export const subscribeBlocks = (me: string, cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(query(collection(db(), 'blocks'), where('users', 'array-contains', me)), s => cb(ids(s)), err);

// Blocking removes any connection between the pair and records the block in one commit.
export async function blockUser(me: string, other: string) {
  const id = pairId(me, other);
  const batch = writeBatch(db());
  batch.delete(doc(db(), 'connections', id));
  batch.set(doc(db(), 'blocks', id), {users: [me, other], blockedBy: me, createdAt: serverTimestamp()});
  await batch.commit();
}

export const unblockUser = (me: string, other: string) => deleteDoc(doc(db(), 'blocks', pairId(me, other)));

// ---------- Likes and comments ----------
export async function toggleLike(me: string, postId: string, liked: boolean) {
  const batch = writeBatch(db());
  batch.update(doc(db(), 'users', me), {likedPosts: liked ? arrayRemove(postId) : arrayUnion(postId)});
  batch.update(doc(db(), 'posts', postId), {likeCount: increment(liked ? -1 : 1)});
  await batch.commit();
}

export const subscribeComments = (postId: string, cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(
    query(collection(db(), 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(200)),
    s => cb(ids(s)),
    err,
  );

export async function addComment(postId: string, author: {id: string; name: string; photo: string | null}, text: string) {
  const batch = writeBatch(db());
  batch.set(doc(collection(db(), 'posts', postId, 'comments')), {
    authorId: author.id,
    authorName: author.name,
    authorPhotoUrl: author.photo,
    text,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db(), 'posts', postId), {commentCount: increment(1)});
  await batch.commit();
}

export async function deleteComment(postId: string, commentId: string) {
  const batch = writeBatch(db());
  batch.delete(doc(db(), 'posts', postId, 'comments', commentId));
  batch.update(doc(db(), 'posts', postId), {commentCount: increment(-1)});
  await batch.commit();
}

// ---------- Messaging ----------
export const subscribeConversations = (me: string, cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(query(collection(db(), 'conversations'), where('users', 'array-contains', me)), s => cb(ids(s)), err);

export const subscribeMessages = (cid: string, cb: Listener<any>, err: ErrorListener) =>
  onSnapshot(
    query(collection(db(), 'conversations', cid, 'messages'), orderBy('createdAt', 'asc'), limit(300)),
    s => cb(ids(s)),
    err,
  );

export async function sendChat(me: string, other: string, text: string) {
  const cid = pairId(me, other);
  const cref = doc(db(), 'conversations', cid);
  const b = writeBatch(db());
  b.set(
    cref,
    {
      users: [me, other],
      lastText: text,
      lastFrom: me,
      lastTs: serverTimestamp(),
      unread: {[other]: increment(1)},
    },
    {merge: true},
  );
  b.set(doc(collection(cref, 'messages')), {from: me, text, createdAt: serverTimestamp()});
  await b.commit();
}

export const readChat = (me: string, cid: string) =>
  updateDoc(doc(db(), 'conversations', cid), {[`unread.${me}`]: 0}).catch(() => {});

export const delChatMsg = (cid: string, mid: string) => deleteDoc(doc(db(), 'conversations', cid, 'messages', mid));

export const clearChat = (me: string, cid: string) =>
  setDoc(doc(db(), 'conversations', cid), {clearedAt: {[me]: serverTimestamp()}, unread: {[me]: 0}}, {merge: true});
