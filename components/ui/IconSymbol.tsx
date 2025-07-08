import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

type IconName = 'home' | 'send' | 'code-braces';

interface IconSymbolProps {
  name: string;
  size: number;
  color: string;
  style?: StyleProp<TextStyle>;
}

export function IconSymbol({ name, size, color, style }: IconSymbolProps) {
  // Map SF Symbol names to MaterialCommunityIcons names
  const iconMap: Record<string, IconName> = {
    'house.fill': 'home',
    'paperplane.fill': 'send',
    'chevron.left.forwardslash.chevron.right': 'code-braces',
  };

  return <MaterialCommunityIcons name={iconMap[name] || 'home'} size={size} color={color} style={style} />;
} 