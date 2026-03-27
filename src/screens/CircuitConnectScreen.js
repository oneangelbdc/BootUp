import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions, Alert
} from 'react-native';
import { theme } from '../styles/theme';
import PowerUpToolbar from '../components/PowerUpToolbar';
import InGameMenu from '../components/InGameMenu';

const { width, height } = Dimensions.get('window');

const DEVICES = [
  { id: 'monitor', label: 'Monitor', icon: '🖥️', x: 0.15, y: 0.15, connectsTo: 'tower' },
  { id: 'tower', label: 'Tower', icon: '🗄️', x: 0.65, y: 0.15, connectsTo: 'monitor' },
  { id: 'server', label: 'Server', icon: '🖧', x: 0.15, y: 0.55, connectsTo: 'router' },
  { id: 'router', label: 'Router', icon: '📡', x: 0.65, y: 0.55, connectsTo: 'server' },
];

const CORRECT_PAIRS = [
  ['monitor', 'tower'],
  ['server', 'router'],
];

export default function CircuitConnectScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [connections, setConnections] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const gameAreaWidth = width - 32;
  const gameAreaHeight = height * 0.45;

  const isConnected = (id) =>
    connections.some(c => c.from === id || c.to === id);

  const isPairCorrect = (a, b) =>
    CORRECT_PAIRS.some(pair =>
      (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)
    );

  const handleDevicePress = (device) => {
    if (isConnected(device.id)) return;
    if (!selected) { setSelected(device); return; }
    if (selected.id === device.id) { setSelected(null); return; }
    if (isPairCorrect(selected.id, device.id)) {
      const newConnections = [...connections,
        { from: selected.id, to: device.id }];
      setConnections(newConnections);
      setSelected(null);
      if (newConnections.length === CORRECT_PAIRS.length) {
        setTimeout(() => {
          navigation.navigate('Completion', { gameId: 'CircuitConnect' });
        }, 800);
      }
    } else {
      Alert.alert('Wrong Connection! ❌',
        `${selected.label} and ${device.label} don't connect. Try again!`);
      setSelected(null);
    }
  };

  const getDevicePos = (device) => ({
    x: device.x * gameAreaWidth,
    y: device.y * gameAreaHeight,
  });

  const renderLines = () =>
    connections.map((conn, i) => {
      const fromDevice = DEVICES.find(d => d.id === conn.from);
      const toDevice = DEVICES.find(d => d.id === conn.to);
      const from = getDevicePos(fromDevice);
      const to = getDevicePos(toDevice);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return (
        <View key={i} style={{
          position: 'absolute',
          left: from.x + 30, top: from.y + 30,
          width: length, height: 3,
          backgroundColor: '#48BB78',
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: 'left center',
        }} />
      );
    });

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}
          onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.backText}>← Circuit Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusDot,
          { backgroundColor: connections.length === CORRECT_PAIRS.length
            ? theme.colors.success : theme.colors.primary }]} />
        <Text style={styles.statusText}>CONNECT PC COMPONENTS</Text>
      </View>
      <Text style={styles.instruction}>
        Tap a component, then tap its correct power partner
      </Text>

      {selected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>
            {selected.icon} {selected.label} selected — tap its partner!
          </Text>
        </View>
      )}

      <View style={[styles.gameArea, { width: gameAreaWidth, height: gameAreaHeight }]}>
        {renderLines()}
        {DEVICES.map(device => {
          const pos = getDevicePos(device);
          const connected = isConnected(device.id);
          const isSelected = selected?.id === device.id;
          return (
            <TouchableOpacity
              key={device.id}
              style={[styles.device, { left: pos.x, top: pos.y },
                isSelected && styles.deviceSelected,
                connected && styles.deviceConnected]}
              onPress={() => handleDevicePress(device)}
              disabled={connected}>
              <Text style={styles.deviceIcon}>{device.icon}</Text>
              <Text style={styles.deviceLabel}>{device.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PowerUpToolbar
        onHint={() => {
          const unconnected = DEVICES.filter(d => !isConnected(d.id));
          if (unconnected.length >= 2)
            Alert.alert('Hint 💡',
              `Try connecting ${unconnected[0].label} with ${unconnected[1].label}!`);
        }}
        onHelp={() => Alert.alert('Help',
          'Tap one device, then tap the device it should connect to!')}
        onInspect={() => Alert.alert('Progress',
          `${connections.length} of ${CORRECT_PAIRS.length} connections made.`)}
      />
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={() => {
          setConnections([]); setSelected(null); setMenuVisible(false);
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
  instruction: {
    fontSize: theme.fonts.small, color: theme.colors.textLight,
    marginHorizontal: 16, marginBottom: 10,
  },
  selectedIndicator: {
    backgroundColor: theme.colors.accent,
    marginHorizontal: 16, padding: 8,
    borderRadius: theme.radius.sm, marginBottom: 8,
  },
  selectedText: { fontSize: theme.fonts.small, fontWeight: '600' },
  gameArea: {
    position: 'relative', backgroundColor: theme.colors.white,
    marginHorizontal: 16, borderRadius: theme.radius.md,
    marginBottom: 12, elevation: 2, overflow: 'hidden',
  },
  device: {
    position: 'absolute', alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 8, borderRadius: theme.radius.sm,
    borderWidth: 2, borderColor: 'transparent', elevation: 2,
  },
  deviceSelected: { borderColor: theme.colors.accent, backgroundColor: '#FFFAF0' },
  deviceConnected: { borderColor: theme.colors.success, backgroundColor: '#F0FFF4' },
  deviceIcon: { fontSize: 32 },
  deviceLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.text, marginTop: 2 },
});