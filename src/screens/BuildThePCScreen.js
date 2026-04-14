import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Alert, ScrollView, Image, Modal, SafeAreaView, Platform, ImageBackground
} from 'react-native';
import InGameMenu from '../components/InGameMenu';

const { width: SCREEN_W } = Dimensions.get('window');

const BOARD_W = SCREEN_W * 0.94;
const BOARD_H = BOARD_W / 0.65;
const IO_W = BOARD_W * 0.17;

// ── ASSET MAPPING ──────────────────────────────────────────────────────────
const PART_IMAGES = {
  ioSlot:     require('../assets/images/io_interface.png'),
  cpuSlot:    require('../assets/images/cpu_processor.png'),
  ramSlot:    require('../assets/images/ram_module.png'),
  pwrSlot:    require('../assets/images/pwr_connector.png'),
  pciEx1:     require('../assets/images/pcie_x1.png'),
  pciEx4:     require('../assets/images/pcie_x4.png'),
  pciEx8:     require('../assets/images/pcie_x8.png'),
  pciEx16:    require('../assets/images/pcie_x16.png'),
  pciLegacy:  require('../assets/images/pci_legacy.png'),
  pchSlot:    require('../assets/images/pch_chipset.png'),
  sataSlot:   require('../assets/images/sata_ports.png'),
  cmosSlot:   require('../assets/images/cmos_battery.png'),
};

// ── PARTS DATA ─────────────────────────────────────────────────────────────
const PARTS = [
  { id: 'IO',    label: 'I/O Interfaces', type: 'IO',   imgKey: 'ioSlot',    desc: 'Input/Output ports for connecting external peripherals.' },
  { id: 'CPU',   label: 'CPU Socket',     type: 'CPU',  imgKey: 'cpuSlot',   desc: 'The socket where the processor is installed.' },
  { id: 'MEM1',  label: 'Memory Slot 1',  type: 'RAM',  imgKey: 'ramSlot',   desc: 'RAM slot for high-speed temporary data storage.' },
  { id: 'MEM2',  label: 'Memory Slot 2',  type: 'RAM',  imgKey: 'ramSlot',   desc: 'Secondary RAM slot for dual-channel performance.' },
  { id: 'MEM3',  label: 'Memory Slot 3',  type: 'RAM',  imgKey: 'ramSlot',   desc: 'Expansion slot for additional system memory.' },
  { id: 'MEM4',  label: 'Memory Slot 4',  type: 'RAM',  imgKey: 'ramSlot',   desc: 'Final RAM slot for maximum memory capacity.' },
  { id: 'PWR',   label: 'ATX Power',      type: 'PWR',  imgKey: 'pwrSlot',   desc: 'The main 24-pin power connection to the board.' },
  { id: 'PX1_1', label: 'PCIe x1',        type: 'PX1',  imgKey: 'pciEx1',    desc: 'Small expansion slot for low-bandwidth cards.' },
  { id: 'PX16',  label: 'PCIe x16',       type: 'PX16', imgKey: 'pciEx16',   desc: 'High-speed interface primarily used for GPUs.' },
  { id: 'PX1_2', label: 'PCIe x1',        type: 'PX1',  imgKey: 'pciEx1',    desc: 'Secondary PCIe x1 expansion slot.' },
  { id: 'PX4',   label: 'PCIe x4',        type: 'PX4',  imgKey: 'pciEx4',    desc: 'Slot for medium-speed devices like RAID cards.' },
  { id: 'PX8',   label: 'PCIe x8',        type: 'PX8',  imgKey: 'pciEx8',    desc: 'Versatile slot for secondary graphics or network cards.' },
  { id: 'PCI1',  label: 'Legacy PCI 1',   type: 'LPCI', imgKey: 'pciLegacy', desc: 'Old bus standard for legacy expansion cards.' },
  { id: 'PCI2',  label: 'Legacy PCI 2',   type: 'LPCI', imgKey: 'pciLegacy', desc: 'Secondary slot for retro hardware compatibility.' },
  { id: 'PCH',   label: 'PCH Chipset',    type: 'PCH',  imgKey: 'pchSlot',   desc: 'Manages data between the CPU and peripherals.' },
  { id: 'SATA',  label: 'SATA Ports',     type: 'SATA', imgKey: 'sataSlot',  desc: 'Connectors for Hard Drives and SSDs.' },
  { id: 'CMOS',  label: 'CMOS Battery',   type: 'CMOS', imgKey: 'cmosSlot',  desc: 'Maintains BIOS settings and the system clock.' },
];

const SLOT_REQUIREMENTS = {
  ioSlot:   'IO',   cpuSlot: 'CPU',  pwrSlot: 'PWR',
  pciEx16:  'PX16', pciEx4:  'PX4',  pciEx8:  'PX8',
  pchSlot:  'PCH',  sataSlot:'SATA', cmosSlot:'CMOS',
  mem1Slot: 'RAM',  mem2Slot:'RAM',  mem3Slot:'RAM',  mem4Slot:'RAM',
  pciEx1_1: 'PX1',  pciEx1_2:'PX1',
  pciL1:    'LPCI', pciL2:   'LPCI',
};

export default function BuildThePCScreen({ navigation }) {
  const [placedParts, setPlacedParts]         = useState({});
  const [placedPartIds, setPlacedPartIds]     = useState([]);
  const [selectedPart, setSelectedPart]       = useState(null);
  const [showSpecs, setShowSpecs]             = useState(false);
  const [isInspectMode, setIsInspectMode]     = useState(false);
  const [showHint, setShowHint]               = useState(false);
  const [menuVisible, setMenuVisible]         = useState(false);

  // ── COMPLETION ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (placedPartIds.length === PARTS.length && PARTS.length > 0) {
      setTimeout(() => {
        navigation.navigate('Completion', { gameId: 'BuildThePC' });
      }, 600);
    }
  }, [placedPartIds]);

  const handleReset = () => {
    setPlacedParts({});
    setPlacedPartIds([]);
    setSelectedPart(null);
    setShowHint(false);
    setMenuVisible(false);
  };

  const handlePartSelect = (part) => {
    if (placedPartIds.includes(part.id)) return;
    setSelectedPart(part);
  };

  const handleSlotPress = (slotName, label) => {
    if (isInspectMode) {
      Alert.alert('Identification', `Target Slot: ${label}`);
      setIsInspectMode(false);
      return;
    }
    if (!selectedPart) return;
    if (selectedPart.type !== SLOT_REQUIREMENTS[slotName]) {
      Alert.alert('Incompatibility', 'Physical dimensions do not match this slot.');
      return;
    }
    if (placedParts[slotName]) return;

    setPlacedParts(prev => ({ ...prev, [slotName]: selectedPart.imgKey }));
    setPlacedPartIds(prev => [...prev, selectedPart.id]);
    setSelectedPart(null);
    setShowHint(false);
  };

  // ── SLOT RENDERER (inside ImageBackground) ────────────────────────────
  const renderSlot = (slotName, style, label) => {
    const imgKey   = placedParts[slotName];
    const isPlaced = !!imgKey;
    const isHinted = showHint && selectedPart &&
      selectedPart.type === SLOT_REQUIREMENTS[slotName];
    return (
      <TouchableOpacity
        style={[
          styles.slotBase, style,
          isPlaced && styles.slotFilled,
          isHinted && styles.slotHintGlow,
        ]}
        onPress={() => handleSlotPress(slotName, label)}
        activeOpacity={0.8}
      >
        {isPlaced && (
          <View style={styles.imageContainer}>
            <Image
              source={PART_IMAGES[imgKey]}
              style={styles.placedImage}
              resizeMode="stretch"
            />
            <View style={styles.labelOverlay}>
              <Text style={styles.slotTextFilled}>{label}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── I/O SLOT RENDERER (outside ImageBackground) ───────────────────────
  const renderIOSlot = () => {
    const imgKey   = placedParts['ioSlot'];
    const isPlaced = !!imgKey;
    const isHinted = showHint && selectedPart &&
      selectedPart.type === SLOT_REQUIREMENTS['ioSlot'];
    return (
      <TouchableOpacity
        style={[
          styles.ioSlotOuter,
          isPlaced && styles.slotFilled,
          isHinted && styles.slotHintGlow,
        ]}
        onPress={() => handleSlotPress('ioSlot', 'I/O')}
        activeOpacity={0.8}
      >
        {isPlaced && (
          <View style={styles.imageContainer}>
            <Image
              source={PART_IMAGES['ioSlot']}
              style={styles.placedImage}
              resizeMode="stretch"
            />
            <View style={styles.labelOverlay}>
              <Text style={styles.slotTextFilled}>I/O</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.backText}>← Build the PC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* ── SCROLL HINT BANNER ── */}
      <View style={styles.scrollHintBanner}>
        <Text style={styles.scrollHintText}>
          👇 Scroll down to see the parts inventory!
        </Text>
      </View>
        {/* ── BOARD ── */}
        <View style={styles.boardWrapper}>
          {renderIOSlot()}
          <ImageBackground
            source={require('../assets/images/motherboard_bg.png')}
            style={styles.motherboard}
            imageStyle={styles.motherboardImage}
          >
            {renderSlot('cpuSlot',  styles.cpuSlot,  'CPU')}
            {renderSlot('mem1Slot', styles.mem1Slot,  'RAM')}
            {renderSlot('mem2Slot', styles.mem2Slot,  'RAM')}
            {renderSlot('mem3Slot', styles.mem3Slot,  'RAM')}
            {renderSlot('mem4Slot', styles.mem4Slot,  'RAM')}
            {renderSlot('pwrSlot',  styles.pwrSlot,   'PWR')}
            {renderSlot('pciEx1_1', styles.pciX1_1,   'x1')}
            {renderSlot('pciEx16',  styles.pciX16,    'x16')}
            {renderSlot('pciEx1_2', styles.pciX1_2,   'x1')}
            {renderSlot('pciEx4',   styles.pciX4,     'x4')}
            {renderSlot('pciEx8',   styles.pciX8,     'x8')}
            {renderSlot('pciL1',    styles.pciL1,     'PCI')}
            {renderSlot('pciL2',    styles.pciL2,     'PCI')}
            {renderSlot('pchSlot',  styles.pchSlot,   'PCH')}
            {renderSlot('sataSlot', styles.sataSlot,  'SATA')}
            {renderSlot('cmosSlot', styles.cmosSlot,  'CMOS')}
          </ImageBackground>
        </View>

        {/* ── INVENTORY ── */}
        <View style={styles.inventoryContainer}>
          <Text style={styles.inventoryLabel}>INVENTORY</Text>
          <View style={styles.inventory}>
            {PARTS.map(part => (
              <TouchableOpacity
                key={part.id}
                style={[
                  styles.partCard,
                  placedPartIds.includes(part.id) && styles.partPlaced,
                  selectedPart?.id === part.id    && styles.partSelected,
                ]}
                onPress={() => handlePartSelect(part)}
                disabled={placedPartIds.includes(part.id)}
              >
                <Text style={{ fontSize: 20 }}>⚙️</Text>
                <Text style={styles.partLabel}>{part.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── FOOTER TOOLBAR ── */}
      <View style={styles.footerToolbar}>
        <TouchableOpacity onPress={() => setShowSpecs(true)} style={styles.toolBtn}>
          <Text style={{ fontSize: 24 }}>📋</Text>
          <Text style={styles.toolBtnLabel}>Specs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowHint(!showHint)}
          style={styles.toolBtn}
        >
          <Text style={{ fontSize: 24, opacity: showHint ? 1 : 0.5 }}>💡</Text>
          <Text style={styles.toolBtnLabel}>Hint</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsInspectMode(!isInspectMode)}
          style={styles.toolBtn}
        >
          <Text style={{ fontSize: 24, opacity: isInspectMode ? 1 : 0.5 }}>🔍</Text>
          <Text style={styles.toolBtnLabel}>Inspect</Text>
        </TouchableOpacity>
      </View>

      {/* ── IN-GAME MENU ── */}
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={handleReset}
        onHome={() => {
          setMenuVisible(false);
          navigation.navigate('Menu');
        }}
      />

      {/* ── SPECS MODAL ── */}
      <Modal visible={showSpecs} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Part Specifications</Text>
            <ScrollView style={{ marginBottom: 20 }}>
              {PARTS.map(p => (
                <View key={p.id} style={styles.specItem}>
                  <Text style={styles.specLabel}>{p.label}</Text>
                  <Text style={styles.specDesc}>{p.desc}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowSpecs(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#1A202C' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2D3748',
  },
  backBtn: {
    backgroundColor: '#4A5568',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  backText: { fontWeight: '600', color: '#FFFFFF', fontSize: 13 },
  menuBtn: {
    backgroundColor: '#4A5568',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  menuText: { fontWeight: '600', color: '#FFFFFF', fontSize: 13 },

  scrollContent: { paddingVertical: 20, alignItems: 'center' },
  // Banner 
    scrollHintBanner: {
    backgroundColor: '#F6AD55',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    width: BOARD_W,
    alignItems: 'center',
  },
  scrollHintText: {
    color: '#2D3748',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Board ──
  boardWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: BOARD_W + IO_W * 0.25,
  },
  ioSlotOuter: {
    width: IO_W,
    height: BOARD_H * 0.45,
    marginTop: BOARD_H * 0.01,
    marginRight: -(IO_W * 0.75),
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#4FD1C5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 209, 197, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  motherboard: {
    width: BOARD_W,
    aspectRatio: 0.65,
    backgroundColor: '#1B4D3E',
    borderWidth: 2,
    borderColor: '#0F2E25',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1,
  },
  motherboardImage: { resizeMode: 'stretch' },

  // ── Slots ──
  slotBase: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#4FD1C5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 209, 197, 0.05)',
  },
  slotFilled:   { borderWidth: 0, backgroundColor: 'transparent' },
  slotHintGlow: { borderColor: '#FFFFFF', borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  imageContainer: { width: '100%', height: '100%' },
  placedImage:    { width: '100%', height: '100%' },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  slotTextFilled: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', textAlign: 'center' },

  // ── Inventory ──
  inventoryContainer: { width: '100%', padding: 15, marginTop: 20 },
  inventoryLabel: {
    fontSize: 12, color: '#E2E8F0',
    letterSpacing: 2, textAlign: 'center', marginBottom: 10,
  },
  inventory: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  partCard: {
    backgroundColor: '#FFFFFF', borderRadius: 8,
    padding: 8, width: SCREEN_W * 0.22, alignItems: 'center',
  },
  partPlaced:   { opacity: 0.3 },
  partSelected: { borderColor: '#3182CE', borderWidth: 2 },
  partLabel: {
    fontSize: 8, color: '#2D3748',
    textAlign: 'center', fontWeight: 'bold', marginTop: 4,
  },

  // ── Footer toolbar ──
  footerToolbar: {
    height: 66,
    backgroundColor: '#4299E1',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: Platform.OS === 'android' ? 32 : 16,
  },
  toolBtn: {
    padding: 6,
    alignItems: 'center',
  },
  toolBtnLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // ── Specs modal ──
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: '#2D3748', borderRadius: 15,
    padding: 20, maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFF', fontSize: 20,
    fontWeight: 'bold', marginBottom: 15, textAlign: 'center',
  },
  specItem: {
    marginBottom: 12, borderBottomWidth: 1,
    borderBottomColor: '#4A5568', paddingBottom: 8,
  },
  specLabel: { color: '#4FD1C5', fontSize: 14, fontWeight: 'bold' },
  specDesc:  { color: '#E2E8F0', fontSize: 11, marginTop: 2 },
  closeBtn: {
    backgroundColor: '#E53E3E', padding: 12,
    borderRadius: 8, alignItems: 'center',
  },

  // ── Slot positions (unchanged) ──
  cpuSlot:  { top: '12%', left: '27%', width: '28%', height: '22%' },
  
  mem1Slot: { top: '6%',  left: '65%', width: '4%',  height: '45%' },
  mem2Slot: { top: '6%',  left: '71%', width: '4%',  height: '45%' },
  mem3Slot: { top: '6%',  left: '77%', width: '4%',  height: '45%' },
  mem4Slot: { top: '6%',  left: '83%', width: '4%',  height: '45%' },
  
  pwrSlot:  { top: '12%',  left: '94%', width: '6%',  height: '18%' },
  
  pciX1_1:  { top: '48%', left: '8%',  width: '10%', height: '4%' },
  pciX16:   { top: '55%', left: '8%',  width: '45%', height: '4%' },
  pciX1_2:  { top: '62%', left: '8%',  width: '10%', height: '4%' },
  pciX4:    { top: '69%', left: '8%',  width: '20%', height: '4%' },
  pciX8:    { top: '76%', left: '8%',  width: '32%', height: '4%' },
  pciL1:    { top: '83%', left: '8%',  width: '50%', height: '4%' },
  pciL2:    { top: '90%', left: '8%',  width: '50%', height: '4%' },
  
  pchSlot:  { top: '58%', left: '59%', width: '28%', height: '22%' },
  sataSlot: { top: '69%', left: '93%', width: '7%',  height: '15%' },
  cmosSlot: { top: '86%', left: '89%', width: '10%', height: '7%', borderRadius: 100 },
});