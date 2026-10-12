import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightAction }) => {
  const { user, isOwner } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : user ? (
          <Badge
            label={isOwner ? '👑 Owner' : '🛒 Sales'}
            variant={isOwner ? 'reseller' : 'retail'}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: Spacing.md,
  },
});
