import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal
} from 'react-native';
import { theme } from '../styles/theme';

export default function InGameMenu({ visible, onClose, onRestart, onHome }) {
  const [volume, setVolume] = useState(0.8);
  const [music, setMusic] = useState(0.5);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.menuBox}>
          <Text style={styles.menuTitle}>⚙️ Menu</Text>

          <View style={styles.sliderRow}>
            <Text style={styles.icon}>🔊</Text>
            <Text style={styles.sliderLabel}>Volume</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.icon}>🎵</Text>
            <Text style={styles.sliderLabel}>Music</Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={onRestart}>
            <Text style={styles.btnText}>↺  Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.homeBtn]} onPress={onHome}>
            <Text style={styles.btnText}>🏠  Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 28, width: '80%',
    alignItems: 'center', elevation: 8,
  },
  menuTitle: {
    fontSize: 20, fontWeight: '800',
    color: theme.colors.text, marginBottom: 20,
  },
  sliderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, width: '100%',
  },
  icon: { fontSize: 24, marginRight: 8 },
  sliderLabel: { color: theme.colors.textLight, fontSize: 14 },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12, paddingHorizontal: 40,
    borderRadius: theme.radius.sm,
    marginBottom: 10, width: '100%', alignItems: 'center',
  },
  homeBtn: { backgroundColor: theme.colors.primaryDark },
  btnText: { color: theme.colors.white, fontWeight: '700', fontSize: 16 },
  closeBtn: { marginTop: 8 },
  closeText: { color: theme.colors.textLight, fontSize: 14 },
});