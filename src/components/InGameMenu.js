import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager';

// STATE & LIFECYCLE
export default function InGameMenu({ visible, onClose, onRestart, onHome }) {
  const [sfxVolume, setSfxVolume] = useState(AudioManager.sfxVolume);
  const [musicVolume, setMusicVolume] = useState(AudioManager.bgmVolume);

  useEffect(() => {
    if (visible) {
      setSfxVolume(AudioManager.sfxVolume);
      setMusicVolume(AudioManager.bgmVolume);
    }
  }, [visible]);

  // VOLUME HANDLERS
  const handleSfxVolumeChange = (value) => {
    setSfxVolume(value);
    AudioManager.setSfxVolume(value);
  };

  const handleMusicVolumeChange = (value) => {
    setMusicVolume(value);
    AudioManager.setBgmVolume(value);
  };

  // UI RENDER
  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <View style={styles.menuBox}>
          
          {/* CLOSE BUTTON */}
          <TouchableOpacity 
            style={styles.closeIconButton} 
            onPress={() => { AudioManager.playTap(); onClose(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>

          {/* SFX SLIDER */}
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
              minimumTrackTintColor="#2B6CB0"
              maximumTrackTintColor="#CBD5E0"
              thumbTintColor="#2B6CB0"
              onValueChange={handleSfxVolumeChange}
            />
          </View>

          {/* BGM SLIDER */}
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
              minimumTrackTintColor="#2B6CB0"
              maximumTrackTintColor="#CBD5E0"
              thumbTintColor="#2B6CB0"
              onValueChange={handleMusicVolumeChange}
            />
          </View>

          {/* 3D RESTART BUTTON */}
          <TouchableOpacity
            style={styles.btn3D}
            onPress={() => { AudioManager.playTap(); onRestart(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>↺  Restart</Text>
          </TouchableOpacity>

          {/* 3D HOME BUTTON */}
          <TouchableOpacity
            style={styles.homeBtn3D}
            onPress={() => { 
              AudioManager.playTap(); 
              if (onHome) onHome();
            }}
            activeOpacity={0.85}
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

// STYLESHEET
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
  
  closeIconButton: {
    position: 'absolute', top: 8, right: 9, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  closeIconText: { fontSize: 20, fontWeight: '700', color: theme.colors.text, lineHeight: 20 },
  
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, width: '100%' },
  iconImage: { marginLeft: -10, width: 50, height: 50 },
  slider: { flex: 1, height: 50, marginTop: 15, marginBottom: 15 },
  
  // 3D Restart Button
  btn3D: { 
    backgroundColor: '#9cd5ff', 
    borderBottomWidth: 5, borderBottomColor: '#0f2c67',
    borderLeftWidth: 0.5, borderLeftColor: '#0f2c67',
    borderRightWidth: 0.5, borderRightColor: '#0f2c67',
    borderTopWidth: 0, borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 40, 
    marginBottom: 10, width: '70%', alignItems: 'center' 
  },
  btnText: { color: '#0f2c67', fontWeight: '500', fontSize: 18.5, marginLeft: -8 },
  
  // 3D Home Button
  homeBtn3D: { 
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#48a0ff', 
    borderBottomWidth: 5, borderBottomColor: '#0f2c67',
    borderLeftWidth: 0.5, borderLeftColor: '#0f2c67',
    borderRightWidth: 0.5, borderRightColor: '#0f2c67',
    borderTopWidth: 0, borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 40, 
    width: '70%', alignItems: 'center', justifyContent: 'center',
  },
  homeIcon: { width: 20, height: 20, marginRight: 8, marginLeft: -8 },
  homeText: { color: '#0f2c67', fontSize: 18.5, fontWeight: '500' }
});