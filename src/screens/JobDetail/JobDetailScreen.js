import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Card, Chip, Empty, GradientButton, Header, Input, OutlineButton } from '../../components';
import { timeAgo } from '../../utils/time';
import { colors, type, font } from '../../theme';

const statusCopy = (status) => (status === 'Submitted' ? 'Submitted' : status);

export default function JobDetailScreen({ route, navigation }) {
  const { jobs, user, applications, ownerApplications, applyToJob, withdrawApplication, toggleSaveJob, deleteJob, setJobStatus } = useApp();
  const [applying, setApplying] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const job = jobs.find((j) => j.id === route.params.jobId);

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Job details" />
        <Empty icon="briefcase-outline" title="This job is no longer listed" text="The poster may have closed or removed it." />
      </View>
    );
  }

  const app = applications.find((a) => a.jobId === job.id);
  const applicantCount = ownerApplications.filter((a) => a.jobId === job.id).length;
  const has = (sk) => user.skills.some((u) => u.toLowerCase() === sk.toLowerCase());

  const submit = async () => {
    setBusy(true);
    try {
      await applyToJob(job, note);
      setApplying(false);
      setNote('');
      Alert.alert('Application sent', `${job.company} will see your profile and note.`);
    } catch (error) {
      Alert.alert('Could not apply', error.message);
    } finally {
      setBusy(false);
    }
  };
  const del = () => Alert.alert('Delete job post?', 'This removes the listing and every application to it.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { deleteJob(job.id); navigation.goBack(); } },
  ]);
  const withdraw = () => Alert.alert('Withdraw application?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Withdraw', style: 'destructive', onPress: () => withdrawApplication(app.id) },
  ]);
  const toggleOpen = () => setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open');

  let action;
  if (job.mine) {
    action = (
      <Card>
        <Text style={type.h3}>Manage this listing</Text>
        <Text style={[type.small, { marginTop: 4 }]}>{applicantCount} applicant{applicantCount === 1 ? '' : 's'} • {job.status === 'open' ? 'Open' : 'Closed'}</Text>
        <GradientButton title={`View applicants (${applicantCount})`} icon="people-outline" onPress={() => navigation.navigate('Applicants', { jobId: job.id })} style={{ marginTop: 12 }} />
        <View style={s.row}>
          <OutlineButton title="Edit" icon="create-outline" style={{ flex: 1 }} onPress={() => navigation.navigate('JobForm', { job })} />
          <OutlineButton
            title={job.status === 'open' ? 'Close' : 'Reopen'}
            icon={job.status === 'open' ? 'lock-closed-outline' : 'lock-open-outline'}
            style={{ flex: 1 }}
            onPress={toggleOpen}
          />
        </View>
        <OutlineButton title="Delete listing" icon="trash-outline" danger onPress={del} style={{ marginTop: 12 }} />
      </Card>
    );
  } else if (app) {
    action = (
      <Card>
        <Text style={[type.label, { color: colors.success }]}>✓ {statusCopy(app.status)} • applied {timeAgo(app.ts)}</Text>
        {!!app.note && <Text style={[type.small, { marginTop: 4 }]}>Your note: {app.note}</Text>}
        <OutlineButton title="Withdraw application" danger onPress={withdraw} style={{ marginTop: 12 }} />
      </Card>
    );
  } else if (applying) {
    action = (
      <Card>
        <Text style={[type.h3, { marginBottom: 8 }]}>Add a note (optional)</Text>
        <Input multiline placeholder={`Tell ${job.company} why you’re a fit`} value={note} onChangeText={setNote} />
        <View style={s.row}>
          <OutlineButton title="Cancel" style={{ flex: 1 }} onPress={() => setApplying(false)} />
          <GradientButton title="Submit" icon="paper-plane" style={{ flex: 1 }} onPress={submit} disabled={busy} />
        </View>
      </Card>
    );
  } else if (job.status === 'open') {
    action = <GradientButton title="Apply now" icon="paper-plane" onPress={() => setApplying(true)} />;
  } else {
    action = <Text style={[type.small, { textAlign: 'center' }]}>Applications are closed for this job.</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Job details"
        right={<Ionicons name={job.saved ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.primary} onPress={() => toggleSaveJob(job.id)} />}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={s.logo}><Text style={s.logoText}>{job.company[0] || '?'}</Text></View>
            <Text style={[type.h2, { marginTop: 12 }]}>{job.title}</Text>
            <Text style={type.body}>{job.company} • {job.location || 'Location not listed'}</Text>
            <Text style={[type.small, { marginTop: 4 }]}>{job.mode} • {job.salary} • Posted {timeAgo(job.ts)}</Text>
            {job.status === 'closed' && <Text style={s.closedNote}>This job is closed to new applications.</Text>}
          </Card>
          <Card>
            <Text style={[type.h3, { marginBottom: 8 }]}>About the role</Text>
            <Text style={type.body}>{job.desc || 'No description provided.'}</Text>
          </Card>
          {job.requirements.length > 0 && (
            <Card>
              <Text style={[type.h3, { marginBottom: 8 }]}>Requirements</Text>
              {job.requirements.map((r) => <Text key={r} style={[type.body, { marginBottom: 4 }]}>• {r}</Text>)}
            </Card>
          )}
          <Card>
            <Text style={[type.h3, { marginBottom: 4 }]}>Skills</Text>
            <Text style={[type.small, { marginBottom: 12 }]}>Highlighted skills are on your profile.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {job.skills.map((k) => <Chip key={k} label={k} active={has(k)} icon={has(k) ? 'checkmark' : undefined} />)}
            </View>
          </Card>
          {action}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: font.bold, fontSize: 24, color: colors.primary },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  closedNote: { fontFamily: font.semi, fontSize: 12, color: colors.error, marginTop: 8 },
});
