import React from 'react';
import { View, Text, Image, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from './LinearGradient';
import Ionicons from './Ionicons';
import { colors, gradient, radius, font, shadow, type } from '../theme';
import { useApp } from '../context/AppContext';

export const Avatar = ({ uri, name = '?', size = 48, online }) => (
  <View style={{ width: size, height: size }}>
    {uri ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.chipBg }} />
      : <LinearGradient colors={gradient} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: font.bold, fontSize: size * 0.38 }}>{name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</Text>
        </LinearGradient>}
    {online !== undefined && <View style={[s.pip, { backgroundColor: online ? colors.success : colors.text3 }]} />}
  </View>
);

export const Card = ({ style, children }) => <View style={[s.card, style]}>{children}</View>;

export const GradientButton = ({ title, onPress, icon, style, small, disabled }) => (
  <Pressable disabled={disabled} onPress={onPress} style={[shadow.cta, { borderRadius: radius.md, opacity: disabled ? 0.5 : 1 }, style]}>
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, small && { height: 36, paddingHorizontal: 16 }]}>
      {icon && <Ionicons name={icon} size={18} color="#fff" style={title ? { marginRight: 6 } : null} />}
      {!!title && <Text style={s.btnText}>{title}</Text>}
    </LinearGradient>
  </Pressable>
);

export const OutlineButton = ({ title, onPress, icon, style, dark, danger }) => (
  <Pressable onPress={onPress} style={[s.btn, s.outline, dark && { backgroundColor: '#293040', borderColor: '#293040' }, danger && { borderColor: colors.error }, style]}>
    {icon && <Ionicons name={icon} size={18} color={dark ? '#fff' : danger ? colors.error : colors.primary} style={{ marginRight: 6 }} />}
    <Text style={[s.btnText, { color: dark ? '#fff' : danger ? colors.error : colors.text }]}>{title}</Text>
  </Pressable>
);

export const Chip = ({ label, active, icon, onPress, onRemove }) => (
  <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
    {icon && <Ionicons name={icon} size={14} color={active ? colors.primary : colors.text2} style={{ marginRight: 4 }} />}
    <Text style={[s.chipText, active && { color: colors.primary, fontFamily: font.semi }]}>{label}</Text>
    {onRemove && <Ionicons name="close" size={14} color={colors.text2} style={{ marginLeft: 6 }} onPress={onRemove} />}
  </Pressable>
);

export const Badge = ({ label }) => <View style={s.badge}><Text style={s.badgeText}>{label}</Text></View>;

export const Input = ({ icon, style, ...p }) => (
  <View style={[s.input, p.multiline && { height: undefined, minHeight: 96, alignItems: 'flex-start', paddingTop: 12 }, style]}>
    {icon && <Ionicons name={icon} size={18} color={colors.text2} style={{ marginRight: 10 }} />}
    <TextInput placeholderTextColor={colors.text3} textAlignVertical={p.multiline ? 'top' : 'center'} style={{ flex: 1, fontFamily: font.reg, fontSize: 14, color: colors.text }} {...p} />
  </View>
);

export const Field = ({ label, ...p }) => (
  <View style={{ marginBottom: 16 }}><Text style={[type.label, { marginBottom: 6 }]}>{label}</Text><Input {...p} /></View>
);

export const Empty = ({ icon = 'sparkles-outline', title, text }) => (
  <View style={{ alignItems: 'center', padding: 32 }}>
    <Ionicons name={icon} size={40} color={colors.text3} /><Text style={[type.h3, { marginTop: 12 }]}>{title}</Text>
    <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>{text}</Text>
  </View>
);

export const Header = ({ title, right }) => {
  const nav = useNavigation();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <View style={s.header}>
        <Ionicons name="arrow-back" size={24} color={colors.text} onPress={() => nav.goBack()} />
        <Text style={[type.h3, { flex: 1, marginLeft: 16 }]} numberOfLines={1}>{title}</Text>{right}
      </View>
    </SafeAreaView>
  );
};

export const TopBar = ({ placeholder, value, onChangeText }) => {
  const nav = useNavigation();
  const { user, notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <View style={s.topbar}>
      <Input icon="search" placeholder={placeholder} value={value} onChangeText={onChangeText} style={{ flex: 1, height: 40, marginRight: 12 }} />
      <Pressable onPress={() => nav.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />{unread > 0 && <View style={s.dot} />}
      </Pressable>
      <Pressable onPress={() => nav.navigate('Profile')} style={{ marginLeft: 14 }}><Avatar uri={user.avatar} name={user.name} size={36} /></Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, ...shadow.card },
  btn: { height: 44, paddingHorizontal: 20, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: font.semi, fontSize: 14, color: '#fff' },
  outline: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  chipOn: { backgroundColor: colors.tint, borderColor: colors.tintBorder },
  chipText: { fontFamily: font.reg, fontSize: 13, color: colors.text2 },
  badge: { backgroundColor: colors.chipBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: colors.text2 },
  input: { height: 48, borderRadius: radius.md, paddingHorizontal: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  pip: { position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(229,231,235,0.8)' },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 0, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.error, borderWidth: 1.5, borderColor: '#fff' },
});
