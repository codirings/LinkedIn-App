import {getApp} from '@react-native-firebase/app';
import {
  ReactNativeFirebaseAppCheckProvider,
  initializeAppCheck,
} from '@react-native-firebase/app-check';
import ENV from '../config/env.generated';

let started = false;

export function initAppCheck() {
  if (started) return;
  started = true;
  const dbg = __DEV__;
  const debugToken = ENV.APPCHECK_DEBUG_TOKEN || undefined;
  const provider = new ReactNativeFirebaseAppCheckProvider();
  provider.configure({
    android: {provider: dbg ? 'debug' : 'playIntegrity', debugToken},
    apple: {
      provider: dbg ? 'debug' : 'appAttestWithDeviceCheckFallback',
      debugToken,
    },
  });
  initializeAppCheck(getApp(), {provider, isTokenAutoRefreshEnabled: true});
}
