import React, { useEffect } from 'react';
import { NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen
          name="Start"
          component={StartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="BuildThePC" component={BuildThePCScreen} />
        <Stack.Screen name="CircuitConnect" component={CircuitConnectScreen} />
        <Stack.Screen name="DebugInterface" component={DebugInterfaceScreen} />
        <Stack.Screen name="Completion" component={CompletionScreen} />
      </Stack.Navigator>
    </NavigationIndependentTree>
  );
}