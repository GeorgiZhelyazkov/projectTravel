export const unstable_settings = {
  drawer: null,
};

import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import routes from '../../assets/data/routes.json';
import stops from '../../assets/data/stops.json';

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const stop = stops.find((s: any) => String(s.code) === stopId);

  if (!stop) {
    return <Text>Спирката не е намерена.</Text>;
  }

  const name = stop.names?.bg || 'Без име';
  const routeIndexes: number[] = stop.route_indexes || [];

  // Групиране по тип: автобус, трамвай, тролей
  const grouped: { [key: string]: string[] } = {
    bus: [],
    tram: [],
    trolley: [],
    metro: [],
    other: [],
  };

  routeIndexes.forEach((index) => {
    const route = routes[index];
    if (!route || !route.route_ref) return;

    const line = route.route_ref;
    const type = route.type;

    if (type === 'bus') grouped.bus.push(line);
    else if (type === 'tram') grouped.tram.push(line);
    else if (type === 'trolley') grouped.trolley.push(line);
    else if (type === 'metro') grouped.metro.push(line);
    else grouped.other.push(line);
  });

  const renderLine = (lineId: string, index: number) => (
    <Pressable
      key={`line-${lineId}-${index}`}
      onPress={() => router.push(`/timetables/${lineId}/index`)}
      style={{
        backgroundColor: '#eee',
        padding: 8,
        marginVertical: 4,
        borderRadius: 6,
      }}
    >
      <Text style={{ fontSize: 16 }}>Линия {lineId}</Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen options={{ title: `Спирка ${name}` }} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 10 }}>{name}</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Линии:</Text>

        {grouped.bus.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16 }}>🚌 Автобуси:</Text>
            {grouped.bus.map((line, idx) => renderLine(line, idx))}
          </View>
        )}

        {grouped.tram.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16 }}>🚋 Трамваи:</Text>
            {grouped.tram.map((line, idx) => renderLine(line, idx))}
          </View>
        )}

        {grouped.trolley.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16 }}>⚡ Тролеи:</Text>
            {grouped.trolley.map((line, idx) => renderLine(line, idx))}
          </View>
        )}

        {grouped.metro.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16 }}>🚇 Метро:</Text>
            {grouped.metro.map((line, idx) => renderLine(line, idx))}
          </View>
        )}

        {grouped.other.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16 }}>❓ Други:</Text>
            {grouped.other.map((line, idx) => renderLine(line, idx))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
