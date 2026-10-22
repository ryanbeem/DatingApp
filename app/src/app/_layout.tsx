import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Loading } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

function RootStack() {
  const { loading, me } = useAuth();
  if (loading) return <Loading />;
  const signedIn = !!me;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Messages' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootStack />
    </AuthProvider>
  );
}
