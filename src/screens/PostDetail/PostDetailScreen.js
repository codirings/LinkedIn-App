import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Header, Input, Empty } from '../../components';
import PostCard from '../../components/PostCard';
import { usePostComments } from '../../hooks/usePostComments';
import { timeAgo } from '../../utils/time';
import { colors, type } from '../../theme';

export default function PostDetailScreen({ route }) {
  const { posts, user, addComment, deleteComment } = useApp();
  const postId = route.params.postId;
  const post = posts.find((p) => p.id === postId);
  const comments = usePostComments(postId, user?.id);
  const [text, setText] = useState('');

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Post" />
        <Empty icon="document-text-outline" title="This post is no longer available" text="It may have been removed by its author." />
      </View>
    );
  }

  const send = () => {
    if (!text.trim()) return;
    addComment(post.id, text.trim());
    setText('');
  };
  const del = (c) => Alert.alert('Delete comment?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteComment(post.id, c.id) },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Post" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          <PostCard post={post} detail />
          <Text style={type.h3}>Comments ({comments.length})</Text>
          {comments.length === 0 && <Empty icon="chatbubbles-outline" title="No comments yet" text="Start the conversation." />}
          {comments.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row' }}>
              <Avatar uri={c.avatar} name={c.author} size={36} />
              <View style={s.bubble}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={type.label}>{c.mine ? user.name : c.author} <Text style={type.small}>• {timeAgo(c.ts)}</Text></Text>
                  {c.mine && <Ionicons name="trash-outline" size={16} color={colors.text3} onPress={() => del(c)} />}
                </View>
                <Text style={type.body}>{c.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={s.bar}>
          <Input placeholder="Add a comment…" value={text} onChangeText={setText} style={{ flex: 1, height: 44 }} onSubmitEditing={send} returnKeyType="send" />
          <Ionicons name="send" size={24} color={text.trim() ? colors.primary : colors.text3} style={{ marginLeft: 12 }} onPress={send} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  bubble: { flex: 1, marginLeft: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
});
