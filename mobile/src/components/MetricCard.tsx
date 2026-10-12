import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  bgVariant?: 'mint' | 'cream' | 'peach' | 'white';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  bgVariant = 'white',
}) => {
  const getBg = () => {
    switch (bgVariant) {
      case 'mint':
        return Colors.veryLightMint;
      case 'cream':
        return Colors.warmCream;
      case 'peach':
        return Colors.softPeach;
      default:
        return Colors.white;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getBg() }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borders,
    flex: 1,
    minWidth: 140,
    margin: 4,
    shadowColor: '#1B3B2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF80',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 4,
  },
});
