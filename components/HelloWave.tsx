import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 30}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialCommunityIcons name="hand-wave" size={24} color="#FFD700" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    transform: [{ rotate: '0deg' }],
  },
}); 