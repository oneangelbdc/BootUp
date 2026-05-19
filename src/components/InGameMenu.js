import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager';

// ✅ Updated prop: Added onHome for strict Menu navigation
export default function InGameMenu({ visible, onClose, onRestart, onHome }) {
  const [sfxVolume, setSfxVolume] = useState(AudioManager.sfxVolume);
  const [musicVolume, setMusicVolume] = useState(AudioManager.bgmVolume);

  useEffect(() => {
    if (visible) {
      setSfxVolume(AudioManager.sfxVolume);
      setMusicVolume(AudioManager.bgmVolume);
    }
  }, [visible]);

  const handleSfxVolumeChange = (value) => {
    setSfxVolume(value);
    AudioManager.setSfxVolume(value);
  };

  const handleMusicVolumeChange = (value) => {
    setMusicVolume(value);
    AudioManager.setBgmVolume(value);
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <View style={styles.menuBox}>
          
          {/* ✅ X Close Button - Upper Right Corner */}
          <TouchableOpacity 
            style={styles.closeIconButton} 
            onPress={() => { AudioManager.playTap(); onClose(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>

          {/* ✅ SFX Slider with Icon on Left */}
          <View style={styles.sliderRow}>
            <Image 
              source={require('../assets/images/sfx-icon.png')} 
              style={styles.iconImage} 
              resizeMode="contain" 
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={sfxVolume}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={theme.colors.primary}
              onValueChange={handleSfxVolumeChange}
            />
          </View>

          {/* ✅ BGM Slider with Icon on Left */}
          <View style={[styles.sliderRow, { marginTop: 8 }]}>
            <Image 
              source={require('../assets/images/bgm-icon.png')} 
              style={styles.iconImage} 
              resizeMode="contain" 
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={musicVolume}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor={theme.colors.primary}
              onValueChange={handleMusicVolumeChange}
            />
          </View>

          {/* ✅ Restart Button */}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => { AudioManager.playTap(); onRestart(); }}
          >
            <Text style={styles.btnText}>↺  Restart</Text>
          </TouchableOpacity>

          {/* ✅ Home Button - Navigates strictly to MenuScreen */}
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => { 
              AudioManager.playTap(); 
              if (onHome) onHome(); // ✅ Strict Menu navigation
            }}
          >
            <Image 
              source={require('../assets/images/home-icon.png')} 
              style={styles.homeIcon} 
              resizeMode="contain" 
            />
            <Text style={styles.homeText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { 
    backgroundColor: theme.colors.white, 
    borderRadius: theme.radius.lg, 
    padding: 28, 
    width: '80%', 
    alignItems: 'center', 
    elevation: 8,
    position: 'relative',
  },
  
  /* ✅ X Close Button Styles */
  closeIconButton: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 20,
  },
  
  /* ✅ Slider row: icon on left, slider fills remaining space */
  sliderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8, 
    width: '100%',
  },
  
  /* ✅ Icon image style */
  iconImage: { 
    marginLeft: -10,
    width: 50, 
    height: 50,
  },
  
  /* ✅ Slider takes remaining space in row */
  slider: { 
    flex: 1, 
    height: 40, 
    marginTop: 15,
    marginBottom: 15 
  },
  
  /* ✅ Restart Button - Primary Blue */
  btn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 40, 
    borderRadius: theme.radius.sm, 
    marginBottom: 10, 
    width: '80%', 
    alignItems: 'center' 
  },
  btnText: { color: theme.colors.black, fontWeight: '500', fontSize: 18 },
  
  /* ✅ Home Button - Darker Blue, No Tint on Icon */
  homeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8,
    backgroundColor: '#2B6CB0',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: theme.radius.sm,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  homeText: { 
    color: theme.colors.black,
    fontSize: 18,
    fontWeight: '500',
  },
});