export const unstable_settings = {
  drawer: null,
};

import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import directions from '../../../assets/data/directions.json';
import routes from '../../../assets/data/routes.json';
import stops from '../../../assets/data/stops.json';
import trips from '../../../assets/data/trips.json';
import { useTheme } from '../../../context/ThemeContext';

export default function TimetableScreen() {
  const { lineId } = useLocalSearchParams();
  const { isDarkMode } = useTheme();

  const routeIndex = routes.findIndex(route => route.route_ref === lineId);

  if (routeIndex === -1) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.errorText, isDarkMode && styles.darkText]}>Линията {lineId} не е намерена.</Text>
      </View>
    );
  }

  const availableDirections = Array.from(
    new Set(
      trips
        .filter(trip => trip.route_index === routeIndex)
        .map(trip => trip.direction)
    )
  );

  const handleDirectionPress = (direction: number) => {
    router.push(`/timetables/${lineId}/${direction}`);
  };

  const getDirectionLabel = (direction: number) => {
    const dir = directions.find((d) => d.code === direction);
    if (!dir || !dir.stops || dir.stops.length === 0) return `Посока ${direction}`;

    const firstStop = stops.find(s => s.code === dir.stops[0]);
    const lastStop = stops.find(s => s.code === dir.stops[dir.stops.length - 1]);

    if (!firstStop || !lastStop) return `Посока ${direction}`;

    return `Посока ${firstStop.names.bg} - ${lastStop.names.bg}`;
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          {routes[routeIndex]?.route_ref} — Избери посока:
        </Text>

        {availableDirections.map((direction) => {
          const dir = directions.find((d) => d.code === direction);
          if (!dir) return null;

          return (
            <Pressable
              key={direction}
              onPress={() => handleDirectionPress(direction)}
              style={[styles.directionButton, isDarkMode && styles.darkDirectionButton]}
            >
              <Text style={[styles.directionButtonText, isDarkMode && styles.darkText]}>
                {getDirectionLabel(direction)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    padding: 16,
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
  directionButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  darkDirectionButton: {
    backgroundColor: '#333',
  },
  directionButtonText: {
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    color: '#900',
    fontSize: 16,
  },
});
