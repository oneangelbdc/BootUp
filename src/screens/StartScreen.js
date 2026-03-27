import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions
} from 'react-native';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function StartScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 800, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <Animated.View style={[styles.iconContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Text style={styles.circuitIcon}>⚡</Text>
      </Animated.View>
      <Animated.View style={[styles.titleContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Text style={styles.titleBoot}>BOOT</Text>
        <Text style={styles.titleUp}>UP!</Text>
        <Text style={styles.subtitle}>FIX • CONNECT • BUILD</Text>
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.8}
        >
          <Text style={styles.playText}>PLAY</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    top: -60, right: -60,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.primary,
    opacity: 0.25,
  },
  iconContainer: { marginBottom: 20 },
  circuitIcon: { fontSize: 60 },
  titleContainer: { alignItems: 'center', marginBottom: 50 },
  titleBoot: {
    fontSize: 64, fontWeight: '900',
    color: theme.colors.primary, letterSpacing: 4,
  },
  titleUp: {
    fontSize: 64, fontWeight: '900',
    color: theme.colors.primary, letterSpacing: 4, marginTop: -20,
  },
  subtitle: {
    fontSize: theme.fonts.body, color: theme.colors.textLight,
    letterSpacing: 3, marginTop: 8,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 60, paddingVertical: 16,
    borderRadius: theme.radius.md, elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  playText: {
    color: theme.colors.white, fontSize: 18,
    fontWeight: '700', letterSpacing: 3,
  },
});