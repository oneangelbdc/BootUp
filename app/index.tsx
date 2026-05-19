import React, { useEffect, useState } from 'react';
import { NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '../src/styles/theme';
import AudioManager from '../src/utils/AudioManager';
import StartScreen from '../src/screens/StartScreen';
import MenuScreen from '../src/screens/MenuScreen';
import BuildThePCScreen from '../src/screens/BuildThePCScreen';
import CircuitConnectScreen from '../src/screens/CircuitConnectScreen';
import DebugInterfaceScreen from '../src/screens/DebugInterfaceScreen';
import CompletionScreen from '../src/screens/CompletionScreen';

const Stack = createStackNavigator();

// ✅ Prevent the splash screen from auto-hiding immediately
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // ✅ PRELOAD CRITICAL ASSETS HERE
        // 1. Fonts (if any custom fonts are used)
        // await Font.loadAsync({ ... });
        
        // 2. Critical Sounds (if AudioManager has a preload method)
        // await AudioManager.preloadCriticalSounds?.();

        // ✅ Optional: Keep splash screen visible for a brief moment for branding
        // await new Promise(resolve => setTimeout(resolve, 500));

      } catch (e) {
        console.warn('Asset preload error:', e);
      } finally {
        // ✅ Tell the app to render
        setAppIsReady(true);
        // ✅ Hide splash screen once ready
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // ✅ BGM Effect - Only play when app is ready
  useEffect(() => {
    if (appIsReady) {
      AudioManager.playBGM(require('../src/assets/sounds/bg_music.mp3'));
      return () => {
        AudioManager.stopBGM();
      };
    }
  }, [appIsReady]);

  // ✅ While loading, show nothing (SplashScreen covers the app)
  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationIndependentTree>
      <Stack.Navigator 
        initialRouteName="Start"
        screenOptions={{ headerShown: false }} // ✅ DISABLE ALL HEADERS GLOBALLY
      >
        {/* StartScreen: No header */}
        <Stack.Screen name="Start" component={StartScreen} />
        
        {/* MenuScreen: No header (custom back button handled in screen) */}
        <Stack.Screen name="Menu" component={MenuScreen} />
        
        {/* Game screens: No header (custom back buttons handled in screens) */}
        <Stack.Screen name="BuildThePC" component={BuildThePCScreen} />
        <Stack.Screen name="CircuitConnect" component={CircuitConnectScreen} />
        <Stack.Screen name="DebugInterface" component={DebugInterfaceScreen} />
        
        {/* CompletionScreen: No header */}
        <Stack.Screen name="Completion" component={CompletionScreen} />
      </Stack.Navigator>
    </NavigationIndependentTree>
  );
}