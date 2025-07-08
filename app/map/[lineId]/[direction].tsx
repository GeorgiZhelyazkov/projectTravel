import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import directions from '../../../assets/data/directions.json';
import routes from '../../../assets/data/routes.json';
import stops from '../../../assets/data/stops.json';

const getStopCoordinates = (stopCode: number) => {
  const stop = stops.find(s => s.code === stopCode);
  return stop
    ? {
        latitude: stop.coords[0],
        longitude: stop.coords[1],
        title: stop.names?.bg || `Спирка ${stop.code}`,
      }
    : null;
};

const getMarkerColor = (index: number, totalStops: number) => {
  if (index === 0) return 'green';
  if (index === totalStops - 1) return 'red';
  return 'blue';
};

export default function MapLineDirection() {
  const { lineId, direction } = useLocalSearchParams();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [allStopMarkers, setAllStopMarkers] = useState<
    { latitude: number; longitude: number; title: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildRoute = async () => {
      const routeIndex = routes.findIndex(r => r.route_ref == lineId);
      const directionCode = parseInt(direction as string, 10);

      if (routeIndex === -1) {
        console.warn('Route not found');
        return;
      }

      const directionEntry = directions.find(d => d.code === directionCode);

      if (!directionEntry) {
        console.warn('Direction not found');
        return;
      }

      const stopCoords = directionEntry.stops
        .map(getStopCoordinates)
        .filter(Boolean) as { latitude: number; longitude: number; title: string }[];

      if (stopCoords.length < 2) {
        console.warn('Not enough stop coordinates');
        return;
      }

      setAllStopMarkers(stopCoords);

      const coordString = stopCoords.map(c => `${c.longitude},${c.latitude}`).join(';');
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`
        );
        const json = await res.json();
        const path = json.routes?.[0]?.geometry?.coordinates.map(
          ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon })
        );
        setCoords(path ?? stopCoords.map(({ latitude, longitude }) => ({ latitude, longitude })));
      } catch (e) {
        console.warn('OSRM fetch error', e);
        setCoords(stopCoords.map(({ latitude, longitude }) => ({ latitude, longitude })));
      } finally {
        setLoading(false);
      }
    };
    
    buildRoute();
  }, [lineId, direction]);

  const initialRegion = {
    latitude: coords[0]?.latitude || 42.6977,
    longitude: coords[0]?.longitude || 23.3219,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Polyline coordinates={coords} strokeColor="#e74c3c" strokeWidth={5} />

        {allStopMarkers.map((stop, index) => (
          <Marker
            key={`${stop.latitude}-${stop.longitude}-${stop.title}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.title}
            pinColor={getMarkerColor(index, allStopMarkers.length)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
