import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing } from '../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helper, style, ...rest }) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#9EA8A1"
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {helper && !error ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1,
    borderColor: '#E2EBE5',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.mainText,
    fontWeight: '600',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF5F6',
  },
  errorText: {
    fontSize: 11.5,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 4,
  },
});
