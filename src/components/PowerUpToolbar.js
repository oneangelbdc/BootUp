import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export default function PowerUpToolbar({ onHint, onHelp, onInspect }) {
  return (
    <View style={styles.toolbar}>
      <TouchableOpacity style={styles.btn} onPress={onHint}>
        <Text style={styles.icon}>📋</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onHelp}>
        <Text style={styles.icon}>💡</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onInspect}>
        <Text style={styles.icon}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.toolbar,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 4,
  },
  btn: { padding: 8 },
  icon: { fontSize: 28 },
});