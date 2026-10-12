import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function KhataLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.darkForest,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.lightMint },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Digital Khata Book' }} />
      <Stack.Screen name="accounts/index" options={{ title: 'Accounts Directory' }} />
      <Stack.Screen name="accounts/add" options={{ title: 'Add New Account' }} />
      <Stack.Screen name="accounts/[id]" options={{ title: 'Khata Ledger' }} />
      <Stack.Screen name="transactions/add" options={{ title: 'Add Entry' }} />
      <Stack.Screen name="reminders/index" options={{ title: 'Payment Reminders' }} />
      <Stack.Screen name="reports/index" options={{ title: 'Khata Reports' }} />
    </Stack>
  );
}
