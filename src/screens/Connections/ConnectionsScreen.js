import React, { useState } from 'react';
import { View, Text, FlatList, Alert, Pressable, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Header, Input, Empty, GradientButton, OutlineButton } from '../../components';
import { presenceLabel } from '../../utils/presence';
import { colors, type } from '../../theme';

export default function ConnectionsScreen({ navigation }) {
  const { connections, removeConnection, blockPerson, unblockPerson, blockedProfiles, openConversation } = useApp();
  const [q, setQ] = useState('');
  const data = connections.filter((c) => `${c.name} ${c.headline}`.toLowerCase().includes(q.toLowerCase()));
  const message = (c) => { const id = openConversation(c); navigation.navigate('Chat', { cid: id, person: c }); };
  const manage = (c) => Alert.alert(c.name, undefined, [
    { text: 'Remove connection', style: 'destructive', onPress: () => removeConnection(c.id) },
    { text: 'Block', style: 'destructive', onPress: () => confirmBlock(c) },
    { text: 'Cancel', style: 'cancel' },
  ]);
  const confirmBlock = (c) => Alert.alert(`Block ${c.name}?`, 'You will no longer see each other’s profiles, posts or messages, and the connection is removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Block', style: 'destructive', onPress: () => blockPerson(c.id) },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={`Connections (${connections.length})`} />
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Input icon="search" placeholder="Search connections" value={q} onChangeText={setQ} style={{ marginBottom: 8 }} />}
        ListEmptyComponent={connections.length === 0
          ? <View style={{ alignItems: 'center' }}>
              <Empty icon="people-outline" title="No connections yet" text="Browse people and connect when you find someone you know." />
              <GradientButton title="Browse people" icon="search" onPress={() => navigation.navigate('Network')} />
            </View>
          : <Empty icon="search-outline" title="No connections found" text="Try another name or headline." />}
        ListFooterComponent={blockedProfiles.length > 0
          ? <View style={{ marginTop: 24, gap: 8 }}>
              <Text style={type.h3}>Blocked members</Text>
              {blockedProfiles.map((b) => (
                <View key={b.id} style={s.row}>
                  <View style={{ flex: 1 }}><Text style={type.h3}>{b.name}</Text><Text style={type.small}>You can’t see each other’s activity</Text></View>
                  <OutlineButton title="Unblock" onPress={() => unblockPerson(b.id)} />
                </View>
              ))}
            </View>
          : null}
        renderItem={({ item: c }) => (
          <View style={s.row}>
            <Avatar uri={c.avatar} name={c.name} size={48} online={c.online} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={type.h3}>{c.name}</Text>
              <Text style={type.small} numberOfLines={1}>{c.headline}</Text>
              {c.lastActiveMs !== undefined && <Text style={[type.small, { fontSize: 11 }]}>{presenceLabel(c)}</Text>}
            </View>
            <Pressable style={s.btn} onPress={() => message(c)}><Ionicons name="chatbubble-outline" size={20} color={colors.primary} /></Pressable>
            <Pressable style={[s.btn, { marginLeft: 8 }]} onPress={() => manage(c)}><Ionicons name="ellipsis-horizontal" size={20} color={colors.text2} /></Pressable>
          </View>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border },
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
});
