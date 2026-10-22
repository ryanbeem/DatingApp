import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';
import type { Conversation } from '../../lib/types';

export default function Messages() {
  const { me } = useAuth();
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await api.conversations()).conversations);
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 15000);
      return () => clearInterval(timer);
    }, [load]),
  );

  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty title="No messages yet. Open a profile and say hello." />;

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => String(c.partner.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      renderItem={({ item }) => {
        const mine = item.last_message.sender_id === me?.id;
        return (
          <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.partner.id}`)}>
            <Avatar uri={item.partner.main_photo_url} name={item.partner.first_name} />
            <View style={styles.text}>
              <Text style={styles.name}>
                {item.partner.first_name}
                {item.partner.job_title ? <Text style={styles.job}>  ·  {item.partner.job_title}</Text> : null}
              </Text>
              <Text style={[styles.preview, item.unread > 0 && styles.unread]} numberOfLines={1}>
                {mine ? 'You: ' : ''}
                {item.last_message.body}
              </Text>
            </View>
            {item.unread > 0 ? <View style={styles.dot}><Text style={styles.dotText}>{item.unread}</Text></View> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  text: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  job: { color: colors.orange, fontWeight: '600' },
  preview: { color: colors.muted, marginTop: 3 },
  unread: { color: colors.text, fontWeight: '700' },
  dot: { backgroundColor: colors.orange, borderRadius: 999, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  dotText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
