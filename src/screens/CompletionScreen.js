import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Animated, Dimensions
} from 'react-native';
import { theme } from '../styles/theme';
import AudioManager from '../utils/AudioManager'; // ✅ Import AudioManager

const { width } = Dimensions.get('window');

const LESSONS = {
  DebugInterface: [
    { icon: '🎨', title: 'Color in UI',
      fact: 'Color communicates meaning — green means go, red means stop or danger.' },
    { icon: '🔤', title: 'Typography',
      fact: 'Text that is too small breaks readability and makes software harder to use.' },
    { icon: '🗂️', title: 'Icons',
      fact: 'Icons must match their labels — wrong icons confuse users.' },
    { icon: '📐', title: 'Layout',
      fact: 'Good UI design ensures every element has proper spacing and hierarchy.' },
  ],
  
  // ✅ BuildThePC level-specific lessons
  BuildThePC_easy: [
    { icon: '🔧', title: 'Motherboard',
      fact: 'The motherboard is the main circuit board that connects all PC components together.' },
    { icon: '⚡', title: 'Power Supply',
      fact: 'The PSU converts wall power to stable DC voltages (3.3V, 5V, 12V) for all components.' },
    { icon: '💿', title: 'Disk Drive Bay',
      fact: 'Drive bays hold storage devices like HDDs or SSDs and slide into the PC case.' },
    { icon: '🖥️', title: 'PC Case Assembly',
      fact: 'Building a PC starts with installing the motherboard, then PSU, then drives — in that order.' },
  ],
  BuildThePC_medium: [
    { icon: '🧠', title: 'CPU',
      fact: 'The CPU is the brain of the computer — it processes all instructions and calculations.' },
    { icon: '💾', title: 'RAM',
      fact: 'RAM temporarily stores data so the CPU can access it quickly without waiting for slower storage.' },
    { icon: '🎮', title: 'PCI Graphics',
      fact: 'PCI slots allow expansion cards like GPUs to communicate with the CPU via the motherboard.' },
    { icon: '🔌', title: 'Component Placement',
      fact: 'Components must match their slot types — a CPU won\'t fit in a RAM slot, and vice versa.' },
  ],
  BuildThePC_hard: [
    { icon: '🔌', title: 'I/O Interfaces',
      fact: 'I/O ports (USB, HDMI, Ethernet) let peripherals connect to the PC through the motherboard.' },
    { icon: '🚀', title: 'PCIe Slots',
      fact: 'PCIe x16 slots provide 16 high-speed lanes for GPUs; x1/x4/x8 slots support smaller cards.' },
    { icon: '💽', title: 'SATA Ports',
      fact: 'SATA ports connect storage drives and optical drives using thin data cables at up to 6 Gbps.' },
    { icon: '🔋', title: 'CMOS Battery',
      fact: 'The CMOS battery maintains BIOS settings and system time even when the PC is unplugged.' },
  ],
  
  CircuitConnect_easy: [
    {
      title: 'Monitor → DisplayPort Cable',
      fact: 'The monitor receives video from the GPU through a DisplayPort or HDMI cable. DisplayPort supports up to 8K resolution and 240 Hz refresh rates.',
    },
    {
      title: 'CPU → CPU Socket',
      fact: 'The CPU slots into the CPU Socket on the motherboard (e.g. LGA1700 or AM5). The socket\'s hundreds of pins carry power and data to the processor.',
    },
    {
      title: 'Hard Drive → SATA Cable',
      fact: 'A Hard Drive connects to the motherboard via a SATA data cable. SATA III transfers data at up to 6 Gbps — slower than NVMe but still common.',
    },
    {
      title: 'Keyboard → USB-A Port',
      fact: 'A wired keyboard plugs into the rectangular USB-A port. USB sends keypress signals to the CPU using just 5 volts — barely more than a phone charger.',
    },
  ],
  CircuitConnect_medium: [
    {
      title: 'Graphics Card → PCIe x16 Slot',
      fact: 'The GPU seats into the long PCIe x16 slot on the motherboard. It provides 16 high-speed lanes — the most bandwidth of any slot on the board.',
    },
    {
      title: 'RAM Stick → DIMM Slot',
      fact: 'RAM sticks click into DIMM slots. A notch prevents backward insertion. DDR5 slots are not compatible with DDR4 sticks — the notch position is different.',
    },
    {
      title: 'Power Supply → 24-pin ATX',
      fact: 'The PSU powers the motherboard through the wide 24-pin ATX connector. It supplies 3.3V, 5V, and 12V rails to run every component on the board.',
    },
    {
      title: 'CPU Cooler → CPU (top)',
      fact: 'The CPU Cooler mounts directly on top of the CPU to draw heat away from the processor. Without it, a modern CPU would overheat and shut down in seconds.',
    },
  ],
  CircuitConnect_hard: [
    {
      title: 'NVMe SSD → M.2 Slot',
      fact: 'An NVMe SSD slides into the M.2 slot and uses the PCIe bus directly, reaching 7,000+ MB/s — over 10× faster than a SATA hard drive.',
    },
    {
      title: 'Thermal Paste → CPU IHS',
      fact: 'Thermal paste is applied to the CPU\'s IHS (Integrated Heat Spreader) before mounting the cooler. It fills microscopic air gaps that would otherwise trap heat.',
    },
    {
      title: 'Case Fan → Fan Header (4-pin)',
      fact: 'Case fans plug into 4-pin PWM Fan Headers on the motherboard. This lets the system automatically adjust fan speed based on temperature — quieter at idle.',
    },
    {
      title: 'Wi-Fi Card → PCIe x1 Slot',
      fact: 'Wi-Fi cards use the short PCIe x1 slot — not the long x16 slot reserved for GPUs. PCIe x1 provides 1 lane of bandwidth, enough for wireless speeds.',
    },
  ],
};

// ✅ Helper to get next level key
const getNextLevel = (currentLevel) => {
  if (currentLevel === 'easy') return 'medium';
  if (currentLevel === 'medium') return 'hard';
  return null; // Already on hard
};

// ✅ Helper to get level number
const getLevelNumber = (levelKey) => {
  if (levelKey === 'easy') return 1;
  if (levelKey === 'medium') return 2;
  if (levelKey === 'hard') return 3;
  return 1; // fallback
};

export default function CompletionScreen({ navigation, route }) {
  const gameId   = route?.params?.gameId   || '';
  const levelKey = route?.params?.levelKey || '';
 
  // ── Lesson picker ──────────────────────────────────────────────────────────
  let lessons;
  if (gameId === 'CircuitConnect') {
    lessons = LESSONS[`CircuitConnect_${levelKey}`] || LESSONS['CircuitConnect_easy'];
  } else if (gameId === 'BuildThePC') {
    lessons = LESSONS[`BuildThePC_${levelKey}`] || LESSONS['BuildThePC_medium'];
  } else if (gameId === 'DebugInterface') {
    lessons = LESSONS['DebugInterface'];
  } else {
    lessons = LESSONS['DebugInterface'];
  }
 
  // ── Level title for the "Learnings" heading ────────────────────────────────
  const levelName =
    levelKey === 'easy'   ? 'PC Assembly'       :
    levelKey === 'medium' ? 'Basic Setup'       :
    levelKey === 'hard'   ? 'Full Build'        :
    gameId   === 'DebugInterface' ? 'Debug the Interface' :
    gameId   === 'BuildThePC'     ? 'Build the PC'        :
    'Circuit Connect';
 
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Play completion sound when screen opens
  useEffect(() => {
    AudioManager.playComplete();
  }, []);

  // ✅ Button Handlers
  const handleNextLevel = () => {
    // ✅ SPECIAL CASE: BuildThePC hard → CircuitConnect LEVEL SELECT
    if (gameId === 'BuildThePC' && levelKey === 'hard') {
      navigation.navigate('CircuitConnect');
      return;
    }
    
    const nextLevel = getNextLevel(levelKey);
    if (nextLevel) {
      if (gameId === 'BuildThePC') {
        navigation.navigate('BuildThePC', { 
          screen: 'PCGame', 
          params: { levelKey: nextLevel } 
        });
      } else if (gameId === 'CircuitConnect') {
        navigation.navigate('CircuitConnect', { 
          screen: 'CircuitGame', 
          params: { levelKey: nextLevel } 
        });
      } else if (gameId === 'DebugInterface') {
        navigation.navigate('Menu');
      }
    } else {
      navigation.navigate('Menu');
    }
  };

  const handlePlayAgain = () => {
    if (gameId === 'BuildThePC') {
      navigation.navigate('BuildThePC', { 
        screen: 'PCGame', 
        params: { levelKey, reset: true } 
      });
    } else if (gameId === 'CircuitConnect') {
      navigation.navigate('CircuitConnect', { 
        screen: 'CircuitGame', 
        params: { levelKey, reset: true } 
      });
    } else if (gameId === 'DebugInterface') {
      navigation.navigate('DebugInterface', { reset: true });
    }
  };

  const handleHome = () => {
    navigation.navigate('Menu');
  };

  // ✅ Determine button text and level display
  const isBuildThePCHard = gameId === 'BuildThePC' && levelKey === 'hard';
  const nextButtonText = isBuildThePCHard ? 'Next Mission →' : (getNextLevel(levelKey) ? 'Next Level →' : 'Back to Menu 🏠');
  const levelNumber = getLevelNumber(levelKey); // ✅ Dynamic level number

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.decorCircle} />
      <Animated.Text style={[styles.trophy, { transform: [{ scale: scaleAnim }] }]}>
        🎉
      </Animated.Text>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>SYSTEM</Text>
        <Text style={styles.title}>RESTORED!</Text>
        {/* ✅ DYNAMIC LEVEL NUMBER */}
        <Text style={styles.subtitle}>Level {levelNumber} — Complete ✅</Text>
      </Animated.View>

      <Animated.View style={[styles.dykSection, { opacity: fadeAnim }]}>
        <View style={styles.dykBadge}>
          <Text style={styles.dykBadgeText}>💡 DID YOU KNOW?</Text>
        </View>
        <Text style={styles.dykTitle}>
          {gameId === 'DebugInterface' ? 'Debug the Interface' :
           gameId === 'BuildThePC' ? `Build the PC — ${levelName}` : 'Circuit Connect'} Learnings
        </Text>
        <Text style={styles.dykSub}>Swipe to reveal what you've learned.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}>
          {lessons.map((lesson, i) => (
            <View key={i} style={styles.lessonCard}>
              <Text style={styles.lessonIcon}>{lesson.icon}</Text>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonFact}>{lesson.fact}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        {/* ✅ Next Level / Next Mission Button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNextLevel}>
          <Text style={styles.primaryBtnText}>{nextButtonText}</Text>
        </TouchableOpacity>
        
        {/* ✅ Play Again Button */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePlayAgain}>
          <Text style={styles.secondaryBtnText}>↺  Play Again</Text>
        </TouchableOpacity>
        
        {/* ✅ Home Button */}
        <TouchableOpacity style={styles.homeBtn} onPress={handleHome}>
          <Text style={styles.primaryBtnText}>🏠  Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    alignItems: 'center', paddingTop: 60,
    paddingBottom: 40, paddingHorizontal: 24,
  },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: theme.colors.primary, opacity: 0.2,
  },
  trophy: { fontSize: 80, marginBottom: 16 },
  title: {
    fontSize: 42, fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: 4, textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.body, color: theme.colors.textLight,
    marginTop: 8, marginBottom: 32, textAlign: 'center',
  },
  dykSection: { width: '100%', alignItems: 'center', marginBottom: 32 },
  dykBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 12,
  },
  dykBadgeText: { fontWeight: '700', fontSize: 12, color: theme.colors.text },
  dykTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  dykSub: {
    fontSize: theme.fonts.small, color: theme.colors.textLight,
    marginTop: 4, marginBottom: 16,
  },
  cardsRow: { paddingHorizontal: 4, gap: 12 },
  lessonCard: {
    backgroundColor: theme.colors.white, borderRadius: theme.radius.md,
    padding: 16, width: 160, elevation: 3,
  },
  lessonIcon: { fontSize: 28, marginBottom: 8 },
  lessonTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  lessonFact: { fontSize: 11, color: theme.colors.textLight, lineHeight: 16 },
  buttons: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center', elevation: 3,
  },
  primaryBtnText: { color: theme.colors.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: theme.colors.white, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.primary, elevation: 2,
  },
  secondaryBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
  homeBtn: {
    backgroundColor: theme.colors.primaryDark, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center', elevation: 3,
  },
});