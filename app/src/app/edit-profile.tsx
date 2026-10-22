import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Field } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { confirm, errorMessage, notify } from '../lib/notify';
import { colors } from '../lib/theme';
import type { Options, Photo, Profile } from '../lib/types';

const MAX_PHOTOS = 6;
const EMPLOYMENT = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self employed' },
  { value: 'between_jobs', label: 'Between jobs' },
] as const;

export default function EditProfile() {
  const { me, setMe } = useAuth();
  const [options, setOptions] = useState<Options | null>(null);
  const [form, setForm] = useState(() => toForm(me));
  const [qualityIds, setQualityIds] = useState<number[]>(me?.qualities.map((q) => q.id) ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.options().then(setOptions).catch(() => {});
  }, []);

  if (!me) return null;
  const isWorker = me.role === 'worker';
  const set = (key: keyof ReturnType<typeof toForm>) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      setMe(await api.uploadPhoto(asset.uri, asset.file));
    } catch (e) {
      notify('Upload failed', errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const photoMenu = async (photo: Photo) => {
    try {
      if (!photo.is_main && (await confirm('Make this your main photo?', 'Your main photo is what people see while swiping.', 'Make main'))) {
        setMe(await api.setMainPhoto(photo.id));
      } else if (await confirm('Delete this photo?', 'This cannot be undone.', 'Delete')) {
        setMe(await api.deletePhoto(photo.id));
      }
    } catch (e) {
      notify('Something went wrong', errorMessage(e));
    }
  };

  const toggleQuality = (id: number) =>
    setQualityIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 25 ? ids : [...ids, id]));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateMe({
        first_name: form.first_name,
        birthdate: form.birthdate,
        city: form.city,
        state: form.state,
        job_title: form.job_title,
        employer: form.employer,
        years_experience: form.years_experience === '' ? null : Number(form.years_experience),
        is_licensed: form.is_licensed === '1',
        employment_status: (form.employment_status || null) as Profile['employment_status'],
        bio: form.bio,
        looking_for: form.looking_for,
        quality_ids: qualityIds,
      });
      setMe(updated);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      notify('Could not save', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const grouped = (options?.qualities ?? []).reduce<Record<string, Options['qualities']>>((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Photos</Text>
        <Text style={styles.sub}>Tap a photo to make it your main photo or delete it. The main photo shows on your swipe card.</Text>
        <View style={styles.photos}>
          {me.photos.map((p) => (
            <Pressable key={p.id} style={styles.photoSlot} onPress={() => photoMenu(p)}>
              <Image source={{ uri: p.url }} style={styles.photo} />
              {p.is_main ? <Text style={styles.mainBadge}>MAIN</Text> : null}
            </Pressable>
          ))}
          {me.photos.length < MAX_PHOTOS ? (
            <Pressable style={[styles.photoSlot, styles.addSlot]} onPress={addPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color={colors.orange} /> : <Text style={styles.plus}>＋</Text>}
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.heading}>{isWorker ? 'Your trade' : 'Work'}</Text>
        <Field
          label={isWorker ? 'Job title (shown under your photo)' : 'What do you do?'}
          value={form.job_title}
          onChangeText={set('job_title')}
          placeholder={isWorker ? 'e.g. Mechanic' : 'e.g. Nurse'}
        />
        {isWorker && options ? (
          <View style={styles.chips}>
            {options.trades.map((t) => (
              <Chip key={t} label={t} selected={form.job_title === t} onPress={() => set('job_title')(t)} />
            ))}
          </View>
        ) : null}
        {isWorker ? (
          <>
            <Field label="Employer or company" value={form.employer} onChangeText={set('employer')} placeholder="e.g. Main Street Auto, or Self employed" />
            <Field label="Years in the trade" value={form.years_experience} onChangeText={(v) => set('years_experience')(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
            <Text style={styles.label}>Work status</Text>
            <View style={styles.chips}>
              {EMPLOYMENT.map((e) => (
                <Chip key={e.value} label={e.label} selected={form.employment_status === e.value} onPress={() => set('employment_status')(e.value)} />
              ))}
              <Chip label={form.is_licensed === '1' ? '✓ Licensed / certified' : 'Licensed / certified'} selected={form.is_licensed === '1'} onPress={() => set('is_licensed')(form.is_licensed === '1' ? '0' : '1')} />
            </View>
          </>
        ) : null}

        <Text style={styles.heading}>About you</Text>
        <Field label="First name" value={form.first_name} onChangeText={set('first_name')} />
        <Field label="Birthday" value={form.birthdate} onChangeText={set('birthdate')} placeholder="YYYY-MM-DD" hint="Only your age is shown" />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Field label="City" value={form.city} onChangeText={set('city')} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="State" value={form.state} onChangeText={(v) => set('state')(v.toUpperCase())} maxLength={2} autoCapitalize="characters" />
          </View>
        </View>
        <Field label="About me" value={form.bio} onChangeText={set('bio')} multiline maxLength={2000} />
        <Field label="What I'm looking for" value={form.looking_for} onChangeText={set('looking_for')} multiline maxLength={1000} />

        <Text style={styles.heading}>My qualities</Text>
        <Text style={styles.sub}>Pick the ones that describe you ({qualityIds.length}/25).</Text>
        {Object.entries(grouped).map(([category, qs]) => (
          <View key={category} style={{ marginBottom: 8 }}>
            <Text style={styles.label}>{category}</Text>
            <View style={styles.chips}>
              {qs.map((q) => (
                <Chip key={q.id} label={q.name} selected={qualityIds.includes(q.id)} onPress={() => toggleQuality(q.id)} />
              ))}
            </View>
          </View>
        ))}

        <Button title="Save profile" onPress={save} loading={saving} style={{ marginTop: 12 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function toForm(p: Profile | null) {
  return {
    first_name: p?.first_name ?? '',
    birthdate: p?.birthdate ?? '',
    city: p?.city ?? '',
    state: p?.state ?? '',
    job_title: p?.job_title ?? '',
    employer: p?.employer ?? '',
    years_experience: p?.years_experience != null ? String(p.years_experience) : '',
    is_licensed: p?.is_licensed ? '1' : '0',
    employment_status: p?.employment_status ?? '',
    bio: p?.bio ?? '',
    looking_for: p?.looking_for ?? '',
  };
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 48, width: '100%', maxWidth: 640, alignSelf: 'center' },
  heading: { fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 12, marginBottom: 6 },
  sub: { color: colors.muted, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  photoSlot: { width: 100, height: 125, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.border },
  photo: { width: '100%', height: '100%' },
  addSlot: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.orange, backgroundColor: colors.orangeLight },
  plus: { fontSize: 36, color: colors.orange },
  mainBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.orange, color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '800', paddingVertical: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
});
