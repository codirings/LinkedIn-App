import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Chip, Field, GradientButton, Header } from '../../components';
import { MODES, validateJobInput } from '../../utils/jobs';
import { colors, type } from '../../theme';

export default function JobFormScreen({ navigation, route }) {
  const job = route.params?.job;
  const { user, createJob, updateJob } = useApp();
  const [f, setF] = useState({
    title: job?.title ?? '',
    company: job?.company ?? user.company ?? '',
    location: job?.location ?? '',
    mode: job?.mode ?? 'Remote',
    salaryMin: job?.salaryMin != null ? String(job.salaryMin) : '',
    salaryMax: job?.salaryMax != null ? String(job.salaryMax) : '',
    skills: (job?.skills ?? []).join(', '),
    requirements: (job?.requirements ?? []).join('\n'),
    desc: job?.desc ?? '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.title.trim() && f.company.trim() && !saving;

  const save = async () => {
    const problem = validateJobInput(f);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (job) await updateJob(job.id, f);
      else await createJob(f);
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Could not save the job. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={job ? 'Edit job' : 'Post a job'} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="Job title *" value={f.title} onChangeText={set('title')} />
        <Field label="Company *" value={f.company} onChangeText={set('company')} />
        <Field label="Location" placeholder="City or Remote" value={f.location} onChangeText={set('location')} />
        <Text style={[type.label, { marginBottom: 6 }]}>Work mode</Text>
        <View style={s.modes}>
          {MODES.map((m) => <Chip key={m} label={m} active={f.mode === m} onPress={() => set('mode')(m)} />)}
        </View>
        <View style={s.salary}>
          <View style={{ flex: 1 }}>
            <Field label="Salary min (USD/yr)" placeholder="120000" keyboardType="number-pad" value={f.salaryMin} onChangeText={set('salaryMin')} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Salary max (USD/yr)" placeholder="150000" keyboardType="number-pad" value={f.salaryMax} onChangeText={set('salaryMax')} />
          </View>
        </View>
        <Field label="Skills (comma separated)" placeholder="Figma, React" value={f.skills} onChangeText={set('skills')} />
        <Field label="Requirements (one per line)" multiline value={f.requirements} onChangeText={set('requirements')} />
        <Field label="Description" multiline value={f.desc} onChangeText={set('desc')} />
        {!!error && <Text style={s.error}>{error}</Text>}
        <GradientButton title={job ? 'Save changes' : 'Publish job'} onPress={save} disabled={!ok} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  modes: { flexDirection: 'row', marginBottom: 16 },
  salary: { flexDirection: 'row', gap: 12 },
  error: { fontSize: 13, color: colors.error, marginBottom: 12 },
});
