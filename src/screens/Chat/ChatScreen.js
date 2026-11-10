import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Header, Input } from '../../components';
import { clock } from '../../utils/time';
import { subscribeMessages } from '../../services/social';
import { colors, type } from '../../theme';

export default function ChatScreen({ route, navigation }) {
  const { user, conversations, sendMessage, deleteMessage, markRead, messagingBlocked } = useApp();
  const { cid, person } = route.params;
  const found = conversations.find((c) => c.id === cid);
  const conv = found || (person && cid.includes('~') ? { id: cid, personId: person.id, name: person.name, avatar: person.avatar, unread: 0, cleared: 0, remote: true, messages: [] } : null);
  const [live, setLive] = useState([]);
  const [text, setText] = useState('');
  const ref = useRef(null);
  const cleared = conv?.cleared || 0;
  const blocked = messagingBlocked(conv?.personId || person?.id || '');

  useEffect(() => {
    if (!conv?.remote) return undefined;
    return subscribeMessages(cid, (docs) => setLive(docs.map((d) => ({ id: d.id, from: d.from === user.id ? 'me' : 'them', text: d.text, ts: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now() })).filter((m) => m.ts > cleared)), () => {});
  }, [cid, conv?.remote, cleared, user.id]);
  useEffect(() => { if (!conv) navigation.goBack(); else if (conv.unread) markRead(conv.id); }, [conv?.id, conv?.unread]); // eslint-disable-line react-hooks/exhaustive-deps
  const msgs = conv?.remote ? live : conv?.messages;
  if (!conv) return null;
  const send = () => { if (!text.trim() || blocked) return; sendMessage(conv.id, text.trim()); setText(''); };
  const del = (m) => m.from === 'me' && Alert.alert('Delete message?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(conv.id, m.id) }]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={conv.name} right={<Avatar uri={conv.avatar} name={conv.name} size={32} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {blocked && <Text style={s.banner}>You can’t message this member.</Text>}
        <FlatList ref={ref} data={msgs} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={[type.small, { textAlign: 'center', marginTop: 40 }]}>Say hello to {conv.name}. Long-press your own message to delete it.</Text>}
          renderItem={({ item: m }) => (
            <View style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
              <Text onLongPress={() => del(m)} style={[s.bubble, m.from === 'me' ? s.me : s.them]}>{m.text}</Text>
              <Text style={[type.small, { fontSize: 11, marginTop: 2 }]}>{clock(m.ts)}</Text>
            </View>
          )} />
        <View style={s.bar}>
          <Input placeholder={blocked ? 'Messaging unavailable' : 'Write a message…'} editable={!blocked} value={text} onChangeText={setText} style={{ flex: 1, height: 44 }} onSubmitEditing={send} returnKeyType="send" />
          <Ionicons name="send" size={24} color={text.trim() && !blocked ? colors.primary : colors.text3} style={{ marginLeft: 12 }} onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, overflow: 'hidden', fontSize: 14, lineHeight: 20 },
  me: { backgroundColor: colors.primary, color: '#fff' }, them: { backgroundColor: '#fff', color: colors.text, borderWidth: 1, borderColor: colors.border },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  banner: { textAlign: 'center', padding: 10, backgroundColor: colors.tint, color: colors.text2, fontSize: 13 },
});
