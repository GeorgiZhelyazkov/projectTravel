import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return <BlurView intensity={80} style={StyleSheet.absoluteFill} />;
} 