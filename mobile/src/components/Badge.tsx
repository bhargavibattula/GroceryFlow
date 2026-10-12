import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'reseller' | 'retail' | 'success' | 'warning' | 'error' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const getColors = () => {
    switch (variant) {
      case 'reseller':
        return { bg: '#E4F4EB', text: Colors.darkForest };
      case 'retail':
        return { bg: '#FDF1E6', text: '#A2591F' };
      case 'success':
        return { bg: '#E4F7EC', text: Colors.success };
      case 'warning':
        return { bg: '#FEF5E7', text: '#B46200' };
      case 'error':
        return { bg: '#FDECEF', text: Colors.error };
      default:
        return { bg: '#EDF3EF', text: Colors.secondaryText };
    }
  };

  const styleColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: styleColors.bg }]}>
      <Text style={[styles.text, { color: styleColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
