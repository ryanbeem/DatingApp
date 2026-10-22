import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage, notify } from '../../lib/notify';
import { colors } from '../../lib/theme';
import type { Message, Profile } from '../../lib/types';

const POLL_MS = 5000;

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const partnerId = Number(id);
  const { me } = useAuth();
  const insets = useSafeAreaInsets();
  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const list = useRef<FlatList<Message>>(null);

  const addMessages = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  const poll = useCallback(async () => {
    try {
      addMessages((await api.messages(partnerId, lastId.current)).messages);
    } catch {}
  }, [partnerId, addMessages]);

  useEffect(() => {
    api.profile(partnerId).then(setPartner).catch(() => {});
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [partnerId, poll]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await api.sendMessage(partnerId, body);
      addMessages([res.message]);
      setDraft('');
    } catch (e) {
      notify('Message not sent', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const mainPhoto = partner?.photos[0]?.url ?? null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          headerTitle: () =>
            partner ? (
              <Pressable style={styles.header} onPress={() => router.push(`/profile/${partnerId}`)}>
                <Avatar uri={mainPhoto} name={partner.first_name} size={32} />
                <View>
                  <Text style={styles.headerName}>{partner.first_name}</Text>
                  {partner.job_title ? <Text style={styles.headerJob}>{partner.job_title}</Text> : null}
                </View>
              </Pressable>
            ) : (
              <Text style={styles.headerName}>Messages</Text>
            ),
        }}
      />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.empty}>Say hi to {partner?.first_name ?? 'them'}! Ask about their work, their weekend, or their dog.</Text>}
        renderItem={({ item }) => {
          const mine = item.sender_id === me?.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.body}</Text>
              <Text style={[styles.time, mine && { color: '#FCE7D6' }]}>
                {new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message"
          placeholderTextColor="#9A9A9A"
          multiline
          maxLength={2000}
          onSubmitEditing={Platform.OS === 'web' ? send : undefined}
          submitBehavior={Platform.OS === 'web' ? 'submit' : undefined}
        />
        <Pressable style={[styles.send, (!draft.trim() || sending) && { opacity: 0.5 }]} onPress={send} disabled={!draft.trim() || sending}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerJob: { color: colors.orange, fontSize: 12, fontWeight: '600' },
  list: { padding: 12, flexGrow: 1 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginVertical: 3 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.orange, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 16, color: colors.text },
  time: { fontSize: 11, color: colors.muted, marginTop: 3 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, maxHeight: 120, backgroundColor: colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text },
  send: { backgroundColor: colors.orange, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11 },
  sendText: { color: '#fff', fontWeight: '700' },
});
