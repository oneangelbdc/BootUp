import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, Animated, PanResponder,
  Image, ImageBackground, Dimensions, BackHandler,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InGameMenu    from '../components/InGameMenu';
import AudioManager  from '../utils/AudioManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ─────────────────────────────────────────────────────────────
   TOOLBAR ICON ASSETS
   Used in the bottom action bar: Specs | Hint | Inspect
───────────────────────────────────────────────────────────── */
const TOOLBAR_ICONS = {
  specs:   require('../assets/images/icon-clipboard.png'),
  hint:    require('../assets/images/icon-lightbulb.png'),
  inspect: require('../assets/images/icon-magnifying-glass.png'),
};

/* ─────────────────────────────────────────────────────────────
   LEVEL DATA
   Each level object defines:
     • type         — 'drag' (Levels 1-2) or 'spot' (Level 3)
     • placeholders — drop-zones positioned as % of container size
     • inventory    — draggable icons the player picks from
     • bugs         — tappable bug zones for the spot level
     • description  — shown when Inspect Mode is active
───────────────────────────────────────────────────────────── */
const LEVELS = [

  /* ── LEVEL 1 ── Drag-and-Drop: Web Interface ── */
  {
    name:        'Debug the Web Interface',
    badge:       'LEVEL 1',
    type:        'drag',
    desc:        'Drag the correct missing icons to their elements.',
    bgImage:     require('../assets/images/interfc-bg-1-removebg.png'),
    aspectRatio: 1.10,

    // Drop-zones: position is a fraction (0–1) of the container's width/height
    placeholders: [
      { id: 'exit', leftPct: 0.95, topPct: 0.09, phWidth: 29, phHeight: 29, hint: 'Exit lives in the top-right corner' },
      { id: 'play', leftPct: 0.76, topPct: 0.42, phWidth: 29, phHeight: 29, hint: 'Play belongs inside the media player' },
      { id: 'home', leftPct: 0.13, topPct: 0.85, phWidth: 29, phHeight: 29, hint: 'Home is in the bottom navigation bar' },
    ],

    // A correct drop is when item.id === placeholder.id
    inventory: [
      { id: 'exit',   src: require('../assets/images/exit_icons.png'),   description: '✕  Exit Icon\nCloses the current screen or modal dialog. Typically placed in the top-right corner of a UI.' },
      { id: 'play',   src: require('../assets/images/play_icons-.png'),  description: '▶  Play Icon\nStarts media playback. Belongs inside the media player control bar.' },
      { id: 'home',   src: require('../assets/images/home_icons.png'),   description: '⌂  Home Icon\nReturns the user to the main home screen. Found in the bottom navigation bar.' },
      { id: 'user',   src: require('../assets/images/user_icons.png'),   description: '👤  User / Profile Icon\nRepresents account or profile settings. Not needed on this interface — it\'s a distractor!' },
      { id: 'camera', src: require('../assets/images/camera-icons.png'), description: '📷  Camera Icon\nOpens the camera or photo picker. Not needed on this interface — it\'s a distractor!' },
    ],
  },

  /* ── LEVEL 2 ── Drag-and-Drop: Login Interface ── */
  {
    name:        'Debug the Login Interface',
    badge:       'LEVEL 2',
    type:        'drag',
    desc:        'Something is wrong with the Sign In screen. Drag the correct elements into place.',
    bgImage:     require('../assets/images/interfc-bg-2.png'),
    aspectRatio: 1.0,

    placeholders: [
      { id: 'email_text',   leftPct: 0.21, topPct: 0.22, phWidth: 40,  phHeight: 16, hint: 'The email field needs its label on the left' },
      { id: 'login_button', leftPct: 0.50, topPct: 0.78, phWidth: 230, phHeight: 40, hint: 'The primary action button goes in the centre' },
      { id: 'eye',          leftPct: 0.82, topPct: 0.45, phWidth: 25,  phHeight: 23, hint: 'The password visibility toggle belongs on the right' },
    ],

    inventory: [
      { id: 'email_text',   src: require('../assets/images/email_text_icons_2.png'),         description: '✉  "Email" Field Label\nIdentifies the email input field. Belongs on the left side of the email row.' },
      { id: 'login_button', src: require('../assets/images/login_pink_button_icons_2.png'),  description: '🔑  "Log In" Button\nThe primary call-to-action that signs the user in. Goes in the centre of the form.' },
      { id: 'eye',          src: require('../assets/images/eye_icons_2.png'),                description: '👁  Eye / Visibility Icon\nToggles the password between hidden and visible text. Placed on the right edge of the password input.' },
      { id: 'user_text',    src: require('../assets/images/user_text_icons_2.png'),          description: '👤  "Username" Field Label\nIdentifies the username input. Not needed on this screen — it\'s a distractor!' },
      { id: 'sign_up_btn',  src: require('../assets/images/sign_up_pink_button_icons_2.png'),description: '✍  "Sign Up" Button\nNavigates to the registration flow. Not needed on this Login screen — it\'s a distractor!' },
      { id: 'lock',         src: require('../assets/images/lock_icons_2.png'),               description: '🔒  Lock Icon\nIndicates a secured field. Not needed on this screen — it\'s a distractor!' },
    ],
  },

  /* ── LEVEL 3 ── Spot the Bug: System Error Cleanup ── */
  {
    name:        'System Error Cleanup',
    badge:       'LEVEL 3',
    type:        'spot',
    desc:        'Find and fix all 5 bugs in the interface below!',
    bgImage:     require('../assets/images/Intface-3bg.png'),
    aspectRatio: 1.15,

    // Bug zones: tap to fix. Position is a % fraction of the container.
    bugs: [
      { id: 'Nospace_GTB', leftPct: 0.30, topPct: 0.77, phWidth: 100, phHeight: 21, hint: 'Check the left phone button!',                    description: '☎  Wrong Phone Button\nThis call button uses the wrong icon variant. It should match the standard dialer style on the right phone.' },
      { id: 'login',       leftPct: 0.36, topPct: 0.94, phWidth: 30,  phHeight: 19, hint: 'New users should Sign Up, not Log In!',            description: '🔀  Wrong CTA Label\nNew users should see "Sign Up", not "Log In". This mislabelled button would confuse first-time users.' },
      { id: 'time',        leftPct: 0.58, topPct: 0.04, phWidth: 31,  phHeight: 15, hint: 'The time on the right phone is corrupted!',        description: '⏰  Corrupted Status-Bar Time\nThe clock shows garbled characters instead of a valid time. A classic rendering bug.' },
      { id: 'sign_up',     leftPct: 0.70, topPct: 0.66, phWidth: 103, phHeight: 23, hint: 'Why is there a Log Out button on a Sign Up page?', description: '🚪  Misplaced "Log Out" Button\nA logout action makes no sense on a Sign Up screen — the user hasn\'t logged in yet!' },
      { id: 'fb_link',     leftPct: 0.64, topPct: 0.75, phWidth: 25,  phHeight: 25, hint: 'Check the link at the bottom right!',              description: '🔗  Broken Navigation Link\nThis icon links to an undefined route, causing a crash or blank screen — a dead-end in the user flow.' },
    ],
  },
];

// Tolerance radius for a successful drop (as a fraction of container size)
const HIT_PCT = 0.15;


/* =============================================================
   COMPONENT: FeedbackFlash
   Purpose  : Full-screen green ✓ or red ✗ flash on correct/wrong action.
   Lifecycle: Fades out automatically over 650ms using Animated.timing.
============================================================= */
function FeedbackFlash({ type }) {
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }).start();
  }, []);

  const isOk = type === 'correct';
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, {
        opacity,
        backgroundColor: isOk ? 'rgba(72,199,142,0.22)' : 'rgba(229,62,62,0.18)',
        justifyContent:  'center',
        alignItems:      'center',
        zIndex:          999,
      }]}
    >
      <Text style={{ fontSize: 88, color: isOk ? '#27AE60' : '#E53E3E', fontWeight: 'bold' }}>
        {isOk ? '✓' : '✗'}
      </Text>
    </Animated.View>
  );
}


/* =============================================================
   COMPONENT: ProgressBar
   Purpose  : Shows placed/total count as a green fill bar.
============================================================= */
function ProgressBar({ placed, total }) {
  const pct = total > 0 ? placed / total : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <View style={{ flex: 1, height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: '100%', backgroundColor: '#48C78E', borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#48C78E', minWidth: 30, textAlign: 'right' }}>
        {placed}/{total}
      </Text>
    </View>
  );
}


/* =============================================================
   COMPONENT: InspectTooltip
   Purpose  : Dark floating card that slides in and shows
              a description when Inspect Mode is active.
   Behavior : Animates in with opacity + spring slide.
              Has a manual ✕ dismiss and auto-dismisses after 5s.
============================================================= */
function InspectTooltip({ text, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, friction: 7,   useNativeDriver: true }),
    ]).start();
  }, [text]);

  return (
    <Animated.View style={[styles.inspectTooltip, { opacity, transform: [{ translateY: slideY }] }]}>
      <View style={styles.inspectTooltipHeader}>
        <Text style={styles.inspectTooltipLabel}>🔍  INSPECT</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.inspectTooltipClose}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inspectTooltipBody}>{text}</Text>
    </Animated.View>
  );
}


/* =============================================================
   COMPONENT: DraggableIcon
   Purpose  : Renders a single inventory icon.

   NORMAL MODE  → Uses PanResponder to track finger drag.
                  On release, calculates drop position as a
                  fraction of the image container and checks
                  proximity to each placeholder (within HIT_PCT).
                  Calls onDrop(itemId, zoneId) if a hit is found.

   INSPECT MODE → Disables drag. Renders as a plain
                  TouchableOpacity that calls onInspect()
                  with the item's description text.
============================================================= */
function DraggableIcon({ item, placeholders, containerViewRef, containerLayout, onDrop, inspectMode, onInspect }) {
  const pan   = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      // On lift: re-measure the container so positions are always fresh
      onPanResponderGrant: () => {
        if (containerViewRef?.current) {
          containerViewRef.current.measureInWindow((x, y, w, h) => {
            containerLayout.current = { px: x, py: y, width: w, height: h };
          });
        }
        Animated.spring(scale, { toValue: 1.22, useNativeDriver: false }).start();
      },

      // Live drag: update pan offset
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      // On release: snap icon back and check if it landed on a valid zone
      onPanResponderRelease: (_, gesture) => {
        Animated.spring(scale, { toValue: 1,               useNativeDriver: false }).start();
        Animated.spring(pan,   { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();

        const { px, py, width, height } = containerLayout.current;
        if (!width || width <= 1) return;

        // Convert absolute screen coords → fraction of the image container
        const fracX = (gesture.moveX - px) / width;
        const fracY = (gesture.moveY - py) / height;

        // Find the first placeholder within the HIT_PCT tolerance
        let hit = null;
        for (const ph of placeholders) {
          if (
            Math.abs(fracX - ph.leftPct) < HIT_PCT &&
            Math.abs(fracY - ph.topPct)  < HIT_PCT
          ) { hit = ph; break; }
        }

        if (hit) onDrop(item.id, hit.id);
      },
    })
  ).current;

  /* ── INSPECT MODE: static tappable tile ── */
  if (inspectMode) {
    return (
      <TouchableOpacity
        style={[styles.draggableItem, styles.draggableItemInspect]}
        onPress={() => onInspect(item.description || item.id)}
        activeOpacity={0.72}
      >
        <Image source={item.src} style={styles.iconImage} resizeMode="contain" />
        <View style={styles.inspectBadge}>
          <Text style={{ fontSize: 7, color: '#fff' }}>🔍</Text>
        </View>
      </TouchableOpacity>
    );
  }

  /* ── NORMAL MODE: draggable animated view ── */
  return (
    <Animated.View
      {...pr.panHandlers}
      style={[
        styles.draggableItem,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }], zIndex: 999, elevation: 30 },
      ]}
    >
      <Image source={item.src} style={styles.iconImage} resizeMode="contain" />
    </Animated.View>
  );
}


/* =============================================================
   COMPONENT: PlaceholderZone
   Purpose  : Renders a single drop-zone on the image canvas.
              Shows a dashed outline when empty, and the dropped
              icon with a ✓/✗ badge when filled.

   INSPECT MODE → If a correctly placed item is present,
                  wraps the zone in a TouchableOpacity so the
                  player can tap to read the icon's description.
============================================================= */
function PlaceholderZone({ ph, placedItem, containerW, containerH, inspectMode, onInspect }) {
  // Convert fractional position to absolute pixel coords
  const cx = ph.leftPct * containerW;
  const cy = ph.topPct  * containerH;
  const W  = ph.phWidth  || 36;
  const H  = ph.phHeight || 36;

  const hasItem   = !!placedItem;
  const isCorrect = placedItem?.correct;

  // Shared zone content (used in both normal and inspect-mode renders)
  const zoneContent = (
    <View
      style={[
        styles.placeholder,
        {
          left:            cx - W / 2,
          top:             cy - H / 2,
          width:           W,
          height:          H,
          borderColor:     hasItem ? (isCorrect ? '#48C78E' : '#E53E3E') : '#00000042',
          borderStyle:     hasItem ? 'solid' : 'dashed',
          backgroundColor: hasItem
            ? (isCorrect ? 'rgba(72,199,142,0.25)' : 'rgba(229,62,62,0.25)')
            : 'rgba(255,255,255,0.55)',
        },
      ]}
    >
      {hasItem ? (
        <>
          <Image source={placedItem.src} style={{ width: W * 0.78, height: H * 0.78 }} resizeMode="contain" />
          <View style={[styles.checkBadge, { backgroundColor: isCorrect ? '#48C78E' : '#E53E3E' }]}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{isCorrect ? '✓' : '✗'}</Text>
          </View>
          {inspectMode && (
            <View style={[styles.inspectBadge, { bottom: -6, left: -6, top: undefined, right: undefined }]}>
              <Text style={{ fontSize: 7, color: '#fff' }}>🔍</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={{ color: '#A0AEC0', fontSize: Math.min(W, H) * 0.45, fontWeight: 'bold' }}>+</Text>
      )}
    </View>
  );

  // In Inspect Mode: wrap filled zones so they're tappable
  if (inspectMode && hasItem && placedItem?.description) {
    return (
      <TouchableOpacity
        style={{ position: 'absolute', left: cx - W / 2, top: cy - H / 2, width: W, height: H }}
        onPress={() => onInspect(placedItem.description)}
        activeOpacity={0.75}
      >
        <View style={[
          styles.placeholder,
          {
            left: 0, top: 0, width: W, height: H,
            borderColor:     isCorrect ? '#48C78E' : '#E53E3E',
            borderStyle:     'solid',
            backgroundColor: isCorrect ? 'rgba(72,199,142,0.25)' : 'rgba(229,62,62,0.25)',
          },
        ]}>
          <Image source={placedItem.src} style={{ width: W * 0.78, height: H * 0.78 }} resizeMode="contain" />
          <View style={[styles.checkBadge, { backgroundColor: isCorrect ? '#48C78E' : '#E53E3E' }]}>
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>{isCorrect ? '✓' : '✗'}</Text>
          </View>
          <View style={[styles.inspectBadge, { bottom: -6, left: -6, top: undefined, right: undefined }]}>
            <Text style={{ fontSize: 7, color: '#fff' }}>🔍</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return zoneContent;
}


/* =============================================================
   SCREEN: DebugGameScreen
   Purpose : The single reusable game screen that handles all 3
             levels. The active level is determined by
             route.params.levelIndex (defaults to 0).

   KEY STATE
   ─────────────────────────────────────────────────────────
   placedMap     — { [zoneId]: { src, correct, itemId, description } }
                   Tracks what has been dropped into each zone.

   bugStates     — Array of bug objects with an `isFixed` flag.
                   Only used in Level 3 (type: 'spot').

   inspectMode   — Boolean toggle. When true, tapping elements
                   shows descriptions instead of triggering gameplay.

   inspectTooltip— The string currently shown in the tooltip card.
                   Empty string = tooltip hidden.

   NAVIGATION TRIGGERS (inside this screen)
   ─────────────────────────────────────────────────────────
   ← Back button       → navigation.navigate('Menu')
   Menu overlay > Home → navigation.navigate('Menu')
   Level complete > Next → navigation.replace('DebugGame', { levelIndex: next })
   Level 3 complete > Finish → navigation.navigate('Completion', { gameId })
============================================================= */
function DebugGameScreen({ navigation, route }) {
  const levelIndex = route.params?.levelIndex ?? 0;
  const current    = LEVELS[levelIndex];

  // ── Game State ──
  const [placedMap,      setPlacedMap]      = useState({});
  const [bugStates,      setBugStates]      = useState(
    current.bugs ? current.bugs.map(b => ({ ...b, isFixed: false })) : []
  );
  const [hint,           setHint]           = useState('');
  const [showComplete,   setShowComplete]   = useState(false);
  const [menuVisible,    setMenuVisible]    = useState(false);
  const [feedback,       setFeedback]       = useState(null);
  const [feedbackKey,    setFeedbackKey]    = useState(0);
  const [containerSz,    setContainerSz]    = useState({ width: 1, height: 1 });

  // ── Inspect Mode State ──
  const [inspectMode,    setInspectMode]    = useState(false);
  const [inspectTooltip, setInspectTooltip] = useState('');
  const inspectTimerRef  = useRef(null);

  // ── Image Container Ref (used for drag hit detection) ──
  const containerLayout  = useRef({ px: 0, py: 0, width: 1, height: 1 });
  const containerViewRef = useRef(null);


  /* ──────────────────────────────────────────────────────
     LIFECYCLE: Reset state when levelIndex changes.
     This fires when navigation.replace() delivers a new
     levelIndex via route.params.
  ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (current.type === 'spot' && current.bugs) {
      setBugStates(current.bugs.map(b => ({ ...b, isFixed: false })));
    }
    setPlacedMap({});
    setShowComplete(false);
    setInspectMode(false);
    setInspectTooltip('');
  }, [levelIndex]);

  // Listen for a "reset" param sent from the Completion screen's "Play Again" button
  useEffect(() => {
    if (route.params?.reset) {
      redo();
      navigation.setParams({ reset: undefined });
    }
  }, [route.params?.reset]);

  // Clean up the inspect auto-dismiss timer when the screen unmounts
  useEffect(() => () => clearTimeout(inspectTimerRef.current), []);


  /* ──────────────────────────────────────────────────────
     LAYOUT: Measure the image container after it renders.
     The x/y/w/h values are stored in containerLayout ref
     so DraggableIcon can convert screen coords to fractions.
  ────────────────────────────────────────────────────── */
  const onContainerLayout = useCallback(() => {
    if (containerViewRef.current) {
      containerViewRef.current.measureInWindow((x, y, w, h) => {
        containerLayout.current = { px: x, py: y, width: w, height: h };
        setContainerSz({ width: w, height: h });
      });
    }
  }, []);


  /* ──────────────────────────────────────────────────────
     FEEDBACK FLASH: Triggers the full-screen ✓/✗ overlay.
     Uses a key to force re-mount (and restart the animation)
     even if the same type fires twice in a row.
  ────────────────────────────────────────────────────── */
  const triggerFeedback = (type) => {
    setFeedbackKey(k => k + 1);
    setFeedback(type);
    setTimeout(() => setFeedback(null), 700);
  };


  /* ──────────────────────────────────────────────────────
     INSPECT MODE
     toggleInspectMode — flips the boolean; clears tooltip on exit.
     showInspectTooltip — sets the tooltip text and starts a 5s
                          auto-dismiss timer.
     dismissInspectTooltip — manual ✕ dismiss.
  ────────────────────────────────────────────────────── */
  const toggleInspectMode = () => {
    setInspectMode(prev => {
      if (prev) setInspectTooltip('');
      return !prev;
    });
  };

  const showInspectTooltip = (text) => {
    clearTimeout(inspectTimerRef.current);
    setInspectTooltip(text);
    inspectTimerRef.current = setTimeout(() => setInspectTooltip(''), 5000);
  };

  const dismissInspectTooltip = () => {
    clearTimeout(inspectTimerRef.current);
    setInspectTooltip('');
  };


  /* ──────────────────────────────────────────────────────
     GAME MECHANIC: Spot the Bug (Level 3)
     Tapping a bug zone either:
       • INSPECT MODE ON  → shows the bug's description
       • INSPECT MODE OFF → marks the bug as fixed,
                            plays audio, triggers feedback flash,
                            and checks if all bugs are fixed
                            (→ shows completion popup after 600ms)
  ────────────────────────────────────────────────────── */
  const handleSpotTap = (id) => {
    if (inspectMode) {
      const bug = bugStates.find(b => b.id === id);
      if (bug) showInspectTooltip(bug.description || bug.hint);
      return;
    }

    const updated = bugStates.map(bug =>
      bug.id === id ? { ...bug, isFixed: true } : bug
    );
    setBugStates(updated);
    AudioManager.playCorrect();
    triggerFeedback('correct');

    if (updated.every(b => b.isFixed)) {
      setTimeout(() => setShowComplete(true), 600);
    }
  };


  /* ──────────────────────────────────────────────────────
     GAME MECHANIC: Drag and Drop (Levels 1 & 2)
     Called by DraggableIcon when a drop lands on a zone.
     correct = true if itemId matches the zone's id.
     Stores the result in placedMap and checks for level
     completion (all placeholders correctly filled).
  ────────────────────────────────────────────────────── */
  const handleDrop = useCallback((itemId, zoneId) => {
    const correct = zoneId === itemId;

    if (correct) AudioManager.playCorrect();
    else         AudioManager.playWrong();
    triggerFeedback(correct ? 'correct' : 'wrong');

    setPlacedMap(prev => {
      const inventoryItem = current.inventory.find(i => i.id === itemId);
      const next = {
        ...prev,
        [zoneId]: { src: inventoryItem?.src, correct, itemId, description: inventoryItem?.description },
      };

      if (current.placeholders.every(p => next[p.id]?.correct)) {
        setTimeout(() => setShowComplete(true), 550);
      }
      return next;
    });
  }, [current]);


  /* ──────────────────────────────────────────────────────
     HINT: Shows the first unfixed/incomplete item's hint
     as a floating pill for 3.5 seconds.
  ────────────────────────────────────────────────────── */
  const showHint = () => {
    if (current.type === 'spot') {
      const unfixed = bugStates.find(b => !b.isFixed);
      if (unfixed) setHint(unfixed.hint);
    } else {
      const missing = current.placeholders.find(p => !placedMap[p.id]?.correct);
      if (missing) setHint(missing.hint);
    }
    setTimeout(() => setHint(''), 3500);
  };


  /* ──────────────────────────────────────────────────────
     REDO: Resets the current level to its initial state.
     Called from: Completion popup "Redo" / InGameMenu "Restart".
  ────────────────────────────────────────────────────── */
  const redo = () => {
    setPlacedMap({});
    if (current.type === 'spot') setBugStates(current.bugs.map(b => ({ ...b, isFixed: false })));
    setShowComplete(false);
    setMenuVisible(false);
    setHint('');
    setInspectMode(false);
    setInspectTooltip('');
  };


  /* ──────────────────────────────────────────────────────
     NEXT LEVEL / FINISH
     Called from: Completion popup "Next →" or "Finish".

     If there are more levels → navigation.replace() to the
     same screen with the incremented levelIndex.
     replace() is used so the back button does NOT return
     to the previous level.

     If all levels done → navigation.navigate('Completion')
     to the global win screen, passing the game ID so it
     can display the correct completion message.
  ────────────────────────────────────────────────────── */
  const nextLevel = () => {
    setShowComplete(false);
    const nextIdx = levelIndex + 1;

    if (nextIdx < LEVELS.length) {
      // ✅ replace() keeps the stack clean — no going back to a completed level
      navigation.replace('DebugGame', { levelIndex: nextIdx });
    } else {
      // ✅ navigate() adds Completion to the stack (normal back behavior from there)
      navigation.navigate('Completion', { gameId: 'DebugInterface' });
    }
  };


  // ── Derived display values ──
  const placedCount = current.type === 'spot'
    ? bugStates.filter(b => b.isFixed).length
    : Object.values(placedMap).filter(v => v?.correct).length;
  const totalCount = current.type === 'spot' ? bugStates.length : current.placeholders.length;
  const allDone    = placedCount === totalCount;


  /* ──────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgBlob} />

        {/* Flash overlay on correct/wrong action */}
        {feedback && <FeedbackFlash key={feedbackKey} type={feedback} />}

        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Back → navigates to Menu (does NOT pop to previous level) */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>{current.name}</Text>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
            <Text style={styles.menuText}>Menu</Text>
          </TouchableOpacity>
        </View>

        {/* ── PROGRESS BANNER ── */}
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

        {/* ── INSPECT MODE BANNER (visible only when active) ── */}
        {inspectMode && (
          <View style={styles.inspectModeBanner}>
            <Text style={styles.inspectModeBannerText}>🔍  INSPECT MODE  —  Tap any element to learn about it</Text>
          </View>
        )}

        {/* ── HINT PILL (auto-dismisses after 3.5s) ── */}
        {hint !== '' && (
          <View style={styles.hintWrapper}>
            <Text style={styles.hintText}>💡 {hint}</Text>
          </View>
        )}

        {/* ── INSPECT TOOLTIP CARD (slides in, auto-dismisses after 5s) ── */}
        {inspectTooltip !== '' && (
          <InspectTooltip text={inspectTooltip} onDismiss={dismissInspectTooltip} />
        )}

        {/* ── GAME AREA ── */}
        <View style={styles.gameArea}>

          {current.type === 'drag' ? (
            /* ── LEVELS 1 & 2: Drag-and-Drop ── */
            <>
              {/* Image canvas with placeholder drop-zones */}
              <View style={styles.topCanvas}>
                <View
                  ref={containerViewRef}
                  onLayout={onContainerLayout}
                  style={[styles.imageContainer, { aspectRatio: current.aspectRatio || 1.13, width: '100%', alignSelf: 'center' }]}
                >
                  <ImageBackground source={current.bgImage} style={StyleSheet.absoluteFill} resizeMode="contain" />
                  {current.placeholders.map(ph => (
                    <PlaceholderZone
                      key={ph.id}
                      ph={ph}
                      placedItem={placedMap[ph.id] ?? null}
                      containerW={containerSz.width}
                      containerH={containerSz.height}
                      inspectMode={inspectMode}
                      onInspect={showInspectTooltip}
                    />
                  ))}
                </View>
              </View>

              {/* Inventory tray — icons to drag from */}
              <View style={styles.bottomCanvas}>
                <Text style={styles.inventoryLabel}>
                  {inspectMode ? '🔍  TAP AN ICON TO INSPECT IT' : 'DRAG AN ICON UP ↑'}
                </Text>
                <View style={styles.inventoryRow}>
                  {current.inventory.map(item => {
                    const isCorrectlyPlaced = Object.values(placedMap).some(v => v.itemId === item.id && v.correct);
                    if (isCorrectlyPlaced) return <View key={item.id} style={styles.emptySlot} />;
                    return (
                      <DraggableIcon
                        key={item.id}
                        item={item}
                        placeholders={current.placeholders}
                        containerViewRef={containerViewRef}
                        containerLayout={containerLayout}
                        onDrop={handleDrop}
                        inspectMode={inspectMode}
                        onInspect={showInspectTooltip}
                      />
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            /* ── LEVEL 3: Spot the Bug ── */
            <View style={styles.topCanvas}>
              <View
                ref={containerViewRef}
                onLayout={onContainerLayout}
                style={[styles.imageContainer, {
                  aspectRatio: current.aspectRatio || 1.15,
                  width: '95%', maxHeight: SCREEN_WIDTH * 1.25 * 0.9,
                  alignSelf: 'center', minHeight: 370,
                }]}
              >
                <ImageBackground
                  source={current.bgImage}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  imageStyle={{ borderRadius: 16 }}
                />

                {/* Render each bug as a tappable zone */}
                {bugStates.map(bug => {
                  const cx = bug.leftPct * containerSz.width;
                  const cy = bug.topPct  * containerSz.height;
                  const W  = bug.phWidth  || 80;
                  const H  = bug.phHeight || 40;

                  // Inspect mode uses blue; fixed = green; unfixed = subtle red
                  const borderCol = inspectMode ? '#4A90E2' : (bug.isFixed ? '#48C78E' : 'rgba(255,248,248,0.24)');
                  const bgCol     = inspectMode ? 'rgba(74,144,226,0.12)' : (bug.isFixed ? 'rgba(72,199,142,0.25)' : 'rgba(255,255,255,0.01)');

                  return (
                    <TouchableOpacity
                      key={bug.id}
                      style={{
                        position: 'absolute',
                        left: cx - W / 2, top: cy - H / 2,
                        width: W, height: H,
                        borderRadius: 8,
                        backgroundColor: bgCol,
                        borderColor: borderCol,
                        borderWidth: (bug.isFixed || inspectMode) ? 3 : 1.5,
                        borderStyle: (bug.isFixed || inspectMode) ? 'solid' : 'dashed',
                        justifyContent: 'center', alignItems: 'center',
                        elevation: 15,
                      }}
                      onPress={() => handleSpotTap(bug.id)}
                      disabled={bug.isFixed && !inspectMode}
                      activeOpacity={0.7}
                    >
                      {bug.isFixed && !inspectMode && (
                        <View style={styles.checkBadge}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                        </View>
                      )}
                      {inspectMode && <Text style={{ fontSize: 9, color: '#4A90E2', fontWeight: '700' }}>🔍</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ── BOTTOM ACTION BAR ── */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>

            {/* Specs: shows the level task description in an alert */}
            <TouchableOpacity style={styles.actionIcon} onPress={() => Alert.alert('Task', current.desc)}>
              <Image source={TOOLBAR_ICONS.specs} style={styles.toolbarImg} resizeMode="contain" />
            </TouchableOpacity>

            {/* Hint: reveals a contextual hint for the next unsolved item */}
            <TouchableOpacity style={styles.actionIconCenter} onPress={showHint}>
              <Image source={TOOLBAR_ICONS.hint} style={styles.toolbarImgCenter} resizeMode="contain" />
            </TouchableOpacity>

            {/* Inspect: toggles Inspect Mode on/off; glows blue when active */}
            <TouchableOpacity
              style={[styles.actionIcon, inspectMode && styles.actionIconActive]}
              onPress={toggleInspectMode}
            >
              <Image source={TOOLBAR_ICONS.inspect} style={styles.toolbarImg} resizeMode="contain" />
              {inspectMode && <View style={styles.activeIndicatorDot} />}
            </TouchableOpacity>

          </View>
        </View>

        {/* ── IN-GAME MENU OVERLAY ── */}
        {/* Provides Restart (redo) and Home (navigate to Menu) */}
        <InGameMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onRestart={redo}
          onHome={() => navigation.navigate('Menu')}
        />

        {/* ── LEVEL COMPLETION POPUP ── */}
        {showComplete && (
          <View style={styles.overlay}>
            <View style={styles.popup}>
              <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 8 }}>🎉</Text>
              <Text style={styles.popupTitle}>Level Complete!</Text>
              <Text style={styles.popupSub}>Interface is fully functional.</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                {[0, 1, 2].map(i => <Text key={i} style={{ fontSize: 26 }}>⭐</Text>)}
              </View>
              <View style={styles.popupBtnRow}>
                {/* Redo: resets current level state */}
                <TouchableOpacity style={styles.popupBtnOutline} onPress={redo}>
                  <Text style={styles.popupBtnOutlineTxt}>Redo</Text>
                </TouchableOpacity>
                {/* Next: advances to next level OR goes to Completion screen */}
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


/* =============================================================
   STACK NAVIGATOR: DebugInterfaceStack
   Purpose  : Wraps DebugGameScreen in a native stack and
              handles the Android hardware back button.

   NAVIGATION DECISIONS
   ─────────────────────────────────────────────────────────
   • headerShown: false → the game screen manages its own header.

   • BackHandler intercept → pressing the Android back button
     anywhere inside this stack routes to 'Menu' and returns
     true to prevent the default pop behavior.
     This means the player can never accidentally go back to a
     level they've already completed.

   • initialParams: { levelIndex: 0 } → the game always boots
     at Level 1. Subsequent levels are loaded via
     navigation.replace('DebugGame', { levelIndex: N }).
============================================================= */
const Stack = createNativeStackNavigator();

export default function DebugInterfaceStack({ navigation }) {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Menu'); // Always go to Menu, never pop to a previous level
        return true;                 // true = event consumed, default pop is suppressed
      }
    );
    return () => backHandler.remove(); // Clean up listener on unmount
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DebugGame"
        component={DebugGameScreen}
        initialParams={{ levelIndex: 0 }}
      />
    </Stack.Navigator>
  );
}


/* =============================================================
   STYLES
============================================================= */
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#F4F5EB' },
  container: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', position: 'relative' },
  bgBlob:    { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#CDE5F7' },

  // ── Header ──
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 12, zIndex: 1 },
  iconBtn:   { width: 50, height: 40, backgroundColor: '#FFF', borderWidth: 1.5, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  iconText:  { fontSize: 20, fontWeight: '600' },
  titleText: { flex: 1, paddingLeft: 15, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  menuBtn:   { backgroundColor: '#A6D5FA', borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 15 },
  menuText:  { fontSize: 14, fontWeight: '500' },

  // ── Progress Banner ──
  bannerContainer: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 4, zIndex: 1 },
  errorPill:       { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center', width: '100%', marginBottom: 4, elevation: 2 },
  dot:             { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  errorText:       { fontSize: 10, letterSpacing: 1, color: '#666', fontWeight: '600' },
  instructionText: { fontSize: 12, color: '#888', letterSpacing: 0.5 },

  // ── Hint Pill ──
  hintWrapper: {
    backgroundColor: '#FFFAF0', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#F6E05E',
    alignSelf: 'center', marginBottom: 8, zIndex: 100, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3,
  },
  hintText: { color: '#B7791F', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // ── Inspect Mode Banner ──
  inspectModeBanner: {
    marginHorizontal: 20, marginBottom: 6, backgroundColor: '#EBF4FF',
    borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#4A90E2', alignItems: 'center', zIndex: 90,
  },
  inspectModeBannerText: { fontSize: 11, fontWeight: '700', color: '#2B6CB0', letterSpacing: 0.4 },

  // ── Inspect Tooltip Card ──
  inspectTooltip: {
    position: 'absolute', top: 160, left: 20, right: 20,
    backgroundColor: '#1A202C', borderRadius: 14, padding: 14,
    zIndex: 300, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  inspectTooltipHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inspectTooltipLabel:   { fontSize: 11, fontWeight: '800', color: '#90CDF4', letterSpacing: 1.2 },
  inspectTooltipClose:   { fontSize: 15, color: '#A0AEC0', fontWeight: '600' },
  inspectTooltipBody:    { fontSize: 13, color: '#E2E8F0', lineHeight: 20, fontWeight: '500' },

  // ── Inspect Badge (tiny 🔍 dot on icons) ──
  inspectBadge: {
    position: 'absolute', top: -5, right: -5, width: 14, height: 14,
    borderRadius: 7, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center',
  },

  // ── Game Area ──
  gameArea:       { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  topCanvas:      { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 12, padding: 8, elevation: 2, zIndex: 1 },
  imageContainer: { width: '100%', position: 'relative' },

  // ── Placeholder Drop-Zone ──
  placeholder: { position: 'absolute', borderWidth: 2, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkBadge:  { position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#48C78E', justifyContent: 'center', alignItems: 'center' },

  // ── Inventory Tray ──
  bottomCanvas:   { backgroundColor: '#FFF', borderRadius: 15, marginBottom: 12, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', zIndex: 50, elevation: 10 },
  inventoryLabel: { fontSize: 9, letterSpacing: 1.5, color: '#A0AEC0', marginBottom: 10, fontWeight: '600' },
  inventoryRow:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },

  // ── Draggable Icon ──
  draggableItem:        { width: 52, height: 52, backgroundColor: '#F0F4F8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  draggableItemInspect: { borderWidth: 2, borderColor: '#4A90E2', borderStyle: 'dashed', position: 'relative' },
  iconImage:            { width: 30, height: 30 },
  emptySlot:            { width: 52, height: 52 },

  // ── Bottom Action Bar ──
  bottomBar:          { paddingHorizontal: 20, paddingBottom: 20 },
  bottomBarInner:     { flexDirection: 'row', backgroundColor: '#8BCBFF', borderRadius: 15, height: 70, justifyContent: 'space-evenly', alignItems: 'center', elevation: 4 },
  actionIcon:         { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  actionIconActive:   { borderWidth: 2.5, borderColor: '#4A90E2', backgroundColor: '#EBF4FF' },
  activeIndicatorDot: { position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: '#4A90E2', borderWidth: 1.5, borderColor: '#FFF' },
  actionIconCenter:   { width: 60, height: 60, backgroundColor: '#FFF', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  toolbarImg:         { width: 24, height: 24 },
  toolbarImgCenter:   { width: 30, height: 30 },

  // ── Completion Popup ──
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