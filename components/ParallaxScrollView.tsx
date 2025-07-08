import { useColorScheme } from '@/hooks/useColorScheme';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerImage?: React.ReactNode;
  headerBackgroundColor: {
    light: string;
    dark: string;
  };
}

export function ParallaxScrollView({ children, headerImage, headerBackgroundColor }: ParallaxScrollViewProps) {
  const scrollY = useSharedValue(0);
  const colorScheme = useColorScheme();
  const backgroundColor = headerBackgroundColor[colorScheme ?? 'light'];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scrollY.value * 0.5 }],
    };
  });

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor }]}>
        <Animated.View style={[styles.headerImage, headerStyle]}>{headerImage}</Animated.View>
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  header: {
    height: 200,
    overflow: 'hidden',
  },
  headerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
}); 