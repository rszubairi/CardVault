import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticLight, hapticSuccess } from '../../src/lib/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    key:      'scan',
    emoji:    'ðŸ“·',
    bg:       '#0F0F23',
    accent:   '#6366F1',
    title:    'Scan Any Card',
    subtitle: 'Point your camera at any business card. AI extracts every contact detail in under a second â€” no typing required.',
  },
  {
    key:      'organize',
    emoji:    'ðŸ¤',
    bg:       '#0A1628',
    accent:   '#0EA5E9',
    title:    'Build Relationships',
    subtitle: 'Organize contacts with tags, take voice notes, and set smart follow-up reminders so you never lose a connection.',
  },
  {
    key:      'connect',
    emoji:    'ðŸ’¬',
    bg:       '#160F1F',
    accent:   '#A855F7',
    title:    'Connect Instantly',
    subtitle: 'CardVault drafts your WhatsApp intros and LinkedIn messages. From card to conversation in seconds.',
  },
];

export default function OnboardingScreen() {
  const router   = useRouter();
  const listRef  = useRef<FlatList>(null);
  const scrollX  = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState(0);

  const goNext = () => {
    hapticLight();
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    } else {
      finishOnboarding();
    }
  };

  const skip = () => {
    hapticLight();
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    hapticSuccess();
    await SecureStore.setItemAsync('hasSeenOnboarding', '1').catch(() => {});
    router.replace('/(auth)/');
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Slides */}
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        scrollEnabled={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_W }]}>
            <View style={[styles.emojiCircle, { backgroundColor: `${item.accent}22`, borderColor: `${item.accent}44` }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Controls */}
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const width = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={s.key}
                style={[styles.dot, { opacity, width }]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {!isLast ? (
            <TouchableOpacity style={styles.skipBtn} onPress={skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipBtn} />
          )}

          <TouchableOpacity
            style={[styles.nextBtn, isLast && styles.nextBtnLast]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#0F0F23',
  },
  slide: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 40,
    paddingTop:      Platform.OS === 'ios' ? 80 : 60,
    paddingBottom:   40,
  },
  emojiCircle: {
    width:          140,
    height:         140,
    borderRadius:   40,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   44,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize:    30,
    fontWeight:  '800',
    color:       '#F1F5F9',
    textAlign:   'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize:   16,
    color:      '#64748B',
    textAlign:  'center',
    lineHeight: 26,
    maxWidth:   300,
  },
  controls: {
    paddingHorizontal: 28,
    paddingBottom:     Platform.OS === 'ios' ? 8 : 24,
    backgroundColor:   '#0F0F23',
  },
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            6,
    marginBottom:   24,
  },
  dot: {
    height:       8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  btnRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            12,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical:   14,
    minWidth:          80,
  },
  skipText: {
    color:      '#475569',
    fontSize:   15,
    fontWeight: '500',
  },
  nextBtn: {
    flex:            1,
    backgroundColor: '#6366F1',
    borderRadius:    16,
    paddingVertical: 16,
    alignItems:      'center',
    justifyContent:  'center',
  },
  nextBtnLast: {
    backgroundColor: '#6366F1',
  },
  nextText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '700',
  },
});

