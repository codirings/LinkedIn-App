import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { Avatar, TopBar, Chip, GradientButton, Empty } from '../../components';
import { listTime } from '../../utils/time';
import { colors, type, font } from '../../theme';

export default function MessagesScreen({ navigation }) {
  const { conversations, deleteConversation } = useApp();
  const [q, setQ] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const last = (c) => c.messages[c.messages.length - 1];
  const data = conversations
    .filter((c) => !c.hidden && (!unreadOnly || c.unread) && `${c.name} ${c.messages.map((m) => m.text).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (last(b)?.ts || 0) - (last(a)?.ts || 0));
  const confirmDelete = (c) => Alert.alert('Delete conversation?', `Your chat with ${c.name} will be removed.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(c.id) }]);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar placeholder="Search messages" value={q} onChangeText={setQ} />
      <FlatList data={data} keyExtractor={(c) => c.id} contentContainerStyle={{ padding: 16, gap: 8 }} keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Chip label="All" active={!unreadOnly} onPress={() => setUnreadOnly(false)} /><Chip label="Unread" active={unreadOnly} onPress={() => setUnreadOnly(true)} />
            <View style={{ flex: 1 }} /><GradientButton title="New" icon="create-outline" small onPress={() => navigation.navigate('Connections')} />
          </View>}
        ListEmptyComponent={<Empty icon="chatbubbles-outline" title="No messages yet" text="Tap New and pick a connection to start chatting." />}
        renderItem={({ item: c }) => {
          const m = last(c);
          return (
            <Pressable style={s.row} onPress={() => navigation.navigate('Chat', { cid: c.id })} onLongPress={() => confirmDelete(c)}>
              <Avatar uri={c.avatar} name={c.name} size={52} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[type.h3, { flexShrink: 1 }]}>{c.name}</Text>{!!m && <Text style={[type.small, c.unread > 0 && { color: colors.primary }]}>{listTime(m.ts)}</Text>}</View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[type.small, { flex: 1 }, c.unread > 0 && { fontFamily: font.bold, color: colors.text }]} numberOfLines={1}>{m ? `${m.from === 'me' ? 'You: ' : ''}${m.text}` : 'No messages yet. Say hello!'}</Text>
                  {c.unread > 0 && <Text style={s.cnt}>{c.unread}</Text>}
                </View>
              </View>
            </Pressable>
          );
        }} />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border },
  cnt: { fontFamily: font.bold, fontSize: 12, color: '#fff', backgroundColor: colors.primary, minWidth: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, overflow: 'hidden', marginLeft: 8 },
});
