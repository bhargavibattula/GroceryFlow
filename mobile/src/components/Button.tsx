import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'cream' | 'dock';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#CCD5CE';
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.veryLightMint;
      case 'outline':
        return 'transparent';
      case 'destructive':
        return Colors.error;
      case 'cream':
        return Colors.warmCream;
      case 'dock':
        return Colors.darkForest;
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#8D9B91';
    switch (variant) {
      case 'primary':
      case 'destructive':
      case 'dock':
        return Colors.white;
      case 'secondary':
      case 'cream':
      case 'outline':
        return Colors.darkForest;
      default:
        return Colors.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case 'lg':
        return { paddingVertical: 15, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? Colors.primary : Colors.borders,
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        variant === 'primary' && styles.primaryShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: size === 'sm' ? 12.5 : size === 'lg' ? 15.5 : 14 },
              icon ? { marginLeft: 8 } : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
