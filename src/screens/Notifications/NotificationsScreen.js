import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import Ionicons from '../../components/Ionicons';
import { useApp } from '../../context/AppContext';
import { Header, Empty } from '../../components';
import { timeAgo } from '../../utils/time';
import { colors, type, font } from '../../theme';

export default function NotificationsScreen({ navigation }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, removeNotification } = useApp();

  // Marks the item read and opens the screen it points to (profile, job, applicants, ...).
  const open = (n) => {
    markNotificationRead(n.id);
    if (n.target?.screen) {
      const { screen, ...params } = n.target;
      navigation.navigate(screen, params);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="Notifications"
        right={notifications.some((n) => !n.read)
          ? <Text style={[type.label, { color: colors.primary }]} onPress={markAllNotificationsRead}>Mark all read</Text>
          : null}
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Empty icon="notifications-off-outline" title="You’re all caught up" text="New activity will appear here." />}
        renderItem={({ item: n }) => (
          <Pressable style={[s.row, !n.read && { backgroundColor: colors.tint }]} onPress={() => open(n)}>
            <View style={s.ico}><Ionicons name={n.icon || 'notifications'} size={18} color={colors.primary} /></View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[type.body, !n.read && { fontFamily: font.semi }]}>{n.text}</Text>
              <Text style={type.small}>{timeAgo(n.ts)}</Text>
            </View>
            <Ionicons name="close" size={20} color={colors.text3} onPress={() => removeNotification(n.id)} />
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border },
  ico: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
