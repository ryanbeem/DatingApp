import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export function Avatar({ uri, name, size = 56 }: { uri: string | null; name: string; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[style, styles.img]} />;
  return (
    <View style={[style, styles.fallback]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.border },
  fallback: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});
