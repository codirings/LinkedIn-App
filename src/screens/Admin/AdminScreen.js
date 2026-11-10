import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Switch, Alert, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { Avatar, Badge, Card, Empty, Header, Input, OutlineButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { fetchMetrics, removePost, setUserDisabled, subscribeToUsers, updateSettings } from '../../services/admin';
import { seedJobCatalog } from '../../services/jobs';
import { JOB_CATALOG } from '../../data/jobCatalog';
import { timeAgo } from '../../utils/time';
import { colors, radius, type } from '../../theme';

const fail = (verb) => (error) => Alert.alert(`Could not ${verb}`, `${error?.code ?? ''} ${error?.message ?? error}`.trim());

function Section({ icon, title, right, children }) {
  return (
    <Card>
      <View style={s.sectionHead}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[type.h3, { flex: 1, marginLeft: 8 }]}>{title}</Text>
        {right}
      </View>
      {children}
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <View style={s.stat}>
      <Text style={type.h2}>{value ?? '–'}</Text>
      <Text style={type.small}>{label}</Text>
    </View>
  );
}

function MetricsWidget() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setMetrics(await fetchMetrics()); setError(null); } catch (e) { setError(e?.message || String(e)); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <Section icon="stats-chart-outline" title="System metrics" right={loading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="refresh" size={22} color={colors.text2} onPress={load} />}>
      {error && <Text style={[type.small, { color: colors.error, marginBottom: 8 }]}>{error}</Text>}
      <View style={s.grid}>
        <Stat label="Total users" value={metrics?.totalUsers} />
        <Stat label="New (7 days)" value={metrics?.newUsers7d} />
        <Stat label="Disabled users" value={metrics?.disabledUsers} />
        <Stat label="Admins" value={metrics?.admins} />
        <Stat label="Total posts" value={metrics?.totalPosts} />
        <Stat label="Posts (24h)" value={metrics?.posts24h} />
      </View>
    </Section>
  );
}

function SettingsWidget() {
  const { settings, user } = useApp();
  const rows = [
    { key: 'postingEnabled', title: 'Allow new posts', text: 'When off, only admins can publish posts.', value: settings.postingEnabled },
    { key: 'maintenanceMode', title: 'Maintenance mode', text: 'When on, non-admin users see a maintenance screen.', value: settings.maintenanceMode },
  ];
  const toggle = (key, value) => {
    const apply = () => updateSettings({ [key]: value }, user.id).catch(fail('update the setting'));
    if (key === 'maintenanceMode' && value) {
      Alert.alert('Turn on maintenance mode?', 'Everyone except admins will be locked out until you turn it off.', [
        { text: 'Cancel', style: 'cancel' }, { text: 'Turn on', style: 'destructive', onPress: apply },
      ]);
    } else apply();
  };
  return (
    <Section icon="settings-outline" title="Site settings">
      {rows.map((r, i) => (
        <View key={r.key} style={[s.row, i > 0 && s.rowBorder]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={type.label}>{r.title}</Text>
            <Text style={type.small}>{r.text}</Text>
          </View>
          <Switch value={r.value} onValueChange={(v) => toggle(r.key, v)} trackColor={{ true: colors.primary }} />
        </View>
      ))}
    </Section>
  );
}

function UsersWidget() {
  const { user: me } = useApp();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => subscribeToUsers(setUsers, (e) => setError(e?.message || String(e))), []);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (users || []).filter((u) => !term || `${u.displayName || ''} ${u.email || ''}`.toLowerCase().includes(term));
    return list.slice(0, 25);
  }, [users, q]);
  const toggle = (u) => {
    const disabling = !u.disabled;
    Alert.alert(disabling ? 'Disable this account?' : 'Re-enable this account?', `${u.displayName || u.email || u.id}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: disabling ? 'Disable' : 'Enable', style: disabling ? 'destructive' : 'default', onPress: () => setUserDisabled(u.id, disabling).catch(fail('update the user')) },
    ]);
  };
  return (
    <Section icon="people-outline" title={`Users${users ? ` (${users.length})` : ''}`}>
      <Input icon="search" placeholder="Search by name or email" value={q} onChangeText={setQ} autoCapitalize="none" style={{ height: 44, marginBottom: 8 }} />
      {error && <Text style={[type.small, { color: colors.error }]}>{error}</Text>}
      {!users && !error && <ActivityIndicator color={colors.primary} style={{ margin: 16 }} />}
      {users && shown.length === 0 && <Empty icon="people-outline" title="No users found" text="Try a different search." />}
      {shown.map((u, i) => (
        <View key={u.id} style={[s.row, i > 0 && s.rowBorder]}>
          <Avatar uri={u.photoURL} name={u.displayName || u.email || '?'} size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[type.label, { flexShrink: 1 }]} numberOfLines={1}>{u.displayName || 'Unnamed'}</Text>
              {u.id === me.id && <Badge label="You" />}
              {u.disabled && <Badge label="Disabled" />}
            </View>
            <Text style={type.small} numberOfLines={1}>{u.email}</Text>
          </View>
          {u.id !== me.id && (
            <Pressable onPress={() => toggle(u)} style={s.action} hitSlop={8}>
              <Ionicons name={u.disabled ? 'checkmark-circle-outline' : 'ban-outline'} size={20} color={u.disabled ? colors.success : colors.error} />
            </Pressable>
          )}
        </View>
      ))}
      {users && users.length > shown.length && !q && <Text style={[type.small, { marginTop: 8 }]}>Showing {shown.length} of {users.length}. Use search to find others.</Text>}
    </Section>
  );
}

function ModerationWidget() {
  const { posts } = useApp();
  const recent = posts.slice(0, 15);
  const remove = (p) => Alert.alert('Remove this post?', `By ${p.author}. This can’t be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => removePost(p.id).catch(fail('remove the post')) },
  ]);
  return (
    <Section icon="flag-outline" title="Content moderation">
      {recent.length === 0 && <Empty icon="document-text-outline" title="No posts" text="Posts will show up here for review." />}
      {recent.map((p, i) => (
        <View key={p.id} style={[s.row, i > 0 && s.rowBorder, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={type.label} numberOfLines={1}>{p.author} <Text style={type.small}>• {timeAgo(p.ts)}</Text></Text>
            <Text style={[type.body, { marginTop: 2 }]} numberOfLines={3}>{p.text}</Text>
          </View>
          <Pressable onPress={() => remove(p)} style={s.action} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      ))}
    </Section>
  );
}

// Loads the sample listings into jobs/. Deterministic ids mean running it again updates them in place.
function CatalogWidget() {
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      const count = await seedJobCatalog(JOB_CATALOG);
      Alert.alert('Job catalog loaded', `${count} sample listings are now in Jobs.`);
    } catch (error) {
      fail('load the job catalog')(error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section icon="briefcase-outline" title="Job catalog">
      <Text style={[type.small, { marginBottom: 12 }]}>
        Adds {JOB_CATALOG.length} sample listings across design, engineering, data and operations. Safe to run again: existing sample listings are updated, not duplicated.
      </Text>
      <OutlineButton title={busy ? 'Loading…' : 'Load sample jobs'} icon="cloud-upload-outline" onPress={load} />
    </Section>
  );
}

export default function AdminScreen() {
  const { isAdmin } = useApp();
  const [refreshKey, setRefreshKey] = useState(0);
  // Defense in depth: the route is only registered for admins, but the screen re-checks too.
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Admin" />
        <Empty icon="lock-closed-outline" title="Not authorized" text="You need administrator access to view this page." />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Admin dashboard" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={() => setRefreshKey((k) => k + 1)} />}>
        <MetricsWidget key={`m${refreshKey}`} />
        <SettingsWidget />
        <UsersWidget />
        <CatalogWidget />
        <ModerationWidget />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '31%', flexGrow: 1, backgroundColor: colors.bg, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  action: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chipBg },
});
