import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import AudioManager from '../utils/AudioManager';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');
const GAME_W = width - 32;
const CELL_W = GAME_W / 2;
const CELL_H = 110;

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE IMAGE MAP
// Replace the `null` values below with your actual image requires, e.g.:
//   monitor: require('../assets/images/monitor.png'),
//
// The icon emoji is shown as fallback when image is null.
// ─────────────────────────────────────────────────────────────────────────────
const DEVICE_IMAGES = {
  // Easy
  monitor:  null, // replace: require('../assets/images/monitor.png')
  tower:    null, // replace: require('../assets/images/tower.png')
  keyboard: null, // replace: require('../assets/images/keyboard.png')
  mouse:    null, // replace: require('../assets/images/mouse.png')

  // Medium
  router:   null, // replace: require('../assets/images/router.png')
  modem:    null, // replace: require('../assets/images/modem.png')
  switch:   null, // replace: require('../assets/images/switch.png')
  hub:      null, // replace: require('../assets/images/hub.png')
  server:   null, // replace: require('../assets/images/server.png')
  rack:     null, // replace: require('../assets/images/rack.png')

  // Hard
  firewall: null, // replace: require('../assets/images/firewall.png')
  gateway:  null, // replace: require('../assets/images/gateway.png')
  nas:      null, // replace: require('../assets/images/nas.png')
  backup:   null, // replace: require('../assets/images/backup.png')
  ups:      null, // replace: require('../assets/images/ups.png')
  pdu:      null, // replace: require('../assets/images/pdu.png')
  kvm:      null, // replace: require('../assets/images/kvm.png')
  console:  null, // replace: require('../assets/images/console.png')
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = {
  easy: {
    key: 'easy',
    badge: 'EASY',
    title: 'Basic Setup',
    desc: 'Connect common PC peripherals. Perfect for beginners.',
    pairs: 2,
    stars: 1,
    badgeColor: '#2D6A0F',
    badgeBg: '#E3F5D5',
    accentColor: '#7DC952',
    devices: [
      { id: 'monitor',  label: 'Monitor',  icon: '🖥️', col: 0, row: 0 },
      { id: 'tower',    label: 'Tower',    icon: '🗄️', col: 1, row: 0 },
      { id: 'keyboard', label: 'Keyboard', icon: '⌨️', col: 0, row: 1 },
      { id: 'mouse',    label: 'Mouse',    icon: '🖱️', col: 1, row: 1 },
    ],
    correct: [['monitor', 'tower'], ['keyboard', 'mouse']],
    hints: [
      'Monitor pairs with Tower — together they make a desktop PC!',
      'Keyboard and Mouse are both input devices that work as a pair.',
    ],
    wrongMessages: [
      "Those two don't connect! Check the device types.",
      'Not quite! Think about which devices work together.',
      "Hmm, that's wrong. Try connecting input devices together.",
    ],
  },
  medium: {
    key: 'medium',
    badge: 'MEDIUM',
    title: 'Network Lab',
    desc: 'Mix of hardware and networking gear. Know your ports!',
    pairs: 3,
    stars: 2,
    badgeColor: '#7A4508',
    badgeBg: '#FDE8C8',
    accentColor: '#E89020',
    devices: [
      { id: 'router', label: 'Router', icon: '📡', col: 0, row: 0 },
      { id: 'modem',  label: 'Modem',  icon: '📶', col: 1, row: 0 },
      { id: 'switch', label: 'Switch', icon: '🔀', col: 0, row: 1 },
      { id: 'hub',    label: 'Hub',    icon: '🔌', col: 1, row: 1 },
      { id: 'server', label: 'Server', icon: '🖧', col: 0, row: 2 },
      { id: 'rack',   label: 'Rack',   icon: '🗃️', col: 1, row: 2 },
    ],
    correct: [['router', 'modem'], ['switch', 'hub'], ['server', 'rack']],
    hints: [
      'Router connects to Modem for internet access.',
      'Switch and Hub both distribute network traffic.',
      'Server lives inside a Rack unit.',
    ],
    wrongMessages: [
      "Wrong connection! Those devices aren't compatible.",
      "Nope! Think about which networking devices pair up.",
      "Incorrect pairing — check the device functions.",
    ],
  },
  hard: {
    key: 'hard',
    badge: 'HARD',
    title: 'Data Center',
    desc: 'Advanced infrastructure components. Expert-level challenge!',
    pairs: 4,
    stars: 3,
    badgeColor: '#8B1F1F',
    badgeBg: '#FADFDF',
    accentColor: '#D94444',
    devices: [
      { id: 'firewall', label: 'Firewall', icon: '🛡️', col: 0, row: 0 },
      { id: 'gateway',  label: 'Gateway',  icon: '🚪', col: 1, row: 0 },
      { id: 'nas',      label: 'NAS',      icon: '💾', col: 0, row: 1 },
      { id: 'backup',   label: 'Backup',   icon: '📦', col: 1, row: 1 },
      { id: 'ups',      label: 'UPS',      icon: '🔋', col: 0, row: 2 },
      { id: 'pdu',      label: 'PDU',      icon: '⚡', col: 1, row: 2 },
      { id: 'kvm',      label: 'KVM',      icon: '🖲️', col: 0, row: 3 },
      { id: 'console',  label: 'Console',  icon: '💻', col: 1, row: 3 },
    ],
    correct: [
      ['firewall', 'gateway'],
      ['nas', 'backup'],
      ['ups', 'pdu'],
      ['kvm', 'console'],
    ],
    hints: [
      'Firewall pairs with Gateway — both guard the network edge.',
      'NAS connects to Backup for data redundancy.',
      'UPS powers the PDU to protect against outages.',
      'KVM connects to the Console for remote management.',
    ],
    wrongMessages: [
      "Wrong connection! Those components don't interface.",
      "Incorrect! In a data center, think about function pairs.",
      "Not quite — consider what each device does.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION LINE  (pure RN — no react-native-svg needed)
// ─────────────────────────────────────────────────────────────────────────────
function ConnectionLine({ x1, y1, x2, y2, color = '#1D9E75' }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
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
// DEVICE NODE  (with image support + shake animation)
// ─────────────────────────────────────────────────────────────────────────────
function DeviceNode({ device, isSelected, isConnected, isWrong, onPress, accentColor, badgeBg }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Trigger shake when wrong
  React.useEffect(() => {
    if (!isWrong) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  }, [isWrong]);

  // Pop scale when selected
  React.useEffect(() => {
    if (isSelected) {
      Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, tension: 200 }).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [isSelected]);

  const hasImage = !!DEVICE_IMAGES[device.id];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: device.col * CELL_W + CELL_W / 2 - 48,
        top: device.row * CELL_H + 8,
        transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          nd.node,
          isSelected  && [nd.nodeSelected,  { borderColor: accentColor, backgroundColor: badgeBg }],
          isConnected && nd.nodeConnected,
          isWrong     && nd.nodeWrong,
        ]}
        onPress={onPress}
        disabled={isConnected}
        activeOpacity={0.8}
      >
        {/* ── DEVICE VISUAL ───────────────────────────────────────────────
            If DEVICE_IMAGES[device.id] is set, renders the image.
            Otherwise falls back to the emoji icon.
            To use an image: set DEVICE_IMAGES[device.id] at the top of the file.
        ─────────────────────────────────────────────────────────────────── */}
        {hasImage ? (
          <Image
            source={DEVICE_IMAGES[device.id]}
            style={nd.nodeImage}
            resizeMode="contain"
          />
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

        {/* Connected checkmark badge */}
        {isConnected && (
          <View style={nd.checkBadge}>
            <Text style={nd.checkText}>✓</Text>
          </View>
        )}

        {/* Wrong X badge */}
        {isWrong && (
          <View style={nd.wrongBadge}>
            <Text style={nd.wrongText}>✕</Text>
          </View>
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
  nodeSelected: {
    borderWidth: 2,
    elevation: 5,
    shadowOpacity: 0.15,
  },
  nodeConnected: {
    borderColor: '#1D9E75',
    backgroundColor: '#E8F8F2',
  },
  nodeWrong: {
    borderColor: '#D94444',
    backgroundColor: '#FADFDF',
  },
  nodeImage: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  nodeIcon: {
    fontSize: 36,
    marginBottom: 4,
    lineHeight: 44,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1916',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  wrongBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D94444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL SELECT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LevelSelectScreen({ navigation }) {
  return (
    <View style={ls.container}>
      <View style={ls.decorCircle} />
      <View style={ls.header}>
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
  const chips = level.devices.slice(0, 3).map((d) => d.label);
  const extra = level.devices.length - 3;

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
        {/* Arrow */}
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
function GameScreen({ navigation, route }) {
  const { levelKey } = route.params;
  const level = LEVELS[levelKey];

  const [selected, setSelected]           = useState(null);
  const [connections, setConnections]     = useState([]);   // {from,to,x1,y1,x2,y2}
  const [connectedIds, setConnectedIds]   = useState(new Set());
  const [wrongIds, setWrongIds]           = useState(new Set());  // ids currently flashing wrong
  const [mistakes, setMistakes]           = useState(0);
  const [hintIdx, setHintIdx]             = useState(0);
  const [menuVisible, setMenuVisible]     = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');  // inline error banner text
  const errorAnim                         = useRef(new Animated.Value(0)).current;
  const wrongTimerRef                     = useRef(null);

  const rows   = Math.max(...level.devices.map((d) => d.row)) + 1;
  const GAME_H = rows * CELL_H + 16;

  const nodeCenter = (device) => ({
    x: device.col * CELL_W + CELL_W / 2,
    y: device.row * CELL_H + CELL_H / 2,
  });

  const isPairCorrect = (a, b) =>
    level.correct.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));

  // Show inline error banner
  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setErrorMsg(''));
  }, []);

  const handleTap = (id) => {
    if (connectedIds.has(id)) return;

    if (!selected) {
      setSelected(id);
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }

    const a = selected, b = id;
    setSelected(null);

    if (isPairCorrect(a, b)) {
      AudioManager.playCorrect();
      // ── Correct connection ──
      const da = level.devices.find((d) => d.id === a);
      const db = level.devices.find((d) => d.id === b);
      const ca = nodeCenter(da);
      const cb = nodeCenter(db);

      const newConns = [...connections, { from: a, to: b, x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }];
      const newIds   = new Set([...connectedIds, a, b]);
      setConnections(newConns);
      setConnectedIds(newIds);

      if (newConns.length === level.pairs) {
        setTimeout(() =>
          navigation.navigate('Completion', {
            gameId: 'CircuitConnect',
            levelKey,
            mistakes,
            pairs: level.pairs,
          }), 800);
      }
    } else {
      AudioManager.playWrong();
      // ── Wrong connection — shake + flash + inline error ──
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      // Flash both nodes red
      setWrongIds(new Set([a, b]));
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongIds(new Set()), 1000);

      // Pick a random wrong message from level config
      const msgs = level.wrongMessages;
      const msg  = msgs[Math.floor(Math.random() * msgs.length)];

      // Show inline banner with mistake count
      showError(`❌ ${msg} (${newMistakes} mistake${newMistakes > 1 ? 's' : ''})`);
    }
  };

  const handleRestart = () => {
    setSelected(null);
    setConnections([]);
    setConnectedIds(new Set());
    setWrongIds(new Set());
    setMistakes(0);
    setHintIdx(0);
    setMenuVisible(false);
    setErrorMsg('');
  };

  const selectedDevice = level.devices.find((d) => d.id === selected);

  return (
    <View style={g.container}>
      <View style={g.decorCircle} />

      {/* ── Header ── */}
      <View style={g.header}>
        <View />
        <TouchableOpacity style={g.menuBtn} onPress={() => setMenuVisible(true)}>
          <Text style={g.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      {/* ── Status bar ── */}
      <View style={g.statusBar}>
        <View style={g.statusLeft}>
          <View style={[g.statusDot, {
            backgroundColor: connections.length === level.pairs ? '#1D9E75' : level.accentColor,
          }]} />
          <Text style={g.statusText}>CONNECT PC COMPONENTS</Text>
        </View>
        <View style={[g.levelPill, { backgroundColor: level.badgeBg }]}>
          <Text style={[g.levelPillText, { color: level.badgeColor }]}>
            {level.badge}  {connections.length}/{level.pairs}
          </Text>
        </View>
      </View>

      <Text style={g.instruction}>
        Tap a component, then tap its correct power partner
      </Text>

      {/* ── Selected indicator ── */}
      {selectedDevice ? (
        <View style={[g.selectedBar, { borderColor: level.accentColor, backgroundColor: level.badgeBg + '88' }]}>
          <Text style={[g.selectedText, { color: level.badgeColor }]}>
            {selectedDevice.icon}  {selectedDevice.label} selected — tap its partner!
          </Text>
        </View>
      ) : (
        <View style={g.selectedBarPlaceholder} />
      )}

      {/* ── Inline error banner (slides in from top of game area) ── */}
      <Animated.View
        style={[
          g.errorBanner,
          {
            opacity: errorAnim,
            transform: [{
              translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
            }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={g.errorText}>{errorMsg}</Text>
      </Animated.View>

      {/* ── Mistakes counter ── */}
      {mistakes > 0 && (
        <View style={g.mistakesRow}>
          {Array.from({ length: Math.min(mistakes, 5) }).map((_, i) => (
            <View key={i} style={g.mistakeDot} />
          ))}
          {mistakes > 5 && <Text style={g.mistakesExtra}>+{mistakes - 5}</Text>}
          <Text style={g.mistakesLabel}> mistake{mistakes !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* ── Game area ── */}
      <View style={[g.gameArea, { height: GAME_H }]}>
        {/* Connection lines */}
        {connections.map((conn, i) => (
          <ConnectionLine key={i} x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} />
        ))}

        {/* Device nodes */}
        {level.devices.map((device) => (
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

      {/* ── Toolbar ── */}
      <PowerUpToolbar
        onHint={() => {
          const hint = level.hints[hintIdx % level.hints.length];
          setHintIdx((i) => i + 1);
          Alert.alert('Hint 💡', hint, [{ text: 'Got it!' }]);
        }}
        onHelp={() =>
          Alert.alert(
            'How to play',
            'Tap a device to select it (it highlights), then tap the correct partner device to connect them!\n\nGreen lines show completed connections.',
            [{ text: 'OK!' }],
          )
        }
        onInspect={() =>
          Alert.alert(
            'Progress 🔍',
            `✅ ${connections.length} of ${level.pairs} connections made\n❌ ${mistakes} mistake${mistakes !== 1 ? 's' : ''} so far`,
            [{ text: 'Keep going!' }],
          )
        }
      />

      {/* ── In-game menu ── */}
      <InGameMenu
  visible={menuVisible}
  onClose={() => setMenuVisible(false)}
  onRestart={handleRestart}
  onSwitchLevel={() => navigation.goBack()} // ✅ Goes back to CircuitLevels
/>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — nested stack (no extra install needed)
// ─────────────────────────────────────────────────────────────────────────────
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

const ls = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.primary, opacity: 0.12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 20, gap: 12,
  },
  backBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    borderRadius: theme.radius.sm, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  backText: { fontSize: 18, color: theme.colors.text },
  headerTitle: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: theme.colors.textLight, fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 16 },
  card: {
    backgroundColor: theme.colors.white, borderRadius: 16,
    borderWidth: 1.5, flexDirection: 'row',
    overflow: 'hidden', elevation: 3, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardBar: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  stars: { fontSize: 14, letterSpacing: 2 },
  pairsPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pairsText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: theme.colors.textLight, lineHeight: 18, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: '#E2DFD8',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: theme.colors.textLight },
  arrowWrap: { justifyContent: 'center', paddingRight: 14 },
  arrow: { fontSize: 26, fontWeight: '300' },
});

const g = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
  decorCircle: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.primary, opacity: 0.12,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 10,
  },
  backBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    borderRadius: theme.radius.sm, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  backText: { fontWeight: '700', color: theme.colors.text, fontSize: 13 },
  menuBtn: {
    backgroundColor: theme.colors.white, padding: 10,
    paddingHorizontal: 20, borderRadius: theme.radius.sm, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  menuText: { fontWeight: '700', color: theme.colors.text },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16, padding: 10,
    borderRadius: theme.radius.sm, marginBottom: 6,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: theme.colors.text },
  levelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  levelPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  instruction: {
    fontSize: 12, color: theme.colors.textLight,
    marginHorizontal: 16, marginBottom: 6, textAlign: 'center',
  },
  selectedBar: {
    marginHorizontal: 16, marginBottom: 6,
    borderWidth: 1.5, borderRadius: theme.radius.sm,
    padding: 9, alignItems: 'center',
  },
  selectedBarPlaceholder: { height: 38, marginHorizontal: 16, marginBottom: 6 },
  selectedText: { fontSize: 12, fontWeight: '700' },

  // Error banner
  errorBanner: {
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: '#FADFDF',
    borderWidth: 1, borderColor: '#F09595',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
    alignItems: 'center',
  },
  errorText: { fontSize: 12, fontWeight: '700', color: '#8B1F1F', textAlign: 'center' },

  // Mistakes row
  mistakesRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 4, gap: 4,
  },
  mistakeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D94444',
  },
  mistakesExtra: { fontSize: 11, color: '#D94444', fontWeight: '700' },
  mistakesLabel: { fontSize: 11, color: '#D94444', fontWeight: '600' },

  gameArea: {
    position: 'relative',
    backgroundColor: theme.colors.white,
    marginHorizontal: 16, borderRadius: 16,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
    overflow: 'hidden',
  },
});

