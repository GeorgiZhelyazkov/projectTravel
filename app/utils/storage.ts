import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageItem {
  id: string;
  title: string;
  type: 'route' | 'timetable' | 'custom_route';
  timestamp?: number;
  routeData?: {
    start: number;
    end: number;
  };
}

// Favorites functions
export const addToFavorites = async (item: StorageItem): Promise<void> => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    const favoritesArray = favorites ? JSON.parse(favorites) : [];
    
    // Check if item already exists
    if (!favoritesArray.some((fav: StorageItem) => fav.id === item.id)) {
      favoritesArray.push(item);
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (id: string): Promise<void> => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    if (favorites) {
      const favoritesArray = JSON.parse(favorites);
      const updatedFavorites = favoritesArray.filter((item: StorageItem) => item.id !== id);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const getFavorites = async (): Promise<StorageItem[]> => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Recent items functions
export const addToRecent = async (item: StorageItem): Promise<void> => {
  try {
    const recent = await AsyncStorage.getItem('recentItems');
    const recentArray = recent ? JSON.parse(recent) : [];
    
    // Remove if already exists
    const filteredArray = recentArray.filter((recentItem: StorageItem) => recentItem.id !== item.id);
    
    // Add timestamp
    const newItem = {
      ...item,
      timestamp: Date.now(),
    };
    
    // Add to beginning of array
    filteredArray.unshift(newItem);
    
    // Keep only last 10 items
    const trimmedArray = filteredArray.slice(0, 10);
    
    await AsyncStorage.setItem('recentItems', JSON.stringify(trimmedArray));
  } catch (error) {
    console.error('Error adding to recent:', error);
    throw error;
  }
};

export const getRecent = async (): Promise<StorageItem[]> => {
  try {
    const recent = await AsyncStorage.getItem('recentItems');
    return recent ? JSON.parse(recent) : [];
  } catch (error) {
    console.error('Error getting recent items:', error);
    return [];
  }
};

// Clear all storage (useful for debugging)
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('favorites');
    await AsyncStorage.removeItem('recentItems');
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

export default {
  // Add your storage utility functions here
  // For example:
  async getItem(key: string) {
    // Implementation
  },
  async setItem(key: string, value: string) {
    // Implementation
  }
}; 