import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { colors } from '../../lib/theme';
import type { Card } from '../../lib/types';

type Row = Card & { section: 'match' | 'like' };

export default function Likes() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [likes, matches] = await Promise.all([api.likes(), api.matches()]);
      setRows([...matches.matches.map((c) => ({ ...c, section: 'match' as const })), ...likes.likes.map((c) => ({ ...c, section: 'like' as const }))]);
    } catch {
      setRows([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (rows === null) return <Loading />;
  if (rows.length === 0) return <Empty title="No likes or matches yet. Keep swiping!" />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => `${r.section}-${r.id}`}
      numColumns={2}
      contentContainerStyle={styles.grid}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      renderItem={({ item }) => (
        <Pressable style={styles.tile} onPress={() => router.push(`/profile/${item.id}`)}>
          {item.main_photo_url ? <Image source={{ uri: item.main_photo_url }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.navy }]} />}
          <View style={[styles.badge, { backgroundColor: item.section === 'match' ? colors.like : colors.orange }]}>
            <Text style={styles.badgeText}>{item.section === 'match' ? 'Match' : 'Likes you'}</Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.job} numberOfLines={1}>{item.job_title || ' '}</Text>
            <Text style={styles.name} numberOfLines={1}>{item.first_name}{item.age ? `, ${item.age}` : ''}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: 8, width: '100%', maxWidth: 760, alignSelf: 'center' },
  tile: { flex: 1, margin: 6, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.card, maxWidth: '50%' },
  photo: { width: '100%', aspectRatio: 0.8 },
  badge: { position: 'absolute', top: 8, left: 8, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  footer: { backgroundColor: colors.navy, padding: 8 },
  job: { color: colors.orange, fontWeight: '800', fontSize: 15 },
  name: { color: '#fff', fontSize: 13 },
});
