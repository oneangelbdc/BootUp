import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Alert, ScrollView, Image, Modal, SafeAreaView, Platform, ImageBackground, Animated, BackHandler // ✅ Added BackHandler
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../styles/theme';
import InGameMenu from '../components/InGameMenu';
import AudioManager from '../utils/AudioManager';

const { width: SCREEN_W } = Dimensions.get('window');
const BOARD_W = SCREEN_W * 0.94;
const BOARD_H = BOARD_W / 0.65;
const IO_W = BOARD_W * 0.17;

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PART_IMAGES = {
  // Hard Level (Motherboard)
  ioSlot: require('../assets/images/io_interface.png'),
  cpuSlot: require('../assets/images/cpu_processor.png'),
  ramSlot: require('../assets/images/ram_module.png'),
  pwrSlot: require('../assets/images/pwr_connector.png'),
  pciEx1: require('../assets/images/pcie_x1.png'),
  pciEx4: require('../assets/images/pcie_x4.png'),
  pciEx8: require('../assets/images/pcie_x8.png'),
  pciEx16: require('../assets/images/pcie_x16.png'),
  pciLegacy: require('../assets/images/pci_legacy.png'),
  pchSlot: require('../assets/images/pch_chipset.png'),
  sataSlot: require('../assets/images/sata_ports.png'),
  cmosSlot: require('../assets/images/cmos_battery.png'),
  
  // Medium Level (Old Easy)
  easyCpuInv: require('../assets/images/easy_cpu_inventory.png'),
  easyRamInv: require('../assets/images/easy_ram_inventory.png'),
  easyPciInv: require('../assets/images/easy_pci_inventory.png'),
  easyCpuPlaced: require('../assets/images/easy_cpu_placed.png'),
  easyRamPlaced: require('../assets/images/easy_ram_placed.png'),
  easyPciPlaced: require('../assets/images/easy_pci_placed.png'),
  
  // New Easy Level (PC Case)
  pcMbInv: require('../assets/images/pc_mb_inventory.png'),
  pcMbPlaced: require('../assets/images/pc_mb_placed.png'),
  pcPsuInv: require('../assets/images/pc_psu_inventory.png'),
  pcPsuPlaced: require('../assets/images/pc_psu_placed.png'),
  pcDdInv: require('../assets/images/pc_dd_inventory.png'),
  pcDdPlaced: require('../assets/images/pc_dd_placed.png'),
};

// ✅ NEW: Toolbar Icon Images
const TOOLBAR_ICONS = {
  specs: require('../assets/images/icon-clipboard.png'),   // Replace with your actual path
  hint: require('../assets/images/icon-lightbulb.png'),    // Replace with your actual path
  inspect: require('../assets/images/icon-magnifying-glass.png') // Replace with your actual path
};

const HARD_PARTS = [
  { id: 'IO', label: 'I/O Interfaces', type: 'IO', imgKey: 'ioSlot', desc: 'Input/Output ports for peripherals.' },
  { id: 'CPU', label: 'CPU Socket', type: 'CPU', imgKey: 'cpuSlot', desc: 'Processor socket.' },
  { id: 'MEM1', label: 'Memory Slot 1', type: 'RAM', imgKey: 'ramSlot', desc: 'RAM slot.' },
  { id: 'MEM2', label: 'Memory Slot 2', type: 'RAM', imgKey: 'ramSlot', desc: 'RAM slot.' },
  { id: 'MEM3', label: 'Memory Slot 3', type: 'RAM', imgKey: 'ramSlot', desc: 'RAM slot.' },
  { id: 'MEM4', label: 'Memory Slot 4', type: 'RAM', imgKey: 'ramSlot', desc: 'RAM slot.' },
  { id: 'PWR', label: 'ATX Power', type: 'PWR', imgKey: 'pwrSlot', desc: 'Main power connector.' },
  { id: 'PX1_1', label: 'PCIe x1', type: 'PX1', imgKey: 'pciEx1', desc: 'Small expansion slot.' },
  { id: 'PX16', label: 'PCIe x16', type: 'PX16', imgKey: 'pciEx16', desc: 'GPU interface.' },
  { id: 'PX1_2', label: 'PCIe x1', type: 'PX1', imgKey: 'pciEx1', desc: 'Secondary x1 slot.' },
  { id: 'PX4', label: 'PCIe x4', type: 'PX4', imgKey: 'pciEx4', desc: 'Medium speed slot.' },
  { id: 'PX8', label: 'PCIe x8', type: 'PX8', imgKey: 'pciEx8', desc: 'Secondary GPU slot.' },
  { id: 'PCI1', label: 'Legacy PCI 1', type: 'LPCI', imgKey: 'pciLegacy', desc: 'Old bus standard.' },
  { id: 'PCI2', label: 'Legacy PCI 2', type: 'LPCI', imgKey: 'pciLegacy', desc: 'Old bus standard.' },
  { id: 'PCH', label: 'PCH Chipset', type: 'PCH', imgKey: 'pchSlot', desc: 'Platform Controller Hub.' },
  { id: 'SATA', label: 'SATA Ports', type: 'SATA', imgKey: 'sataSlot', desc: 'Storage connectors.' },
  { id: 'CMOS', label: 'CMOS Battery', type: 'CMOS', imgKey: 'cmosSlot', desc: 'Maintains BIOS settings.' },
];

const MEDIUM_PARTS = [
  { id: 'CPU_E', label: 'CPU Processor', type: 'CPU', imgKey: 'easyCpuInv', placedImgKey: 'easyCpuPlaced', desc: 'The brain of the PC.' },
  { id: 'MEM_E', label: 'RAM Memory', type: 'RAM', imgKey: 'easyRamInv', placedImgKey: 'easyRamPlaced', desc: 'Short-term memory.' },
  { id: 'PCI_E', label: 'PCI Graphics', type: 'PCI', imgKey: 'easyPciInv', placedImgKey: 'easyPciPlaced', desc: 'Handles visuals.' },
];

const SLOT_REQUIREMENTS = {
  // New Easy
  mbSlot: 'MB', psuSlot: 'PSU', ddSlot: 'DD',
  // Medium
  easyCPU: 'CPU', easyRAM: 'RAM', easyPCI: 'PCI',
  // Hard
  ioSlot: 'IO', cpuSlot: 'CPU', pwrSlot: 'PWR', pciEx16: 'PX16', pciEx4: 'PX4', pciEx8: 'PX8',
  pchSlot: 'PCH', sataSlot: 'SATA', cmosSlot: 'CMOS', mem1Slot: 'RAM', mem2Slot: 'RAM',
  mem3Slot: 'RAM', mem4Slot: 'RAM', pciEx1_1: 'PX1', pciEx1_2: 'PX1', pciL1: 'LPCI', pciL2: 'LPCI',
};

// ────────────────────────────────────────────────────────────────────────────
// LEVEL CONFIGURATION (Restructured)
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = {
  easy: {
    key: 'easy',
    badge: 'EASY',
    title: 'PC Assembly',
    desc: 'Install the core components into the PC case.',
    stars: 1,
    badgeColor: '#2D6A0F',
    badgeBg: '#E3F5D5',
    accentColor: '#7DC952',
    parts: [
      { id: 'MB_E', label: 'Motherboard', type: 'MB', imgKey: 'pcMbInv', placedImgKey: 'pcMbPlaced', desc: 'Main circuit board.' },
      { id: 'PSU_E', label: 'Power Supply', type: 'PSU', imgKey: 'pcPsuInv', placedImgKey: 'pcPsuPlaced', desc: 'Provides power to all components.' },
      { id: 'DD_E', label: 'Disk Drive', type: 'DD', imgKey: 'pcDdInv', placedImgKey: 'pcDdPlaced', desc: 'Storage drive bay.' },
    ],
    hints: ['Start with the Motherboard!', 'Slot in the Power Supply.', 'Slide the Disk Drive into the bay.'],
  },
  medium: {
    key: 'medium',
    badge: 'MEDIUM',
    title: 'Basic Setup',
    desc: 'Build a simple PC with essential components. Perfect for beginners!',
    stars: 2,
    badgeColor: '#7A4508',
    badgeBg: '#FDE8C8',
    accentColor: '#E89020',
    parts: MEDIUM_PARTS,
    hints: ['Start with the CPU!', 'RAM goes next to it.', 'PCI handles visuals.'],
  },
  hard: {
    key: 'hard',
    badge: 'HARD',
    title: 'Full Build',
    desc: 'Assemble a complete motherboard with all standard components.',
    stars: 3,
    badgeColor: '#8B1F1F',
    badgeBg: '#FADFDF',
    accentColor: '#D94444',
    parts: HARD_PARTS,
    hints: ['I/O goes on the left.', 'CPU is in the center.', 'Match the slot types carefully.'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL SELECT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LevelSelectScreen({ navigation }) {
  return (
    <View style={ls.container}>
      <View style={ls.decorCircle} />
      <View style={ls.header}>
        <View>
          <Text style={ls.headerTitle}>Build The PC</Text>
          <Text style={ls.headerSub}>Choose your difficulty</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={ls.list} showsVerticalScrollIndicator={false}>
        {Object.values(LEVELS).map((lv) => (
          <LevelCard key={lv.key} level={lv} onPress={() => navigation.navigate('PCGame', { levelKey: lv.key })} />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function LevelCard({ level, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  const filledStars = '★'.repeat(level.stars);
  const emptyStars = '☆'.repeat(3 - level.stars);
  const chips = level.parts.slice(0, 3).map((p) => p.label);
  const extra = level.parts.length - 3;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={[ls.card, { borderColor: level.accentColor }]} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={[ls.cardBar, { backgroundColor: level.accentColor }]} />
        <View style={ls.cardBody}>
          <View style={ls.cardTop}>
            <View style={ls.cardTopLeft}>
              <View style={[ls.badge, { backgroundColor: level.badgeBg }]}>
                <Text style={[ls.badgeText, { color: level.badgeColor }]}>{level.badge}</Text>
              </View>
              <Text style={ls.cardTitle}>{level.title}</Text>
              <Text style={ls.stars}>
                <Text style={{ color: level.accentColor }}>{filledStars}</Text>
                <Text style={{ color: '#D3D1C7' }}>{emptyStars}</Text>
              </Text>
            </View>
            <View style={ls.arrowWrap}><Text style={[ls.arrow, { color: level.accentColor }]}>›</Text></View>
          </View>
          <Text style={ls.cardDesc}>{level.desc}</Text>
          <View style={ls.chipRow}>
            {chips.map((c, i) => (
              <View key={i} style={[ls.chip, { borderColor: level.accentColor }]}><Text style={[ls.chipText, { color: level.badgeColor }]}>{c}</Text></View>
            ))}
            {extra > 0 && (
              <View style={[ls.chip, { borderColor: level.accentColor }]}><Text style={[ls.chipText, { color: level.badgeColor }]}>+{extra} more</Text></View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function GameScreen({ navigation, route }) {
  const { levelKey } = route.params;
  const level = LEVELS[levelKey];
  const currentPartsList = level.parts;

  const isNewEasy = levelKey === 'easy';
  const isMedium = levelKey === 'medium';
  const isHard = levelKey === 'hard';

  const scrollRef = useRef(null);
  const [placedParts, setPlacedParts] = useState({});
  const [placedPartIds, setPlacedPartIds] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // ✅ RESET LISTENER
  useEffect(() => {
    if (route.params?.reset) {
      handleReset();
    }
  }, [route.params?.reset]);

  useEffect(() => {
    if (placedPartIds.length === currentPartsList.length && currentPartsList.length > 0) {
      setTimeout(() => { navigation.navigate('Completion', { gameId: 'BuildThePC', levelKey }); }, 600);
    }
  }, [placedPartIds]);

  const handleReset = () => {
    setPlacedParts({}); setPlacedPartIds([]); setSelectedPart(null); setShowHint(false); setMenuVisible(false);
  };

  const handlePartSelect = (part) => {
    if (placedPartIds.includes(part.id)) return;
    setSelectedPart(part);
  };

  const scrollToInventory = () => scrollRef.current?.scrollTo({ y: BOARD_H + 50, animated: true });
  const scrollToMotherboard = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const handleSlotPress = (slotName, label) => {
    if (isInspectMode) {
      Alert.alert('Identification', `Target Slot: ${label}`);
      setIsInspectMode(false);
      return;
    }
    if (!selectedPart) return;
    if (selectedPart.type !== SLOT_REQUIREMENTS[slotName]) {
      AudioManager.playWrong();
      Alert.alert('Incompatibility', 'Physical dimensions do not match this slot.');
      return;
    }
    if (placedParts[slotName]) return;

    const imageToUse = selectedPart.placedImgKey || selectedPart.imgKey;
    setPlacedParts(prev => ({ ...prev, [slotName]: imageToUse }));
    setPlacedPartIds(prev => [...prev, selectedPart.id]);
    setSelectedPart(null);
    setShowHint(false);
    AudioManager.playCorrect();
  };

  // ✅ Clean Empty Slots: No text badges, just dashed borders
  const renderSlot = (slotName, style, label) => {
    const imgKey = placedParts[slotName];
    const isPlaced = !!imgKey;
    const isHinted = showHint && selectedPart && selectedPart.type === SLOT_REQUIREMENTS[slotName];
    return (
      <TouchableOpacity
        style={[styles.slotBase, style, isPlaced && styles.slotFilled, isHinted && styles.slotHintGlow]}
        onPress={() => handleSlotPress(slotName, label)}
        activeOpacity={0.8}
      >
        {isPlaced && (
          <Image source={PART_IMAGES[imgKey]} style={styles.placedImage} resizeMode="stretch" />
        )}
      </TouchableOpacity>
    );
  };

  const renderIOSlot = () => {
    const imgKey = placedParts['ioSlot'];
    const isPlaced = !!imgKey;
    const isHinted = showHint && selectedPart && selectedPart.type === SLOT_REQUIREMENTS['ioSlot'];
    return (
      <TouchableOpacity
        style={[styles.ioSlotOuter, isPlaced && styles.slotFilled, isHinted && styles.slotHintGlow]}
        onPress={() => handleSlotPress('ioSlot', 'I/O')}
        activeOpacity={0.8}
      >
        {isPlaced && <Image source={PART_IMAGES['ioSlot']} style={styles.placedImage} resizeMode="stretch" />}
      </TouchableOpacity>
    );
  };

  // Background selection based on level
  const bgSource = isNewEasy
    ? require('../assets/images/pc_case_bg.png')
    : isMedium
    ? require('../assets/images/easy_motherboard.png')
    : require('../assets/images/motherboard_bg.png');

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.decorCircle} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to level selection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Progress Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, {
            backgroundColor: placedPartIds.length === currentPartsList.length ? '#1D9E75' : level.accentColor,
          }]} />
          <Text style={styles.statusText}>BUILD THE PC</Text>
        </View>
        <View style={[styles.levelPill, { backgroundColor: level.badgeBg }]}>
          <Text style={[styles.levelPillText, { color: level.badgeColor }]}>
            {level.badge}  {placedPartIds.length}/{currentPartsList.length}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.navBanner} onPress={scrollToInventory} activeOpacity={0.7}>
          <Text style={styles.navBannerText}>Go To Inventory ↓</Text>
        </TouchableOpacity>

        <View style={styles.boardWrapper}>
          {isHard && renderIOSlot()}
          <ImageBackground
            source={bgSource}
            style={[styles.motherboard, isNewEasy && styles.pcCaseStyle]}
            imageStyle={styles.motherboardImage}
          >
            {isNewEasy ? (
              <>
                {renderSlot('mbSlot', styles.mbSlotPos, 'Motherboard')}
                {renderSlot('psuSlot', styles.psuSlotPos, 'Power Supply')}
                {renderSlot('ddSlot', styles.ddSlotPos, 'Disk Drive')}
              </>
            ) : isMedium ? (
              <>
                {renderSlot('easyCPU', styles.easyCPUPos, 'CPU')}
                {renderSlot('easyRAM', styles.easyRAMPos, 'MEMORY')}
                {renderSlot('easyPCI', styles.easyPCIPos, 'PCI')}
              </>
            ) : (
              <>
                {renderSlot('cpuSlot', styles.cpuSlot, 'CPU')}
                {renderSlot('mem1Slot', styles.mem1Slot, 'RAM')}
                {renderSlot('mem2Slot', styles.mem2Slot, 'RAM')}
                {renderSlot('mem3Slot', styles.mem3Slot, 'RAM')}
                {renderSlot('mem4Slot', styles.mem4Slot, 'RAM')}
                {renderSlot('pwrSlot', styles.pwrSlot, 'PWR')}
                {renderSlot('pciEx1_1', styles.pciX1_1, 'x1')}
                {renderSlot('pciEx16', styles.pciX16, 'x16')}
                {renderSlot('pciEx1_2', styles.pciX1_2, 'x1')}
                {renderSlot('pciEx4', styles.pciX4, 'x4')}
                {renderSlot('pciEx8', styles.pciX8, 'x8')}
                {renderSlot('pciL1', styles.pciL1, 'PCI')}
                {renderSlot('pciL2', styles.pciL2, 'PCI')}
                {renderSlot('pchSlot', styles.pchSlot, 'PCH')}
                {renderSlot('sataSlot', styles.sataSlot, 'SATA')}
                {renderSlot('cmosSlot', styles.cmosSlot, 'CMOS')}
              </>
            )}
          </ImageBackground>
        </View>

        <View style={styles.inventoryContainer}>
          <Text style={styles.inventoryLabel}>INVENTORY</Text>
          <View style={styles.inventory}>
            {currentPartsList.map(part => (
              <TouchableOpacity
                key={part.id}
                style={[styles.partCard, placedPartIds.includes(part.id) && styles.partPlaced, selectedPart?.id === part.id && styles.partSelected]}
                onPress={() => handlePartSelect(part)}
                disabled={placedPartIds.includes(part.id)}
              >
                <Image source={PART_IMAGES[part.imgKey]} style={styles.inventoryImage} resizeMode="contain" />
                <Text style={styles.partLabel}>{part.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.navBanner, styles.bottomBanner]} onPress={scrollToMotherboard} activeOpacity={0.7}>
          <Text style={styles.navBannerText}>Back to Motherboard ↑</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footerToolbar}>
        {/* ✅ Specs Icon */}
        <TouchableOpacity onPress={() => setShowSpecs(true)} style={styles.toolBtn}>
          <Image source={TOOLBAR_ICONS.specs} style={{ width: 24, height: 24}} />
          <Text style={styles.toolBtnLabel}>Specs</Text>
        </TouchableOpacity>
        
        {/* ✅ Hint Icon */}
        <TouchableOpacity onPress={() => setShowHint(!showHint)} style={styles.toolBtn}>
          <Image 
            source={TOOLBAR_ICONS.hint} 
            style={{ width: 24, height: 24, opacity: showHint ? 1 : 0.5 }} 
          />
          <Text style={styles.toolBtnLabel}>Hint</Text>
        </TouchableOpacity>
        
        {/* ✅ Inspect Icon */}
        <TouchableOpacity onPress={() => setIsInspectMode(!isInspectMode)} style={styles.toolBtn}>
          <Image 
            source={TOOLBAR_ICONS.inspect} 
            style={{ width: 24, height: 24, opacity: isInspectMode ? 1 : 0.5 }} 
          />
          <Text style={styles.toolBtnLabel}>Inspect</Text>
        </TouchableOpacity>
      </View>

      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleReset}
      />

      <Modal visible={showSpecs} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Part Specifications</Text>
            <ScrollView style={{ marginBottom: 20 }}>
              {currentPartsList.map(p => (
                <View key={p.id} style={styles.specItem}>
                  <Text style={styles.specLabel}>{p.label}</Text>
                  <Text style={styles.specDesc}>{p.desc}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSpecs(false)} style={styles.closeBtn}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: theme.colors.background },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.primary, opacity: 0.12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  backBtn: { backgroundColor: theme.colors.white, padding: 10, borderRadius: theme.radius.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, marginTop: 15 },
  backText: { fontWeight: '700', color: theme.colors.text, fontSize: 13 },
  menuBtn: { backgroundColor: theme.colors.white, padding: 10, paddingHorizontal: 20, borderRadius: theme.radius.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, marginTop: 15 },
  menuText: { fontWeight: '700', color: theme.colors.text },

  // ✅ Status Bar Styles
  statusBar: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: theme.colors.white, marginHorizontal: 16, padding: 10, 
    borderRadius: theme.radius.sm, marginBottom: 6, elevation: 2, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.colors.text },
  levelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  levelPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  scrollContent: { paddingVertical: 20, alignItems: 'center' },
  boardWrapper: { flexDirection: 'row', alignItems: 'flex-start', width: BOARD_W + IO_W * 0.25 },
  ioSlotOuter: { width: IO_W, height: BOARD_H * 0.45, marginTop: BOARD_H * 0.01, marginRight: -(IO_W * 0.75), zIndex: 10, borderWidth: 2, borderColor: 'white', borderStyle: 'dashed', backgroundColor: 'rgba(79, 209, 197, 0.05)', borderRadius: 4, overflow: 'hidden' },
  motherboard: { width: BOARD_W, aspectRatio: 0.65, backgroundColor: '#1B4D3E', borderWidth: 2, borderColor: '#0F2E25', borderRadius: 8, overflow: 'hidden', zIndex: 1 },
  pcCaseStyle: { backgroundColor: '#2C3E50', borderColor: '#4A6572' }, // ✅ Style for new Easy PC background
  motherboardImage: { resizeMode: 'stretch' },
  slotBase: { position: 'absolute', borderWidth: 2, borderColor: 'white', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  slotFilled: { borderWidth: 0, backgroundColor: 'transparent' },
  slotHintGlow: { borderColor: 'yellow', borderWidth: 3 },
  placedImage: { width: '100%', height: '100%' },
  
  // ✅ New Easy Slot Positions
  mbSlotPos: { top: '25%', left: '6%', width: '45%', height: '45%' },
  psuSlotPos: { top: '73%', left: '6%', width: '45%', height: '20%' },
  ddSlotPos: { top: '8%', left: '6%', width: '45%', height: '15%' },
  
  // Medium Slot Positions
  easyCPUPos: { top: '23%', left: '62%', width: '27%', height: '27.5%' },
  easyRAMPos: { top: '10%', left: '9%', width: '19%', height: '45%' },
  easyPCIPos: { top: '59%', left: '38%', width: '55%', height: '16%' },
  
  // Hard Slot Positions
  cpuSlot: { top: '12%', left: '27%', width: '28%', height: '22%' },
  mem1Slot: { top: '6%', left: '65%', width: '4%', height: '45%' },
  mem2Slot: { top: '6%', left: '71%', width: '4%', height: '45%' },
  mem3Slot: { top: '6%', left: '77%', width: '4%', height: '45%' },
  mem4Slot: { top: '6%', left: '83%', width: '4%', height: '45%' },
  pwrSlot: { top: '12%', left: '94%', width: '6%', height: '18%' },
  pciX1_1: { top: '48%', left: '8%', width: '10%', height: '4%' },
  pciX16: { top: '55%', left: '8%', width: '45%', height: '4%' },
  pciX1_2: { top: '62%', left: '8%', width: '10%', height: '4%' },
  pciX4: { top: '69%', left: '8%', width: '20%', height: '4%' },
  pciX8: { top: '76%', left: '8%', width: '32%', height: '4%' },
  pciL1: { top: '83%', left: '8%', width: '50%', height: '4%' },
  pciL2: { top: '90%', left: '8%', width: '50%', height: '4%' },
  pchSlot: { top: '58%', left: '59%', width: '28%', height: '22%' },
  sataSlot: { top: '69%', left: '93%', width: '7%', height: '15%' },
  cmosSlot: { top: '86%', left: '89%', width: '10%', height: '7%', borderRadius: 100 },
  navBanner: { marginBottom: 5, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(66, 153, 225, 0.9)', borderRadius: 20, borderWidth: 1, borderColor: '#FFF' },
  bottomBanner: { marginTop: 10, marginBottom: 160 },
  navBannerText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  inventoryContainer: { width: '100%', padding: 15, marginTop: 10 },
  inventoryLabel: { fontSize: 12, color: '#000000', textAlign: 'center', marginBottom: 10 },
  inventory: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  partCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, width: SCREEN_W * 0.26, alignItems: 'center' },
  partPlaced: { opacity: 0.3 },
  partSelected: { borderColor: '#3182CE', borderWidth: 2 },
  inventoryImage: { width: '90%', height: 35, marginBottom: 6 },
  partLabel: { fontSize: 8, color: '#2D3748', textAlign: 'center', fontWeight: 'bold' },
  footerToolbar: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 30, left: 20, right: 20,
    height: 70, backgroundColor: '#4299E1', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65,
  },
  toolBtn: { padding: 6, alignItems: 'center' },
  toolBtnLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#2D3748', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  specItem: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#4A5568', paddingBottom: 8 },
  specLabel: { color: '#4FD1C5', fontSize: 14, fontWeight: 'bold' },
  specDesc: { color: '#E2E8F0', fontSize: 11, marginTop: 2 },
  closeBtn: { backgroundColor: '#E53E3E', padding: 12, borderRadius: 8, alignItems: 'center' },
});

const ls = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingTop: 50 },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.primary, opacity: 0.12,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  headerTitle: { fontSize: 33, fontWeight: '700', color: theme.colors.text, marginTop: -20},
  headerSub: { fontSize: 22, color: theme.colors.textLight, marginTop: 1 },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: theme.colors.white, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', overflow: 'hidden', elevation: 3, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardBar: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  stars: { fontSize: 14, letterSpacing: 2, marginBottom: 6 },
  pairsPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pairsText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: theme.colors.textLight, lineHeight: 18, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: '#E2DFD8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, color: theme.colors.textLight },
  arrowWrap: { justifyContent: 'center', paddingRight: 14 },
  arrow: { fontSize: 26, fontWeight: '300' },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
export default function BuildThePCScreen({ navigation }) {
  // ✅ HARDWARE BACK BUTTON: Intercepts Android back press and goes to Menu
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Menu');
        return true; // Prevents default Android behavior (exiting app)
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PCLevels">
        {(props) => (
          <LevelSelectScreen
            {...props}
            navigation={{
              ...props.navigation,
              navigate: (screen, params) => screen === 'Menu' ? navigation.navigate('Menu') : props.navigation.navigate(screen, params),
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PCGame">
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