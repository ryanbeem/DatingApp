import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileView } from '../../components/ProfileView';
import { Button, Empty, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { confirm, errorMessage, notify } from '../../lib/notify';
import { colors } from '../../lib/theme';
import type { Photo, Profile } from '../../lib/types';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const { me } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProfile(await api.profile(userId));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePhotoLike = async (photo: Photo) => {
    if (!profile) return;
    try {
      const res = await api.likePhoto(photo.id, !photo.liked_by_me);
      setProfile({
        ...profile,
        photos: profile.photos.map((p) => (p.id === photo.id ? { ...p, liked_by_me: res.liked_by_me, like_count: res.like_count } : p)),
      });
    } catch (e) {
      notify('Could not like photo', errorMessage(e));
    }
  };

  const swipe = async (direction: 'like' | 'pass') => {
    if (!profile) return;
    setBusy(true);
    try {
      const res = await api.swipe(profile.id, direction);
      setProfile({ ...profile, my_swipe: direction, is_match: res.matched || profile.is_match });
      if (res.matched) notify("It's a match!", `You and ${profile.first_name} like each other.`);
    } catch (e) {
      notify('Something went wrong', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    if (!profile) return;
    if (!(await confirm(`Block ${profile.first_name}?`, "They won't be able to see you or message you, and you won't see them.", 'Block'))) return;
    try {
      await api.block(profile.id);
      router.back();
    } catch (e) {
      notify('Could not block', errorMessage(e));
    }
  };

  const report = async () => {
    if (!profile) return;
    if (!(await confirm(`Report ${profile.first_name}?`, 'Our team will review this profile for fake, offensive or unsafe content.', 'Report'))) return;
    try {
      await api.report(profile.id, 'Reported from profile screen');
      notify('Thanks for letting us know', 'We will review this profile.');
    } catch (e) {
      notify('Could not report', errorMessage(e));
    }
  };

  if (error) return <Empty title={error} />;
  if (!profile) return <Loading />;
  const isSelf = profile.id === me?.id;
  const canMessage = !isSelf && profile.role !== me?.role;

  return (
    <>
      <Stack.Screen options={{ title: profile.first_name }} />
      <ScrollView contentContainerStyle={styles.wrap}>
        <ProfileView profile={profile} isSelf={isSelf} onTogglePhotoLike={togglePhotoLike} />
        {!isSelf ? (
          <View style={styles.actions}>
            {profile.is_match ? <Text style={styles.matched}>✓ You matched with {profile.first_name}</Text> : null}
            {canMessage ? <Button title={`Message ${profile.first_name}`} onPress={() => router.push(`/chat/${profile.id}`)} /> : null}
            {canMessage ? (
              <View style={styles.row}>
                <Button title="✕ Pass" variant="secondary" onPress={() => swipe('pass')} loading={busy} disabled={profile.my_swipe === 'pass'} style={styles.half} />
                <Button title={profile.my_swipe === 'like' ? '♥ Liked' : '♥ Like'} onPress={() => swipe('like')} loading={busy} disabled={profile.my_swipe === 'like'} style={styles.half} />
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.safety} onPress={report}>Report</Text>
              <Text style={styles.safety} onPress={block}>Block</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  actions: { paddingHorizontal: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  half: { flex: 1 },
  matched: { color: colors.like, fontWeight: '700', textAlign: 'center', fontSize: 16 },
  safety: { color: colors.muted, padding: 12, textDecorationLine: 'underline' },
});
