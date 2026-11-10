import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Card, Chip, Empty, TopBar } from '../../components';
import { timeAgo } from '../../utils/time';
import { JOB_FILTERS, searchJobs } from '../../utils/jobSearch';
import { colors, type, font } from '../../theme';

export default function JobsScreen({ navigation }) {
  const { jobs, user, applications, toggleSaveJob } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const appliedIds = new Set(applications.map((a) => a.jobId));
  const list = searchJobs(jobs, { query: q, filter, skills: user.skills, appliedIds });
  const savedCount = jobs.filter((j) => j.saved).length;
  const heading = q.trim() ? `Results for “${q.trim()}”` : filter === 'All' ? 'Recommended for you' : filter;

  const tools = [
    ['bookmark-outline', 'Saved', `${savedCount} saved`, () => setFilter('Saved')],
    ['paper-plane-outline', 'Applications', `${applications.length} sent`, () => navigation.navigate('Applications')],
    ['add-circle-outline', 'Post a job', 'Hire talent', () => navigation.navigate('JobForm')],
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar placeholder="Search jobs, skills, companies" value={q} onChangeText={setQ} />
      <FlatList
        data={list}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={s.tools}>
              {tools.map(([ic, t, sub, fn]) => (
                <Pressable key={t} style={{ flex: 1 }} onPress={fn}>
                  <Card style={s.tool}>
                    <View style={s.toolIco}><Ionicons name={ic} size={18} color={colors.primary} /></View>
                    <Text style={type.label}>{t}</Text>
                    <Text style={[type.small, { fontSize: 11 }]}>{sub}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {JOB_FILTERS.map((f) => <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}
            </ScrollView>
            <Text style={type.h2}>{heading}</Text>
            <Text style={[type.small, { marginBottom: 4 }]}>
              {list.length} {list.length === 1 ? 'job' : 'jobs'} • ranked by relevance and skill match
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Empty
            icon="briefcase-outline"
            title="No jobs found"
            text={q.trim() ? 'Try fewer or different words, or clear the search.' : 'Try another filter.'}
          />
        }
        renderItem={({ item: j }) => {
          const applied = appliedIds.has(j.id);
          return (
            <Pressable onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}>
              <Card>
                <View style={{ flexDirection: 'row' }}>
                  <View style={s.logo}><Text style={s.logoText}>{j.company[0] || '?'}</Text></View>
                  <View style={s.body}>
                    <Text style={type.h3}>{j.title}</Text>
                    <Text style={type.small}>{j.company} • {j.location || 'Location not listed'} ({j.mode})</Text>
                  </View>
                  <Ionicons
                    name={j.saved ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={j.saved ? colors.primary : colors.text}
                    onPress={() => toggleSaveJob(j.id)}
                  />
                </View>
                <Text style={[type.small, { marginTop: 8 }]}>{j.salary} • {timeAgo(j.ts)}</Text>
                <View style={s.footer}>
                  {j.skills.length > 0 ? <Text style={s.match}>Matches {j.skillMatch} of {j.skills.length} skills</Text> : <View />}
                  <View style={s.badges}>
                    {j.status === 'closed' && <Text style={s.closed}>Closed</Text>}
                    {applied && <Text style={s.applied}>Applied</Text>}
                    {j.mine && !applied && <Text style={s.applied}>Your post • {j.applicantCount} applicant{j.applicantCount === 1 ? '' : 's'}</Text>}
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tools: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tool: { alignItems: 'center', padding: 12 },
  toolIco: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: font.bold, fontSize: 20, color: colors.primary },
  body: { flex: 1, marginHorizontal: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 },
  badges: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  match: { fontFamily: font.semi, fontSize: 12, color: colors.primary, backgroundColor: colors.tint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  applied: { fontFamily: font.semi, fontSize: 12, color: colors.success },
  closed: { fontFamily: font.semi, fontSize: 12, color: colors.error },
});
