import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import stops from '../assets/data/stops.json';

function padCode(code: number): string {
  return code.toString().padStart(4, '0');
}

export default function Index() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [suggestionsFrom, setSuggestionsFrom] = useState<any[]>([]);
  const [suggestionsTo, setSuggestionsTo] = useState<any[]>([]);
  const { isDarkMode } = useTheme();

  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.start) {
      setFromCode(params.start as string);
      if (params.startName) {
        setFrom(params.startName as string);
      }
    }
    if (params.end) {
      setToCode(params.end as string);
      if (params.endName) {
        setTo(params.endName as string);
      }
    }
  }, [params]);

  const handleSearch = () => {
    if (fromCode && toCode) {
      router.push({
        pathname: '/route',
        params: { from: fromCode, to: toCode },
      });
    } else {
      alert('Моля, изберете начална и крайна спирка от списъка.');
    }
  };

  const filterStops = (text: string) => {
    const lowered = text.toLowerCase();
    return stops.filter((s) => s.names.bg.toLowerCase().includes(lowered));
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Image 
        source={require('../assets/images/mainIcon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, isDarkMode && styles.darkText]}>София Навигатор</Text>

      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="От (напр. НДК)"
        placeholderTextColor={isDarkMode ? '#999' : undefined}
        value={from}
        onChangeText={(text) => {
          setFrom(text);
          setFromCode('');
          setSuggestionsFrom(filterStops(text));
        }}
      />
      {suggestionsFrom.length > 0 && (
        <FlatList
          data={suggestionsFrom}
          keyExtractor={(item, index) => `${item.code}-${index}`}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setFrom(item.names.bg);
                setFromCode(item.code.toString());
                setSuggestionsFrom([]);
              }}
            >
              <Text style={[styles.suggestion, isDarkMode && styles.darkSuggestion]}>
                {item.names.bg} ({padCode(item.code)})
              </Text>
            </Pressable>
          )}
        />
      )}

      <TextInput
        style={[styles.input, isDarkMode && styles.darkInput]}
        placeholder="До (напр. Площад Славейков)"
        placeholderTextColor={isDarkMode ? '#999' : undefined}
        value={to}
        onChangeText={(text) => {
          setTo(text);
          setToCode('');
          setSuggestionsTo(filterStops(text));
        }}
      />
      {suggestionsTo.length > 0 && (
        <FlatList
          data={suggestionsTo}
          keyExtractor={(item, index) => `${item.code}-${index}`}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setTo(item.names.bg);
                setToCode(item.code.toString());
                setSuggestionsTo([]);
              }}
            >
              <Text style={[styles.suggestion, isDarkMode && styles.darkSuggestion]}>
                {item.names.bg} ({padCode(item.code)})
              </Text>
            </Pressable>
          )}
        />
      )}

      <Button title="🔍 Търси маршрут" onPress={handleSearch} color={isDarkMode ? '#81b0ff' : '#2196F3'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
    color: '#000',
  },
  darkInput: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#333',
  },
  suggestion: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#000',
  },
  darkSuggestion: {
    backgroundColor: '#333',
    borderBottomColor: '#444',
    color: '#fff',
  },
  extraLinks: {
    marginTop: 40,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 12,
  },
});