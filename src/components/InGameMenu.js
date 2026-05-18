import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager';

export default function InGameMenu({ visible, onClose, onRestart }) {
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
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.menuBox}>
          <Text style={styles.menuTitle}>Menu</Text>

          <View style={styles.sliderRow}>
            <Text style={styles.icon}>🔊</Text>
            <Text style={styles.sliderLabel}>SFX Volume</Text>
          </View>
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

          <View style={[styles.sliderRow, { marginTop: 8 }]}>
            <Text style={styles.icon}>🎵</Text>
            <Text style={styles.sliderLabel}>Music Volume</Text>
          </View>
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

          <TouchableOpacity
            style={styles.btn}
            onPress={() => { AudioManager.playTap(); onRestart(); }}
          >
            <Text style={styles.btnText}>↺  Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => { AudioManager.playTap(); onClose(); }}
          >
            <Text style={styles.closeText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: 28, width: '80%', alignItems: 'center', elevation: 8 },
  menuTitle: { fontSize: 35, fontWeight: '900', color: theme.colors.text, marginBottom: 20 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, width: '100%' },
  icon: { fontSize: 24, marginRight: 8 },
  sliderLabel: { color: theme.colors.text, fontSize: 14, fontWeight: 500 },
  slider: { width: '100%', height: 40, marginBottom: 12 },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 40, borderRadius: theme.radius.sm, marginBottom: 10, width: '100%', alignItems: 'center' },
  btnText: { color: theme.colors.white, fontWeight: '900', fontSize: 18 },
  closeBtn: { marginTop: 8 },
  closeText: { color: theme.colors.textLight, fontSize: 18 },
});