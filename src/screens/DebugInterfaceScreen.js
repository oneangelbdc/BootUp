import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions, Alert
} from 'react-native';
import { theme } from '../styles/theme';
import PowerUpToolbar from '../components/PowerUpToolbar';
import InGameMenu from '../components/InGameMenu';

const { width } = Dimensions.get('window');

const initialBugs = [
  {
    id: 1, label: 'SAVE Button',
    broken: { bg: '#E53E3E', text: '💾 SAVE' },
    fixed: { bg: '#48BB78', text: '💾 SAVE' },
    hint: 'Save buttons should be green, not red!',
    isFixed: false,
  },
  {
    id: 2, label: 'File Explorer Icon',
    broken: { bg: '#E2E8F0', text: '❓' },
    fixed: { bg: '#E2E8F0', text: '📁' },
    hint: 'The File Explorer icon is missing!',
    isFixed: false,
  },
  {
    id: 3, label: 'DELETE Button',
    broken: { bg: '#48BB78', text: 'DELETE' },
    fixed: { bg: '#E53E3E', text: 'DELETE' },
    hint: 'Delete buttons should be red, not green!',
    isFixed: false,
  },
  {
    id: 4, label: 'Chrome Label',
    broken: { bg: '#E2E8F0', text: 'Opera' },
    fixed: { bg: '#E2E8F0', text: 'Chrome' },
    hint: 'That icon is Chrome, not Opera!',
    isFixed: false,
  },
];

export default function DebugInterfaceScreen({ navigation }) {
  const [bugs, setBugs] = useState(initialBugs);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const fixedCount = bugs.filter(b => b.isFixed).length;

  const handleTap = (id) => {
    const updated = bugs.map(bug =>
      bug.id === id ? { ...bug, isFixed: true } : bug
    );
    setBugs(updated);
    if (updated.every(b => b.isFixed)) {
      setTimeout(() => {
        navigation.navigate('Completion', { gameId: 'DebugInterface' });
      }, 600);
    }
  };

  const handleHint = () => {
    const unfixed = bugs.find(b => !b.isFixed);
    if (unfixed) setHintText(unfixed.hint);
    setTimeout(() => setHintText(''), 3000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}
          onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.backText}>← Debug the Interface</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}
          onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusDot,
          { backgroundColor: fixedCount === 4
            ? theme.colors.success : '#E53E3E' }]} />
        <Text style={styles.statusText}>
          {fixedCount === 4
            ? 'ALL BUGS FIXED! ✅'
            : `ERRORS DETECTED — ${fixedCount}/4 FIXED — TAP TO FIX`}
        </Text>
      </View>
      <Text style={styles.instruction}>
        Find and fix all 4 bugs in the interface below!
      </Text>

      {hintText ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 {hintText}</Text>
        </View>
      ) : null}

      <View style={styles.interfaceBox}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.bugBtn,
              { backgroundColor: bugs[0].isFixed
                ? bugs[0].fixed.bg : bugs[0].broken.bg }]}
            onPress={() => !bugs[0].isFixed && handleTap(1)}
            disabled={bugs[0].isFixed}>
            <Text style={styles.bugBtnText}>
              {bugs[0].isFixed ? bugs[0].fixed.text : bugs[0].broken.text}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBox,
              { backgroundColor: bugs[1].isFixed
                ? bugs[1].fixed.bg : bugs[1].broken.bg }]}
            onPress={() => !bugs[1].isFixed && handleTap(2)}
            disabled={bugs[1].isFixed}>
            <Text style={styles.iconText}>
              {bugs[1].isFixed ? bugs[1].fixed.text : bugs[1].broken.text}
            </Text>
            <Text style={styles.iconLabel}>File Explorer</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.bugBtn,
              { backgroundColor: bugs[2].isFixed
                ? bugs[2].fixed.bg : bugs[2].broken.bg }]}
            onPress={() => !bugs[2].isFixed && handleTap(3)}
            disabled={bugs[2].isFixed}>
            <Text style={styles.bugBtnText}>
              {bugs[2].isFixed ? bugs[2].fixed.text : bugs[2].broken.text}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <View style={styles.appItem}>
            <Text style={styles.appIcon}>🌐</Text>
            <TouchableOpacity
              onPress={() => !bugs[3].isFixed && handleTap(4)}
              disabled={bugs[3].isFixed}>
              <Text style={[styles.appLabel,
                { color: bugs[3].isFixed
                  ? theme.colors.success : theme.colors.error }]}>
                {bugs[3].isFixed ? bugs[3].fixed.text : bugs[3].broken.text}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <PowerUpToolbar
        onHint={handleHint}
        onHelp={() => Alert.alert('Help',
          'Tap on each broken element to fix it!')}
        onInspect={() => Alert.alert('Inspect',
          `${4 - fixedCount} bug(s) remaining.`)}
      />
      <InGameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRestart={() => { setBugs(initialBugs); setMenuVisible(false); }}
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
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
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
  hintBox: {
    backgroundColor: theme.colors.accent, marginHorizontal: 16,
    padding: 10, borderRadius: theme.radius.sm, marginBottom: 10,
  },
  hintText: { fontWeight: '600', color: theme.colors.text },
  interfaceBox: {
    backgroundColor: theme.colors.white, marginHorizontal: 16,
    borderRadius: theme.radius.md, padding: 20,
    flex: 1, marginBottom: 12, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, flexWrap: 'wrap', gap: 12,
  },
  bugBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: theme.radius.sm, elevation: 2,
  },
  bugBtnText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },
  iconBox: {
    alignItems: 'center', padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1, borderStyle: 'dashed',
    borderColor: theme.colors.textLight, minWidth: 80,
  },
  iconText: { fontSize: 28 },
  iconLabel: { fontSize: theme.fonts.small, color: theme.colors.textLight, marginTop: 4 },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appIcon: { fontSize: 28 },
  appLabel: { fontSize: 16, fontWeight: '700' },
});