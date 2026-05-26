import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useThemeContext } from '@/context/theme-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeContext();
  const isDark = colorScheme === 'dark';

  // Animated rotation and scale
  const rotation = useSharedValue(isDark ? 360 : 0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotation.value = withSpring(isDark ? 360 : 0, { damping: 15, stiffness: 100 });
  }, [isDark, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const iconColor = useThemeColor({ light: '#11181C', dark: '#ECEDEE' }, 'text');
  const backgroundColor = useThemeColor(
    { light: 'rgba(255, 255, 255, 0.85)', dark: 'rgba(21, 23, 24, 0.85)' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.08)', dark: 'rgba(255, 255, 255, 0.12)' },
    'icon'
  );

  return (
    <Pressable
      onPress={toggleColorScheme}
      onPressIn={() => {
        scale.value = withTiming(0.85, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={({ hovered }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
        },
        Platform.OS === 'web' && hovered && styles.buttonHovered,
      ]}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <IconSymbol
          name={isDark ? 'moon.stars.fill' : 'sun.max.fill'}
          size={20}
          color={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 82,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      } as any,
    }),
  },
  buttonHovered: {
    transform: [{ scale: 1.08 }],
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      } as any,
    }),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
