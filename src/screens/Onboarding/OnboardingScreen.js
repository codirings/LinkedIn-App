import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Card, Chip, GradientButton, Input } from '../../components';
import { colors, type, font } from '../../theme';

const professions = ['Product Designer', 'Software Engineer', 'Product Manager', 'Data Scientist', 'Founder'];
const levels = [['Entry', '0–2 yrs exp'], ['Mid-level', '3–5 yrs exp'], ['Senior / Lead', '6+ yrs exp'], ['Executive', 'Director & C-Suite']];
const goals = ['Design Systems', 'AI & Machine Learning', 'Startup Growth', 'Remote Work', 'Leadership', 'Tech Jobs', 'Mentorship'];

export default function OnboardingScreen() {
  const { completeOnboarding, signOut } = useApp();
  const [profession, setProfession] = useState('Product Designer');
  const [org, setOrg] = useState('');
  const [level, setLevel] = useState('Mid-level');
  const [picked, setPicked] = useState(['Design Systems', 'AI & Machine Learning', 'Startup Growth']);
  const [open, setOpen] = useState(true);
  const [lookup, setLookup] = useState(false);
  const toggle = (g) => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));
  const finish = () => completeOnboarding({ headline: profession.trim(), company: org.trim(), interests: picked });
  const Title = ({ icon, t, right }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name={icon} size={18} color={colors.primary} /><Text style={[type.h3, { color: colors.primary, marginLeft: 8, flex: 1 }]}>{t}</Text>{right}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.head}>
        <Ionicons name="log-out-outline" size={24} onPress={signOut} />
        <Text style={[type.h3, { fontFamily: font.xbold }]}>Set up your profile</Text>
        <Text style={[type.label, { color: colors.primary }]} onPress={finish}>Skip</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Tailor your experience</Text>
        <Text style={type.body}>Tell us what you do so we can customize your feed, job matches and network suggestions.</Text>
        <Card>
          <Title icon="id-card-outline" t="Professional Identity" />
          <Text style={[type.label, { marginVertical: 8 }]}>Headline</Text>
          <Input icon="briefcase-outline" value={profession} onChangeText={setProfession} />
          <View style={s.wrap}>{professions.map((p) => <Chip key={p} label={p} active={p === profession} onPress={() => setProfession(p)} />)}</View>
          <Text style={[type.label, { marginVertical: 8 }]}>Current Organization</Text>
          <Input icon="business-outline" placeholder="Company, Studio, or 'Independent'" value={org} onChangeText={setOrg} />
          <Text style={[type.label, { marginVertical: 8 }]}>Experience</Text>
          <View style={s.wrap}>
            {levels.map(([l, sub]) => (
              <Pressable key={l} onPress={() => setLevel(l)} style={[s.level, level === l && s.levelOn]}>
                <Text style={[type.label, level === l && { color: colors.primary }]}>{l}</Text><Text style={type.small}>{sub}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card>
          <Title icon="git-network-outline" t="Topics & Goals" right={<Text style={s.count}>{picked.length} selected</Text>} />
          <Text style={[type.small, { marginVertical: 8 }]}>Choose 3 or more subjects.</Text>
          <View style={s.wrap}>{goals.map((g) => <Chip key={g} label={g} active={picked.includes(g)} onPress={() => toggle(g)} />)}</View>
        </Card>
        <Card>
          <Title icon="shield-outline" t="Visibility" />
          {[['Open to opportunities', 'Signal confidentially to verified recruiters', open, setOpen], ['Colleague email lookup', 'Let people who know your email connect easily', lookup, setLookup]].map(([t, d, v, set]) => (
            <View key={t} style={s.row}><View style={{ flex: 1 }}><Text style={type.label}>{t}</Text><Text style={type.small}>{d}</Text></View><Switch value={v} onValueChange={set} trackColor={{ true: colors.primary }} /></View>
          ))}
        </Card>
        <GradientButton title="Continue to your feed" icon="arrow-forward" onPress={finish} disabled={picked.length < 3} />
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  level: { width: '48%', padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  levelOn: { backgroundColor: colors.tint, borderColor: colors.tintBorder },
  count: { fontFamily: font.bold, fontSize: 11, color: colors.text2, backgroundColor: colors.chipBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: colors.tint, marginTop: 12 },
});
