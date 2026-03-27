import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Dimensions
} from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const games = [
  {
    id: 'BuildThePC',
    title: 'Build the PC',
    description: 'Arrange slot components onto the motherboard',
    icon: '🖥️',
    screen: 'BuildThePC',
  },
  {
    id: 'CircuitConnect',
    title: 'Circuit Connect',
    description: 'Connect wires correctly',
    icon: '🔌',
    screen: 'CircuitConnect',
  },
  {
    id: 'DebugInterface',
    title: 'Debug the Interface',
    description: 'Find & fix all visual glitches',
    icon: '🐛',
    screen: 'DebugInterface',
  },
];

export default function MenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Choose</Text>
        <Text style={styles.headingAccent}>Mission</Text>
        <Text style={styles.subheading}>3 mini-games to boot the system</Text>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.card}
            onPress={() => navigation.navigate(game.screen, { gameId: game.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.cardIcon}>{game.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{game.title}</Text>
              <Text style={styles.cardDesc}>{game.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  decorCircle: {
    position: 'absolute',
    top: -50, right: -50,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
    opacity: 0.2,
  },
  scroll: { padding: 24, paddingTop: 80, alignItems: 'center' },
  heading: {
    fontSize: 42, fontWeight: '900',
    color: theme.colors.primary, letterSpacing: 2,
  },
  headingAccent: {
    fontSize: 42, fontWeight: '900',
    color: theme.colors.primary, letterSpacing: 2, marginTop: -10,
  },
  subheading: {
    fontSize: theme.fonts.body, color: theme.colors.textLight,
    letterSpacing: 2, marginBottom: 32, marginTop: 8,
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 16, marginBottom: 16,
    width: width - 48, elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardIcon: { fontSize: 36, marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: theme.fonts.heading,
    fontWeight: '700', color: theme.colors.text,
  },
  cardDesc: {
    fontSize: theme.fonts.small, color: theme.colors.textLight,
    marginTop: 4, letterSpacing: 1,
  },
});