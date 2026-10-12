import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'mint' | 'peach' | 'cream' | 'lavender';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  const getBgColor = () => {
    switch (variant) {
      case 'mint':
        return Colors.veryLightMint;
      case 'peach':
        return Colors.softPeach;
      case 'cream':
        return Colors.warmCream;
      case 'lavender':
        return Colors.softLavender;
      default:
        return Colors.white;
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
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    marginBottom: Spacing.md,
  },
  shadow: {
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
