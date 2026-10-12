import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { Colors } from '../src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: Colors.white },
                  headerTintColor: Colors.darkForest,
                  headerTitleStyle: { fontWeight: '700' },
                  contentStyle: { backgroundColor: Colors.lightMint },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen
                  name="product/[id]"
                  options={{ title: 'Product Details', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="product/add"
                  options={{ title: 'Add New Product', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="pricing/[id]"
                  options={{ title: 'Dual-Pricing Rules', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="purchase/record"
                  options={{ title: 'Record Bulk Purchase', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="purchase/history"
                  options={{ title: 'Purchase History', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="sell/cart"
                  options={{ title: 'Bill & Checkout', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="sell/receipt"
                  options={{ title: 'Sale Receipt', headerBackTitle: 'Back', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="sales/history"
                  options={{ title: 'Sales History', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="returns/new"
                  options={{ title: 'Process Customer Return', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="inventory/adjust"
                  options={{ title: 'Stock Adjustment', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="admin/audit-logs"
                  options={{ title: 'Audit Trail Logs', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="admin/users"
                  options={{ title: 'Users & Permissions', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="suppliers/index"
                  options={{ title: 'Suppliers Directory', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="khata"
                  options={{ headerShown: false }}
                />
              </Stack>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
