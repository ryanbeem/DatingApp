import { useEffect, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../lib/theme';
import type { Card } from '../lib/types';

const SWIPE_THRESHOLD = 110;
const TAP_SLOP = 6;

export type SwipeDirection = 'like' | 'pass';

interface Props {
  cards: Card[];
  onSwipe: (card: Card, direction: SwipeDirection) => void;
  onOpen: (card: Card) => void;
  onEmpty: () => void;
}

export function SwipeDeck({ cards, onSwipe, onOpen, onEmpty }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const animating = useRef(false);

  // PanResponder is created once, so it reads the latest values through a ref.
  const latest = useRef({ cards, index, onSwipe, onOpen, width });
  latest.current = { cards, index, onSwipe, onOpen, width };

  useEffect(() => {
    setIndex(0);
    position.setValue({ x: 0, y: 0 });
  }, [cards, position]);

  useEffect(() => {
    if (cards.length > 0 && index >= cards.length) onEmpty();
  }, [index, cards.length, onEmpty]);

  const finishSwipe = (direction: SwipeDirection) => {
    const { cards: list, index: i, onSwipe: cb, width: w } = latest.current;
    const card = list[i];
    if (!card || animating.current) return;
    animating.current = true;
    Animated.timing(position, {
      toValue: { x: (direction === 'like' ? 1 : -1) * w * 1.5, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      animating.current = false;
      setIndex(i + 1);
      cb(card, direction);
    });
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !animating.current,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP,
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.3 }),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
          position.setValue({ x: 0, y: 0 });
          const { cards: list, index: i, onOpen: open } = latest.current;
          if (list[i]) open(list[i]);
        } else if (g.dx > SWIPE_THRESHOLD) {
          finishSwipe('like');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          finishSwipe('pass');
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0.95, 1], extrapolate: 'clamp' });

  const current = cards[index];
  const next = cards[index + 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.deck}>
        {next ? (
          <Animated.View key={`card-${next.id}`} style={[styles.card, { transform: [{ scale: nextScale }] }]}>
            <CardFace card={next} />
          </Animated.View>
        ) : null}
        {current ? (
          <Animated.View
            key={`card-${current.id}`}
            {...responder.panHandlers}
            style={[styles.card, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
          >
            <CardFace card={current} />
            <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
              <Text style={[styles.stampText, { color: colors.like }]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
              <Text style={[styles.stampText, { color: colors.pass }]}>NOPE</Text>
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <RoundButton label="✕" color={colors.pass} onPress={() => finishSwipe('pass')} disabled={!current} />
        <RoundButton label="ⓘ" color={colors.navy} small onPress={() => current && onOpen(current)} disabled={!current} />
        <RoundButton label="♥" color={colors.like} onPress={() => finishSwipe('like')} disabled={!current} />
      </View>
    </View>
  );
}

export function CardFace({ card }: { card: Card }) {
  const place = [card.city, card.state].filter(Boolean).join(', ');
  return (
    <View style={styles.face}>
      {card.main_photo_url ? (
        <Image source={{ uri: card.main_photo_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>{card.first_name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.job} numberOfLines={1}>
          {card.job_title || 'Profile'}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {card.first_name}
          {card.age ? `, ${card.age}` : ''}
          {place ? `  ·  ${place}` : ''}
        </Text>
        {card.years_experience || card.is_licensed ? (
          <Text style={styles.meta}>
            {[card.years_experience ? `${card.years_experience} yrs experience` : null, card.is_licensed ? 'Licensed' : null]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function RoundButton({ label, color, onPress, disabled, small }: { label: string; color: string; onPress: () => void; disabled?: boolean; small?: boolean }) {
  const size = small ? 52 : 68;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, borderColor: color, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={{ color, fontSize: small ? 22 : 30, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  deck: { flex: 1, margin: 14, marginBottom: 6 },
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  face: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  photo: { flex: 1, width: '100%', backgroundColor: colors.border },
  noPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  noPhotoText: { color: '#fff', fontSize: 96, fontWeight: '800' },
  footer: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingVertical: 14 },
  job: { color: colors.orange, fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  name: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 2 },
  meta: { color: '#C9CEDA', fontSize: 13, marginTop: 4 },
  stamp: { position: 'absolute', top: 36, borderWidth: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
  stampLike: { left: 24, borderColor: colors.like, transform: [{ rotate: '-15deg' }] },
  stampPass: { right: 24, borderColor: colors.pass, transform: [{ rotate: '15deg' }] },
  stampText: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, paddingBottom: 14, paddingTop: 4 },
  round: { backgroundColor: colors.card, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
