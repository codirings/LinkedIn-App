import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import LinearGradient from '../../components/LinearGradient';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Avatar, Card, Chip, Empty, Header, Input, OutlineButton, GradientButton } from '../../components';
import { pickImage } from '../../utils/media';
import { presenceLabel } from '../../utils/presence';
import { RELATION } from '../../utils/relationship';
import { colors, gradient, type } from '../../theme';

export default function ProfileScreen({ navigation, route }) {
  const {
    isAdmin, user: ownUser, userId, connections, posts, openConversation, connect, withdrawRequest, acceptInvite, ignoreInvite,
    removeConnection, blockPerson, unblockPerson, relationFor, profileFor, updateProfile, removeSkill, addSkill, deleteExperience, signOut,
  } = useApp();
  const [skill, setSkill] = useState('');
  const viewedId = route.params?.userId ?? route.params?.profile?.id ?? null;
  const isOwnProfile = !viewedId || viewedId === userId;
  const viewed = isOwnProfile ? null : profileFor(viewedId);
  const relation = isOwnProfile ? null : relationFor(viewedId);

  if (!isOwnProfile && !viewed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Profile" />
        <Empty icon="person-outline" title="Profile not available" text="This member can’t be shown right now." />
      </View>
    );
  }

  const user = isOwnProfile ? ownUser : {
    ...viewed,
    experience: Array.isArray(viewed.experience) ? viewed.experience : [],
    skills: Array.isArray(viewed.skills) ? viewed.skills : [],
  };
  const changePhoto = async () => { const uri = await pickImage({ allowsEditing: true, aspect: [1, 1] }); if (uri) updateProfile({ avatar: uri }); };
  const add = () => { if (skill.trim()) { addSkill(skill.trim()); setSkill(''); } };
  const confirmDel = (x) => Alert.alert('Remove experience?', `${x.title} at ${x.company}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => deleteExperience(x.id) }]);
  const confirmBlock = () => Alert.alert(`Block ${user.name}?`, 'You will no longer see each other’s profiles, posts or messages, and any connection is removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Block', style: 'destructive', onPress: () => blockPerson(viewedId) },
  ]);
  const confirmRemove = () => Alert.alert('Remove connection?', `${user.name} won’t be notified.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => removeConnection(viewedId) },
  ]);
  const SectionHead = ({ t, onAdd }) => (
    <View style={s.sectionHead}>
      <Text style={type.h3}>{t}</Text>{onAdd && <Ionicons name="add-circle-outline" size={26} color={colors.primary} onPress={onAdd} />}
    </View>
  );

  // Buttons for another member, chosen from the live relationship state.
  const memberActions = () => {
    if (relation === RELATION.UNAVAILABLE) return <Text style={[type.small, { marginTop: 16 }]}>This profile isn’t available.</Text>;
    if (relation === RELATION.BLOCKED) {
      return (
        <View style={{ marginTop: 16, gap: 8 }}>
          <Text style={type.small}>You blocked this member.</Text>
          <OutlineButton title="Unblock" icon="checkmark-outline" onPress={() => unblockPerson(viewedId)} />
        </View>
      );
    }
    let primary;
    if (relation === RELATION.CONNECTED) {
      primary = (
        <View style={{ marginTop: 16, gap: 12 }}>
          <GradientButton title="Message" icon="chatbubble-outline" onPress={() => { const cid = openConversation(user); navigation.navigate('Chat', { cid, person: user }); }} />
          <OutlineButton title="Remove connection" icon="person-remove-outline" danger onPress={confirmRemove} />
        </View>
      );
    } else if (relation === RELATION.OUTGOING) {
      primary = <OutlineButton title="Withdraw request" icon="time-outline" onPress={() => withdrawRequest(viewedId)} style={{ marginTop: 16 }} />;
    } else if (relation === RELATION.INCOMING) {
      primary = (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <GradientButton title="Accept" icon="checkmark" style={{ flex: 1 }} onPress={() => acceptInvite(viewedId).catch(() => Alert.alert('Could not accept', 'Please try again.'))} />
          <OutlineButton title="Decline" style={{ flex: 1 }} onPress={() => ignoreInvite(viewedId)} />
        </View>
      );
    } else {
      primary = (
        <Pressable style={s.connectionButton} onPress={() => connect(viewedId)}>
          <Ionicons name="person-add-outline" size={18} color={colors.primary} /><Text style={[type.label, { color: colors.primary, marginLeft: 8 }]}>Connect</Text>
        </Pressable>
      );
    }
    return (
      <View>
        {primary}
        <OutlineButton title="Block member" icon="ban-outline" danger onPress={confirmBlock} style={{ marginTop: 12 }} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <LinearGradient colors={gradient} style={{ height: 90 }} />
          <View style={{ padding: 16 }}>
            <Pressable onPress={isOwnProfile ? changePhoto : undefined} style={s.ring}>
              <Avatar uri={user.avatar} name={user.name} size={88} online={isOwnProfile ? undefined : viewed?.online} />
              {isOwnProfile && <View style={s.cam}><Ionicons name="camera" size={14} color="#fff" /></View>}
            </Pressable>
            <Text style={[type.h2, { marginTop: 8 }]}>{user.name}</Text>
            <Text style={type.body}>{user.headline || 'Add a headline'}</Text>
            <Text style={type.small}>{[user.company, user.location].filter(Boolean).join(' • ') || (isOwnProfile ? 'Add company and location' : '')}</Text>
            {!isOwnProfile && !!viewed?.username && <Text style={[type.small, { marginTop: 4 }]}>@{viewed.username}</Text>}
            {!isOwnProfile && viewed?.lastActiveMs !== undefined && <Text style={[type.label, { color: viewed.online ? colors.success : colors.text2, marginTop: 6 }]}>{presenceLabel(viewed)}</Text>}
            {isOwnProfile && <Text style={[type.label, { color: colors.primary, marginTop: 8 }]} onPress={() => navigation.navigate('Connections')}>{connections.length} connections • {posts.filter((p) => p.mine).length} posts</Text>}
            {isOwnProfile && <GradientButton title="Edit profile" icon="create-outline" onPress={() => navigation.navigate('EditProfile')} style={{ marginTop: 16 }} />}
            {!isOwnProfile && memberActions()}
          </View>
        </Card>
        <Card><SectionHead t="About" />
          <Text style={type.body}>{user.about || (isOwnProfile ? 'Tell people what you do and what you’re looking for. Tap Edit profile to add a summary.' : 'No about information added yet.')}</Text></Card>
        <Card>
          <SectionHead t="Experience" onAdd={isOwnProfile ? () => navigation.navigate('ExperienceForm') : undefined} />
          {user.experience.length === 0 && <Text style={type.small}>{isOwnProfile ? 'No experience yet. Tap + to add your first role.' : 'No experience added yet.'}</Text>}
          {user.experience.map((x) => (
            <View key={x.id} style={s.exp}>
              <View style={s.ico}><Ionicons name="business" size={18} color={colors.primary} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={type.label}>{x.title}</Text><Text style={type.small}>{x.company}{x.period ? ` • ${x.period}` : ''}</Text>
                {!!x.desc && <Text style={[type.small, { marginTop: 4 }]}>{x.desc}</Text>}
              </View>
              {isOwnProfile && <Ionicons name="create-outline" size={20} color={colors.text2} onPress={() => navigation.navigate('ExperienceForm', { exp: x })} />}
              {isOwnProfile && <Ionicons name="trash-outline" size={20} color={colors.text3} style={{ marginLeft: 12 }} onPress={() => confirmDel(x)} />}
            </View>
          ))}
        </Card>
        <Card>
          <SectionHead t="Skills" />
          <View style={s.chips}>
            {user.skills.map((k) => <Chip key={k} label={k} active onRemove={isOwnProfile ? () => removeSkill(k) : undefined} />)}
          </View>
          {isOwnProfile && <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input placeholder="Add a skill" value={skill} onChangeText={setSkill} onSubmitEditing={add} style={{ flex: 1, height: 44 }} />
            <GradientButton icon="add" onPress={add} style={{ width: 52 }} />
          </View>}
        </Card>
        {isOwnProfile && isAdmin && <OutlineButton title="Admin dashboard" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Admin')} />}
        {isOwnProfile && <OutlineButton title="Sign out" icon="log-out-outline" danger onPress={signOut} />}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  ring: { alignSelf: 'flex-start', marginTop: -60, borderWidth: 4, borderColor: '#fff', borderRadius: 48 },
  cam: { position: 'absolute', right: 0, bottom: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  exp: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  ico: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  connectionButton: { height: 44, marginTop: 16, backgroundColor: colors.tint, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
