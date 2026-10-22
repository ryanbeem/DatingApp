import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import type { Photo, Profile } from '../lib/types';
import { Chip } from './ui';

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self employed',
  between_jobs: 'Between jobs',
};

interface Props {
  profile: Profile;
  isSelf?: boolean;
  onTogglePhotoLike?: (photo: Photo) => void;
}

export function ProfileView({ profile, isSelf, onTogglePhotoLike }: Props) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const place = [profile.city, profile.state].filter(Boolean).join(', ');
  const work = [
    profile.employer,
    profile.years_experience ? `${profile.years_experience} years in the trade` : null,
    profile.is_licensed ? 'Licensed' : null,
    profile.employment_status ? EMPLOYMENT_LABELS[profile.employment_status] : null,
  ].filter(Boolean);

  const byCategory = profile.qualities.reduce<Record<string, string[]>>((acc, q) => {
    (acc[q.category] ??= []).push(q.name);
    return acc;
  }, {});

  return (
    <View>
      <View style={styles.gallery} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {profile.photos.length === 0 ? (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>{isSelf ? 'Add photos from Edit profile' : 'No photos yet'}</Text>
          </View>
        ) : width > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={32}
          >
            {profile.photos.map((photo) => (
              <View key={photo.id} style={{ width }}>
                <Image source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
                <Pressable
                  style={styles.heart}
                  disabled={isSelf || !onTogglePhotoLike}
                  onPress={() => onTogglePhotoLike?.(photo)}
                  accessibilityLabel={photo.liked_by_me ? 'Unlike photo' : 'Like photo'}
                >
                  <Text style={[styles.heartIcon, photo.liked_by_me && { color: colors.pass }]}>{photo.liked_by_me ? '♥' : '♡'}</Text>
                  <Text style={styles.heartCount}>{photo.like_count}</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
        {profile.photos.length > 1 ? (
          <View style={styles.dots}>
            {profile.photos.map((p, i) => (
              <View key={p.id} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.jobBar}>
        <Text style={styles.job}>{profile.job_title || (profile.role === 'worker' ? 'Tradesman' : ' ')}</Text>
        <Text style={styles.name}>
          {profile.first_name}
          {profile.age ? `, ${profile.age}` : ''}
        </Text>
        {place ? <Text style={styles.place}>{place}</Text> : null}
      </View>

      <View style={styles.body}>
        {work.length > 0 ? <Section title="Work">{<Text style={styles.text}>{work.join('  ·  ')}</Text>}</Section> : null}
        {profile.bio ? <Section title="About me"><Text style={styles.text}>{profile.bio}</Text></Section> : null}
        {profile.looking_for ? <Section title="Looking for"><Text style={styles.text}>{profile.looking_for}</Text></Section> : null}
        {Object.entries(byCategory).map(([category, names]) => (
          <Section key={category} title={category}>
            <View style={styles.chips}>
              {names.map((n) => (
                <Chip key={n} label={n} />
              ))}
            </View>
          </Section>
        ))}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { width: '100%', backgroundColor: colors.border },
  photo: { width: '100%', aspectRatio: 0.85 },
  noPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  noPhotoText: { color: '#fff', fontSize: 16 },
  heart: { position: 'absolute', right: 14, bottom: 14, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heartIcon: { fontSize: 22, color: colors.navy },
  heartCount: { fontSize: 15, fontWeight: '700', color: colors.navy },
  dots: { position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff' },
  jobBar: { backgroundColor: colors.navy, padding: 16 },
  job: { color: colors.orange, fontSize: 28, fontWeight: '900' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 },
  place: { color: '#C9CEDA', fontSize: 15, marginTop: 2 },
  body: { padding: 16 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  text: { fontSize: 16, color: colors.text, lineHeight: 23 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
