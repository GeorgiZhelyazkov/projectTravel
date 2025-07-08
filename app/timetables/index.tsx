import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { addToFavorites, addToRecent, getFavorites, removeFromFavorites } from '../utils/storage';

import routes from '../../assets/data/routes.json';

export default function TimetableHome() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs.map(fav => fav.id));
  };

  const toggleFavorite = async (route: any) => {
    const routeId = route.route_ref;
    const isFavorite = favorites.includes(routeId);

    if (isFavorite) {
      await removeFromFavorites(routeId);
    } else {
      await addToFavorites({
        id: routeId,
        title: `Линия ${route.route_ref}`,
        type: 'timetable'
      });
    }

    await loadFavorites();
  };

  const handleRoutePress = async (route: any) => {
    // Add to recent items
    await addToRecent({
      id: route.route_ref,
      title: `Линия ${route.route_ref}`,
      type: 'timetable'
    });

    router.push(`/timetables/${route.route_ref}`);
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Избери линия:</Text>
      {routes.map((route, index) => (
        <View key={`${route.route_ref}-${index}`} style={styles.routeContainer}>
          <Pressable
            onPress={() => handleRoutePress(route)}
            style={[styles.button, isDarkMode && styles.darkButton]}
          >
            <Text style={[styles.buttonText, isDarkMode && styles.darkText]}>
              {route.type === 'bus' && '🚌'}
              {route.type === 'tram' && '🚋'}
              {route.type === 'trolleybus' && '🚎'}
              {route.type === 'metro' && '🚇'} Линия {route.route_ref}
            </Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => toggleFavorite(route)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={favorites.includes(route.route_ref) ? 'heart' : 'heart-outline'}
              size={24}
              color={favorites.includes(route.route_ref) ? '#ff4444' : isDarkMode ? '#999' : '#666'}
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  darkButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
  favoriteButton: {
    padding: 12,
    marginLeft: 8,
  },
});
