import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Field, GradientButton, Header } from '../../components';
import { colors } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useApp();
  const [f, setF] = useState({ name: user.name, username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''), headline: user.headline, company: user.company, location: user.location, about: user.about });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => { if (!f.name.trim()) return; updateProfile({ ...f, name: f.name.trim() }); navigation.goBack(); };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Edit profile" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="Full name" value={f.name} onChangeText={set('name')} />
        <Field label="Username" placeholder="e.g. alexrivera" value={f.username} onChangeText={set('username')} autoCapitalize="none" />
        <Field label="Headline" placeholder="e.g. Product Designer" value={f.headline} onChangeText={set('headline')} />
        <Field label="Company" value={f.company} onChangeText={set('company')} />
        <Field label="Location" placeholder="City, Country" value={f.location} onChangeText={set('location')} />
        <Field label="About" multiline value={f.about} onChangeText={set('about')} />
        <GradientButton title="Save changes" onPress={save} disabled={!f.name.trim()} />
      </ScrollView>
    </View>
  );
}
