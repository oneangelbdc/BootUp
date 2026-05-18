import React, { useEffect } from 'react';
import { NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';
import { theme } from '../src/styles/theme';
import AudioManager from '../src/utils/AudioManager';
import StartScreen from '../src/screens/StartScreen';
import MenuScreen from '../src/screens/MenuScreen';
import BuildThePCScreen from '../src/screens/BuildThePCScreen';
import CircuitConnectScreen from '../src/screens/CircuitConnectScreen';
import DebugInterfaceScreen from '../src/screens/DebugInterfaceScreen';
import CompletionScreen from '../src/screens/CompletionScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    AudioManager.playBGM(require('../src/assets/sounds/bg_music.mp3'));
    return () => {
      AudioManager.stopBGM();
    };
  }, []);

  return (
    <NavigationIndependentTree>
      <Stack.Navigator 
        initialRouteName="Start"
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        }}
      >
        {/* StartScreen: No header */}
        <Stack.Screen
          name="Start"
          component={StartScreen}
          options={{ headerShown: false }}
        />
        
        {/* MenuScreen: Back button goes to Start */}
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'Menu',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Start')}
                style={{ marginLeft: 16, padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 22, fontWeight: '600', color: theme.colors.text }}>←</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        {/* Game screens: Back button goes to Menu */}
        <Stack.Screen
          name="BuildThePC"
          component={BuildThePCScreen}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'BuildThePC',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Menu')}
                style={{ marginLeft: 16, padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 22, fontWeight: '600', color: theme.colors.text }}>←</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="CircuitConnect"
          component={CircuitConnectScreen}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'CircuitConnect',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Menu')}
                style={{ marginLeft: 16, padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 22, fontWeight: '600', color: theme.colors.text }}>←</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="DebugInterface"
          component={DebugInterfaceScreen}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitle: 'DebugInterface',
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Menu')}
                style={{ marginLeft: 16, padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 22, fontWeight: '600', color: theme.colors.text }}>←</Text>
              </TouchableOpacity>
            ),
          })}
        />
        
        {/* CompletionScreen: No header */}
        <Stack.Screen
          name="Completion"
          component={CompletionScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationIndependentTree>
  );
}