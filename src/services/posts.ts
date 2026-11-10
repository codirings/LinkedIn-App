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
} from '@react-native-firebase/firestore';
import type {AppUser} from './users';

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string | null;
  text: string;
  createdAt: any;
  likeCount?: number;
};

// CREATE
export async function createPost(user: AppUser, text: string) {
  await addDoc(collection(getFirestore(), 'posts'), {
    authorId: user.uid,
    authorName: user.displayName ?? 'Anonymous',
    authorPhotoUrl: user.photoURL ?? null,
    text: text.trim(),
    createdAt: serverTimestamp(),
    likeCount: 0,
  });
}

// READ (live feed, newest first)
export function subscribeToPosts(
  onData: (posts: Post[]) => void,
  onError: (e: Error) => void,
) {
  const q = query(
    collection(getFirestore(), 'posts'),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    snap => {
      onData(snap.docs.map(d => ({id: d.id, ...(d.data() as any)}) as Post));
    },
    onError,
  );
}

// UPDATE
export async function updatePost(postId: string, text: string) {
  await updateDoc(doc(getFirestore(), 'posts', postId), {
    text: text.trim(),
    updatedAt: serverTimestamp(),
  });
}

// DELETE
export async function deletePost(postId: string) {
  await deleteDoc(doc(getFirestore(), 'posts', postId));
}