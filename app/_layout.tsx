import { usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function ThemedDrawer() {
  const pathname = usePathname();
  const isRouteScreen = pathname === '/route';
  const isRouteMapScreen = pathname === '/routeMap';
  const isStopDetailsScreen = pathname.startsWith('/stops/');
  const { isDarkMode } = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
        },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        drawerStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
        },
        drawerLabelStyle: {
          color: isDarkMode ? '#fff' : '#000',
        },
        drawerActiveTintColor: isDarkMode ? '#81b0ff' : '#2196F3',
        drawerInactiveTintColor: isDarkMode ? '#ccc' : '#666',
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Начало' }} />
      <Drawer.Screen name="map" options={{ 
        title: 'Карта',
        headerShown: true,
      }} />
      <Drawer.Screen
        name="favorites"
        options={{
          title: 'Любими',
          headerShown: true, 
        }}
      />
      <Drawer.Screen
        name="timetables"
        options={{
          title: 'Разписания',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="recent"
        options={{
          title: 'Скорошни',
          headerShown: true,
        }}
      />
      <Drawer.Screen name="route" options={{ 
        title: 'Маршрут',
        headerShown: true,
        drawerItemStyle: { display: isRouteScreen ? 'flex' : 'none' },
       }} />
      <Drawer.Screen name="routeMap" options={{ 
        title: 'Карта на маршрута',
        headerShown: true,
        drawerItemStyle: { display: isRouteMapScreen ? 'flex' : 'none' },
       }} />
      <Drawer.Screen
        name="stops"
        options={{
          title: 'Детайли за спирка',
          headerShown: true,
          drawerItemStyle: { display: isStopDetailsScreen ? 'flex' : 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Настройки',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="utils/storage"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Only run in development and only on web/Node.js capable platforms
    if (__DEV__ && (typeof window === 'undefined' || Platform.OS === 'web')) {
      try {
        // Dynamically require child_process to avoid issues in production
        const { exec } = require('child_process');
        exec('node ./scripts/generatePrecomputedData.ts', (error, stdout, stderr) => {
          if (error) {
            console.error('Error regenerating precomputed.json:', error);
          } else {
            console.log('precomputed.json regenerated:', stdout);
          }
        });
      } catch (e) {
        // Ignore errors in production or on platforms where not supported
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <ThemedDrawer />
    </ThemeProvider>
  );
} 