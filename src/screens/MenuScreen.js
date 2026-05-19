import React, { useEffect } from 'react'; // ✅ Added useEffect
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Dimensions, Image, BackHandler // ✅ Added BackHandler
} from 'react-native';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager';

const { width } = Dimensions.get('window');

const games = [
  {
    id: 'BuildThePC',
    title: 'Build the PC',
    description: 'Arrange slot components onto the motherboard',
    image: require('../assets/images/menu-icon-buildpc.png'), 
    screen: 'BuildThePC',
  },
  {
    id: 'CircuitConnect',
    title: 'Circuit Connect',
    description: 'Connect wires correctly',
    image: require('../assets/images/menu-icon-circuit.png'), 
    screen: 'CircuitConnect',
  },
  {
    id: 'DebugInterface',
    title: 'Debug the Interface',
    description: 'Find & fix all visual glitches',
    image: require('../assets/images/menu-icon-debug.png'), 
    screen: 'DebugInterface',
  },
];

export default function MenuScreen({ navigation }) {
  // ✅ Hardware back button: go to StartScreen (matches universal header back button)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Start');
        return true; // Prevent default exit
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ✅ Title as PNG images */}
        <Image 
          source={require('../assets/images/menu-choose-text.png')} 
          style={styles.headingImage}
          resizeMode="contain"
        />
        <Image 
          source={require('../assets/images/menu-mission-text.png')} 
          style={styles.headingAccentImage}
          resizeMode="contain"
        />
        
        {/* ✅ Subtitle as PNG image */}
        <Image 
          source={require('../assets/images/menu-subheading-text.png')} 
          style={styles.subheadingImage}
          resizeMode="contain"
        />
        
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.card}
            onPress={() => {
              AudioManager.playTap();
              navigation.navigate(game.screen, { gameId: game.id });
            }}
            activeOpacity={0.85}
          >
            {/* ✅ Render PNG image instead of emoji text */}
            <Image
              source={game.image}
              style={styles.cardIcon}
              resizeMode="contain"
            />
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
  
  // ✅ Image styles for menu header
  headingImage: {
    width: 220,
    height: 55,
    marginTop: 70,
    marginBottom: 0,
  },
  headingAccentImage: {
    width: 250,
    height: 62.5,
    marginTop: 10,
    marginBottom: 8,
  },
  subheadingImage: {
    width: 315,
    height: 45,
    marginTop: 20,
    marginBottom: 32,
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
  // ✅ Updated for PNG icons (adjust width/height as needed)
  cardIcon: { width: 48, height: 48, marginRight: 16 },
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