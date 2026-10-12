import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, BookOpen } from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';

export default function TabLayout() {
  const { t, language } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#A8DCC7',
        tabBarStyle: {
          backgroundColor: Colors.dockBg,
          borderRadius: 28,
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 14,
          left: 12,
          right: 12,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          shadowColor: '#103828',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabDashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabIcon : null}>
              <LayoutDashboard color={color} size={focused ? 22 : 20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabInventory'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabIcon : null}>
              <Package color={color} size={focused ? 22 : 20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: t('tabSell'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabIcon : null}>
              <ShoppingCart color={color} size={focused ? 22 : 20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="khata"
        options={{
          title: language === 'te' ? 'బాహీ ఖాతా' : 'Khata',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabIcon : null}>
              <BookOpen color={color} size={focused ? 22 : 20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabIcon : null}>
              <Settings color={color} size={focused ? 22 : 20} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabIcon: {
    backgroundColor: '#FFFFFF2A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
