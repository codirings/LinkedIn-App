import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Field, GradientButton, Header } from '../../components';
import { colors } from '../../theme';

export default function ExperienceFormScreen({ navigation, route }) {
  const exp = route.params?.exp;
  const { addExperience, updateExperience } = useApp();
  const [f, setF] = useState({ title: exp?.title ?? '', company: exp?.company ?? '', period: exp?.period ?? '', desc: exp?.desc ?? '' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.title.trim() && f.company.trim();
  const save = () => { if (!ok) return; exp ? updateExperience(exp.id, f) : addExperience(f); navigation.goBack(); };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={exp ? 'Edit experience' : 'Add experience'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="Title *" placeholder="e.g. Senior Designer" value={f.title} onChangeText={set('title')} />
        <Field label="Company *" value={f.company} onChangeText={set('company')} />
        <Field label="Period" placeholder="e.g. 2021 – Present" value={f.period} onChangeText={set('period')} />
        <Field label="Description" multiline value={f.desc} onChangeText={set('desc')} />
        <GradientButton title={exp ? 'Save changes' : 'Add experience'} onPress={save} disabled={!ok} />
      </ScrollView>
    </View>
  );
}
