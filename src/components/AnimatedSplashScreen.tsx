import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LOGO_SIZE = 120;

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({
  isReady,
  onAnimationComplete,
}: AnimatedSplashScreenProps) {
  /* ── shared values ── */
  const logoScale    = useSharedValue(0.3);
  const logoOpacity  = useSharedValue(0);
  const titleY       = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const taglineY     = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const scanBarY     = useSharedValue(-20);
  const scanBarOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const glowScale    = useSharedValue(1);

  const finishAnimation = useCallback(() => {
    runOnJS(onAnimationComplete)();
  }, [onAnimationComplete]);

  /* ── entrance animations ── */
  useEffect(() => {
    // Logo: spring scale + fade in
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    // Glow pulse
    glowScale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    // Title: slide up + fade in
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(
      400,
      withSpring(0, { damping: 14, stiffness: 90 }),
    );

    // Tagline: slide up + fade in
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(
      700,
      withSpring(0, { damping: 14, stiffness: 90 }),
    );

    // Scan bar sweep
    scanBarOpacity.value = withDelay(900, withTiming(0.8, { duration: 300 }));
    scanBarY.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(LOGO_SIZE + 10, {
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(-20, {
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  /* ── exit animation when ready ── */
  useEffect(() => {
    if (!isReady) return;

    // Wait a beat then fade out the entire overlay
    const exitDelay = 600;
    containerOpacity.value = withDelay(
      exitDelay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, () => {
        finishAnimation();
      }),
    );
  }, [isReady]);

  /* ── animated styles ── */
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowScale.value, [1, 1.3], [0.3, 0.6]),
    transform: [{ scale: glowScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const scanBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanBarOpacity.value,
    transform: [{ translateY: scanBarY.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Background gradient overlay */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      {/* Centre content */}
      <View style={styles.centreContent}>
        {/* Glow ring behind logo */}
        <Animated.View style={[styles.glowRing, glowAnimatedStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Scan bar */}
        <Animated.View style={[styles.scanBar, scanBarAnimatedStyle]} />

        {/* Brand text */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.titleText}>CardVault</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
          <Text style={styles.taglineText}>
            Scan · Store · Connect
          </Text>
        </Animated.View>
      </View>

      {/* Bottom decorative dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface[900],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  /* subtle radial-ish gradient overlays */
  bgGradientTop: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.25,
    left: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.3,
    right: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(34,211,238,0.04)',
  },

  centreContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* glow ring */
  glowRing: {
    position: 'absolute',
    width: LOGO_SIZE + 60,
    height: LOGO_SIZE + 60,
    borderRadius: (LOGO_SIZE + 60) / 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },

  /* logo */
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 4,
    overflow: 'hidden',
    backgroundColor: Colors.surface[800],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  /* scan bar */
  scanBar: {
    position: 'absolute',
    width: LOGO_SIZE + 40,
    height: 2,
    backgroundColor: '#22D3EE',
    borderRadius: 1,
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },

  /* brand text */
  titleContainer: {
    marginTop: 32,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1.5,
  },

  taglineContainer: {
    marginTop: 8,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.slate[400],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  /* bottom dots */
  dotsRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface[700],
  },
  dotActive: {
    backgroundColor: Colors.primary[500],
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
