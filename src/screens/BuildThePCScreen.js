import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions, Alert, ScrollView
} from 'react-native';
import { theme } from '../styles/theme';
import PowerUpToolbar from '../components/PowerUpToolbar';
import InGameMenu from '../components/InGameMenu';

const { width } = Dimensions.get('window');

const PARTS = [
  { id: 'RAM', label: 'RAM', icon: '💾', slot: 'ramSlot' },
  { id: 'CPU', label: 'CPU', icon: '🧠', slot: 'cpuSlot' },
  { id: 'FAN', label: 'FAN', icon: '🌀', slot: 'fanSlot' },
  { id: 'SSD', label: 'SSD', icon: '📀', slot: 'ssdSlot' },
  { id: 'GPU', label: 'GPU', icon: '🎮', slot: 'gpuSlot' },
  { id: 'PSU', label: 'Power Supply', icon: '⚡', slot: 'psuSlot' },
];

const SLOTS = [
  { id: 'cpuSlot', label: 'CPU Slot', acceptsId: 'CPU' },
  { id: 'ramSlot', label: 'RAM Slot', acceptsId: 'RAM' },
  { id: 'fanSlot', label: 'FAN Slot', acceptsId: 'FAN' },
  { id: 'gpuSlot', label: 'GPU Slot', acceptsId: 'GPU' },
  { id: 'ssdSlot', label: 'SSD Slot', acceptsId: 'SSD' },
  { id: 'psuSlot', label: 'PSU Slot', acceptsId: 'PSU' },
];

export default function BuildThePCScreen({ navigation }) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [placedParts, setPlacedParts] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);
  const placedCount = Object.keys(placedParts).length;

  const handleSelectPart = (part) => {
    const alreadyPlaced = Object.values(placedParts).find(p => p.id === part.id);
    if (alreadyPlaced) return;
    setSelectedPart(part);
  };

  const handleSlotPress = (slot) => {
    if (!selectedPart) {
      Alert.alert('Select a Part', 'Tap a part from the inventory first!');
      return;
    }
    if (placedParts[slot.id]) {
      Alert.alert('Slot Occupied', 'This slot already has a component!');
      return;
    }
    if (selectedPart.slot !== slot.id) {
      Alert.alert('Wrong Slot! ❌',
        `${selectedPart.label} doesn't go in the ${slot.label}. Try again!`);
      return;
    }
    const newPlaced = { ...placedParts, [slot.id]: selectedPart };
    setPlacedParts(newPlaced);
    setSelectedPart(null);
    if (Object.keys(newPlaced).length === SLOTS.length) {
      setTimeout(() => {
        navigation.navigate('Completion', { gameId: 'BuildThePC' });
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}
          onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.backText}>← Build the PC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusDot,
          { backgroundColor: placedCount === SLOTS.length
            ? theme.colors.success : theme.colors.primary }]} />
        <Text style={styles.statusText}>
          SELECT PART → TAP CORRECT SLOT ({placedCount}/{SLOTS.length})
        </Text>
      </View>

      {selectedPart && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>
            Selected: {selectedPart.icon} {selectedPart.label} — now tap its slot!
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.boardLabel}>▶ MOTHERBOARD v2.0 — SLOTS AVAILABLE</Text>
        <View style={styles.motherboard}>
          {SLOTS.map(slot => {
            const placed = placedParts[slot.id];
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slot,
                  placed ? styles.slotFilled : styles.slotEmpty]}
                onPress={() => handleSlotPress(slot)}>
                {placed ? (
                  <View style={styles.placedContent}>
                    <Text style={styles.placedIcon}>{placed.icon}</Text>
                    <Text style={styles.placedLabel}>{placed.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.inventoryLabel}>PARTS INVENTORY</Text>
        <View style={styles.inventory}>
          {PARTS.map(part => {
            const isPlaced = Object.values(placedParts).find(p => p.id === part.id);
            const isSelected = selectedPart?.id === part.id;
            return (
              <TouchableOpacity
                key={part.id}
                style={[styles.partBtn,
                  isPlaced && styles.partPlaced,
                  isSelected && styles.partSelected]}
                onPress={() => handleSelectPart(part)}
                disabled={!!isPlaced}>
                <Text style={styles.partIcon}>{part.icon}</Text>
                <Text style={styles.partLabel}>{part.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <PowerUpToolbar
        onHint={() => {
          const unplaced = PARTS.find(p =>
            !Object.values(placedParts).find(pl => pl.id === p.id));
          if (unplaced) Alert.alert('Hint 💡',
            `Try placing the ${unplaced.label} next!`);
        }}
        onHelp={() => Alert.alert('Help',
          'Tap a part in the inventory, then tap its matching slot!')}
        onInspect={() => Alert.alert('Progress',
          `${placedCount} of ${SLOTS.length} parts placed.`)}
      />
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={() => {
          setPlacedParts({}); setSelectedPart(null); setMenuVisible(false);
        }}
        onHome={() => navigation.navigate('Menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: theme.colors.background, paddingTop: 50,
  },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.primary, opacity: 0.2,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 10,
  },
  backBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    borderRadius: theme.radius.sm, elevation: 2,
  },
  backText: { fontWeight: '600', color: theme.colors.text },
  menuBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    paddingHorizontal: 20, borderRadius: theme.radius.sm, elevation: 2,
  },
  menuText: { fontWeight: '600', color: theme.colors.text },
  statusBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16, padding: 10,
    borderRadius: theme.radius.sm, marginBottom: 6,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: theme.fonts.small, fontWeight: '600', letterSpacing: 1 },
  selectedIndicator: {
    backgroundColor: theme.colors.accent,
    marginHorizontal: 16, padding: 8,
    borderRadius: theme.radius.sm, marginBottom: 6,
  },
  selectedText: { fontSize: theme.fonts.small, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 8 },
  boardLabel: {
    fontSize: 10, color: theme.colors.textLight, letterSpacing: 1, marginBottom: 8,
  },
  motherboard: {
    backgroundColor: '#1A3A5C', borderRadius: theme.radius.md,
    padding: 16, flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'space-between', marginBottom: 16,
  },
  slot: {
    width: (width - 80) / 2, height: 70,
    borderRadius: theme.radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  slotEmpty: {
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed',
  },
  slotFilled: {
    backgroundColor: 'rgba(91,184,245,0.3)',
    borderWidth: 2, borderColor: theme.colors.primary,
  },
  slotLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1 },
  placedContent: { alignItems: 'center' },
  placedIcon: { fontSize: 24 },
  placedLabel: { color: theme.colors.white, fontSize: 11, fontWeight: '600', marginTop: 2 },
  inventoryLabel: {
    fontSize: 10, color: theme.colors.textLight,
    letterSpacing: 2, marginBottom: 10, textAlign: 'center',
  },
  inventory: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'center', marginBottom: 12,
  },
  partBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    borderRadius: theme.radius.sm, alignItems: 'center',
    minWidth: 80, elevation: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  partPlaced: { opacity: 0.3 },
  partSelected: { borderColor: theme.colors.primary, backgroundColor: '#EBF8FF' },
  partIcon: { fontSize: 22 },
  partLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.text, marginTop: 4 },
});