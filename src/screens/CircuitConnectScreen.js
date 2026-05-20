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

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { theme } from '../styles/theme';
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
      ['monitor',  'dp_cable'],   // Monitor ↔ HDMI Cable (video output)
      ['cpu',      'cpu_socket'], // CPU ↔ CPU Socket on the motherboard
      ['hdd',      'sata_cable'], // Hard Drive ↔ SATA data cable
      ['keyboard', 'usb_port'],   // USB keyboard ↔ USB-A port
    ],
    // hints[] — one per pair in this level, shown one at a time when the player
    // taps the Hint power-up. Each hint names BOTH devices in the pair so the
    // player knows exactly which connection it's describing.
    hints: [
      'Pair 1 — Monitor + DisplayPort Cable: The Monitor connects to the GPU via a DisplayPort (or HDMI) cable to receive the video signal.',
      'Pair 2 — CPU + CPU Socket: The CPU is a flat chip that locks into the CPU Socket (LGA or AM5 style) on the motherboard.',
      'Pair 3 — Hard Drive + SATA Cable: Hard Drives send data to the motherboard through a thin SATA data cable plugged into a SATA port.',
      'Pair 4 — Keyboard + USB-A Port: A wired USB keyboard plugs into the rectangular USB-A port on the back panel of your PC.',
    ],
    // wrongMessages[] — only mentions parts that actually exist in THIS level.
    wrongMessages: [
      "Nope! The 4 pairs here are: Monitor→Cable, CPU→Socket, Hard Drive→SATA, Keyboard→USB.",
      "Not quite! Does a CPU really plug into a SATA Cable? Think about what each part actually connects to.",
      "Wrong match! Hint: every part on the left connects to exactly one part on the right in this level.",
    ],
    // learnings{} — a short educational fact shown as a green toast the moment
    // the player confirms a correct pair. Key = left-column device id.
    learnings: {
      monitor:  '✅ DisplayPort carries digital video + audio up to 8K. It replaced the older VGA and DVI connectors on modern monitors.',
      cpu:      '✅ The CPU Socket (e.g. LGA1700 or AM5) uses hundreds of pins or pads to connect the CPU to the motherboard power and data lanes.',
      hdd:      '✅ SATA III cables transfer data at up to 6 Gbps. They are L-shaped to prevent accidental removal inside the case.',
      keyboard: '✅ USB-A is the flat rectangular USB plug. Keyboards send keypress signals over it to the CPU using just 5V of power.',
    },
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
      { id: 'pin24',      label: '24-pin ATX', icon: '🔌', col: 1, row: 2 },
      { id: 'cpu_top',    label: 'CPU (top)',         icon: '🔲', col: 1, row: 3 },
    ],
    correct: [
      ['gpu',        'pcie_slot'], // GPU seats in the long PCIe x16 slot
      ['ram',        'dimm_slot'], // RAM stick clicks into a DIMM slot
      ['psu',        'pin24'],     // PSU main power through the 24-pin ATX connector
      ['cpu_cooler', 'cpu_top'],   // CPU cooler mounts on top of the CPU die
    ],
    hints: [
      'Pair 1 — Graphics Card + PCIe x16 Slot: The GPU slides into the long PCIe x16 slot on the motherboard and is secured with a screw.',
      'Pair 2 — RAM Stick + DIMM Slot: RAM sticks click into the DIMM slots on the motherboard. Most boards have 2 or 4 slots.',
      'Pair 3 — Power Supply + 24-pin ATX Connector: The PSU delivers main power to the motherboard through the wide 24-pin ATX connector.',
      'Pair 4 — CPU Cooler + CPU (top): The CPU Cooler sits directly on top of the CPU, transferring heat away from the processor die.',
    ],
    wrongMessages: [
      "Nope! The 4 pairs here are: GPU→PCIe x16, RAM→DIMM Slot, PSU→24-pin ATX, CPU Cooler→CPU.",
      "Wrong match! Does a RAM Stick really go into a PCIe slot? Think about where each component physically seats.",
      "Incorrect! Every component on the left connects to exactly one slot or connector on the right in this level.",
    ],
    learnings: {
      gpu:        '✅ PCIe x16 is the longest slot on the motherboard. It provides 16 lanes of bandwidth — enough for modern GPUs at full speed.',
      ram:        '✅ DIMM slots have a notch that prevents RAM from being inserted backwards. DDR5 RAM only fits DDR5 slots — they are not interchangeable.',
      psu:        '✅ The 24-pin ATX connector supplies 3.3V, 5V, and 12V power rails to the motherboard. It is the largest connector from the PSU.',
      cpu_cooler: '✅ CPU Coolers use a metal heatsink and fan (or liquid) to draw heat off the CPU. Without one the CPU would overheat in seconds.',
    },
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
      { id: 'fan_header',label: 'Fan Header',icon: '📌', col: 1, row: 2 },
      { id: 'pcie_x1',   label: 'PCIe x1 Slot',    icon: '🟩', col: 1, row: 3 },
    ],
    correct: [
      ['nvme',      'm2_slot'],    // NVMe SSD slides into the M.2 slot
      ['thermal',   'cpu_ihs'],    // Thermal paste applied to CPU IHS (heat spreader)
      ['case_fan',  'fan_header'], // Case fan plugs into the 3/4-pin fan header
      ['wifi_card', 'pcie_x1'],    // Wi-Fi card uses the short PCIe x1 slot
    ],
    hints: [
      'Pair 1 — NVMe SSD + M.2 Slot: An NVMe SSD is a small stick that slides diagonally into the M.2 slot and is held down by a single screw.',
      'Pair 2 — Thermal Paste + CPU IHS: Thermal paste is applied to the CPU IHS (the flat metal lid) before the cooler is mounted, to fill microscopic air gaps.',
      'Pair 3 — Case Fan + Fan Header (4-pin): Case fans plug into 3 or 4-pin Fan Headers on the motherboard so the system can control fan speed.',
      'Pair 4 — Wi-Fi Card + PCIe x1 Slot: Wi-Fi PCIe cards use the short PCIe x1 slot — not the long x16 slot that the GPU uses.',
    ],
    wrongMessages: [
      "Nope! The 4 pairs here are: NVMe→M.2 Slot, Thermal Paste→CPU IHS, Case Fan→Fan Header, Wi-Fi Card→PCIe x1.",
      "Wrong match! A Wi-Fi Card does NOT go in the PCIe x16 slot — that one is for the GPU. It uses the shorter PCIe x1.",
      "Incorrect! Think carefully: does Thermal Paste plug into a slot? No — it's applied to a surface (the CPU IHS).",
    ],
    learnings: {
      nvme:      '✅ NVMe SSDs use the PCIe bus directly through the M.2 slot, reaching 7,000+ MB/s — far faster than SATA drives at 600 MB/s.',
      thermal:   '✅ The CPU IHS (Integrated Heat Spreader) is the silver lid on top of the CPU. Thermal paste fills the microscopic gaps between it and the cooler.',
      case_fan:  '✅ A 4-pin PWM Fan Header lets the motherboard control fan RPM automatically based on CPU temperature, reducing noise at idle.',
      wifi_card: '✅ PCIe x1 slots have just 1 lane of bandwidth — enough for Wi-Fi cards, sound cards, and USB expansion cards, but not GPUs.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE SPECS — shown in the 📋 Specs modal (one fact per device)
// ─────────────────────────────────────────────────────────────────────────────
const DEVICE_SPECS = {
  // Easy
  monitor:    'Displays visual output from the GPU. Connects via DisplayPort or HDMI cable. Supports up to 8K resolution on modern panels.',
  cpu:        'Central Processing Unit — the brain of the PC. Seats into the CPU Socket on the motherboard. Executes all program instructions.',
  hdd:        'Hard Disk Drive — magnetic storage for files and OS. Connects to the motherboard via a SATA data cable at up to 6 Gbps.',
  keyboard:   'Primary text input device. Connects to a USB-A port on the back panel. Uses 5V of power to send keypress signals to the CPU.',
  dp_cable:   'DisplayPort Cable — carries digital video and audio up to 8K @ 60Hz. Connects monitor to GPU or motherboard video output.',
  cpu_socket:'The CPU Socket (e.g. LGA1700, AM5) holds the CPU in place on the motherboard using hundreds of pins or contact pads.',
  sata_cable: 'Serial ATA data cable — connects HDDs and SSDs to the motherboard. L-shaped connector prevents accidental removal.',
  usb_port:   'USB-A Port — the standard rectangular USB connector. Accepts keyboards, mice, drives, and other peripherals at up to 10 Gbps (USB 3.2).',
  // Medium
  gpu:        'Graphics Processing Unit — renders images and video. Seats into the long PCIe x16 slot. Powers displays via HDMI or DisplayPort.',
  ram:        'RAM Stick — volatile short-term memory. Clicks into DIMM slots. DDR5 is the latest standard; not interchangeable with DDR4.',
  psu:        'Power Supply Unit — converts AC mains power to DC voltages (3.3V, 5V, 12V) used by all PC components.',
  cpu_cooler: 'CPU Cooler — heatsink + fan (or liquid loop) that draws heat away from the CPU die to prevent thermal throttling.',
  pcie_slot:  'PCIe x16 Slot — the longest expansion slot on the motherboard. Provides 16 high-speed lanes for GPUs.',
  dimm_slot:  'DIMM Slot — holds RAM sticks. A notch prevents backward insertion. Most boards have 2 or 4 slots.',
  pin24:      '24-pin ATX Connector — the main power connector from PSU to motherboard. Supplies 3.3V, 5V, and 12V rails.',
  cpu_top:    'CPU IHS (top surface) — the flat metal lid of the CPU that contacts the cooler. Thermal paste is applied here.',
  // Hard
  nvme:       'NVMe SSD — high-speed storage using the PCIe bus through the M.2 slot. Reaches 7,000+ MB/s, over 10× faster than SATA.',
  thermal:    'Thermal Paste — fills microscopic air gaps between the CPU IHS and cooler base to maximise heat transfer.',
  case_fan:   'Case Fan — moves air through the PC case. Plugs into a 3 or 4-pin Fan Header. PWM (4-pin) allows automatic speed control.',
  wifi_card:  'Wi-Fi PCIe Card — adds wireless networking. Uses the short PCIe x1 slot, not the long x16 slot used by GPUs.',
  m2_slot:    'M.2 Slot — a compact connector on the motherboard for NVMe SSDs. The drive slides in at an angle and is screwed down.',
  cpu_ihs:    'CPU IHS (Integrated Heat Spreader) — the silver lid on top of the CPU. Thermal paste is applied to it before mounting the cooler.',
  fan_header: '4-pin PWM Fan Header — connects case fans to the motherboard so the system can control fan speed based on temperature.',
  pcie_x1:    'PCIe x1 Slot — the shortest expansion slot. Provides 1 PCIe lane. Used for Wi-Fi cards, sound cards, and USB hubs.',
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
        disabled={false} // taps always allowed; handleTap guards connected cards after inspect check
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
  const [learnMsg, setLearnMsg]         = useState('');  // green learning toast shown on correct match
  const [shuffleKey, setShuffleKey]     = useState(0); // increment to trigger re-scramble on restart
  const [showSpecs, setShowSpecs]       = useState(false); // specs modal
  const [showHint, setShowHint]         = useState(false); // hint banner below status bar
  const [showInspect, setShowInspect]   = useState(false); // inspect banner
  const inspectRef = useRef(false); // ref mirrors showInspect — avoids stale closure in handleTap

  const errorAnim     = useRef(new Animated.Value(0)).current; // drives error banner opacity + translateY
  const learnAnim     = useRef(new Animated.Value(0)).current; // drives green learning toast opacity
  const wrongTimerRef = useRef(null);                           // clears the wrong-flash timeout

  // Scrambled device layout — recalculated only when the level or shuffleKey changes
  const scrambledDevices = useMemo(
    () => scramblePositions(level.devices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, shuffleKey],
  );

  useEffect(() => {
    setMenuVisible(false);
  }, [levelKey]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setMenuVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

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

  // Animates the green learning toast: slide in → wait → fade out
  const showLearning = useCallback((msg) => {
    setLearnMsg(msg);
    learnAnim.setValue(0);
    Animated.sequence([
      Animated.timing(learnAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(learnAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setLearnMsg(''));
  }, []);

  // ── Stable inspect handler — uses ref so it never has a stale closure ─────
  // Called directly from DeviceNode onPress when inspectRef.current is true.
  const handleInspect = useCallback((id) => {
    const device = level.devices.find((d) => d.id === id);
    const pair   = level.correct.find((p) => p[0] === id || p[1] === id);
    if (pair && device) {
      const partnerId  = pair[0] === id ? pair[1] : pair[0];
      const partnerDev = level.devices.find((d) => d.id === partnerId);
      const hintForPair = level.hints[level.correct.indexOf(pair)] || '';
      Alert.alert(
        `🔍 ${device.label}`,
        `Connects to: ${partnerDev?.label}

${hintForPair}`,
        [{ text: 'Got it!' }],
      );
    }
    inspectRef.current = false;
    setShowInspect(false);
  }, [level]);

  // Main tap handler — only called when NOT in inspect mode
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

      // Show a learning fact for this specific pair (keyed by the left-column device id)
      const leftId = [a, b].find((id) => level.devices.find((d) => d.id === id && d.col === 0));
      if (level.learnings && level.learnings[leftId]) {
        showLearning(level.learnings[leftId]);
      }

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
    setLearnMsg('');
    setShowSpecs(false);
    setShowHint(false);
    setShowInspect(false);
    inspectRef.current = false;
    setShuffleKey((k) => k + 1); // triggers useMemo to re-run scramblePositions
  };

  const selectedDevice = scrambledDevices.find((d) => d.id === selected);

  return (
    <View style={g.container}>
      <View style={g.decorCircle} />

      {/* Header: back button | centered title | menu button */}
      <View style={g.header}>
        <TouchableOpacity style={g.backBtn} onPress={() => navigation.goBack()}>
          <Text style={g.backText}>←</Text>
        </TouchableOpacity>
        <Text style={g.headerTitle}>Circuit Connect</Text>
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

      {/* ── HINT BANNER — shows current hint when showHint is true ── */}
      {showHint && (
        <View style={g.hintWrapper}>
          <Text style={g.hintText}>
            💡 {level.hints[hintIdx % level.hints.length]}
          </Text>
        </View>
      )}

      {/* ── INSPECT BANNER — reminds player they are in inspect mode ── */}
      {showInspect && (
        <View style={g.inspectWrapper}>
          <Text style={g.inspectText}>
            🔍 INSPECT MODE — tap any card to see what it connects to
          </Text>
        </View>
      )}

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

      {/* Green learning toast — slides in from above on each correct match */}
      <Animated.View
        style={[g.learnBanner, {
          opacity: learnAnim,
          transform: [{ translateY: learnAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }]}
        pointerEvents="none"
      >
        <Text style={g.learnText}>{learnMsg}</Text>
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
            onPress={() => inspectRef.current ? handleInspect(device.id) : handleTap(device.id)}
            accentColor={level.accentColor}
            badgeBg={level.badgeBg}
          />
        ))}
      </View>

      {/* ── INLINE POWER-UP TOOLBAR ──────────────────────────────────────
           📋 Specs   — opens a modal listing all pairs in this level
           💡 Hint    — toggles a banner showing the current hint
           🔍 Inspect — toggles inspect mode; tapping a card shows its pair
      ─────────────────────────────────────────────────────────────────── */}
      <View style={g.footerToolbar}>

        {/* 📋 Specs button — shows all pairs for this level */}
        <TouchableOpacity
          style={g.toolBtn}
          onPress={() => setShowSpecs(true)}
          activeOpacity={0.8}
        >
          <View style={g.toolBtnCircle}>
            <Text style={g.toolBtnIcon}>📋</Text>
          </View>
          <Text style={g.toolBtnLabel}>Specs</Text>
        </TouchableOpacity>

        {/* 💡 Hint button — toggles hint banner, advances hint index each open */}
        <TouchableOpacity
          style={g.toolBtn}
          onPress={() => {
            if (!showHint) setHintIdx((i) => i + 1); // advance hint on each open
            if (!showHint && showInspect) setShowInspect(false); // mutual exclusion
            setShowHint((v) => !v);
          }}
          activeOpacity={0.8}
        >
          <View style={[g.toolBtnCircle, showHint && g.toolBtnCircleActive]}>
            <Text style={g.toolBtnIcon}>💡</Text>
          </View>
          <Text style={g.toolBtnLabel}>Hint</Text>
        </TouchableOpacity>

        {/* 🔍 Inspect button — toggles inspect mode */}
        <TouchableOpacity
          style={g.toolBtn}
          onPress={() => {
            if (!showInspect && showHint) setShowHint(false); // mutual exclusion
            const next = !showInspect;
            inspectRef.current = next;
            setShowInspect(next);
          }}
          activeOpacity={0.8}
        >
          <View style={[g.toolBtnCircle, showInspect && g.toolBtnCircleActive]}>
            <Text style={g.toolBtnIcon}>🔍</Text>
          </View>
          <Text style={g.toolBtnLabel}>Inspect</Text>
        </TouchableOpacity>

      </View>

      {/* ── SPECS MODAL — shows name + description for every device in this level ── */}
      <Modal visible={showSpecs} transparent animationType="fade">
        <View style={g.modalBackdrop}>
          <View style={g.modalContent}>
            <Text style={g.modalTitle}>📋 {level.title} — Part Specs</Text>
            <ScrollView style={{ marginBottom: 20 }}>
              {level.devices.map((device) => (
                <View key={device.id} style={g.specItem}>
                  <Text style={g.specLabel}>{device.icon}  {device.label}</Text>
                  <Text style={g.specDesc}>{DEVICE_SPECS[device.id] || 'A key PC hardware component.'}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSpecs(false)} style={g.closeBtn}>
              <Text style={g.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* In-game pause menu overlay */}
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleRestart}
        onHome={() => { setMenuVisible(false); navigation.navigate('Menu'); }}
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
  headerTitle:            { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: theme.colors.text, letterSpacing: 0.5 },
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
  learnBanner:            { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  learnText:              { fontSize: 11, fontWeight: '700', color: '#0F6E56', textAlign: 'center', lineHeight: 16 },
  // ── Power-up toolbar styles ─────────────────────────────────────────────────
  footerToolbar:          { flexDirection: 'row', backgroundColor: '#4299E1', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 14, borderRadius: 25, marginHorizontal: 16, marginBottom: 10, elevation: 6 },
  toolBtn:                { alignItems: 'center' },
  toolBtnCircle:          { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 4, elevation: 2 },
  toolBtnCircleActive:    { backgroundColor: '#FFD700' },
  toolBtnIcon:            { fontSize: 24 },
  toolBtnLabel:           { color: '#fff', fontSize: 10, fontWeight: '700' },
  // ── Hint banner ──────────────────────────────────────────────────────────────
  hintWrapper:            { marginHorizontal: 16, marginBottom: 6, backgroundColor: '#FFFBEB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#F6E05E', alignItems: 'center' },
  hintText:               { fontSize: 12, fontWeight: '700', color: '#B7791F', textAlign: 'center', lineHeight: 18 },
  // ── Inspect banner ───────────────────────────────────────────────────────────
  inspectWrapper:         { marginHorizontal: 16, marginBottom: 6, backgroundColor: '#EBF8FF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#4A90E2', alignItems: 'center' },
  inspectText:            { fontSize: 12, fontWeight: '700', color: '#2B6CB0', textAlign: 'center' },
  // ── Specs modal ──────────────────────────────────────────────────────────────
  modalBackdrop:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent:           { backgroundColor: '#2D3748', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle:             { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  specItem:               { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#4A5568', paddingBottom: 8 },
  specLabel:              { color: '#4FD1C5', fontSize: 13, fontWeight: '700' },
  specDesc:               { color: '#E2E8F0', fontSize: 11, marginTop: 4, lineHeight: 16 },
  closeBtn:               { backgroundColor: '#E53E3E', padding: 12, borderRadius: 8, alignItems: 'center' },
  closeBtnText:           { color: '#fff', fontWeight: '700', fontSize: 14 },
  gameArea:               { position: 'relative', backgroundColor: theme.colors.white, marginHorizontal: 16, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, overflow: 'hidden' },
});