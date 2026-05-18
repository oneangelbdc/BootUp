/**
 * CircuitConnectScreen.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * "Circuit Connect" — match real PC hardware components to their partners.
 *
 * LAYOUT MECHANIC (the core design rule):
 *   LEFT  column (col: 0) = "source" side of each pair  (the part you hold)
 *   RIGHT column (col: 1) = "target" side of each pair  (where it plugs into)
 *
 *   Connections ALWAYS go LEFT → RIGHT, never within the same column.
 *
 *   Difficulty comes from ROW SCRAMBLING: each column's row order is shuffled
 *   independently, so the correct partner is (almost) never on the same row.
 *   Every connection line is diagonal — you cannot guess by position.
 *
 * REAL HARDWARE PAIRS used:
 *   Easy   → Monitor ↔ DisplayPort Cable, CPU ↔ CPU Socket,
 *             Hard Drive ↔ SATA Cable, Keyboard ↔ USB-A Port
 *   Medium → GPU ↔ PCIe x16 Slot, RAM Stick ↔ DIMM Slot,
 *             PSU ↔ 24-pin ATX Connector, CPU Cooler ↔ CPU (top)
 *   Hard   → NVMe SSD ↔ M.2 Slot, Thermal Paste ↔ CPU IHS,
 *             Case Fan ↔ Fan Header, Wi-Fi Card ↔ PCIe x1 Slot
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { theme } from '../styles/theme';
import PowerUpToolbar from '../components/PowerUpToolbar';
import InGameMenu from '../components/InGameMenu';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Layout constants ────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const GAME_W = width - 32;  // board width = screen width minus 16px padding each side
const CELL_W = GAME_W / 2;  // each column takes half the board width
const CELL_H = 110;          // height of each row in pixels

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE IMAGE MAP
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE YOUR OWN IMAGES INSTEAD OF EMOJI:
//   1. Put your PNG/JPG/WebP files in   ../assets/images/
//   2. Replace the `null` for that device with a require(), e.g.:
//        monitor: require('../assets/images/monitor.png'),
//   3. Recommended source size: 112×112 px  (renders at 56×56 @2x)
//   4. The DeviceNode component auto-switches to <Image> when value is non-null,
//      and falls back to the emoji <Text> icon when it is null.
// ─────────────────────────────────────────────────────────────────────────────
const DEVICE_IMAGES = {
  // ── Easy tier ──────────────────────────────────────────────────────────────
  monitor:    null, // → require('../assets/images/monitor.png')
  dp_cable:   require('../assets/CircuitConnect/hdmi.jpg'),
  cpu:        require('../assets/CircuitConnect/cpu.jpg'),
  cpu_socket: require('../assets/CircuitConnect/cpu-socket.jpg'),
  hdd:        require('../assets/CircuitConnect/hdd.jpg'),
  sata_cable: require('../assets/CircuitConnect/sata.jpg'),
  keyboard:   null, // → require('../assets/images/keyboard.png')
  usb_port:   require('../assets/CircuitConnect/usb-port.jpg'),

  // ── Medium tier ────────────────────────────────────────────────────────────
  gpu:        require('../assets/CircuitConnect/gpu.jpg'),
  pcie_slot:  require('../assets/CircuitConnect/pcie.jpg'),
  ram:        require('../assets/CircuitConnect/ram.jpg'),
  dimm_slot:  require('../assets/CircuitConnect/ram-slot.jpg'),
  psu:        require('../assets/CircuitConnect/psu.jpg'),
  pin24:      require('../assets/CircuitConnect/atx24.jpg'),
  cpu_cooler: require('../assets/CircuitConnect/cooler.jpg'),
  cpu_top:    require('../assets/CircuitConnect/cpu.jpg'),

  // ── Hard tier ──────────────────────────────────────────────────────────────
  nvme:       require('../assets/CircuitConnect/nvme.jpg'),
  m2_slot:    require('../assets/CircuitConnect/m2slot.jpg'),
  thermal:    require('../assets/CircuitConnect/thermal.jpg'),
  cpu_ihs:    require('../assets/CircuitConnect/cpu.jpg'),
  case_fan:   require('../assets/CircuitConnect/case_fan.jpg'),
  fan_header: require('../assets/CircuitConnect/fan_header.jpg'),
  wifi_card:  require('../assets/CircuitConnect/wifi_card.jpg'),
  pcie_x1:    require('../assets/CircuitConnect/pcie_x1.jpg'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SHUFFLE UTILITY
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 * @param {Array} array
 * @returns {Array} New shuffled array (original untouched).
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAMBLE POSITIONS — per-column independent row shuffle
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Randomises row positions within each column INDEPENDENTLY.
 *
 * Each device keeps its column assignment (col: 0 = LEFT, col: 1 = RIGHT).
 * Only the row number within that column is shuffled.
 *
 * WHY THIS MATTERS:
 *   If we shuffled across both columns, a pair could accidentally end up
 *   on the same row (side-by-side), making it easy to guess.
 *   By shuffling each column's rows separately, the left and right sides
 *   use different row orderings — so partners are virtually never aligned.
 *
 * Example (3 pairs):
 *   LEFT  rows shuffled to: [2, 0, 1]
 *   RIGHT rows shuffled to: [1, 2, 0]
 *   → GPU (left row 2) ↔ PCIe Slot (right row 0) = diagonal line ✓
 *
 * @param {Array} devices - Each device must have col: 0 or col: 1.
 * @returns {Array} Devices with updated row values; columns unchanged.
 */
function scramblePositions(devices) {
  const left  = devices.filter((d) => d.col === 0); // source column
  const right = devices.filter((d) => d.col === 1); // target column

  // Independent row shuffles — one per column
  const leftRows  = shuffle(left.map((_, i) => i));
  const rightRows = shuffle(right.map((_, i) => i));

  // Re-assign only the row; preserve everything else
  const scrambledLeft  = left.map((d, i)  => ({ ...d, row: leftRows[i]  }));
  const scrambledRight = right.map((d, i) => ({ ...d, row: rightRows[i] }));

  return [...scrambledLeft, ...scrambledRight];
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * LEVELS holds all three difficulty configs.
 *
 * Device grid layout:
 *   col: 0 → LEFT  column (always the physical component / source)
 *   col: 1 → RIGHT column (always the slot, port, or connector / target)
 *   row: N → default row (overwritten by scramblePositions at game start)
 *
 * correct[] format: [ [leftDeviceId, rightDeviceId], ... ]
 *   Order within each pair doesn't matter for matching logic, but by convention
 *   the left-column device is listed first for readability.
 */
const LEVELS = {
  // ── EASY ──────────────────────────────────────────────────────────────────
  easy: {
    key: 'easy',
    badge: 'EASY',
    title: 'PC Basics',
    desc: 'Match everyday PC parts to what they physically connect to.',
    pairs: 4,
    stars: 1,
    badgeColor: '#2D6A0F',
    badgeBg: '#E3F5D5',
    accentColor: '#7DC952',
    devices: [
      // ── LEFT column: the physical parts ──────────────────────────────────
      { id: 'monitor',    label: 'Monitor',          icon: '🖥️', col: 0, row: 0 },
      { id: 'cpu',        label: 'CPU',               icon: '🔲', col: 0, row: 1 },
      { id: 'hdd',        label: 'Hard Drive',        icon: '💿', col: 0, row: 2 },
      { id: 'keyboard',   label: 'Keyboard',          icon: '⌨️', col: 0, row: 3 },
      // ── RIGHT column: what each part plugs into ───────────────────────────
      { id: 'dp_cable',   label: 'HDMI Cable', icon: '🔵', col: 1, row: 0 },
      { id: 'cpu_socket', label: 'CPU Socket',        icon: '🟫', col: 1, row: 1 },
      { id: 'sata_cable', label: 'SATA Cable',        icon: '🔌', col: 1, row: 2 },
      { id: 'usb_port',   label: 'USB-A Port',        icon: '⬜', col: 1, row: 3 },
    ],
    correct: [
      ['monitor',  'dp_cable'],   // Monitor ↔ DisplayPort cable (video output)
      ['cpu',      'cpu_socket'], // CPU ↔ CPU Socket on the motherboard
      ['hdd',      'sata_cable'], // Hard Drive ↔ SATA data cable
      ['keyboard', 'usb_port'],   // USB keyboard ↔ USB-A port
    ],
    hints: [
      'Monitor sends video through a DisplayPort (or HDMI) Cable.',
      'The CPU seats directly into the CPU Socket on the motherboard.',
      'Hard Drive uses a SATA Cable to talk to the motherboard.',
      'A USB Keyboard plugs into a USB-A Port.',
    ],
    wrongMessages: [
      "Those two don't physically connect! Check ports and sockets.",
      "Not quite — what does that part actually plug into?",
      "Wrong match! Think about what connector that device uses.",
    ],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────
  medium: {
    key: 'medium',
    badge: 'MEDIUM',
    title: 'Inside the Case',
    desc: 'Match internal components to their slots and connectors on the board.',
    pairs: 4,
    stars: 2,
    badgeColor: '#7A4508',
    badgeBg: '#FDE8C8',
    accentColor: '#E89020',
    devices: [
      // ── LEFT column: components you install ──────────────────────────────
      { id: 'gpu',        label: 'Graphics Card',   icon: '🎮', col: 0, row: 0 },
      { id: 'ram',        label: 'RAM Stick',        icon: '📊', col: 0, row: 1 },
      { id: 'psu',        label: 'Power Supply',     icon: '⚡', col: 0, row: 2 },
      { id: 'cpu_cooler', label: 'CPU Cooler',       icon: '❄️', col: 0, row: 3 },
      // ── RIGHT column: slots / connectors they seat into ──────────────────
      { id: 'pcie_slot',  label: 'PCIe x16 Slot',   icon: '🟩', col: 1, row: 0 },
      { id: 'dimm_slot',  label: 'DIMM Slot',        icon: '🟦', col: 1, row: 1 },
      { id: 'pin24',      label: '24-pin ATX Conn.', icon: '🔌', col: 1, row: 2 },
      { id: 'cpu_top',    label: 'CPU (top)',         icon: '🔲', col: 1, row: 3 },
    ],
    correct: [
      ['gpu',        'pcie_slot'], // GPU seats in the long PCIe x16 slot
      ['ram',        'dimm_slot'], // RAM stick clicks into a DIMM slot
      ['psu',        'pin24'],     // PSU main power through the 24-pin ATX connector
      ['cpu_cooler', 'cpu_top'],   // CPU cooler mounts on top of the CPU die
    ],
    hints: [
      'Graphics Card plugs into the long PCIe x16 slot.',
      'RAM Stick clicks into a DIMM Slot on the motherboard.',
      'PSU delivers power through the 24-pin ATX Connector.',
      'CPU Cooler mounts directly on top of the CPU.',
    ],
    wrongMessages: [
      "Wrong slot! Those two don't physically mate.",
      "Nope — think about which connector or slot that part fits into.",
      "Incorrect — consider what socket or port that component uses.",
    ],
  },

  // ── HARD ──────────────────────────────────────────────────────────────────
  hard: {
    key: 'hard',
    badge: 'HARD',
    title: 'Pro Build',
    desc: 'Expert-level hardware connections. Know your M.2 from your PCIe x1!',
    pairs: 4,
    stars: 3,
    badgeColor: '#8B1F1F',
    badgeBg: '#FADFDF',
    accentColor: '#D94444',
    devices: [
      // ── LEFT column: specialist components ───────────────────────────────
      { id: 'nvme',      label: 'NVMe SSD',       icon: '💾', col: 0, row: 0 },
      { id: 'thermal',   label: 'Thermal Paste',  icon: '🟥', col: 0, row: 1 },
      { id: 'case_fan',  label: 'Case Fan',        icon: '🌀', col: 0, row: 2 },
      { id: 'wifi_card', label: 'Wi-Fi Card',      icon: '📡', col: 0, row: 3 },
      // ── RIGHT column: slots / headers they connect to ────────────────────
      { id: 'm2_slot',   label: 'M.2 Slot',        icon: '🟫', col: 1, row: 0 },
      { id: 'cpu_ihs',   label: 'CPU IHS',          icon: '🔲', col: 1, row: 1 },
      { id: 'fan_header',label: 'Fan Header (4-pin)',icon: '📌', col: 1, row: 2 },
      { id: 'pcie_x1',   label: 'PCIe x1 Slot',    icon: '🟩', col: 1, row: 3 },
    ],
    correct: [
      ['nvme',      'm2_slot'],    // NVMe SSD slides into the M.2 slot
      ['thermal',   'cpu_ihs'],    // Thermal paste applied to CPU IHS (heat spreader)
      ['case_fan',  'fan_header'], // Case fan plugs into the 3/4-pin fan header
      ['wifi_card', 'pcie_x1'],    // Wi-Fi card uses the short PCIe x1 slot
    ],
    hints: [
      'NVMe SSD slides into the M.2 Slot and is screwed down.',
      'Thermal Paste is applied directly to the CPU IHS (Integrated Heat Spreader).',
      'Case Fan connects to a 4-pin Fan Header on the motherboard.',
      'Wi-Fi Card uses the short PCIe x1 Slot — not the long x16 one.',
    ],
    wrongMessages: [
      "Wrong connection! Those parts don't interface in a real build.",
      "Incorrect — think about the physical slot or header each part uses.",
      "Not quite — a Wi-Fi card doesn't go in the same slot as a GPU!",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION LINE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Draws a coloured line between two absolute-positioned points using a
 * rotated <View>. No SVG dependency needed.
 *
 * Maths:
 *   length = √(dx² + dy²)          — Pythagorean theorem
 *   angle  = atan2(dy, dx) → deg   — rotation so the bar points from A to B
 *   transformOrigin: 'left center'  — keeps the left edge pinned at (x1, y1)
 */
function ConnectionLine({ x1, y1, x2, y2, color = '#1D9E75' }) {
  const dx     = x2 - x1;
  const dy     = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - 2,
        width: length,
        height: 4,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: `${angle}deg` }],
        transformOrigin: 'left center',
        opacity: 0.9,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE NODE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * A single tappable device card rendered at its grid position.
 *
 * Visual states:
 *   default   → neutral white card
 *   selected  → accent-coloured border + tinted background
 *   connected → green border + tint + ✓ badge  (locked — not tappable)
 *   wrong     → red border + tint + ✕ badge + shake animation
 *
 * Icon vs Image:
 *   • If DEVICE_IMAGES[device.id] is non-null → renders <Image>
 *   • Otherwise → renders the emoji in device.icon as <Text>
 *   → To add images, update DEVICE_IMAGES at the top of this file.
 */
function DeviceNode({ device, isSelected, isConnected, isWrong, onPress, accentColor, badgeBg }) {
  const shakeAnim = useRef(new Animated.Value(0)).current; // X-axis shake on wrong answer
  const scaleAnim = useRef(new Animated.Value(1)).current; // scale pop on selection

  // Shake animation — triggers whenever isWrong flips to true
  React.useEffect(() => {
    if (!isWrong) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [isWrong]);

  // Scale pop — springs up when selected, returns when deselected
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.08 : 1,
      useNativeDriver: true,
      tension: 200,
    }).start();
  }, [isSelected]);

  const hasImage = !!DEVICE_IMAGES[device.id];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        // Centre the 96px card within its CELL_W-wide column slot
        left: device.col * CELL_W + CELL_W / 2 - 48,
        top:  device.row * CELL_H + 8,
        transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          nd.node,
          isSelected  && [nd.nodeSelected, { borderColor: accentColor, backgroundColor: badgeBg }],
          isConnected && nd.nodeConnected,
          isWrong     && nd.nodeWrong,
        ]}
        onPress={onPress}
        disabled={isConnected} // locked once confirmed as part of a correct pair
        activeOpacity={0.8}
      >
        {/*
          ── DEVICE VISUAL ────────────────────────────────────────────────────
          Priority: real image (if DEVICE_IMAGES[id] !== null)  >  emoji fallback

          TO ADD IMAGES:
            1. Save your PNG to  ../assets/images/<name>.png
            2. In DEVICE_IMAGES at the top of this file, change null to:
                 monitor: require('../assets/images/monitor.png'),
            Recommended: 112×112 px source  (displayed at 56×56 dp)
          ──────────────────────────────────────────────────────────────────── */}
        {hasImage ? (
          <Image source={DEVICE_IMAGES[device.id]} style={nd.nodeImage} resizeMode="contain" />
        ) : (
          <Text style={nd.nodeIcon}>{device.icon}</Text>
        )}

        <Text style={[
          nd.nodeLabel,
          isConnected && { color: '#0F6E56' },
          isWrong     && { color: '#A32D2D' },
        ]}>
          {device.label}
        </Text>

        {/* ✓ badge — visible when this node is part of a completed pair */}
        {isConnected && (
          <View style={nd.checkBadge}><Text style={nd.checkText}>✓</Text></View>
        )}

        {/* ✕ badge — visible while the wrong-answer flash is active */}
        {isWrong && (
          <View style={nd.wrongBadge}><Text style={nd.wrongText}>✕</Text></View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const nd = StyleSheet.create({
  node: {
    width: 96,
    alignItems: 'center',
    backgroundColor: '#F7F6F2',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  nodeSelected:  { borderWidth: 2, elevation: 5, shadowOpacity: 0.15 },
  nodeConnected: { borderColor: '#1D9E75', backgroundColor: '#E8F8F2' },
  nodeWrong:     { borderColor: '#D94444', backgroundColor: '#FADFDF' },
  // Image — adjust width/height if your assets use a different aspect ratio
  nodeImage: { width: 56, height: 56, marginBottom: 4 },
  nodeIcon:  { fontSize: 36, marginBottom: 4, lineHeight: 44 },
  nodeLabel: { fontSize: 10, fontWeight: '700', color: '#1A1916', textAlign: 'center', letterSpacing: 0.3 },
  checkBadge: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  wrongBadge: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#D94444', alignItems: 'center', justifyContent: 'center',
  },
  wrongText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN HEADER BAR
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Two-column label bar above the game board.
 * Orients the player: LEFT = "COMPONENTS" (the part), RIGHT = "CONNECTS TO" (the slot).
 */
function ColumnHeaders({ accentColor }) {
  return (
    <View style={ch.row}>
      <View style={[ch.half, { borderBottomColor: accentColor }]}>
        <Text style={[ch.label, { color: accentColor }]}>COMPONENTS</Text>
      </View>
      <View style={[ch.half, { borderBottomColor: accentColor }]}>
        <Text style={[ch.label, { color: accentColor }]}>CONNECTS TO</Text>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  row:   { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4 },
  half:  { flex: 1, paddingVertical: 5, borderBottomWidth: 2, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL SELECT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LevelSelectScreen({ navigation }) {
  return (
    <View style={ls.container}>
      <View style={ls.decorCircle} />
      <View style={ls.header}>
        <TouchableOpacity style={ls.backBtn} onPress={() => navigation.navigate('Menu')}>
          <Text style={ls.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={ls.headerTitle}>Circuit Connect</Text>
          <Text style={ls.headerSub}>Choose your difficulty</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={ls.list} showsVerticalScrollIndicator={false}>
        {Object.values(LEVELS).map((lv) => (
          <LevelCard
            key={lv.key}
            level={lv}
            onPress={() => navigation.navigate('CircuitGame', { levelKey: lv.key })}
          />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function LevelCard({ level, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const filledStars = '★'.repeat(level.stars);
  const emptyStars  = '☆'.repeat(3 - level.stars);
  // Preview chips show the LEFT-column (source) device names
  const leftDevices = level.devices.filter((d) => d.col === 0);
  const chips = leftDevices.slice(0, 3).map((d) => d.label);
  const extra = leftDevices.length - 3;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[ls.card, { borderColor: level.accentColor }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[ls.cardBar, { backgroundColor: level.accentColor }]} />
        <View style={ls.cardBody}>
          <View style={ls.cardTop}>
            <View style={ls.cardTopLeft}>
              <View style={[ls.badge, { backgroundColor: level.badgeBg }]}>
                <Text style={[ls.badgeText, { color: level.badgeColor }]}>{level.badge}</Text>
              </View>
              <Text style={ls.stars}>
                <Text style={{ color: level.accentColor }}>{filledStars}</Text>
                <Text style={{ color: '#D3D1C7' }}>{emptyStars}</Text>
              </Text>
            </View>
            <View style={[ls.pairsPill, { backgroundColor: level.badgeBg }]}>
              <Text style={[ls.pairsText, { color: level.badgeColor }]}>{level.pairs} pairs</Text>
            </View>
          </View>
          <Text style={ls.cardTitle}>{level.title}</Text>
          <Text style={ls.cardDesc}>{level.desc}</Text>
          <View style={ls.chipRow}>
            {chips.map((label) => (
              <View key={label} style={ls.chip}>
                <Text style={ls.chipText}>{label}</Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={[ls.chip, { borderColor: level.accentColor }]}>
                <Text style={[ls.chipText, { color: level.badgeColor }]}>+{extra} more</Text>
              </View>
            )}
          </View>
        </View>
        <View style={ls.arrowWrap}>
          <Text style={[ls.arrow, { color: level.accentColor }]}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Main gameplay screen.
 *
 * Tap flow:
 *   1st tap → select a device (highlights it, shows "X selected" bar)
 *   2nd tap (same card)      → deselect
 *   2nd tap (different card) → validate pair
 *     ✓ correct  → draw ConnectionLine, lock both cards, check win condition
 *     ✗ wrong    → shake + flash red, show error banner, increment mistakes
 *
 * scrambledDevices: memoised; re-calculated only when shuffleKey changes
 *   (i.e. on explicit restart). Each column's row order is independently
 *   randomised so correct partners are (almost) never on the same row.
 */
function GameScreen({ navigation, route }) {
  const { levelKey } = route.params;
  const level = LEVELS[levelKey];

  const [selected, setSelected]         = useState(null);
  const [connections, setConnections]   = useState([]);        // [{from,to,x1,y1,x2,y2}]
  const [connectedIds, setConnectedIds] = useState(new Set()); // ids locked as correct
  const [wrongIds, setWrongIds]         = useState(new Set()); // ids flashing wrong
  const [mistakes, setMistakes]         = useState(0);
  const [hintIdx, setHintIdx]           = useState(0);
  const [menuVisible, setMenuVisible]   = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [shuffleKey, setShuffleKey]     = useState(0); // increment to trigger re-scramble on restart

  const errorAnim     = useRef(new Animated.Value(0)).current; // drives error banner opacity + translateY
  const wrongTimerRef = useRef(null);                           // clears the wrong-flash timeout

  // Scrambled device layout — recalculated only when the level or shuffleKey changes
  const scrambledDevices = useMemo(
    () => scramblePositions(level.devices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, shuffleKey],
  );

  // Board height = tallest row index + 1, converted to pixels
  const rows   = Math.max(...scrambledDevices.map((d) => d.row)) + 1;
  const GAME_H = rows * CELL_H + 16;

  // Returns the pixel-centre {x, y} of a device card (used for line endpoints)
  const nodeCenter = (device) => ({
    x: device.col * CELL_W + CELL_W / 2,
    y: device.row * CELL_H + CELL_H / 2,
  });

  // Returns true if ids a and b form a valid pair (order-independent)
  const isPairCorrect = (a, b) =>
    level.correct.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

  // Animates the error banner: slide in → wait → fade out
  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setErrorMsg(''));
  }, []);

  // Main tap handler
  const handleTap = (id) => {
    if (connectedIds.has(id)) return; // ignore taps on locked cards

    if (!selected)       { setSelected(id);   return; } // first tap — select
    if (selected === id) { setSelected(null);  return; } // same card — deselect

    const a = selected, b = id;
    setSelected(null); // clear selection before evaluating

    if (isPairCorrect(a, b)) {
      // ── ✓ CORRECT ────────────────────────────────────────────────────────
      // Find the scrambled positions to get pixel centres for the line
      const da = scrambledDevices.find((d) => d.id === a);
      const db = scrambledDevices.find((d) => d.id === b);
      const ca = nodeCenter(da);
      const cb = nodeCenter(db);

      const newConns = [...connections, { from: a, to: b, x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }];
      const newIds   = new Set([...connectedIds, a, b]);
      setConnections(newConns);
      setConnectedIds(newIds);

      // All pairs done → navigate to Completion screen after a short delay
      if (newConns.length === level.pairs) {
        setTimeout(
          () => navigation.navigate('Completion', { gameId: 'CircuitConnect', levelKey, mistakes, pairs: level.pairs }),
          800,
        );
      }
    } else {
      // ── ✗ WRONG ──────────────────────────────────────────────────────────
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      // Flash both tapped cards red for 1 second
      setWrongIds(new Set([a, b]));
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongIds(new Set()), 1000);

      // Show a random wrong-answer message with running mistake count
      const msgs = level.wrongMessages;
      showError(`❌ ${msgs[Math.floor(Math.random() * msgs.length)]} (${newMistakes} mistake${newMistakes > 1 ? 's' : ''})`);
    }
  };

  // Reset ALL state and re-scramble positions
  const handleRestart = () => {
    setSelected(null);
    setConnections([]);
    setConnectedIds(new Set());
    setWrongIds(new Set());
    setMistakes(0);
    setHintIdx(0);
    setMenuVisible(false);
    setErrorMsg('');
    setShuffleKey((k) => k + 1); // triggers useMemo to re-run scramblePositions
  };

  const selectedDevice = scrambledDevices.find((d) => d.id === selected);

  return (
    <View style={g.container}>
      <View style={g.decorCircle} />

      {/* Header: back arrow + menu button */}
      <View style={g.header}>
        <TouchableOpacity style={g.backBtn} onPress={() => navigation.goBack()}>
          <Text style={g.backText}>← Level Select</Text>
        </TouchableOpacity>
        <TouchableOpacity style={g.menuBtn} onPress={() => setMenuVisible(true)}>
          <Text style={g.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Progress status bar */}
      <View style={g.statusBar}>
        <View style={g.statusLeft}>
          {/* Dot turns green when all pairs are matched */}
          <View style={[g.statusDot, {
            backgroundColor: connections.length === level.pairs ? '#1D9E75' : level.accentColor,
          }]} />
          <Text style={g.statusText}>MATCH PC HARDWARE</Text>
        </View>
        <View style={[g.levelPill, { backgroundColor: level.badgeBg }]}>
          <Text style={[g.levelPillText, { color: level.badgeColor }]}>
            {level.badge}  {connections.length}/{level.pairs}
          </Text>
        </View>
      </View>

      {/* Instruction subtitle */}
      <Text style={g.instruction}>
        Tap a part on the LEFT, then its match on the RIGHT
      </Text>

      {/* Selected-device indicator (or invisible placeholder to prevent layout shift) */}
      {selectedDevice ? (
        <View style={[g.selectedBar, { borderColor: level.accentColor, backgroundColor: level.badgeBg + '88' }]}>
          <Text style={[g.selectedText, { color: level.badgeColor }]}>
            {selectedDevice.icon}  {selectedDevice.label} selected — tap its match!
          </Text>
        </View>
      ) : (
        <View style={g.selectedBarPlaceholder} />
      )}

      {/* Sliding error banner (slides in from above, fades out automatically) */}
      <Animated.View
        style={[g.errorBanner, {
          opacity: errorAnim,
          transform: [{ translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }]}
        pointerEvents="none"
      >
        <Text style={g.errorText}>{errorMsg}</Text>
      </Animated.View>

      {/* Mistake dots: one dot per mistake, max 5 shown, then "+N" overflow */}
      {mistakes > 0 && (
        <View style={g.mistakesRow}>
          {Array.from({ length: Math.min(mistakes, 5) }).map((_, i) => (
            <View key={i} style={g.mistakeDot} />
          ))}
          {mistakes > 5 && <Text style={g.mistakesExtra}>+{mistakes - 5}</Text>}
          <Text style={g.mistakesLabel}> mistake{mistakes !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Column header labels: COMPONENTS | CONNECTS TO */}
      <ColumnHeaders accentColor={level.accentColor} />

      {/* Game board */}
      <View style={[g.gameArea, { height: GAME_H }]}>
        {/* Connection lines rendered first so they appear behind device cards */}
        {connections.map((conn, i) => (
          <ConnectionLine key={i} x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} />
        ))}

        {/*
          Device nodes — uses scrambledDevices (row-shuffled per-column) NOT level.devices.
          Each DeviceNode positions itself absolutely based on its col and row values.
        */}
        {scrambledDevices.map((device) => (
          <DeviceNode
            key={device.id}
            device={device}
            isSelected={selected === device.id}
            isConnected={connectedIds.has(device.id)}
            isWrong={wrongIds.has(device.id)}
            onPress={() => handleTap(device.id)}
            accentColor={level.accentColor}
            badgeBg={level.badgeBg}
          />
        ))}
      </View>

      {/* Power-up toolbar: Hint / Help / Inspect */}
      <PowerUpToolbar
        onHint={() => {
          // Cycle through hints; wrap around with modulo
          const hint = level.hints[hintIdx % level.hints.length];
          setHintIdx((i) => i + 1);
          Alert.alert('Hint 💡', hint, [{ text: 'Got it!' }]);
        }}
        onHelp={() =>
          Alert.alert(
            'How to play',
            'Tap a component on the LEFT side.\nThen tap its matching slot or connector on the RIGHT side.\n\nParts are shuffled every game — you can\'t guess by position!\n\nGreen lines show completed connections.',
            [{ text: 'OK!' }],
          )
        }
        onInspect={() =>
          Alert.alert(
            'Progress 🔍',
            `✅ ${connections.length} of ${level.pairs} pairs connected\n❌ ${mistakes} mistake${mistakes !== 1 ? 's' : ''} so far`,
            [{ text: 'Keep going!' }],
          )
        }
      />

      {/* In-game pause menu overlay */}
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleRestart}
        onHome={() => navigation.navigate('Menu')}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — nested stack navigator
// ─────────────────────────────────────────────────────────────────────────────
/**
 * CircuitConnectScreen is the top-level export consumed by the parent navigator.
 * It owns a nested Stack with two screens:
 *   CircuitLevels → LevelSelectScreen
 *   CircuitGame   → GameScreen
 *
 * 'Menu' and 'Completion' routes are forwarded to the parent navigator because
 * they live outside this nested stack.
 */
const Stack = createNativeStackNavigator();

export default function CircuitConnectScreen({ navigation }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CircuitLevels">
        {(props) => (
          <LevelSelectScreen
            {...props}
            navigation={{
              ...props.navigation,
              navigate: (screen, params) =>
                screen === 'Menu'
                  ? navigation.navigate('Menu')
                  : props.navigation.navigate(screen, params),
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CircuitGame">
        {(props) => (
          <GameScreen
            {...props}
            navigation={{
              ...props.navigation,
              goBack: () => props.navigation.goBack(),
              navigate: (screen, params) =>
                screen === 'Menu' || screen === 'Completion'
                  ? navigation.navigate(screen, params)
                  : props.navigation.navigate(screen, params),
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

// Level select screen styles (ls)
const ls = StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.colors.background, paddingTop: 50 },
  decorCircle: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: theme.colors.primary, opacity: 0.12 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  backBtn:     { backgroundColor: theme.colors.white, padding: 10, borderRadius: theme.radius.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  backText:    { fontSize: 18, color: theme.colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  headerSub:   { fontSize: 12, color: theme.colors.textLight, marginTop: 1 },
  list:        { paddingHorizontal: 16 },
  card:        { backgroundColor: theme.colors.white, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', overflow: 'hidden', elevation: 3, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardBar:     { width: 5 },
  cardBody:    { flex: 1, padding: 16 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:   { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  stars:       { fontSize: 14, letterSpacing: 2 },
  pairsPill:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pairsText:   { fontSize: 11, fontWeight: '700' },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  cardDesc:    { fontSize: 12, color: theme.colors.textLight, lineHeight: 18, marginBottom: 10 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: '#E2DFD8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText:    { fontSize: 11, color: theme.colors.textLight },
  arrowWrap:   { justifyContent: 'center', paddingRight: 14 },
  arrow:       { fontSize: 26, fontWeight: '300' },
});

// Game screen styles (g)
const g = StyleSheet.create({
  container:              { flex: 1, backgroundColor: theme.colors.background, paddingTop: 50 },
  decorCircle:            { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: theme.colors.primary, opacity: 0.12 },
  header:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  backBtn:                { backgroundColor: theme.colors.white, padding: 10, borderRadius: theme.radius.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  backText:               { fontWeight: '700', color: theme.colors.text, fontSize: 13 },
  menuBtn:                { backgroundColor: theme.colors.white, padding: 10, paddingHorizontal: 20, borderRadius: theme.radius.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  menuText:               { fontWeight: '700', color: theme.colors.text },
  statusBar:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.white, marginHorizontal: 16, padding: 10, borderRadius: theme.radius.sm, marginBottom: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  statusLeft:             { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:              { width: 10, height: 10, borderRadius: 5 },
  statusText:             { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.colors.text },
  levelPill:              { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  levelPillText:          { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  instruction:            { fontSize: 12, color: theme.colors.textLight, marginHorizontal: 16, marginBottom: 6, textAlign: 'center' },
  selectedBar:            { marginHorizontal: 16, marginBottom: 6, borderWidth: 1.5, borderRadius: theme.radius.sm, padding: 9, alignItems: 'center' },
  selectedBarPlaceholder: { height: 38, marginHorizontal: 16, marginBottom: 6 },
  selectedText:           { fontSize: 12, fontWeight: '700' },
  errorBanner:            { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#FADFDF', borderWidth: 1, borderColor: '#F09595', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  errorText:              { fontSize: 12, fontWeight: '700', color: '#8B1F1F', textAlign: 'center' },
  mistakesRow:            { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 4, gap: 4 },
  mistakeDot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D94444' },
  mistakesExtra:          { fontSize: 11, color: '#D94444', fontWeight: '700' },
  mistakesLabel:          { fontSize: 11, color: '#D94444', fontWeight: '600' },
  gameArea:               { position: 'relative', backgroundColor: theme.colors.white, marginHorizontal: 16, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, overflow: 'hidden' },
});