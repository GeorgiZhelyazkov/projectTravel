import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import stopsData from '../assets/data/stops.json';
import { useTheme } from '../context/ThemeContext';
import { StorageItem } from './utils/storage';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<StorageItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculateRoutes, setRecalculateRoutes] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const getStopName = (stopId: number): string => {
    const stop = stopsData.find(s => s.code === stopId);
    return stop ? stop.names.bg : stopId.toString();
  };

  const loadFavorites = async () => {
    try {
      const items = await AsyncStorage.getItem('favorites');
      const recalculate = await AsyncStorage.getItem('recalculateRoutes');
      setRecalculateRoutes(recalculate === 'true');
      
      if (items) {
        setFavorites(JSON.parse(items));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    }
  };

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, []);

  const handleItemPress = (item: StorageItem) => {
    if (item.type === 'route') {
      // For routes, the id is in format "startStop-endStop"
      const [start, end] = item.id.split('-');
      router.push({
        pathname: '/route',
        params: { from: start, to: end }
      });
    } else if (item.type === 'custom_route') {
      // For custom routes, use the stored route data
      console.log('Custom route data:', item);
      const from = item.routeData?.start?.toString() || item.id.split('-')[0];
      const to = item.routeData?.end?.toString() || item.id.split('-')[1];
      
      console.log('Passing to route screen:', { from, to, useStoredRoute: recalculateRoutes ? 'true' : 'false' });
      
      router.push({
        pathname: '/route',
        params: { 
          from,
          to,
          useStoredRoute: recalculateRoutes ? 'true' : 'false'
        }
      });
    } else {
      // For timetables, the id is the route_ref
      router.push(`/timetables/${item.id}`);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const updatedFavorites = favorites.filter(item => item.id !== id);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getItemTitle = (item: StorageItem): string => {
    if (item.type === 'route' || item.type === 'custom_route') {
      const [start, end] = item.id.split('-');
      const startName = getStopName(parseInt(start));
      const endName = getStopName(parseInt(end));
      return `Маршрут от ${startName} (${start}) до ${endName} (${end})`;
    }
    return item.title;
  };

  const renderItem = ({ item }: { item: StorageItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, isDarkMode && styles.darkItemContainer]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, isDarkMode && styles.darkText]}>{getItemTitle(item)}</Text>
        <Text style={[styles.itemType, isDarkMode && styles.darkItemType]}>
          {item.type === 'route' ? 'Маршрут' : 
           item.type === 'custom_route' ? 'Персонализиран маршрут' : 
           'Разписание'}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item.id)}
      >
        <Text style={styles.removeButtonText}>Премахни</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>Няма добавени любими маршрути</Text>
        }
      />
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
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  darkItemContainer: {
    backgroundColor: '#333',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  darkItemType: {
    color: '#999',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
