module.exports = {
  preset: '@react-native/jest-preset',
  // Some native packages ship ES modules that Jest must transform.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-firebase|@react-native-google-signin|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-fetch-api)/)',
  ],
};
