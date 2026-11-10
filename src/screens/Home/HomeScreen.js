import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Card, TopBar, OutlineButton, Empty } from '../../components';
import PostCard from '../../components/PostCard';
import { colors, type, font } from '../../theme';

export default function HomeScreen({ navigation }) {
  const { user, posts, jobs, events, attending, toggleEvent, toggleSaveJob, refreshFeed } = useApp();
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const list = posts.filter((p) => `${p.author || user.name} ${p.text}`.toLowerCase().includes(q.toLowerCase()));
  const matches = (j) => j.skills.filter((s) => user.skills.some((u) => u.toLowerCase() === s.toLowerCase())).length;
  const suggested = [...jobs].filter((j) => !j.mine).sort((a, b) => matches(b) - matches(a)).slice(0, 3);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      refreshFeed();
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar placeholder="Search posts" value={q} onChangeText={setQ} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {!q && (
          <Card>
            <Pressable style={s.composer} onPress={() => navigation.navigate('CreatePost')}>
              <Avatar uri={user.avatar} name={user.name} size={36} /><Text style={[type.small, { marginLeft: 12, flex: 1 }]}>Start a post, share your thoughts...</Text>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
            </Pressable>
          </Card>
        )}
        {list.length === 0 && <Empty icon="newspaper-outline" title={q ? 'No matching posts' : 'Your feed is empty'} text={q ? 'Try a different search.' : 'Share an update or connect with people to see posts here.'} />}
        {list.map((p) => <PostCard key={p.id} post={p} />)}

        {!q && (<>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={type.h3}>Jobs picked for you</Text><Text style={[type.label, { color: colors.primary }]} onPress={() => navigation.navigate('Jobs')}>See all</Text>
            </View>
            {suggested.map((j) => (
              <Pressable key={j.id} style={s.job} onPress={() => navigation.navigate('JobDetail', { jobId: j.id })}>
                <View style={s.logo}><Text style={{ fontFamily: font.bold, color: colors.primary }}>{j.company[0]}</Text></View>
                <View style={{ flex: 1, marginHorizontal: 12 }}><Text style={type.label}>{j.title}</Text><Text style={type.small}>{j.company} • {j.salary}</Text></View>
                <Ionicons name={j.saved ? 'bookmark' : 'bookmark-outline'} size={20} color={j.saved ? colors.primary : colors.text2} onPress={() => toggleSaveJob(j.id)} />
              </Pressable>
            ))}
          </Card>
          {events.length > 0 && <Card>
            <Text style={[type.h3, { marginBottom: 12 }]}>Upcoming events</Text>
            {events.map((e) => {
              const going = attending.includes(e.id);
              return (
                <View key={e.id} style={s.job}>
                  <View style={s.date}><Text style={s.mon}>{e.month}</Text><Text style={[type.h3, { color: colors.primary }]}>{e.day}</Text></View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}><Text style={type.label}>{e.title}</Text><Text style={type.small}>{e.when}</Text><Text style={type.small}>{e.going + (going ? 1 : 0)} attending</Text></View>
                  <OutlineButton title={going ? 'Going' : 'Attend'} icon={going ? 'checkmark' : undefined} onPress={() => toggleEvent(e.id)} style={{ height: 36, paddingHorizontal: 12 }} />
                </View>
              );
            })}
          </Card>}
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  composer: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingRight: 14 },
  job: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: colors.tint, marginBottom: 8 },
  logo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  date: { width: 48, height: 52, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  mon: { fontFamily: font.bold, fontSize: 10, color: colors.text2 },
});