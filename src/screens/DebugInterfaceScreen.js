import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, Animated, PanResponder,
  Image, ImageBackground, Dimensions
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InGameMenu from '../components/InGameMenu';
import AudioManager from '../utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ─────────────────────────────────────────────
   LEVEL DATA
───────────────────────────────────────────────── */
const LEVELS = [
  { // LEVEL 1
    name: 'Debug the Web Interface',
    badge: 'LEVEL 1',
    type: 'drag', // Drag & Drop Mechanic
    desc: 'Drag the correct missing icons to their placeholders.',
    bgImage: require('../assets/images/interfc-bg-1-removebg.png'),
    placeholders: [
      { id: 'exit',  leftPct: 0.98, topPct: 0.05, hint: 'Exit lives in the top-right corner' },
      { id: 'play',  leftPct: 0.79, topPct: 0.41, hint: 'Play belongs inside the media player' },
      { id: 'home',  leftPct: 0.13, topPct: 0.85, hint: 'Home is in the bottom navigation bar' },
    ],
    inventory: [
      { id: 'exit',   src: require('../assets/images/exit_icons.png') },
      { id: 'play',   src: require('../assets/images/play_icons-.png') },
      { id: 'home',   src: require('../assets/images/home_icons.png') },
      { id: 'user',   src: require('../assets/images/user_icons.png') },
      { id: 'camera', src: require('../assets/images/camera-icons.png') },
    ],
  },
  { // LEVEL 2
    name: 'Debug the Login Interface',
    badge: 'LEVEL 2',
    type: 'drag', // Drag & Drop Mechanic
    desc: 'Something is wrong with the Sign In screen. Drag the correct elements into place.',
    bgImage: require('../assets/images/interfc-bg-2.png'),
    aspectRatio: 0.76,
    placeholders: [
      { id: 'email_text',   leftPct: 0.18, topPct: 0.22, phWidth: 43, phHeight: 15, hint: 'The email field needs its label on the left' },
      { id: 'login_button', leftPct: 0.58, topPct: 0.80, phWidth: 268, phHeight: 44, hint: 'The primary action button goes in the centre' },
      { id: 'eye',          leftPct: 1.01, topPct: 0.45, phWidth: 20, phHeight: 23, hint: 'The password visibility toggle belongs on the right' },
    ],
    inventory: [
      { id: 'email_text',   src: require('../assets/images/email_text_icons_2.png') },
      { id: 'login_button', src: require('../assets/images/login_pink_button_icons_2.png') },
      { id: 'eye',          src: require('../assets/images/eye_icons_2.png') },
      { id: 'user_text',    src: require('../assets/images/user_text_icons_2.png') },
      { id: 'sign_up_btn',  src: require('../assets/images/sign_up_pink_button_icons_2.png') },
      { id: 'lock',         src: require('../assets/images/lock_icons_2.png') },
    ],
  },
  { // LEVEL 3 (SPOT THE DIFFERENCE)
    name: 'System Error Cleanup',
    badge: 'LEVEL 3',
    type: 'spot', 
    desc: 'Find and fix all 5 bugs in the interface below!',
    bgImage: require('../assets/images/Intface-3bg.png'), 
    aspectRatio: 1.15,
    bugs: [
      { id: 1, leftPct: 0.30, topPct: 0.77, phWidth: 100, phHeight: 21, hint: 'Check the left phone button!' },
      { id: 2, leftPct: 0.37, topPct: 0.94, phWidth: 30, phHeight: 19, hint: 'New users should Sign Up, not Log In!' },
      { id: 3, leftPct: 0.58, topPct: 0.04, phWidth: 31, phHeight: 15, hint: 'The time on the right phone is corrupted!' },
      { id: 4, leftPct: 0.70, topPct: 0.66, phWidth: 103, phHeight: 23, hint: 'Why is there a Log Out button on a Sign Up page?' },
      { id: 5, leftPct: 0.64, topPct: 0.75, phWidth: 25, phHeight: 25, hint: 'Check the link at the bottom right!' },
    ]
  },
];

const HIT_PCT = 0.12;

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────── */
function FeedbackFlash({ type }) {
  const opacity = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }).start();
  }, []);
  const isOk = type === 'correct';
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, backgroundColor: isOk ? 'rgba(72,199,142,0.22)' : 'rgba(229,62,62,0.18)', justifyContent: 'center', alignItems: 'center', zIndex: 300 }]}>
      <Text style={{ fontSize: 88, color: isOk ? '#27AE60' : '#E53E3E', fontWeight: 'bold' }}>{isOk ? '✓' : '✗'}</Text>
    </Animated.View>
  );
}

function ProgressBar({ placed, total }) {
  const pct = total > 0 ? placed / total : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <View style={{ flex: 1, height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: '#48C78E', borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#48C78E', minWidth: 30, textAlign: 'right' }}>{placed}/{total}</Text>
    </View>
  );
}

function DraggableIcon({ item, placeholders, containerLayout, onDrop }) {
  const pan   = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => { Animated.spring(scale, { toValue: 1.18, useNativeDriver: true }).start(); },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        const { px, py, width, height } = containerLayout.current;
        const fracX = (gesture.moveX - px) / width;
        const fracY = (gesture.moveY - py) / height;

        let hit = null;
        for (const ph of placeholders) {
          if (Math.abs(fracX - ph.leftPct) < HIT_PCT && Math.abs(fracY - ph.topPct) < HIT_PCT) {
            hit = ph; break;
          }
        }
        if (hit) {
          const correct = hit.id === item.id;
          onDrop(item.id, hit.id, correct);
          if (!correct) Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View {...pr.panHandlers} style={[pan.getLayout(), { transform: [{ scale }] }, styles.draggableItem]}>
      <Image source={item.src} style={styles.iconImage} resizeMode="contain" />
    </Animated.View>
  );
}

function PlaceholderZone({ ph, placedSrc, containerW, containerH }) {
  const cx = ph.leftPct * containerW;
  const cy = ph.topPct  * containerH;
  const W = ph.phWidth || 31;
  const H = ph.phHeight || 31;

  return (
    <View style={[styles.placeholder, { left: cx - W / 2, top: cy - H / 2, width: W, height: H, borderColor: placedSrc ? '#48C78E' : '#A0AEC0', borderStyle: placedSrc ? 'solid' : 'dashed', backgroundColor: placedSrc ? 'rgba(72,199,142,0.15)' : 'rgba(255,255,255,0.7)' }]}>
      {placedSrc ? (
        <>
          <Image source={placedSrc} style={{ width: W * 0.85, height: H * 0.85 }} resizeMode="contain" />
          <View style={styles.checkBadge}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>✓</Text>
          </View>
        </>
      ) : (
        <Text style={{ color: '#A0AEC0', fontSize: Math.min(W, H) * 0.5, fontWeight: 'bold' }}>+</Text>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────────── */
function DebugGameScreen({ navigation, route }) {
  const levelIndex    = route.params?.levelIndex    ?? 0;
  const unlockedLevel = route.params?.unlockedLevel ?? 0;
  const current       = LEVELS[levelIndex];

  const [placedMap, setPlacedMap] = useState({}); 
  const [bugStates, setBugStates] = useState(current.bugs ? current.bugs.map(b => ({ ...b, isFixed: false })) : []);
  
  const [hint,         setHint]         = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [menuVisible,  setMenuVisible]  = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [feedbackKey,  setFeedbackKey]  = useState(0);
  const [containerSz,  setContainerSz]  = useState({ width: 1, height: 1 });

  const containerLayout = useRef({ px: 0, py: 0, width: 1, height: 1 });
  const containerViewRef = useRef(null);

  useEffect(() => {
    if (current.type === 'spot' && current.bugs) {
      setBugStates(current.bugs.map(b => ({ ...b, isFixed: false })));
    }
  }, [levelIndex, current]);

  // ✅ RESET LISTENER: Clears board when "Play Again" is clicked
  useEffect(() => {
    if (route.params?.reset) {
      handleRestart();
    }
  }, [route.params?.reset]);

  const onContainerLayout = useCallback(() => {
    if (containerViewRef.current) {
      containerViewRef.current.measure((x, y, w, h, px, py) => {
        containerLayout.current = { px, py, width: w, height: h };
        setContainerSz({ width: w, height: h });
      });
    }
  }, []);

  const triggerFeedback = (type) => {
    setFeedbackKey(k => k + 1);
    setFeedback(type);
    setTimeout(() => setFeedback(null), 700);
  };

  // SPOT MECHANIC: Handle Tap (Level 3)
  const handleSpotTap = (id) => {
    const updated = bugStates.map(bug => bug.id === id ? { ...bug, isFixed: true } : bug);
    setBugStates(updated);
    triggerFeedback('correct');
    AudioManager.playCorrect(); // 🔊 Added SFX
    if (updated.every(b => b.isFixed)) {
      setTimeout(() => setShowComplete(true), 600);
    }
  };

  // DRAG MECHANIC: Handle Drop (Levels 1 & 2)
  const handleDrop = useCallback((itemId, zoneId, correct) => {
    if (correct) {
      triggerFeedback('correct');
      AudioManager.playCorrect(); // 🔊 Added SFX
      setPlacedMap(prev => {
        const next = { ...prev, [zoneId]: current.inventory.find(i => i.id === itemId) };
        if (Object.keys(next).length === current.placeholders.length) {
          setTimeout(() => setShowComplete(true), 550);
        }
        return next;
      });
    } else {
      triggerFeedback('wrong');
      AudioManager.playWrong(); // 🔊 Added SFX
    }
  }, [current]);

  const showHint = () => {
    if (current.type === 'spot') {
      const unfixed = bugStates.find(b => !b.isFixed);
      if (unfixed) setHint(unfixed.hint);
    } else {
      const missing = current.placeholders.find(p => !placedMap[p.id]);
      if (missing) setHint(missing.hint);
    }
    setTimeout(() => setHint(''), 3500);
  };

  const handleRestart = () => {
    setPlacedMap({});
    if (current.type === 'spot') {
      setBugStates(current.bugs.map(b => ({ ...b, isFixed: false })));
    }
    setShowComplete(false);
    setMenuVisible(false);
    setHint('');
  };

  const nextLevel = () => {
    setShowComplete(false);
    const nextIdx     = levelIndex + 1;
    const newUnlocked = Math.max(unlockedLevel, nextIdx);
    if (nextIdx < LEVELS.length) {
      navigation.replace('DebugGame', { levelIndex: nextIdx, unlockedLevel: newUnlocked });
    } else {
      Alert.alert('System Restored!', 'You have fixed all interfaces.');
      navigation.navigate('Menu');
    }
  };

  const placedCount = current.type === 'spot' ? bugStates.filter(b => b.isFixed).length : Object.keys(placedMap).length;
  const totalCount  = current.type === 'spot' ? bugStates.length : current.placeholders.length;
  const allDone     = placedCount === totalCount;
  const placedIds = new Set(Object.keys(placedMap));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgBlob} />

        {feedback && <FeedbackFlash key={feedbackKey} type={feedback} />}

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>{current.name}</Text>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
            <Text style={styles.menuText}>Menu</Text>
          </TouchableOpacity>
        </View>

        {/* PROGRESS BANNER */}
        <View style={styles.bannerContainer}>
          <View style={styles.errorPill}>
            <View style={[styles.dot, { backgroundColor: allDone ? '#48C78E' : '#E53E3E' }]} />
            <Text style={styles.errorText}>
              {allDone ? 'ALL BUGS FIXED!' : 'ERRORS DETECTED – FIX TO PROCEED'}
            </Text>
          </View>
          <Text style={styles.instructionText}>{current.desc}</Text>
          <ProgressBar placed={placedCount} total={totalCount} />
        </View>

        {hint !== '' && (
          <Text style={styles.hintText}>💡 {hint}</Text>
        )}

        {/* DYNAMIC GAME AREA */}
        <View style={styles.gameArea}>
          
          {current.type === 'drag' ? (
            /* ==================================
               DRAG & DROP INTERFACE (Levels 1 & 2)
               ================================== */
            <>
              <View style={styles.topCanvas}>
                <View
                  ref={containerViewRef}
                  onLayout={onContainerLayout}
                  style={[
                    styles.imageContainer,
                    {
                      aspectRatio: current.aspectRatio || 1.13,
                      alignSelf: 'center',
                      width: (current.aspectRatio && current.aspectRatio < 1) ? '65%' : '100%'
                    }
                  ]}
                >
                  <ImageBackground source={current.bgImage} style={StyleSheet.absoluteFill} resizeMode="contain" />
                  {current.placeholders.map(ph => (
                    <PlaceholderZone key={ph.id} ph={ph} placedSrc={placedMap[ph.id]?.src ?? null} containerW={containerSz.width} containerH={containerSz.height} />
                  ))}
                </View>
              </View>

              <View style={styles.bottomCanvas}>
                <Text style={styles.inventoryLabel}>DRAG AN ICON UP ↑</Text>
                <View style={styles.inventoryRow}>
                  {current.inventory.map(item => {
                    if (placedIds.has(item.id)) return <View key={item.id} style={styles.emptySlot} />;
                    return (
                      <DraggableIcon key={item.id} item={item} placeholders={current.placeholders} containerLayout={containerLayout} onDrop={handleDrop} />
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
  /* ==================================
   SPOT THE DIFFERENCE INTERFACE (Level 3)
   ================================== */
<View style={styles.topCanvas}>
  <View
    ref={containerViewRef}
    onLayout={onContainerLayout}
    style={[
      styles.imageContainer,
      {
        aspectRatio: current.aspectRatio || 1.15,
        width: '95%',
        maxHeight: SCREEN_WIDTH * 1.25 * 0.9,
        alignSelf: 'center',
        minHeight: 350
      }
    ]}
  >
    <ImageBackground 
      source={current.bgImage} 
      style={StyleSheet.absoluteFill} 
      resizeMode="contain"
      imageStyle={{ 
        borderRadius: 16,
        width: '100%', 
        height: '100%' 
      }}
    />
    
     {/* Invisible tap zones overlaying the background image */}
    {bugStates.map(bug => {
      const cx = bug.leftPct * containerSz.width;
      const cy = bug.topPct * containerSz.height;
      const W = bug.phWidth || 80;
      const H = bug.phHeight || 40;

      return (
        <TouchableOpacity
          key={bug.id}
          style={{
            position: 'absolute',
            left: cx - W / 2,
            top: cy - H / 2,
            width: W,
            height: H,
            borderRadius: 8,
            backgroundColor: bug.isFixed 
              ? 'rgba(72,199,142,0.25)' 
              : 'rgba(255,255,255,0.01)',
            borderColor: bug.isFixed ? '#48C78E' : 'rgba(229,62,62,0.4)',
            borderWidth: bug.isFixed ? 3 : 1.5,
            borderStyle: bug.isFixed ? 'solid' : 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2
          }}
          onPress={() => !bug.isFixed && handleSpotTap(bug.id)}
          disabled={bug.isFixed}
          activeOpacity={0.7}
        >
          {bug.isFixed ? (
            <View style={styles.checkBadge}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
            </View>
          ) : (
            <Text style={{ 
              color: 'rgba(229,62,62,0.6)', 
              fontSize: 12, 
              fontWeight: 'bold',
              opacity: 0.001
            }}>
              tap
            </Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
</View>
          )}

        </View>

        {/* BOTTOM ACTION BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => Alert.alert('Task', current.desc)}>
              <Text style={styles.actionEmoji}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconCenter} onPress={showHint}>
              <Text style={styles.actionEmoji}>💡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={handleRestart}>
              <Text style={styles.actionEmoji}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        <InGameMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onRestart={handleRestart}
          onSwitchLevel={() => navigation.goBack()}
        />

        {/* COMPLETION POPUP */}
        {showComplete && (
          <View style={styles.overlay}>
            <View style={styles.popup}>
              <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 8 }}>🎉</Text>
              <Text style={styles.popupTitle}>Level Complete!</Text>
              <Text style={styles.popupSub}>Interface is fully functional.</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 26 }}>⭐</Text>
                ))}
              </View>
              <View style={styles.popupBtnRow}>
                <TouchableOpacity style={styles.popupBtnOutline} onPress={handleRestart}>
                  <Text style={styles.popupBtnOutlineTxt}>Redo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupBtnFill} onPress={nextLevel}>
                  <Text style={styles.popupBtnFillTxt}>
                    {levelIndex < LEVELS.length - 1 ? 'Next →' : 'Finish'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();
export default function DebugInterfaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DebugGame" component={DebugGameScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#F4F5EB' },
  container: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', position: 'relative' },
  bgBlob:    { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#CDE5F7' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 12, zIndex: 1 },
  iconBtn:   { width: 50, height: 40, backgroundColor: '#FFF', borderWidth: 1.5, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  iconText:  { fontSize: 20, fontWeight: '600' },
  titleText: { flex: 1, paddingLeft: 15, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  menuBtn:   { backgroundColor: '#A6D5FA', borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 15 },
  menuText:  { fontSize: 14, fontWeight: '500' },
  bannerContainer: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 4, zIndex: 1 },
  errorPill:       { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center', width: '100%', marginBottom: 4, elevation: 2 },
  dot:             { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  errorText:       { fontSize: 10, letterSpacing: 1, color: '#666', fontWeight: '600' },
  instructionText: { fontSize: 12, color: '#888', letterSpacing: 0.5 },
  hintText:        { textAlign: 'center', color: '#D97706', fontWeight: 'bold', marginBottom: 4, paddingHorizontal: 20 },
  gameArea:       { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  
  // Drag & Drop Styles
  topCanvas:      { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 12, padding: 8, overflow: 'hidden', elevation: 2 },
  imageContainer: { width: '100%', position: 'relative' },
  placeholder: { position: 'absolute', borderWidth: 2, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkBadge:  { position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#48C78E', justifyContent: 'center', alignItems: 'center' },
  bottomCanvas:   { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 12, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', zIndex: 10, elevation: 2 },
  inventoryLabel: { fontSize: 9, letterSpacing: 1.5, color: '#A0AEC0', marginBottom: 10, fontWeight: '600' },
  inventoryRow:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  draggableItem:  { width: 52, height: 52, backgroundColor: '#F0F4F8', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, zIndex: 100 },
  iconImage:      { width: 30, height: 30 },
  emptySlot:      { width: 52, height: 52 },

  // UI elements
  bottomBar:        { paddingHorizontal: 20, paddingBottom: 20 },
  bottomBarInner:   { flexDirection: 'row', backgroundColor: '#8BCBFF', borderRadius: 15, height: 70, justifyContent: 'space-evenly', alignItems: 'center', elevation: 4 },
  actionIcon:       { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  actionIconCenter: { width: 60, height: 60, backgroundColor: '#FFF', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  actionEmoji:      { fontSize: 24 },
  overlay:            { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  popup:              { width: 300, backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center' },
  popupTitle:         { fontWeight: 'bold', fontSize: 20, marginBottom: 4 },
  popupSub:           { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  popupBtnRow:        { flexDirection: 'row', gap: 12 },
  popupBtnOutline:    { borderWidth: 1.5, borderColor: '#4A90E2', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  popupBtnOutlineTxt: { color: '#4A90E2', fontWeight: '600', fontSize: 15 },
  popupBtnFill:       { backgroundColor: '#4A90E2', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  popupBtnFillTxt:    { color: '#FFF', fontWeight: '700', fontSize: 15 },
});