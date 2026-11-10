import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, Pressable, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '../../components/Ionicons';
import { ResizeMode, Video } from '../../utils/video';
import { useApp } from '../../context/AppContext';
import { Avatar, Chip, GradientButton } from '../../components';
import { pickImage, pickVideo } from '../../utils/media';
import { colors, type, font } from '../../theme';
import { aiError, generatePost } from '../../services/ai';

const MAX = 3000;
const SIZES = [{ l: 'Auto', w: 0 }, { l: '50', w: 50 }, { l: '120', w: 120 }, { l: '250', w: 250 }, { l: '400', w: 400 }];
const TONES = ['professional', 'friendly', 'bold', 'story'];
const TOPICS = ['#DesignSystems', '#AIinUX', '#Hiring', '#ProductManagement', '#Career'];

export default function CreatePostScreen({ navigation, route }) {
  const editing = route.params?.post;
  const { user, createPost, updatePost } = useApp();
  const [text, setText] = useState(editing?.text ?? '');
  const [image, setImage] = useState(editing?.image ?? null);
  const [video, setVideo] = useState(editing?.video ?? null);
  const [aiOpen, setAiOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [size, setSize] = useState(0);
  const [tone, setTone] = useState('professional');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  const submit = () => {
    if (!text.trim() && !image && !video) return;
    editing ? updatePost(editing.id, text.trim(), image, video) : createPost(text.trim(), image, video);
    navigation.goBack();
  };
  const run = async (improve) => {
    if (busy) return;
    if (!improve && !idea.trim()) { Alert.alert('Add an idea', 'Tell the AI what the post should be about.'); return; }
    setBusy(true); setInfo('');
    try {
      const r = await generatePost({ prompt: idea.trim(), words: size || undefined, tone, base: improve ? text.trim() : undefined, maxChars: MAX });
      setText(r.text); setInfo(`${r.words} words (target ${r.target})`);
    } catch (e) { Alert.alert('AI unavailable', aiError(e)); }
    setBusy(false);
  };
  const addPhoto = async () => { const uri = await pickImage(); if (uri) setImage(uri); };
  const addVideo = async () => { const uri = await pickVideo(); if (uri) setVideo(uri); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Ionicons name="close" size={28} onPress={() => navigation.goBack()} />
          <Text style={type.h3}>{editing ? 'Edit post' : 'Create post'}</Text>
          <GradientButton title={editing ? 'Save' : 'Post'} small onPress={submit} disabled={!text.trim() && !image && !video} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Avatar uri={user.avatar} name={user.name} size={48} />
            <View style={{ marginLeft: 12 }}><Text style={type.h3}>{user.name}</Text><Text style={type.small}>Post to your network</Text></View>
          </View>
          <TextInput autoFocus multiline value={text} onChangeText={setText} maxLength={MAX} placeholder="What do you want to talk about?" placeholderTextColor={colors.text3} style={s.input} />
          {!!image && (
            <View style={{ marginTop: 12 }}>
              <Image source={{ uri: image }} style={s.img} />
              <Pressable style={s.rm} onPress={() => setImage(null)}><Ionicons name="trash-outline" size={18} color="#fff" /></Pressable>
            </View>
          )}
          {!!video && (
            <View style={{ marginTop: 12 }}>
              <Video source={{ uri: video }} style={s.img} useNativeControls resizeMode={ResizeMode.COVER} />
              <Pressable style={s.rm} onPress={() => setVideo(null)}><Ionicons name="trash-outline" size={18} color="#fff" /></Pressable>
            </View>
          )}
          <Pressable style={s.aiHead} onPress={() => setAiOpen((v) => !v)}>
            <Ionicons name="sparkles" size={20} color={colors.primary} /><Text style={[type.label, { flex: 1, marginLeft: 8 }]}>Write with AI</Text>
            <Ionicons name={aiOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text2} />
          </Pressable>
          {aiOpen && (
            <View style={s.ai}>
              <TextInput value={idea} onChangeText={setIdea} multiline placeholder="What should the post be about? Add details, audience, key points." placeholderTextColor={colors.text3} style={s.idea} />
              <Text style={[type.small, { marginTop: 10 }]}>Length (words)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>{SIZES.map((x) => <Chip key={x.l} label={x.l} active={x.w === size} onPress={() => setSize(x.w)} />)}</ScrollView>
              <Text style={[type.small, { marginTop: 6 }]}>Tone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>{TONES.map((x) => <Chip key={x} label={x} active={x === tone} onPress={() => setTone(x)} />)}</ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
                <GradientButton title={busy ? 'Writing…' : 'Generate'} icon="sparkles" small onPress={() => run(false)} disabled={busy} />
                {!!text.trim() && <Pressable style={s.imp} onPress={() => run(true)} disabled={busy}><Text style={[type.label, { color: colors.primary }]}>Improve my draft</Text></Pressable>}
                {busy && <ActivityIndicator color={colors.primary} />}
              </View>
              {!!info && <Text style={[type.small, { marginTop: 8 }]}>{info}</Text>}
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}><Text style={type.label}>Suggested topics</Text><Text style={type.small}>{text.length} / {MAX.toLocaleString()}</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
            {TOPICS.map((t) => <Chip key={t} label={t} active onPress={() => setText((x) => (x.includes(t) ? x : `${x} ${t}`.trim()))} />)}
          </ScrollView>
        </ScrollView>
        <View style={s.add}>
          <View style={s.addActions}>
            <Pressable style={s.addItem} onPress={addPhoto}><Ionicons name="image" size={22} color={colors.primary} /><Text style={[type.label, { marginLeft: 8 }]}>{image ? 'Change photo' : 'Add photo'}</Text></Pressable>
            <Pressable style={s.addItem} onPress={addVideo}><Ionicons name="videocam" size={22} color={colors.primary} /><Text style={[type.label, { marginLeft: 8 }]}>{video ? 'Change video' : 'Add video'}</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  aiHead: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: colors.tint },
  ai: { marginTop: 8, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  idea: { ...type.body, minHeight: 64, textAlignVertical: 'top', padding: 10, borderRadius: 12, backgroundColor: colors.bg },
  imp: { height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' },
  input: { ...type.bodyLg, minHeight: 140, textAlignVertical: 'top', padding: 0 },
  img: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.chipBg },
  rm: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  add: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  addActions: { flexDirection: 'row', gap: 8 },
  addItem: { height: 48, borderRadius: 16, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint },
});
