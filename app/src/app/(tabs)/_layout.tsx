import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';
import { colors } from '../../lib/theme';

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('🔥') }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes', tabBarIcon: icon('♥') }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: icon('💬') }} />
      <Tabs.Screen name="me" options={{ title: 'My profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
