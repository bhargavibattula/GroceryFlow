import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KhataDashboardScreen from '../khata/index';
import { Colors } from '../../src/theme/colors';

export default function KhataTabScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <KhataDashboardScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  container: {
    flex: 1,
    paddingBottom: 70, // Room for floating dock
  },
});
