import React from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useApp} from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';

function Gate() {
  const {ready} = useApp() ?? {ready: false};
  if (!ready) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color="#0A66C2" />
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}
