import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, ViewProps } from 'react-native';

export function ThemedView(props: ViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return <View {...props} style={[{ backgroundColor }, props.style]} />;
} 