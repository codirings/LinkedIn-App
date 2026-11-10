import {AppState, type AppStateStatus} from 'react-native';
import {doc, getFirestore, serverTimestamp, updateDoc} from '@react-native-firebase/firestore';
import {HEARTBEAT_MS} from '../utils/presence';

export async function setPresence(uid: string, online: boolean) {
  await updateDoc(doc(getFirestore(), 'users', uid), {online, lastActiveAt: serverTimestamp()}).catch(() => {});
}

// Marks the account online while the app is in the foreground and refreshes a heartbeat so
// other members can see it. Returns a cleanup function that marks it offline.
export function startPresence(uid: string): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;
  const start = () => {
    setPresence(uid, true);
    if (!timer) timer = setInterval(() => setPresence(uid, true), HEARTBEAT_MS);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    setPresence(uid, false);
  };
  const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') start();
    else stop();
  });
  if (AppState.currentState === 'active') start();
  return () => {
    sub.remove();
    stop();
  };
}
