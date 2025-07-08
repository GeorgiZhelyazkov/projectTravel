import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { addToFavorites, addToRecent, getFavorites, removeFromFavorites } from './utils/storage';

import directions from '../assets/data/directions.json';
import precomputed from '../assets/data/precomputed/precomputed.json';
import routes from '../assets/data/routes.json';
import stop_times from '../assets/data/stop_times.json';
import stops from '../assets/data/stops.json';
import trips from '../assets/data/trips.json';

type Step = {
  stop: number;
  line: number | null;
  isWalking?: boolean;
  time?: number;
  departureTime?: number;
  arrivalTime?: number;
  routeRef?: string;
};

type CachedRoute = {
  steps: Step[];
  timestamp: number;
  start: number;
  end: number;
};

const stopByCode: Record<number, any> = {};
stops.forEach(s => stopByCode[s.code] = s);

function formatTime(minutes: number): string {
  if (!minutes || isNaN(minutes)) return '';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getCurrentTime(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getNextDepartureTime(routeRef: number, stopCode: number, currentTime: number): number | null {
  const direction = directions.find(dir => dir.code === routeRef);
  if (!direction) return null;

  const stopIndex = direction.stops.indexOf(stopCode);
  if (stopIndex === -1) return null;

  const trips = stop_times.filter(t => t.times[stopIndex] !== null);
  if (trips.length === 0) return null;

  let nextDeparture: number | null = null;
  for (const trip of trips) {
    const departureTime = trip.times[stopIndex];
    if (!departureTime) continue;

    if (departureTime > currentTime && (!nextDeparture || departureTime < nextDeparture)) {
      nextDeparture = departureTime;
    }
  }

  if (!nextDeparture) {
    nextDeparture = Math.min(...trips.map(t => t.times[stopIndex]!).filter(t => t !== null));
  }

  return nextDeparture;
}

function getRouteRef(directionCode: number): string {
  // Find a trip with the matching direction code
  const trip = trips.find(t => t.direction === directionCode);
  if (!trip) return directionCode.toString();
  // Find the route with the matching route_index
  const route = routes.find(r => r.route_index === trip.route_index);
  return route ? route.route_ref : directionCode.toString();
}

function getTransportType(routeRef: string): string {
  const route = routes.find(r => r.route_ref === routeRef);
  return route?.type || 'bus';
}

function getTransportName(routeRef: string | null): string {
  console.log('getTransportName called with', routeRef);
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
  console.log('getTransportName returns', `${emoji} ${typeLabel} ${route.route_ref}`);
  return `${emoji} ${typeLabel} ${route.route_ref}`;
}

function getStopName(stopId: number): string {
  const stop = stops.find(s => s.code === stopId);
  return stop ? stop.names.bg : `Спирка ${stopId}`;
}

function calculateHeuristic(currentStop: number, endStop: number): number {
  // Use precomputed nearby stops to estimate remaining distance
  const nearbyStops = precomputed.nearbyStops[currentStop] || [];
  const endNearbyStops = precomputed.nearbyStops[endStop] || [];
  
  // If the stops are directly connected, return 0
  if (nearbyStops.some(n => n.stop === endStop)) return 0;
  
  // Find the minimum distance to any stop that's near the end stop
  let minDistance = Infinity;
  for (const nearby of nearbyStops) {
    for (const endNearby of endNearbyStops) {
      if (nearby.stop === endNearby.stop) {
        minDistance = Math.min(minDistance, nearby.distance + endNearby.distance);
      }
    }
  }
  
  // If no direct connection found, use a conservative estimate
  return minDistance === Infinity ? 1000 : minDistance;
}

function findRoute(start: number, end: number): Step[] | null {
  const currentTime = getCurrentTime();
  const visited = new Set<number>();
  const gScore = new Map<number, number>(); // Cost from start to current node
  const fScore = new Map<number, number>(); // Estimated total cost
  const cameFrom = new Map<number, Step[]>(); // Path reconstruction
  
  // Initialize with start node
  const startStep: Step = {
    stop: start,
    line: null,
    departureTime: currentTime,
    arrivalTime: currentTime
  };
  
  gScore.set(start, 0);
  fScore.set(start, calculateHeuristic(start, end));
  cameFrom.set(start, [startStep]);
  
  // Priority queue using array (could be optimized with a proper heap)
  const openSet: number[] = [start];
  
  while (openSet.length > 0) {
    // Find node with lowest f-score
    let current = openSet[0];
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if ((fScore.get(openSet[i]) || Infinity) < (fScore.get(current) || Infinity)) {
        current = openSet[i];
        currentIndex = i;
      }
    }
    
    // Remove current from open set
    openSet.splice(currentIndex, 1);
    
    if (current === end) {
      return cameFrom.get(current) || null;
    }
    
    visited.add(current);
    const currentSteps = cameFrom.get(current) || [];
    const currentStep = currentSteps[currentSteps.length - 1];
    
    // Check transportation connections
    const nextSteps = precomputed.enhancedAdjacency[current] || [];
    for (const next of nextSteps) {
      if (visited.has(next.neighbor)) continue;
      
      const nextDepartureTime = getNextDepartureTime(next.line, current, currentStep.arrivalTime || currentTime);
      if (!nextDepartureTime) continue;
      
      const tentativeGScore = (gScore.get(current) || 0) + next.time;
      
      if (!gScore.has(next.neighbor) || tentativeGScore < (gScore.get(next.neighbor) || Infinity)) {
        const newStep: Step = {
          stop: next.neighbor,
          line: next.line,
          departureTime: nextDepartureTime,
          arrivalTime: nextDepartureTime + next.time,
          routeRef: getRouteRef(next.line)
        };
        
        cameFrom.set(next.neighbor, [...currentSteps, newStep]);
        gScore.set(next.neighbor, tentativeGScore);
        fScore.set(next.neighbor, tentativeGScore + calculateHeuristic(next.neighbor, end));
        
        if (!openSet.includes(next.neighbor)) {
          openSet.push(next.neighbor);
        }
      }
    }
    
    // Check walking connections
    const nearbyStops = precomputed.nearbyStops[current] || [];
    for (const nearby of nearbyStops) {
      if (visited.has(nearby.stop)) continue;
      
      const walkingTime = Math.ceil(nearby.distance / 100) + 2;
      const departureTime = currentStep.arrivalTime || currentTime;
      const arrivalTime = departureTime + walkingTime;
      
      const tentativeGScore = (gScore.get(current) || 0) + walkingTime;
      
      if (!gScore.has(nearby.stop) || tentativeGScore < (gScore.get(nearby.stop) || Infinity)) {
        const newStep: Step = {
          stop: nearby.stop,
          line: null,
          isWalking: true,
          time: walkingTime,
          departureTime: departureTime,
          arrivalTime: arrivalTime
        };
        
        cameFrom.set(nearby.stop, [...currentSteps, newStep]);
        gScore.set(nearby.stop, tentativeGScore);
        fScore.set(nearby.stop, tentativeGScore + calculateHeuristic(nearby.stop, end));
        
        if (!openSet.includes(nearby.stop)) {
          openSet.push(nearby.stop);
        }
      }
    }
  }
  
  return null;
}

function generateInstructions(steps: Step[]): { instructions: string[], totalTime: number } {
  const instructions: string[] = [];
  let stepNumber = 1;
  let totalTime = 0;

  for (let i = 0; i < steps.length; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    if (currentStep.isWalking) {
      const currentStopName = getStopName(currentStep.stop);
      const nextStopName = nextStep ? getStopName(nextStep.stop) : getStopName(currentStep.stop);
      
      if (currentStep.stop === nextStep?.stop || 
          (currentStopName.includes('НДК') && nextStopName.includes('НДК')) ||
          currentStopName === nextStopName) {
        continue;
      }

      const departureTime = formatTime(currentStep.departureTime || 0);
      const arrivalTime = formatTime(currentStep.arrivalTime || 0);
      instructions.push(
        `${stepNumber}. Отиди пеша от "${currentStopName}" до "${nextStopName}" ` +
        `(${departureTime} - ${arrivalTime})`
      );
      stepNumber++;
      totalTime += currentStep.time || 0;
      continue;
    }

    const routeRef = currentStep.routeRef || getRouteRef(currentStep.line || 0);
    const transportName = getTransportName(routeRef);
    console.log('generateInstructions: routeRef', routeRef, 'transportName', transportName);
    const departureTime = formatTime(currentStep.departureTime || 0);

    let segmentEndIndex = i;
    while (segmentEndIndex + 1 < steps.length && 
           steps[segmentEndIndex + 1].line === currentStep.line) {
      segmentEndIndex++;
    }
    const endStep = steps[segmentEndIndex];
    if (!endStep) continue;

    const endStop = getStopName(endStep.stop);
    const arrivalTime = formatTime(endStep.arrivalTime || 0);

    const direction = directions.find(dir => dir.code === currentStep.line);
    let stopsCount = 0;
    
    if (direction) {
      const startIndex = direction.stops.indexOf(currentStep.stop);
      const endIndex = direction.stops.indexOf(endStep.stop);
      
      if (startIndex !== -1 && endIndex !== -1) {
        stopsCount = Math.abs(endIndex - startIndex);
        if (stopsCount === 0 && startIndex !== endIndex) {
          stopsCount = 1;
        }
      }
    }

    if (stopsCount > 0 || currentStep.stop !== endStep.stop) {
      instructions.push(
        `${stepNumber}. Хвани ${transportName} в ${departureTime} и се вози ${stopsCount} спирки до "${endStop}" ` +
        `(пристигане в ${arrivalTime})`
      );
      stepNumber++;
    }
    
    if (currentStep.departureTime && endStep.arrivalTime) {
      totalTime += endStep.arrivalTime - currentStep.departureTime;
    }

    i = segmentEndIndex;
  }

  totalTime = Math.round(totalTime);

  return { instructions, totalTime };
}

async function getCachedRoute(start: number, end: number): Promise<CachedRoute | null> {
  try {
    const cached = await AsyncStorage.getItem(`route_${start}_${end}`);
    if (!cached) return null;
    
    const route = JSON.parse(cached) as CachedRoute;
    if (Date.now() - route.timestamp > 3600000) {
      await AsyncStorage.removeItem(`route_${start}_${end}`);
      return null;
    }
    return route;
  } catch (error) {
    console.error('Error reading cached route:', error);
    return null;
  }
}

async function cacheRoute(start: number, end: number, steps: Step[]): Promise<void> {
  try {
    const route: CachedRoute = {
      steps,
      timestamp: Date.now(),
      start,
      end
    };
    await AsyncStorage.setItem(`route_${start}_${end}`, JSON.stringify(route));
  } catch (error) {
    console.error('Error caching route:', error);
  }
}

export default function RouteScreen() {
  const { from, to, useStoredRoute } = useLocalSearchParams();
  const [instructions, setInstructions] = useState<string[]>([]);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [routeSteps, setRouteSteps] = useState<Step[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { isDarkMode } = useTheme();

  const loadRoute = useCallback(async () => {
    try {
      if (!from || !to) {
        setError('Моля попълнете начална и крайна спирка');
        return;
      }

      setLoading(true);
      setError(null);

      const start = parseInt(from as string, 10);
      const end = parseInt(to as string, 10);

      const favorites = await getFavorites();
      const routeId = `${from}-${to}`;
      setIsFavorite(favorites.some(fav => fav.id === routeId));

      let route: Step[] | null = null;

      if (useStoredRoute === 'true') {
        const cachedRoute = await getCachedRoute(start, end);
        if (cachedRoute) {
          route = cachedRoute.steps;
        }
      }

      if (!route) {
        route = findRoute(start, end);
        if (route) {
          await cacheRoute(start, end, route);
        }
      }

      if (!route) {
        setError('Не е намерен маршрут между избраните спирки.');
        return;
      }

      setRouteSteps(route);
      const { instructions: instr, totalTime: time } = generateInstructions(route);
      setInstructions(instr);
      setTotalTime(time);

      addToRecent({
        id: `${from}-${to}`,
        title: `Маршрут от ${from} до ${to}`,
        type: 'custom_route',
        routeData: {
          start,
          end
        }
      });
    } catch (error) {
      console.error('Error loading route:', error);
      setError('Възникна грешка при зареждане на маршрута');
    } finally {
      setLoading(false);
    }
  }, [from, to, useStoredRoute]);

  useFocusEffect(
    useCallback(() => {
      loadRoute();
    }, [loadRoute])
  );

  const handleShowMap = () => {
    if (!routeSteps) return;
    router.push({
      pathname: '/routeMap',
      params: { routeData: JSON.stringify(routeSteps) }
    });
  };

  const toggleFavorite = async () => {
    if (!from || !to) return;

    const start = parseInt(from as string, 10);
    const end = parseInt(to as string, 10);
    const routeId = `${start}-${end}`;

    if (isFavorite) {
      await removeFromFavorites(routeId);
    } else {
      await addToFavorites({
        id: routeId,
        title: `Маршрут от ${start} до ${end}`,
        type: 'custom_route',
        routeData: {
          start,
          end
        }
      });
    }
    setIsFavorite(!isFavorite);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color={isDarkMode ? '#fff' : '#000'} />;
  if (error) return <Text style={[styles.error, isDarkMode && styles.darkError]}>{error}</Text>;

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Маршрут:</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#ff4444' : isDarkMode ? '#999' : '#666'}
          />
        </TouchableOpacity>
      </View>
      <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
        {instructions.map((instruction, i) => (
          <Text key={i} style={[styles.step, isDarkMode && styles.darkText]}>
            {instruction}
          </Text>
        ))}
        <Text style={[styles.totalTime, isDarkMode && styles.darkText]}>
          Общо време: {Math.floor(totalTime / 60)} часа и {totalTime % 60} минути
        </Text>
      </ScrollView>
      <View style={[styles.buttonContainer, isDarkMode && styles.darkButtonContainer]}>
        <Button
          title="Покажи на картата"
          onPress={handleShowMap}
          color={isDarkMode ? '#81b0ff' : '#2196F3'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkSafeArea: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  favoriteButton: {
    padding: 8,
  },
  container: { 
    padding: 16, 
    backgroundColor: '#fff',
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 14,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  step: { 
    fontSize: 16, 
    marginBottom: 10,
    color: '#000',
  },
  error: { 
    color: '#900', 
    marginTop: 50, 
    fontSize: 16,
  },
  darkError: {
    color: '#ff6b6b',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  darkButtonContainer: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  totalTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  darkTotalTime: {
    color: '#fff',
  },
});
