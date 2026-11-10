/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Native Firebase and Google Sign-In are replaced with inert stubs: this smoke test only checks
// that the signed-out tree renders. Auth state never fires, so the app stays on the welcome flow.
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {configure: jest.fn(), signOut: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn()},
}));
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => () => {}),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: {credential: jest.fn()},
}));
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(), doc: jest.fn(), query: jest.fn(), where: jest.fn(), orderBy: jest.fn(), limit: jest.fn(),
  onSnapshot: jest.fn(() => () => {}), getDoc: jest.fn(), getDocs: jest.fn(), setDoc: jest.fn(), addDoc: jest.fn(),
  updateDoc: jest.fn(), deleteDoc: jest.fn(), writeBatch: jest.fn(), serverTimestamp: jest.fn(),
  increment: jest.fn(), arrayUnion: jest.fn(), arrayRemove: jest.fn(), getCountFromServer: jest.fn(),
  Timestamp: {fromMillis: jest.fn()},
}));
jest.mock('@react-native-firebase/app-check', () => ({
  __esModule: true,
  ReactNativeFirebaseAppCheckProvider: jest.fn(() => ({configure: jest.fn()})),
  initializeAppCheck: jest.fn(),
}));
jest.mock('@react-native-firebase/ai', () => ({__esModule: true, GoogleAIBackend: {}, getAI: jest.fn(), getGenerativeModel: jest.fn()}));
jest.mock('@react-native-firebase/app', () => ({__esModule: true, getApp: jest.fn(() => ({}))}));

test('renders the signed-out tree without crashing', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
