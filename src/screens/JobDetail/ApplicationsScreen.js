import React from 'react';
import { View, Text, FlatList, Alert, Pressable, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Header, Empty } from '../../components';
import { timeAgo } from '../../utils/time';
import { colors, type, font } from '../../theme';

const STATUS_COLOR = {
  Submitted: colors.text2,
  Reviewing: colors.primary,
  Interview: colors.success,
  Offer: colors.success,
  Rejected: colors.error,
};

export default function ApplicationsScreen({ navigation }) {
  const { applications, jobs, withdrawApplication } = useApp();
  const withdraw = (a) => Alert.alert('Withdraw application?', `${a.title} at ${a.company}`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Withdraw', style: 'destructive', onPress: () => withdrawApplication(a.id) },
  ]);
  const open = (a) => {
    if (jobs.some((j) => j.id === a.jobId)) navigation.navigate('JobDetail', { jobId: a.jobId });
    else Alert.alert('Job no longer listed', 'The poster closed or removed this job.');
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="My applications" />
      <FlatList
        data={applications}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Empty icon="paper-plane-outline" title="No applications yet" text="Apply to a job and track it here." />}
        renderItem={({ item: a }) => (
          <Pressable style={s.row} onPress={() => open(a)}>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{a.title}</Text>
              <Text style={type.small}>{a.company} • {timeAgo(a.ts)}</Text>
              <Text style={[s.status, { color: STATUS_COLOR[a.status] || colors.text2 }]}>{a.status}</Text>
            </View>
            <Ionicons name="trash-outline" size={20} color={colors.text3} onPress={() => withdraw(a)} />
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  status: { fontFamily: font.semi, fontSize: 12, marginTop: 4 },
});
