import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import directions from '../assets/data/directions.json';
import routes from '../assets/data/routes.json';
import stops from '../assets/data/stops.json';
import trips from '../assets/data/trips.json';

interface StopCoordinate {
  latitude: number;
  longitude: number;
  title: string;
}

interface RouteSegment {
  stop: number;
  line: number | null;
  isWalking?: boolean;
  routeRef?: string;
}

interface LegendItem {
  color: string;
  text: string;
  stepNumber: number;
}

// Import the same functions from route.tsx
function getRouteRef(directionCode: number): string {
  // Find a trip with the matching direction code
  const trip = trips.find(t => t.direction === directionCode);
  if (!trip) return directionCode.toString();
  // Find the route with the matching route_index
  const route = routes.find(r => r.route_index === trip.route_index);
  return route ? route.route_ref : directionCode.toString();
}

function getTransportName(routeRef: string | null): string {
  if (routeRef === null) return 'пеша';
  const route = routes.find(r => r.route_ref === routeRef);
  if (!route) return `Линия ${routeRef}`;
  let emoji = '';
  let typeLabel = '';
  switch (route.type) {
    case 'metro':
      emoji = '🚇';
      typeLabel = 'Линия';
      break;
    case 'tram':
      emoji = '🚋';
      typeLabel = 'Линия';
      break;
    case 'trolley':
    case 'trolleybus':
      emoji = '🚎';
      typeLabel = 'Линия';
      break;
    case 'bus':
    default:
      emoji = '🚌';
      typeLabel = 'Линия';
      break;
  }
  return `${emoji} ${typeLabel} ${route.route_ref}`;
}

function getStopName(stopId: number): string {
  const stop = stops.find(s => s.code === stopId);
  return stop ? stop.names.bg : `Спирка ${stopId}`;
}

export default function RouteMapScreen() {
  const { routeData } = useLocalSearchParams();
  const [stopMarkers, setStopMarkers] = useState<StopCoordinate[]>([]);
  const [routeLines, setRouteLines] = useState<{coordinates: StopCoordinate[], color: string}[]>([]);
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 42.6977,
    longitude: 23.3219,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    const buildRoute = async () => {
      try {
        // Parse route data
        let segments: RouteSegment[];
        try {
          segments = typeof routeData === 'string' ? JSON.parse(routeData) : routeData;
        } catch (e) {
          throw new Error('Invalid route data format');
        }

        if (!Array.isArray(segments) || segments.length === 0) {
          throw new Error('Route data must be a non-empty array');
        }

        // Process stops and create markers
        const markers: StopCoordinate[] = [];
        const lines: {coordinates: StopCoordinate[], color: string}[] = [];
        const legend: LegendItem[] = [];
        let currentStep = 1;

        // First pass: Create markers for all stops
        segments.forEach(segment => {
          const stop = stops.find(s => s.code === segment.stop);
          if (!stop) {
            throw new Error(`Stop ${segment.stop} not found`);
          }
          markers.push({
            latitude: stop.coords[0],
            longitude: stop.coords[1],
            title: stop.names.bg
          });
        });

        // Set initial map region to first stop
        if (markers.length > 0) {
          setMapRegion({
            latitude: markers[0].latitude,
            longitude: markers[0].longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }

        // Second pass: Create lines between stops using OSRM
        for (let i = 0; i < segments.length - 1; i++) {
          const currentStop = stops.find(s => s.code === segments[i].stop);
          const nextStop = stops.find(s => s.code === segments[i + 1].stop);
          
          if (!currentStop || !nextStop) continue;

          // Determine line color
          let color = '#4CAF50'; // Default green
          if (segments[i].isWalking) {
            color = '#FF0000'; // Red for walking
          } else if (segments[i].line !== null) {
            // Use a different color for each line
            const lineNumber = segments[i].line ?? 0;
            const hue = (lineNumber * 137.5) % 360; // Golden angle to get good color distribution
            color = `hsl(${hue}, 70%, 50%)`;
          }

          // For walking segments, use direct line; for transit, use OSRM
          if (segments[i].isWalking) {
            // Direct line for walking segments
            lines.push({
              coordinates: [
                {
                  latitude: currentStop.coords[0],
                  longitude: currentStop.coords[1],
                  title: currentStop.names.bg
                },
                {
                  latitude: nextStop.coords[0],
                  longitude: nextStop.coords[1],
                  title: nextStop.names.bg
                }
              ],
              color
            });
          } else {
            // Get route from OSRM for transit segments
            const coordString = `${currentStop.coords[1]},${currentStop.coords[0]};${nextStop.coords[1]},${nextStop.coords[0]}`;
            try {
              const res = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`
              );
              const json = await res.json();
              const path = json.routes?.[0]?.geometry?.coordinates.map(
                ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon })
              );

              if (path) {
                lines.push({
                  coordinates: path,
                  color
                });
              } else {
                // Fallback to direct line if OSRM fails
                lines.push({
                  coordinates: [
                    {
                      latitude: currentStop.coords[0],
                      longitude: currentStop.coords[1],
                      title: currentStop.names.bg
                    },
                    {
                      latitude: nextStop.coords[0],
                      longitude: nextStop.coords[1],
                      title: nextStop.names.bg
                    }
                  ],
                  color
                });
              }
            } catch (e) {
              console.warn('OSRM fetch error', e);
              // Fallback to direct line
              lines.push({
                coordinates: [
                  {
                    latitude: currentStop.coords[0],
                    longitude: currentStop.coords[1],
                    title: currentStop.names.bg
                  },
                  {
                    latitude: nextStop.coords[0],
                    longitude: nextStop.coords[1],
                    title: nextStop.names.bg
                  }
                ],
                color
              });
            }
          }

        }

        // Third pass: Create legend items using the same logic as generateInstructions
        for (let i = 0; i < segments.length; i++) {
          const currentSegment = segments[i];
          const nextSegment = segments[i + 1];

          if (currentSegment.isWalking) {
            const currentStopName = getStopName(currentSegment.stop);
            const nextStopName = nextSegment ? getStopName(nextSegment.stop) : getStopName(currentSegment.stop);
            
            if (currentSegment.stop === nextSegment?.stop || 
                (currentStopName.includes('НДК') && nextStopName.includes('НДК')) ||
                currentStopName === nextStopName) {
              continue;
            }

            legend.push({ 
              color: '#FF0000', 
              text: `${currentStep}. Отиди пеша от "${currentStopName}" до "${nextStopName}"`, 
              stepNumber: currentStep 
            });
            currentStep++;
            continue;
          }

          const routeRef = currentSegment.routeRef || getRouteRef(currentSegment.line || 0);
          const transportName = getTransportName(routeRef);

          let segmentEndIndex = i;
          while (segmentEndIndex + 1 < segments.length && 
                 segments[segmentEndIndex + 1].line === currentSegment.line) {
            segmentEndIndex++;
          }
          const endSegment = segments[segmentEndIndex];
          if (!endSegment) continue;

          const endStop = getStopName(endSegment.stop);

          const direction = directions.find(dir => dir.code === currentSegment.line);
          let stopsCount = 0;
          
          if (direction) {
            const startIndex = direction.stops.indexOf(currentSegment.stop);
            const endIndex = direction.stops.indexOf(endSegment.stop);
            
            if (startIndex !== -1 && endIndex !== -1) {
              stopsCount = Math.abs(endIndex - startIndex);
              if (stopsCount === 0 && startIndex !== endIndex) {
                stopsCount = 1;
              }
            }
          }

          if (stopsCount > 0 || currentSegment.stop !== endSegment.stop) {
            legend.push({ 
              color: `hsl(${(currentSegment.line ?? 0) * 137.5 % 360}, 70%, 50%)`, 
              text: `${currentStep}. Хвани ${transportName} и се вози ${stopsCount} спирки до "${endStop}"`, 
              stepNumber: currentStep 
            });
            currentStep++;
          }

          i = segmentEndIndex;
        }

        setStopMarkers(markers);
        setRouteLines(lines);
        setLegendItems(legend);
        setError(null);
      } catch (err) {
        console.error('Error processing route:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    buildRoute();
  }, [routeData]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {stopMarkers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude
            }}
            title={marker.title}
            pinColor={index === 0 ? '#4CAF50' : index === stopMarkers.length - 1 ? '#FF0000' : '#2196F3'}
          />
        ))}
        {routeLines.map((line, index) => (
          <Polyline
            key={index}
            coordinates={line.coordinates}
            strokeColor={line.color}
            strokeWidth={4}
          />
        ))}
      </MapView>
      <TouchableOpacity 
        style={styles.legendToggle}
        onPress={() => setIsLegendExpanded(!isLegendExpanded)}
      >
        <Text style={styles.legendToggleText}>
          {isLegendExpanded ? '▼' : '▲'} Маршрут
        </Text>
      </TouchableOpacity>
      {isLegendExpanded && (
        <View style={styles.legendContainer}>
          <ScrollView style={styles.legendScrollView}>
            {legendItems.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  error: {
    color: 'red',
    padding: 20,
    fontSize: 16,
  },
  legendToggle: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendScrollView: {
    maxHeight: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 2,
  },
  legendColor: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  }
}); 