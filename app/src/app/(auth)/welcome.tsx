import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import { colors } from '../../lib/theme';

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🔧 ♥</Text>
        <Text style={styles.title}>Blue Collar Match</Text>
        <Text style={styles.tagline}>
          Meet hardworking, employed tradesmen. Mechanics, electricians, plumbers, welders and the men who keep the world running.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button title="I'm looking for a tradesman" onPress={() => router.push({ pathname: '/register', params: { role: 'seeker' } })} />
        <Button title="I work in the trades" variant="secondary" onPress={() => router.push({ pathname: '/register', params: { role: 'worker' } })} />
        <Text style={styles.signin} onPress={() => router.push('/login')}>
          Already have an account? <Text style={styles.link}>Sign in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy, padding: 24, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center' },
  logo: { fontSize: 48, color: colors.orange, marginBottom: 12 },
  title: { fontSize: 38, fontWeight: '900', color: '#fff' },
  tagline: { fontSize: 17, color: '#C9CEDA', marginTop: 12, lineHeight: 24 },
  actions: { gap: 12, paddingBottom: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
  signin: { color: '#C9CEDA', textAlign: 'center', marginTop: 8, fontSize: 15 },
  link: { color: colors.orange, fontWeight: '700' },
});
