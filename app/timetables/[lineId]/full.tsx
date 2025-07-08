export const unstable_settings = {
  drawer: null,
};

import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import directions from '../../../assets/data/directions.json';
import routes from '../../../assets/data/routes.json';
import stopTimes from '../../../assets/data/stop_times.json';
import stops from '../../../assets/data/stops.json';
import trips from '../../../assets/data/trips.json';
import { useTheme } from '../../../context/ThemeContext';

export default function FullTimetableScreen() {
  const { lineId } = useLocalSearchParams();
  const { isDarkMode } = useTheme();

const routeIndex = routes.findIndex(route => route.route_ref === lineId);

if (routeIndex === -1) {
  return (
    <View style={{ padding: 16 }}>
      <Text>Линията {lineId} не е намерена.</Text>
    </View>
  );
}


  const [selectedDirection, setSelectedDirection] = useState<number | null>(null);
  const [isWeekend, setIsWeekend] = useState(() => {
  const day = new Date().getDay();
  return day === 0 || day === 6;
});
const toggleWeekend = () => setIsWeekend((prev) => !prev);

  // Всички направления за тази линия (route)
  const directionsForRoute = useMemo(() => {
    const dirSet = new Set<number>();
    trips.forEach((trip: any) => {
      if (trip.route_index === routeIndex && trip.is_weekend === isWeekend) {
        dirSet.add(trip.direction);
      }
    });
    return Array.from(dirSet);
  }, [routeIndex, isWeekend]);

  // Избраното направление (ако още няма - взимаме първото)
  const currentDirection = selectedDirection ?? directionsForRoute[0];

  // Всички пътувания за тази линия, посока и дали е уикенд
  const relevantTrips = trips
    .map((trip, i) => ({ ...trip, index: i }))
    .filter((trip) =>
      trip.route_index === routeIndex &&
      trip.direction === currentDirection &&
      trip.is_weekend === isWeekend
    );

  // Всички спирки за избраното направление
  const stopIds = useMemo(() => {
    const dir = directions.find(d => d.code === currentDirection);
    return dir?.stops || [];
  }, [currentDirection]);

  // Функция за преобразуване от минути към hh:mm
  const getTimeFromMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  };

  // Изчисляване на разписания за всяка спирка
  const stopTimetables = stopIds.map((stopId, stopIdx) => {
    const stop = stops.find((s) => s.code === stopId);
    if (!stop) return null;

const times: string[] = [];

relevantTrips.forEach((trip) => {
  const allStopsForTrip = stopTimes.filter((s) => s.trip === trip.index);
  allStopsForTrip.forEach((st) => {
    const time = st?.times?.[stopIdx];
    if (time != null) {
      times.push(getTimeFromMinutes(time));
    }
  });
});


    times.sort();

    return (
      <View key={stopId} style={{ marginBottom: 24 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: isDarkMode ? '#fff' : '#000' }}>
          {stop.names.bg}
        </Text>
        <ScrollView horizontal>
          <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>{times.join(', ')}</Text>
      </ScrollView>

      </View>
    );
  });

  const getDirectionLabel = (direction: number) => {
    const dir = directions.find((d) => d.code === direction);
    if (!dir || !dir.stops || dir.stops.length === 0) return `Посока ${direction}`;

    const firstStop = stops.find(s => s.code === dir.stops[0]);
    const lastStop = stops.find(s => s.code === dir.stops[dir.stops.length - 1]);

    if (!firstStop || !lastStop) return `Посока ${direction}`;

    return `Посока ${firstStop.names.bg} - ${lastStop.names.bg}`;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: isDarkMode ? '#fff' : '#000' }}>
        {routes[routeIndex]?.route_ref} — Пълно разписание ({isWeekend ? 'Уикенд' : 'Делник'})
      </Text>

      <Text style={{ marginBottom: 6, color: isDarkMode ? '#fff' : '#000' }}>Избери посока:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, marginRight: 8, color: isDarkMode ? '#fff' : '#000' }}>
          {isWeekend ? 'Уикенд' : 'Делник'}
        </Text>
        <Switch value={isWeekend} onValueChange={toggleWeekend} />
      </View>

      <View style={{ borderWidth: 1, borderColor: isDarkMode ? '#333' : '#ccc', marginBottom: 16 }}>
        <Picker
          selectedValue={currentDirection}
          onValueChange={(itemValue) => setSelectedDirection(itemValue)}
          style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }}
          dropdownIconColor={isDarkMode ? '#fff' : '#000'}
        >
          {directionsForRoute.map((dirCode) => (
            <Picker.Item 
              key={dirCode} 
              label={getDirectionLabel(dirCode)} 
              value={dirCode} 
              color={isDarkMode ? '#fff' : '#000'}
            />
          ))}
        </Picker>
      </View>

      {stopTimetables.map((stopView, idx) => stopView && React.cloneElement(stopView, {
        style: { ...(stopView.props.style || {}), backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }
      }))}
    </ScrollView>
  );
} 