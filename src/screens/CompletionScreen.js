import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Animated, Dimensions
} from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const LESSONS = {
  DebugInterface: [
    { icon: '🎨', title: 'Color in UI',
      fact: 'Color communicates meaning — green means go, red means stop or danger.' },
    { icon: '🔤', title: 'Typography',
      fact: 'Text that is too small breaks readability and makes software harder to use.' },
    { icon: '🗂️', title: 'Icons',
      fact: 'Icons must match their labels — wrong icons confuse users.' },
    { icon: '📐', title: 'Layout',
      fact: 'Good UI design ensures every element has proper spacing and hierarchy.' },
  ],
  BuildThePC: [
    { icon: '🧠', title: 'CPU',
      fact: 'The CPU is the brain of the computer — it processes all instructions.' },
    { icon: '💾', title: 'RAM',
      fact: 'RAM temporarily stores data so the CPU can access it quickly.' },
    { icon: '🌀', title: 'Cooling Fan',
      fact: 'The cooling fan prevents the CPU from overheating during operation.' },
    { icon: '📀', title: 'SSD',
      fact: 'An SSD stores your files permanently and is much faster than older hard drives.' },
  ],
  CircuitConnect: [
    { icon: '🖥️', title: 'Monitor',
      fact: 'The monitor displays visual output from the computer via HDMI or DisplayPort.' },
    { icon: '📡', title: 'Router',
      fact: 'A router connects devices to the internet and manages network traffic.' },
    { icon: '🗄️', title: 'Server',
      fact: 'Servers store and serve data to other computers over a network.' },
    { icon: '🔌', title: 'Power',
      fact: 'Every device needs a stable power connection to function correctly.' },
  ],
};

export default function CompletionScreen({ navigation, route }) {
  const gameId = route?.params?.gameId || 'DebugInterface';
  const lessons = LESSONS[gameId] || LESSONS['DebugInterface'];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.decorCircle} />
      <Animated.Text style={[styles.trophy, { transform: [{ scale: scaleAnim }] }]}>
        🎉
      </Animated.Text>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>SYSTEM</Text>
        <Text style={styles.title}>RESTORED!</Text>
        <Text style={styles.subtitle}>Level 1 — Complete ✅</Text>
      </Animated.View>

      <Animated.View style={[styles.dykSection, { opacity: fadeAnim }]}>
        <View style={styles.dykBadge}>
          <Text style={styles.dykBadgeText}>💡 DID YOU KNOW?</Text>
        </View>
        <Text style={styles.dykTitle}>
          {gameId === 'DebugInterface' ? 'Debug the Interface' :
           gameId === 'BuildThePC' ? 'Build the PC' : 'Circuit Connect'} Learnings
        </Text>
        <Text style={styles.dykSub}>Swipe to reveal what you've learned.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}>
          {lessons.map((lesson, i) => (
            <View key={i} style={styles.lessonCard}>
              <Text style={styles.lessonIcon}>{lesson.icon}</Text>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonFact}>{lesson.fact}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.primaryBtn}
          onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.primaryBtnText}>Next Level →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>↺  Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn}
          onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.primaryBtnText}>🏠  Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    alignItems: 'center', paddingTop: 60,
    paddingBottom: 40, paddingHorizontal: 24,
  },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: theme.colors.primary, opacity: 0.2,
  },
  trophy: { fontSize: 80, marginBottom: 16 },
  title: {
    fontSize: 42, fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: 4, textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.body, color: theme.colors.textLight,
    marginTop: 8, marginBottom: 32, textAlign: 'center',
  },
  dykSection: { width: '100%', alignItems: 'center', marginBottom: 32 },
  dykBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 12,
  },
  dykBadgeText: { fontWeight: '700', fontSize: 12, color: theme.colors.text },
  dykTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  dykSub: {
    fontSize: theme.fonts.small, color: theme.colors.textLight,
    marginTop: 4, marginBottom: 16,
  },
  cardsRow: { paddingHorizontal: 4, gap: 12 },
  lessonCard: {
    backgroundColor: theme.colors.white, borderRadius: theme.radius.md,
    padding: 16, width: 160, elevation: 3,
  },
  lessonIcon: { fontSize: 28, marginBottom: 8 },
  lessonTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  lessonFact: { fontSize: 11, color: theme.colors.textLight, lineHeight: 16 },
  buttons: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center', elevation: 3,
  },
  primaryBtnText: { color: theme.colors.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: theme.colors.white, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.primary, elevation: 2,
  },
  secondaryBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
  homeBtn: {
    backgroundColor: theme.colors.primaryDark, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center', elevation: 3,
  },
});