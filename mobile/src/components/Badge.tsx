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
        return { bg: '#E2F1EC', text: Colors.darkForest };
      case 'retail':
        return { bg: '#FDEEE0', text: '#A2591F' };
      case 'success':
        return { bg: '#E4F6EB', text: Colors.success };
      case 'warning':
        return { bg: '#FEF4E5', text: Colors.warning };
      case 'error':
        return { bg: '#FDEAEB', text: Colors.error };
      default:
        return { bg: '#ECEFEA', text: Colors.secondaryText };
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
