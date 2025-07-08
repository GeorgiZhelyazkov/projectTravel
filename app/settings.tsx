import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [recalculateRoutes, setRecalculateRoutes] = React.useState(false);

  React.useEffect(() => {
    // Load the setting when component mounts
    AsyncStorage.getItem('recalculateRoutes').then(value => {
      setRecalculateRoutes(value === 'true');
    });
  }, []);

  const toggleRecalculateRoutes = async (value: boolean) => {
    setRecalculateRoutes(value);
    await AsyncStorage.setItem('recalculateRoutes', value.toString());
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Изчистване на любими',
      'Сигурни ли сте, че искате да изчистите всички любими маршрути?',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('favorites');
              Alert.alert('Успех', 'Любимите маршрути бяха изчистени.');
            } catch (error) {
              Alert.alert('Грешка', 'Възникна проблем при изчистването на любимите маршрути.');
            }
          },
        },
      ]
    );
  };

  const handleClearRecent = () => {
    Alert.alert(
      'Изчистване на скорошни',
      'Сигурни ли сте, че искате да изчистите всички скорошни маршрути?',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('recentItems');
              Alert.alert('Успех', 'Скорошните маршрути бяха изчистени.');
            } catch (error) {
              Alert.alert('Грешка', 'Възникна проблем при изчистването на скорошните маршрути.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
        <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
          Тъмна тема
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>
      <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
        <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
          Преизчисляване на маршрути
        </Text>
        <Switch
          value={recalculateRoutes}
          onValueChange={toggleRecalculateRoutes}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={recalculateRoutes ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.clearButton, isDarkMode && styles.darkClearButton]}
          onPress={handleClearFavorites}
        >
          <Text style={[styles.clearButtonText, isDarkMode && styles.darkText]}>
            Изчисти любими маршрути
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, isDarkMode && styles.darkClearButton]}
          onPress={handleClearRecent}
        >
          <Text style={[styles.clearButtonText, isDarkMode && styles.darkText]}>
            Изчисти скорошни маршрути
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkSettingItem: {
    borderBottomColor: '#333',
  },
  settingText: {
    fontSize: 16,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  clearButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkClearButton: {
    backgroundColor: '#cc0000',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 