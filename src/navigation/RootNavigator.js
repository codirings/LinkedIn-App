import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from '../components/LinearGradient';
import Ionicons from '../components/Ionicons';
import { colors, gradient, font, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import LoginScreen, { ForgotPasswordScreen, RegistrationScreen, SignInScreen } from '../screens/Login/LoginScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import NetworkScreen from '../screens/Network/NetworkScreen';
import JobsScreen from '../screens/Jobs/JobsScreen';
import MessagesScreen from '../screens/Messages/MessagesScreen';
import CreatePostScreen from '../screens/CreatePost/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetail/PostDetailScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import ExperienceFormScreen from '../screens/Profile/ExperienceFormScreen';
import JobDetailScreen from '../screens/JobDetail/JobDetailScreen';
import JobFormScreen from '../screens/JobDetail/JobFormScreen';
import ApplicationsScreen from '../screens/JobDetail/ApplicationsScreen';
import ApplicantsScreen from '../screens/JobDetail/ApplicantsScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ConnectionsScreen from '../screens/Connections/ConnectionsScreen';
import AdminScreen from '../screens/Admin/AdminScreen';
import MaintenanceScreen from '../screens/Admin/MaintenanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Empty = () => null;
const tabs = [
  { name: 'Home', icon: 'home', comp: HomeScreen }, { name: 'Network', icon: 'people', comp: NetworkScreen },
  { name: 'Post', icon: 'add', comp: Empty }, { name: 'Jobs', icon: 'briefcase', comp: JobsScreen },
  { name: 'Messages', icon: 'chatbox', comp: MessagesScreen },
];

function TabBar({ state, navigation }) {
  const { conversations } = useApp();
  const unread = conversations.reduce((n, c) => n + c.unread, 0);
  return (
    <View style={s.bar}>
      {state.routes.map((r, i) => {
        const t = tabs.find((x) => x.name === r.name);
        const focused = state.index === i;
        const color = focused ? colors.primary : colors.text2;
        if (r.name === 'Post') return (
          <Pressable key={r.key} style={s.item} onPress={() => navigation.navigate('CreatePost')}>
            <LinearGradient colors={gradient} style={[s.fab, shadow.cta]}><Ionicons name="add" size={30} color="#fff" /></LinearGradient>
            <Text style={[s.label, { color: colors.text2 }]}>Post</Text>
          </Pressable>
        );
        return (
          <Pressable key={r.key} style={s.item} onPress={() => navigation.navigate(r.name)}>
            <View><Ionicons name={focused ? t.icon : `${t.icon}-outline`} size={24} color={color} />
              {r.name === 'Messages' && unread > 0 && <Text style={s.badge}>{unread}</Text>}</View>
            <Text style={[s.label, { color, fontFamily: focused ? font.semi : font.reg }]}>{r.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const Main = () => (
  <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
    {tabs.map((t) => <Tab.Screen key={t.name} name={t.name} component={t.comp} />)}
  </Tab.Navigator>
);

export default function RootNavigator() {
  const { ready, signedIn, onboarded, isAdmin, settings } = useApp();
  const lockedOut = settings.maintenanceMode && !isAdmin;
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!signedIn ? <Stack.Group navigationKey="guest">
          <Stack.Screen name="Welcome" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />
          <Stack.Screen name="Login" component={SignInScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group> : <Stack.Group navigationKey="authenticated">
          {lockedOut ? <Stack.Screen name="Maintenance" component={MaintenanceScreen} /> : !onboarded ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : <>
            <Stack.Screen name="Main" component={Main} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ExperienceForm" component={ExperienceFormScreen} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="JobForm" component={JobFormScreen} />
            <Stack.Screen name="Applications" component={ApplicationsScreen} />
            <Stack.Screen name="Applicants" component={ApplicantsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Connections" component={ConnectionsScreen} />
            {isAdmin && <Stack.Screen name="Admin" component={AdminScreen} />}
          </>}
        </Stack.Group>}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 18, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  label: { fontFamily: font.reg, fontSize: 11, marginTop: 2 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: -26 },
  badge: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, color: '#fff', fontSize: 10, fontFamily: font.bold, textAlign: 'center', lineHeight: 16, overflow: 'hidden' },
});
