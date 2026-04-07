import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, 
  Alert, ScrollView, Image, Modal, SafeAreaView, Platform
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ── ASSET MAPPING ──────────────────────────────────────────────────────────
const PART_IMAGES = {
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
};

// ── PARTS DATA ─────────────────────────────────────────────────────────────
const PARTS = [
  { id: 'IO',    label: 'I/O Interfaces',   type: 'IO',    imgKey: 'ioSlot', desc: 'Input/Output ports for connecting external peripherals.' },
  { id: 'CPU',   label: 'CPU Socket',       type: 'CPU',   imgKey: 'cpuSlot', desc: 'The socket where the processor is installed.' },
  { id: 'MEM1',  label: 'Memory Slot 1',    type: 'RAM',   imgKey: 'ramSlot', desc: 'RAM slot for high-speed temporary data storage.' },
  { id: 'MEM2',  label: 'Memory Slot 2',    type: 'RAM',   imgKey: 'ramSlot', desc: 'Secondary RAM slot for dual-channel performance.' },
  { id: 'MEM3',  label: 'Memory Slot 3',    type: 'RAM',   imgKey: 'ramSlot', desc: 'Expansion slot for additional system memory.' },
  { id: 'MEM4',  label: 'Memory Slot 4',    type: 'RAM',   imgKey: 'ramSlot', desc: 'Final RAM slot for maximum memory capacity.' },
  { id: 'PWR',   label: 'ATX Power',        type: 'PWR',   imgKey: 'pwrSlot', desc: 'The main 24-pin power connection to the board.' },
  { id: 'PX1_1', label: 'PCIe x1',          type: 'PX1',   imgKey: 'pciEx1', desc: 'Small expansion slot for low-bandwidth cards.' },
  { id: 'PX16',  label: 'PCIe x16',         type: 'PX16',  imgKey: 'pciEx16', desc: 'High-speed interface primarily used for GPUs.' },
  { id: 'PX1_2', label: 'PCIe x1',          type: 'PX1',   imgKey: 'pciEx1', desc: 'Secondary PCIe x1 expansion slot.' },
  { id: 'PX4',   label: 'PCIe x4',          type: 'PX4',   imgKey: 'pciEx4', desc: 'Slot for medium-speed devices like RAID cards.' },
  { id: 'PX8',   label: 'PCIe x8',          type: 'PX8',   imgKey: 'pciEx8', desc: 'Versatile slot for secondary graphics or network cards.' },
  { id: 'PCI1',  label: 'Legacy PCI 1',     type: 'LPCI',  imgKey: 'pciLegacy', desc: 'Old bus standard for legacy expansion cards.' },
  { id: 'PCI2',  label: 'Legacy PCI 2',     type: 'LPCI',  imgKey: 'pciLegacy', desc: 'Secondary slot for retro hardware compatibility.' },
  { id: 'PCH',   label: 'PCH Chipset',      type: 'PCH',   imgKey: 'pchSlot', desc: 'Manages data between the CPU and peripherals.' },
  { id: 'SATA',  label: 'SATA Ports',       type: 'SATA',  imgKey: 'sataSlot', desc: 'Connectors for Hard Drives and SSDs.' },
  { id: 'CMOS',  label: 'CMOS Battery',     type: 'CMOS',  imgKey: 'cmosSlot', desc: 'Maintains BIOS settings and the system clock.' }
];

const SLOT_REQUIREMENTS = {
  ioSlot: 'IO', cpuSlot: 'CPU', pwrSlot: 'PWR', pciEx16: 'PX16', 
  pciEx4: 'PX4', pciEx8: 'PX8', pchSlot: 'PCH', sataSlot: 'SATA', cmosSlot: 'CMOS',
  mem1Slot: 'RAM', mem2Slot: 'RAM', mem3Slot: 'RAM', mem4Slot: 'RAM',
  pciEx1_1: 'PX1', pciEx1_2: 'PX1',
  pciL1: 'LPCI', pciL2: 'LPCI'
};

export default function BuildThePCScreen({ navigation }) {
  const [placedParts, setPlacedParts] = useState({});
  const [placedPartIds, setPlacedPartIds] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // ── RE-INTEGRATED COMPLETION LOGIC ──────────────────────────────────────
  useEffect(() => {
    // Only triggers when the number of placed unique IDs matches the parts list
    if (placedPartIds.length === PARTS.length && PARTS.length > 0) {
      Alert.alert(
        "Level Complete!", 
        "You've successfully assembled the hardware.",
        [{ text: "Next Stage", onPress: () => navigation.navigate('CircuitConnect') }]
      );
    }
  }, [placedPartIds]);

  const handlePartSelect = (part) => {
    if (placedPartIds.includes(part.id)) return;
    setSelectedPart(part);
  };

  const handleSlotPress = (slotName, label) => {
    if (isInspectMode) {
      Alert.alert("Identification", `Target Slot: ${label}`);
      setIsInspectMode(false);
      return;
    }
    if (!selectedPart) return;
    
    if (selectedPart.type === SLOT_REQUIREMENTS[slotName]) {
      if (placedParts[slotName]) return;
      
      const newPlaced = { ...placedParts, [slotName]: selectedPart.imgKey };
      const newIds = [...placedPartIds, selectedPart.id];
      
      setPlacedParts(newPlaced);
      setPlacedPartIds(newIds);
      setSelectedPart(null);
      setShowHint(false);
    } else {
      Alert.alert("Incompatibility", "Physical dimensions do not match this slot.");
    }
  };

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
          <View style={styles.imageContainer}>
            <Image source={PART_IMAGES[imgKey]} style={styles.placedImage} resizeMode="stretch" />
            <View style={styles.labelOverlay}>
               <Text style={styles.slotTextFilled}>{label}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Assemble the Hardware</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.motherboard}>
            {renderSlot('ioSlot', styles.ioSlot, 'I/O')}
            {renderSlot('cpuSlot', styles.cpuSlot, 'CPU')}
            {renderSlot('mem1Slot', styles.mem1Slot, 'RAM')}
            {renderSlot('mem2Slot', styles.mem2Slot, 'RAM')}
            {renderSlot('mem3Slot', styles.mem3Slot, 'RAM')}
            {renderSlot('mem4Slot', styles.mem4Slot, 'RAM')}
            {renderSlot('pwrSlot', styles.pwrSlot, 'PWR')}
            {renderSlot('pciEx1_1', styles.pciX1_1, 'x1')}
            {renderSlot('pciEx16',  styles.pciX16,  'x16')}
            {renderSlot('pciEx1_2', styles.pciX1_2, 'x1')}
            {renderSlot('pciEx4',   styles.pciX4,   'x4')}
            {renderSlot('pciEx8',   styles.pciX8,   'x8')}
            {renderSlot('pciL1',    styles.pciL1,   'PCI')}
            {renderSlot('pciL2',    styles.pciL2,   'PCI')}
            {renderSlot('pchSlot', styles.pchSlot, 'PCH')}
            {renderSlot('sataSlot', styles.sataSlot, 'SATA')}
            {renderSlot('cmosSlot', styles.cmosSlot, 'CMOS')}
          </View>

          <View style={styles.inventoryContainer}>
            <Text style={styles.inventoryLabel}>INVENTORY</Text>
            <View style={styles.inventory}>
              {PARTS.map(part => (
                <TouchableOpacity
                  key={part.id}
                  style={[styles.partCard, placedPartIds.includes(part.id) && styles.partPlaced, selectedPart?.id === part.id && styles.partSelected]}
                  onPress={() => handlePartSelect(part)}
                  disabled={placedPartIds.includes(part.id)}
                >
                  <Text style={{fontSize: 20}}>⚙️</Text>
                  <Text style={styles.partLabel}>{part.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
      </ScrollView>

      {/* FOOTER TOOLBAR */}
      <View style={styles.footerToolbar}>
        <TouchableOpacity onPress={() => setShowSpecs(true)} style={styles.toolBtn}>
          <Text style={{fontSize: 30}}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHint(!showHint)} style={styles.toolBtn}>
          <Text style={{fontSize: 30, opacity: showHint ? 1 : 0.5}}>💡</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsInspectMode(!isInspectMode)} style={styles.toolBtn}>
          <Text style={{fontSize: 30, opacity: isInspectMode ? 1 : 0.5}}>🔍</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSpecs} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Part Specifications</Text>
            <ScrollView style={{marginBottom: 20}}>
              {PARTS.map(p => (
                <View key={p.id} style={styles.specItem}>
                  <Text style={styles.specLabel}>{p.label}</Text>
                  <Text style={styles.specDesc}>{p.desc}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSpecs(false)} style={styles.closeBtn}>
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#1A202C' },
  header: { padding: 15, backgroundColor: '#2D3748', alignItems: 'center' },
  title: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' },
  scrollContent: { paddingVertical: 20, alignItems: 'center' },
  motherboard: {
    width: SCREEN_W * 0.94, aspectRatio: 0.65, 
    backgroundColor: '#1B4D3E', borderWidth: 2, borderColor: '#0F2E25', borderRadius: 8,
  },
  slotBase: {
    position: 'absolute', borderWidth: 1, borderColor: '#4FD1C5', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(79, 209, 197, 0.05)',
  },
  slotFilled: { borderWidth: 0, backgroundColor: 'transparent' },
  slotHintGlow: { borderColor: '#FFFFFF', borderWidth: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  imageContainer: { width: '100%', height: '100%' },
  placedImage: { width: '100%', height: '100%' },
  labelOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  slotTextFilled: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  
  inventoryContainer: { width: '100%', padding: 15, marginTop: 20 },
  inventoryLabel: { fontSize: 12, color: '#E2E8F0', letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  inventory: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  partCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, width: SCREEN_W * 0.22, alignItems: 'center' },
  partPlaced: { opacity: 0.3 },
  partSelected: { borderColor: '#3182CE', borderWidth: 2 },
  partLabel: { fontSize: 8, color: '#2D3748', textAlign: 'center', fontWeight: 'bold', marginTop: 4 },

  footerToolbar: { 
    height: 70, 
    backgroundColor: '#4299E1', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: Platform.OS === 'android' ? 25 : 10 
  },
  toolBtn: { padding: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#2D3748', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  specItem: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#4A5568', paddingBottom: 8 },
  specLabel: { color: '#4FD1C5', fontSize: 14, fontWeight: 'bold' },
  specDesc: { color: '#E2E8F0', fontSize: 11, marginTop: 2 },
  closeBtn: { backgroundColor: '#E53E3E', padding: 12, borderRadius: 8, alignItems: 'center' },

  // Positioning
  ioSlot:   { top: '5%',  left: '2%',  width: '12%', height: '35%' },
  cpuSlot:  { top: '12%', left: '18%', width: '28%', height: '22%' },
  mem1Slot: { top: '6%',  left: '52%', width: '4%',  height: '35%' },
  mem2Slot: { top: '6%',  left: '58%', width: '4%',  height: '35%' },
  mem3Slot: { top: '6%',  left: '64%', width: '4%',  height: '35%' },
  mem4Slot: { top: '6%',  left: '70%', width: '4%',  height: '35%' },
  pwrSlot:  { top: '4%',  left: '91%', width: '8%', height: '12%' },
  pciX1_1: { top: '42%', left: '5%', width: '10%', height: '5%' },
  pciX16:  { top: '50%', left: '5%', width: '45%', height: '5%' },
  pciX1_2: { top: '58%', left: '5%', width: '10%', height: '5%' },
  pciX4:   { top: '66%', left: '5%', width: '20%', height: '5%' },
  pciX8:   { top: '74%', left: '5%', width: '32%', height: '5%' },
  pciL1:   { top: '82%', left: '5%', width: '50%', height: '5%' },
  pciL2:   { top: '90%', left: '5%', width: '50%', height: '5%' },
  pchSlot:  { top: '53%', left: '55%', width: '28%', height: '22%' },
  sataSlot: { top: '72%', left: '95%', width: '4%',  height: '9%' },
  cmosSlot: { top: '91%', left: '89%', width: '10%', height: '7%', borderRadius: 100 },
});