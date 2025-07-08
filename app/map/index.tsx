import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Checkbox } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';

import routes from '../../assets/data/routes.json';
import stops from '../../assets/data/stops.json';

// Цветове по тип транспорт
const TRANSPORT_COLORS: Record<string, string> = {
  bus: '#007aff',       // син
  tram: '#ff3b30',      // червен
  trolley: '#34c759',   // зелен
  metro: '#5856d6',     // лилав
  default: '#999999',   // сив
};

// Текстове за типовете транспорт
const TRANSPORT_LABELS: Record<string, string> = {
  bus: 'Автобус',
  tram: 'Трамвай',
  trolley: 'Тролей',
  metro: 'Метро',
};

// Определяне на типа транспорт от индексите
function getMainTransportType(route_indexes: number[]): string {
  const types = route_indexes
    ?.map(idx => routes[idx]?.type)
    .filter(Boolean);

  if (!types || types.length === 0) return 'default';

  // Приоритет: метро > трамвай > тролей > автобус
  if (types.includes('metro')) return 'metro';
  if (types.includes('tram')) return 'tram';
  if (types.includes('trolley')) return 'trolley';
  if (types.includes('bus')) return 'bus';

  return 'default';
}

export default function MapScreen() {
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    bus: true,
    tram: true,
    trolley: true,
    metro: true,
  });
  const [selectedStop, setSelectedStop] = useState<{
    code: number;
    name: string;
    coordinate: { latitude: number; longitude: number };
  } | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    })();
  }, []);

  const centerOnUserLocation = async () => {
    if (!locationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location);
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const toggleTransportType = (type: string) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSetStartStop = (stopCode: number, stopName: string) => {
    router.push({
      pathname: '/',
      params: { 
        start: stopCode.toString(),
        startName: stopName
      }
    });
    setSelectedStop(null);
  };

  const handleSetEndStop = (stopCode: number, stopName: string) => {
    router.push({
      pathname: '/',
      params: { 
        end: stopCode.toString(),
        endName: stopName
      }
    });
    setSelectedStop(null);
  };

  const handleNavigateToStopDetails = (stopCode: number) => {
    router.push(`/stops/${stopCode}`);
    setSelectedStop(null);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.filterContainer, isDarkMode && styles.darkFilterContainer]}>
        {Object.entries(TRANSPORT_LABELS).map(([type, label]) => (
          <View key={type} style={styles.filterItem}>
            <Checkbox
              status={selectedTypes[type] ? 'checked' : 'unchecked'}
              onPress={() => toggleTransportType(type)}
              color={TRANSPORT_COLORS[type]}
            />
            <Text style={[styles.filterLabel, isDarkMode && styles.darkText]}>{label}</Text>
          </View>
        ))}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 42.6977,
          longitude: 23.3219,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {stops.map((stop, index) => {
          const { coords, code, names, route_indexes } = stop;
          if (!coords || coords[0] == null || coords[1] == null) return null;

          const transportType = getMainTransportType(route_indexes);
          if (!selectedTypes[transportType]) return null;

          const name = names?.bg || 'Без име';
          const pinColor = TRANSPORT_COLORS[transportType] || TRANSPORT_COLORS.default;

          return (
            <Marker
              key={index}
              coordinate={{ latitude: coords[0], longitude: coords[1] }}
              pinColor={pinColor}
              tracksViewChanges={false}
              onPress={() => setSelectedStop({
                code,
                name,
                coordinate: { latitude: coords[0], longitude: coords[1] }
              })}
            />
          );
        })}
      </MapView>

      <TouchableOpacity 
        style={[styles.locationButton, isDarkMode && styles.darkLocationButton]} 
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color={isDarkMode ? "#fff" : "#000"} />
      </TouchableOpacity>

      {selectedStop && (
        <View style={[styles.customCallout, isDarkMode && styles.darkCustomCallout, { bottom: 20 }]}>
          <Text style={[styles.calloutTitle, isDarkMode && styles.darkText]}>{selectedStop.name}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.calloutButton}
              onPress={() => handleSetStartStop(selectedStop.code, selectedStop.name)}
            >
              <Text style={styles.calloutButtonText}>Начална спирка</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.calloutButton}
              onPress={() => handleSetEndStop(selectedStop.code, selectedStop.name)}
            >
              <Text style={styles.calloutButtonText}>Крайна спирка</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.calloutButton}
              onPress={() => handleNavigateToStopDetails(selectedStop.code)}
            >
              <Text style={styles.calloutButtonText}>Детайли</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  filterContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkFilterContainer: {
    backgroundColor: '#1a1a1a',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  filterLabel: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  customCallout: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkCustomCallout: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  buttonContainer: {
    gap: 8,
  },
  calloutButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkLocationButton: {
    backgroundColor: '#1a1a1a',
  },
});
