import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'mint' | 'peach';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  const getBgColor = () => {
    switch (variant) {
      case 'mint':
        return Colors.veryLightMint;
      case 'peach':
        return Colors.softPeach;
      default:
        return Colors.cardBg;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: getBgColor() },
        variant === 'elevated' && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.md,
  },
  shadow: {
    shadowColor: '#1B3B2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
