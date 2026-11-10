import React from 'react';
import { View, Text, Image, Pressable, Alert, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from './Ionicons';
import { ResizeMode, Video } from '../utils/video';
import { useApp } from '../context/AppContext';
import { Avatar, Badge, Card } from './index';
import { timeAgo } from '../utils/time';
import { colors, type, font } from '../theme';

export default function PostCard({ post: p, detail }) {
  const nav = useNavigation();
  const { user, deletePost, toggleLike } = useApp();
  const a = p.mine ? { author: user.name, avatar: user.avatar, headline: user.headline } : p;
  const del = () => Alert.alert('Delete post?', 'This can’t be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { deletePost(p.id); if (detail) nav.goBack(); } },
  ]);
  const menu = () => Alert.alert('Post options', undefined, [
    { text: 'Edit post', onPress: () => nav.navigate('CreatePost', { post: p }) },
    { text: 'Delete post', style: 'destructive', onPress: del },
    { text: 'Cancel', style: 'cancel' },
  ]);
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar uri={a.avatar} name={a.author} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={type.h3}>{a.author}</Text>{p.mine ? <Badge label="You" /> : !!p.degree && <Badge label={p.degree} />}</View>
          {!!a.headline && <Text style={type.small} numberOfLines={1}>{a.headline}</Text>}
          <Text style={type.small}>{timeAgo(p.ts)}{p.edited ? ' • Edited' : ''}</Text>
        </View>
        {p.mine && <Ionicons name="ellipsis-horizontal" size={22} color={colors.text2} onPress={menu} />}
      </View>
      <Text style={[type.body, { marginVertical: 12 }]}>{p.text}</Text>
      {!!p.image && <Image source={{ uri: p.image }} style={s.img} />}
      {!!p.video && <Video source={{ uri: p.video }} style={s.img} useNativeControls resizeMode={ResizeMode.COVER} />}
      <Text style={type.small}>{p.likes} likes • {p.commentCount ?? 0} comments • {p.reposts} reposts</Text>
      <View style={s.actions}>
        <Pressable style={s.act} onPress={() => toggleLike(p.id)}><Ionicons name={p.liked ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={p.liked ? colors.primary : colors.text2} /><Text style={[s.t, p.liked && { color: colors.primary }]}>Like</Text></Pressable>
        <Pressable style={s.act} onPress={() => !detail && nav.navigate('PostDetail', { postId: p.id })}><Ionicons name="chatbox-outline" size={20} color={colors.text2} /><Text style={s.t}>Comment</Text></Pressable>
        <Pressable style={s.act} onPress={() => Share.share({ message: `${a.author}: ${p.text}` })}><Ionicons name="share-social-outline" size={20} color={colors.text2} /><Text style={s.t}>Share</Text></Pressable>
      </View>
    </Card>
  );
}
const s = StyleSheet.create({
  img: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: colors.chipBg },
  actions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 },
  act: { flexDirection: 'row', alignItems: 'center' }, t: { fontFamily: font.semi, fontSize: 13, color: colors.text2, marginLeft: 6 },
});
