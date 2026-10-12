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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkForest,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.mainText,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 4,
  },
});
