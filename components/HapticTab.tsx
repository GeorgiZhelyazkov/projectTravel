import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <TouchableOpacity
      style={props.style}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.(e);
      }}
    >
      {props.children}
    </TouchableOpacity>
  );
} 