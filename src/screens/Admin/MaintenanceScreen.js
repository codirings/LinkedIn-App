import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { OutlineButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { colors, type } from '../../theme';

export default function MaintenanceScreen() {
  const { signOut } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="construct-outline" size={48} color={colors.text3} />
      <Text style={[type.h2, { marginTop: 16 }]}>We’ll be right back</Text>
      <Text style={[type.body, { textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>The app is down for maintenance. Please check back soon.</Text>
      <OutlineButton title="Sign out" icon="log-out-outline" onPress={signOut} />
    </View>
  );
}
