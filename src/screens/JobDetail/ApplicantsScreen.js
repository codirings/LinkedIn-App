import React from 'react';
import { View, Text, FlatList, Alert, Pressable, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Avatar, Card, Chip, Empty, Header } from '../../components';
import { timeAgo } from '../../utils/time';
import { APPLICATION_STATUSES } from '../../utils/jobs';
import { colors, type } from '../../theme';

// Poster's view of the applicants to one listing. Changing a status notifies the applicant.
export default function ApplicantsScreen({ route, navigation }) {
  const { jobs, ownerApplications, setApplicationStatus, profileFor } = useApp();
  const jobId = route.params?.jobId;
  const job = jobs.find((j) => j.id === jobId);
  const list = ownerApplications.filter((a) => a.jobId === jobId);
  const summary = APPLICATION_STATUSES
    .map((st) => ({ st, n: list.filter((a) => a.status === st).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${x.st.toLowerCase()}`)
    .join(' • ');

  const change = async (a, status) => {
    try {
      await setApplicationStatus(a, status);
    } catch (error) {
      Alert.alert('Could not update status', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={job ? `Applicants · ${job.title}` : 'Applicants'} />
      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <Text style={[type.small, { marginBottom: 4 }]}>
            {list.length} applicant{list.length === 1 ? '' : 's'}{summary ? ` • ${summary}` : ''}
          </Text>
        }
        ListEmptyComponent={<Empty icon="people-outline" title="No applicants yet" text="Applications to this job will appear here." />}
        renderItem={({ item: a }) => {
          const profile = profileFor(a.applicantId);
          return (
            <Card>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('Profile', { userId: a.applicantId })}>
                <Avatar uri={profile?.avatar} name={a.applicantName} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={type.h3}>{a.applicantName}</Text>
                  <Text style={type.small} numberOfLines={1}>{profile?.headline || 'Member'}</Text>
                </View>
              </Pressable>
              {!!a.note && <Text style={[type.body, { marginTop: 10 }]}>“{a.note}”</Text>}
              <Text style={[type.small, { marginTop: 8 }]}>Applied {timeAgo(a.ts)} • {a.status}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {APPLICATION_STATUSES.map((st) => (
                  <Chip key={st} label={st} active={a.status === st} onPress={() => change(a, st)} />
                ))}
              </ScrollView>
            </Card>
          );
        }}
      />
    </View>
  );
}
