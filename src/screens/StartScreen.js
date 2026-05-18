import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Image
} from 'react-native';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager';

const { width, height } = Dimensions.get('window');

export default function StartScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
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
      
      {/* ✅ Mid-top design image */}
      <Animated.View style={[styles.midTopContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Image 
          source={require('../assets/images/starting-page-midtop-design.png')} 
          style={styles.midTopImage}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.View style={[styles.titleContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        {/* ✅ Title as PNG image */}
        <Image 
          source={require('../assets/images/boot-up-title.png')} 
          style={styles.titleImage}
          resizeMode="contain"
        />
        
        {/* ✅ Subtitle as PNG image */}
        <Image 
          source={require('../assets/images/fix-connect-build.png')} 
          style={styles.subtitleImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* 3D Button Container */}
        <View style={styles.button3DContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              AudioManager.playTap();
              navigation.navigate('Menu');
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.playText}>PLAY</Text>
          </TouchableOpacity>
        </View>
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
  
  // ✅ Mid-top design container & image styles
  midTopContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 1,
  },
  midTopImage: {
    width: 300,
    height: 100,
  },
  
  titleContainer: { 
    alignItems: 'center', 
    marginBottom: 50, 
    marginTop: 30 
  },
  
  // ✅ Image styles for title & subtitle
  titleImage: {
    width: 600,
    height: 160,
    marginBottom: 10,
  },
  subtitleImage: {
    width: 250,
    height: 40,
  },
  
  // ✅ 3D Button Styles
  button3DContainer: {
    backgroundColor: '#3A9BD4', // Darker blue for the 3D edge
    borderRadius: theme.radius.md,
    paddingBottom: 6, // Creates the 3D depth
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  playButton: {
    backgroundColor: theme.colors.primary, // Lighter blue for top surface
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    color: theme.colors.black,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
});