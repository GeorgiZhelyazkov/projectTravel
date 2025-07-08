import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import directions from '../../../assets/data/directions.json';
import routes from '../../../assets/data/routes.json';
import stopTimes from '../../../assets/data/stop_times.json';
import stops from '../../../assets/data/stops.json';
import trips from '../../../assets/data/trips.json';
import { useTheme } from '../../../context/ThemeContext';

export default function TimetableDirectionScreen() {
  const { lineId, direction } = useLocalSearchParams();
  const { isDarkMode } = useTheme();

  const routeIndex = routes.findIndex(route => route.route_ref === lineId);

  if (routeIndex === -1) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.errorText, isDarkMode && styles.darkText]}>Линията {lineId} не е намерена.</Text>
      </View>
    );
  }

  const [isWeekend, setIsWeekend] = useState(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  });

  const toggleWeekend = () => setIsWeekend((prev) => !prev);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const availableDirections = useMemo(() => {
    const set = new Set<number>();
    trips.forEach((trip) => {
      if (trip.route_index === routeIndex && trip.is_weekend === isWeekend) {
        set.add(trip.direction);
      }
    });
    return Array.from(set);
  }, [routeIndex, isWeekend]);

  const [directionIndex, setDirectionIndex] = useState(0);
  const currentDirection = availableDirections[directionIndex];

  const tripsForDirection = useMemo(() => {
    return trips
      .map((trip, index) => ({ ...trip, index }))
      .filter(
        (trip) =>
          trip.route_index === routeIndex &&
          trip.direction === currentDirection &&
          trip.is_weekend === isWeekend
      );
  }, [routeIndex, currentDirection, isWeekend]);

  const stopIds = useMemo(() => {
    const dir = directions.find((d) => d.code === currentDirection);
    return dir?.stops || [];
  }, [currentDirection]);

  const getTimeFromMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const stopTimetables = stopIds.map((stopId, stopIdx) => {
    const stop = stops.find((s) => s.code === stopId);
    if (!stop) return null;

    const upcomingTimes: string[] = [];

    tripsForDirection.forEach((trip) => {
      const allTimesForTrip = stopTimes.filter((s) => s.trip === trip.index);
      allTimesForTrip.forEach((stopTime) => {
        const time = stopTime?.times?.[stopIdx];
        if (typeof time === 'number' && time >= nowMinutes) {
          upcomingTimes.push(getTimeFromMinutes(time));
        }
      });
    });

    upcomingTimes.sort();

    if (upcomingTimes.length === 0) return null;

    return (
      <View key={stopId} style={[styles.stopContainer, isDarkMode && styles.darkStopContainer]}>
        <Text style={[styles.stopName, isDarkMode && styles.darkText]}>
          {stop.names.bg}
        </Text>
        <ScrollView horizontal>
          <Text style={[styles.timesText, isDarkMode && styles.darkText]}>{upcomingTimes.join(', ')}</Text>
        </ScrollView>
      </View>
    );
  });

  const changeDirection = () => {
    setDirectionIndex((prev) => (prev + 1) % availableDirections.length);
  };

  const goToFullSchedule = () => {
    router.push(`/timetables/${lineId}/full`);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, isDarkMode && styles.darkContainer]}
    >
      <Text style={[styles.title, isDarkMode && styles.darkText]}>
        {routes[routeIndex]?.route_ref} — Предстоящи курсове (
        {isWeekend ? 'Уикенд' : 'Делник'})
      </Text>

      <View style={[styles.switchContainer, isDarkMode && styles.darkSwitchContainer]}>
        <Text style={[styles.switchLabel, isDarkMode && styles.darkText]}>
          {isWeekend ? 'Уикенд' : 'Делник'}
        </Text>
        <Switch 
          value={isWeekend} 
          onValueChange={toggleWeekend}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isWeekend ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>

      <Pressable
        onPress={changeDirection}
        style={[styles.directionButton, isDarkMode && styles.darkDirectionButton]}
      >
        <Text style={[styles.directionButtonText, isDarkMode && styles.darkText]}>Смени посоката</Text>
      </Pressable>

      {stopTimetables.filter(Boolean).length > 0 ? (
        stopTimetables
      ) : (
        <Text style={[styles.noTripsText, isDarkMode && styles.darkText]}>Няма предстоящи курсове за тази посока.</Text>
      )}

      <Pressable
        onPress={goToFullSchedule}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          Виж пълно разписание
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.push(`/map/${lineId}/${direction}`);
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          🗺 Покажи маршрута на картата
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: 16,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  darkSwitchContainer: {
    backgroundColor: '#333',
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#000',
  },
  directionButton: {
    padding: 8,
    backgroundColor: '#ddd',
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  darkDirectionButton: {
    backgroundColor: '#444',
  },
  directionButtonText: {
    color: '#000',
  },
  stopContainer: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  darkStopContainer: {
    backgroundColor: '#333',
  },
  stopName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  timesText: {
    color: '#000',
  },
  noTripsText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#900',
    fontSize: 16,
  },
});