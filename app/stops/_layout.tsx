import { Stack } from 'expo-router';
import React from 'react';

export default function stopsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
