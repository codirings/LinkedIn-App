import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Card, Chip, GradientButton, TopBar, OutlineButton, Empty } from '../../components';
import { RELATION } from '../../utils/relationship';
import { colors, type, font } from '../../theme';

const FILTERS = ['All', 'From your industry', 'Alumni', 'Mutual connections'];

export default function NetworkScreen({ navigation }) {
  const { user, registeredUsers, invites, people, connections, acceptInvite, ignoreInvite, connect, withdrawRequest, dismissPerson } = useApp();
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = people.filter((p) => !p.dismissed && (filter === 'All' || p.tags?.includes(filter)));
  const sent = people.filter((p) => p.relation === RELATION.OUTGOING);
  const accountMatches = registeredUsers.filter((profile) => {
    if (profile.id === user.id || !query) return false;
    return `${profile.name} ${profile.username} ${profile.headline}`.toLowerCase().includes(query);
  });
  const searchResults = [
    ...people.filter((profile) => `${profile.name} ${profile.username || ''} ${profile.headline}`.toLowerCase().includes(query)),
    ...accountMatches,
  ].filter((profile, index, profiles) => profiles.findIndex((match) => match.id === profile.id) === index);

  const run = (fn) => async (id) => {
    try {
      await fn(id);
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again.');
    }
  };
  const accept = run(acceptInvite);

  // One action per relationship state, so the button always matches what will happen.
  const actionFor = (p) => {
    switch (p.relation) {
      case RELATION.CONNECTED:
        return <Pressable disabled style={[s.cbtn, s.connected]}><Ionicons name="checkmark-circle-outline" size={16} color={colors.success} /><Text style={[type.label, { color: colors.success, marginLeft: 6 }]}>Connected</Text></Pressable>;
      case RELATION.OUTGOING:
        return <OutlineButton title="Pending" icon="time-outline" onPress={() => withdrawRequest(p.id)} style={s.cbtn} />;
      case RELATION.INCOMING:
        return (
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <GradientButton title="Accept" small onPress={() => accept(p.id)} style={{ flex: 1 }} />
            <OutlineButton title="Decline" onPress={() => ignoreInvite(p.id)} style={{ flex: 1, height: 36 }} />
          </View>
        );
      default:
        return <Pressable style={[s.cbtn, s.connect]} onPress={() => connect(p.id)}><Ionicons name="person-add-outline" size={16} color={colors.primary} /><Text style={[type.label, { color: colors.primary, marginLeft: 6 }]}>Connect</Text></Pressable>;
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar placeholder="Search people" value={q} onChangeText={setQ} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {query ? (
          <View>
            <Text style={[type.h2, { marginBottom: 12 }]}>People</Text>
            {searchResults.length === 0
              ? <Empty icon="search-outline" title="No users found" text="Try another name or username." />
              : searchResults.map((profile) => (
                <Pressable key={profile.id} onPress={() => navigation.navigate('Profile', { userId: profile.id })} style={s.searchResult}>
                  <Avatar uri={profile.avatar} name={profile.name} size={52} online={profile.online} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={type.h3}>{profile.name}</Text>
                    {!!profile.headline && <Text style={type.small} numberOfLines={1}>{profile.headline}</Text>}
                    {!!profile.username && <Text style={s.username}>@{profile.username}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text2} />
                </Pressable>
              ))}
          </View>
        ) : <>
        <Pressable onPress={() => navigation.navigate('Connections')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={s.ico}><Ionicons name="people" size={22} color={colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={type.h3}>My connections</Text><Text style={s.count}>{connections.length}</Text></View>
              <Text style={type.small}>View, message or remove connections</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.text2} />
          </Card>
        </Pressable>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><Text style={type.h2}>Invitations</Text>{invites.length > 0 && <Text style={s.red}>{invites.length}</Text>}</View>
          {invites.length === 0 && <Text style={type.small}>You’re all caught up. New invitations show up here.</Text>}
          {invites.map((i) => (
            <View key={i.id} style={s.inv}>
              <Avatar uri={i.avatar} name={i.name} size={52} online={i.online} />
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={type.h3}>{i.name}</Text><Text style={type.small} numberOfLines={1}>{i.headline}</Text>{i.mutual != null && <Text style={[type.small, { fontFamily: font.semi }]}>{i.mutual} mutual connections</Text>}</View>
              <Pressable style={s.x} onPress={() => ignoreInvite(i.id)}><Ionicons name="close" size={20} /></Pressable>
              <GradientButton title="Accept" small onPress={() => accept(i.id)} style={{ marginLeft: 8 }} />
            </View>
          ))}
          {sent.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[type.label, { marginBottom: 4 }]}>Sent requests</Text>
              {sent.map((p) => (
                <View key={p.id} style={s.inv}>
                  <Avatar uri={p.avatar} name={p.name} size={40} online={p.online} />
                  <Text style={[type.body, { flex: 1, marginLeft: 12 }]} numberOfLines={1}>{p.name}</Text>
                  <Pressable onPress={() => withdrawRequest(p.id)}><Text style={[type.label, { color: colors.error }]}>Withdraw</Text></Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        <View><Text style={type.h2}>People you may know</Text><Text style={type.small}>Recommended based on your profile & activity</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{FILTERS.map((f) => <Chip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}</ScrollView>
        {list.length === 0 && <Empty icon="search-outline" title="No people found" text="Try another filter or search." />}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {list.map((p) => (
            <Card key={p.id} style={s.person}>
              <Pressable style={s.dismiss} onPress={() => dismissPerson(p.id)}><Ionicons name="close" size={14} color={colors.text2} /></Pressable>
              <Pressable onPress={() => navigation.navigate('Profile', { userId: p.id })} style={{ alignItems: 'center', width: '100%' }}>
                <Avatar uri={p.avatar} name={p.name} size={64} online={p.online} />
                <Text style={[type.h3, { marginTop: 8 }]} numberOfLines={1}>{p.name}</Text>
                <Text style={[type.small, { textAlign: 'center', height: 36 }]} numberOfLines={2}>{p.headline}</Text>
              </Pressable>
              <Text style={s.reason} numberOfLines={1}>{p.reason}</Text>
              {actionFor(p)}
            </Card>
          ))}
        </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  ico: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: font.bold, fontSize: 11, color: colors.primary, backgroundColor: colors.tint, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8, overflow: 'hidden' },
  red: { fontFamily: font.bold, fontSize: 12, color: '#fff', backgroundColor: colors.error, width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, marginLeft: 8, overflow: 'hidden' },
  inv: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  x: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  person: { width: '48%', alignItems: 'center', paddingTop: 20 },
  dismiss: { position: 'absolute', top: 8, right: 8, zIndex: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  reason: { fontFamily: font.semi, fontSize: 12, color: colors.primary, backgroundColor: colors.tint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginVertical: 8, overflow: 'hidden', maxWidth: '100%' },
  cbtn: { height: 40, width: '100%', paddingHorizontal: 0 }, connect: { backgroundColor: colors.tint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  connected: { backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  searchResult: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginBottom: 8 },
  username: { fontFamily: font.reg, fontSize: 12, color: colors.text3, marginTop: 2 },
});
