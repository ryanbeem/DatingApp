import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SwipeDeck, type SwipeDirection } from '../../components/SwipeDeck';
import { Button, Chip, Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, notify } from '../../lib/notify';
import { colors } from '../../lib/theme';
import type { Card } from '../../lib/types';

export default function Discover() {
  const { me } = useAuth();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [trades, setTrades] = useState<string[]>([]);
  const [match, setMatch] = useState<Card | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.discover({ job_title: jobFilter || undefined });
      setCards(res.cards);
    } catch (e) {
      setError(errorMessage(e));
      setCards([]);
    }
  }, [jobFilter]);

  useEffect(() => {
    setCards(null);
    load();
  }, [load]);

  useEffect(() => {
    if (me?.role === 'seeker') api.options().then((o) => setTrades(o.trades)).catch(() => {});
  }, [me?.role]);

  const onSwipe = useCallback(async (card: Card, direction: SwipeDirection) => {
    try {
      const res = await api.swipe(card.id, direction);
      if (res.matched) setMatch(card);
    } catch (e) {
      notify('Could not save that swipe', errorMessage(e));
    }
  }, []);

  const needsSetup = me && me.photos.length === 0;

  return (
    <View style={styles.screen}>
      {needsSetup ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Add a photo{me.role === 'worker' ? ' and your trade' : ''} so people can see you.</Text>
          <Button title="Finish profile" onPress={() => router.push('/edit-profile')} style={styles.bannerButton} />
        </View>
      ) : null}

      {me?.role === 'seeker' && trades.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersInner}>
          <Chip label="All trades" selected={!jobFilter} onPress={() => setJobFilter('')} />
          {trades.map((t) => (
            <Chip key={t} label={t} selected={jobFilter === t} onPress={() => setJobFilter(t)} />
          ))}
        </ScrollView>
      ) : null}

      {cards === null ? (
        <Loading />
      ) : cards.length === 0 ? (
        <Empty title={error || (jobFilter ? `No new ${jobFilter}s right now` : "You've seen everyone for now")}>
          <Button title="Check again" variant="secondary" onPress={load} />
        </Empty>
      ) : (
        <SwipeDeck cards={cards} onSwipe={onSwipe} onOpen={(c) => router.push(`/profile/${c.id}`)} onEmpty={load} />
      )}

      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.matchTitle}>It's a match!</Text>
            <Text style={styles.matchText}>You and {match?.first_name} like each other.</Text>
            <Button
              title="Send a message"
              onPress={() => {
                const id = match?.id;
                setMatch(null);
                if (id) router.push(`/chat/${id}`);
              }}
            />
            <Button title="Keep swiping" variant="secondary" onPress={() => setMatch(null)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  banner: { backgroundColor: colors.orangeLight, margin: 14, marginBottom: 0, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerText: { flex: 1, color: colors.navy, fontWeight: '600' },
  bannerButton: { paddingVertical: 8, paddingHorizontal: 12 },
  filters: { flexGrow: 0, marginTop: 10 },
  filtersInner: { paddingHorizontal: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.card, borderRadius: 18, padding: 24, width: '100%', maxWidth: 400 },
  matchTitle: { fontSize: 30, fontWeight: '900', color: colors.orange, textAlign: 'center' },
  matchText: { fontSize: 16, color: colors.text, textAlign: 'center', marginVertical: 16 },
});
