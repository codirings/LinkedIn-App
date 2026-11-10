import {
  arrayUnion,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

export type AppUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

// Live copy of the signed-in user's own document. Every device sees the same profile,
// likes, saved jobs and dismissed suggestions.
export const subscribeSelf = (uid: string, cb: (u: any | null) => void, err: (e: Error) => void) =>
  onSnapshot(
    doc(getFirestore(), 'users', uid),
    snap => cb(snap.exists() ? {id: snap.id, ...snap.data()} : null),
    err,
  );

// Writes only the fields given. Undefined values are dropped because Firestore rejects them.
export function patchSelf(uid: string, patch: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  return updateDoc(doc(getFirestore(), 'users', uid), clean);
}

export const dismissSuggestion = (uid: string, otherId: string) =>
  patchSelf(uid, {dismissedUsers: arrayUnion(otherId)});

// Creates users/{uid} on first login, refreshes name/photo on later logins.
// Never touches the "disabled" field after creation (your rules protect it).
export async function saveUserProfile(user: AppUser) {
  const ref = doc(getFirestore(), 'users', user.uid);
  const snap = await getDoc(ref);
  const profile = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
  if (snap.exists()) {
    await updateDoc(ref, profile);
  } else {
    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      disabled: false,
      online: false,
      lastActiveAt: serverTimestamp(),
    });
  }
}
