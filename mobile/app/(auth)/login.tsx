import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, UserCheck, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('bhargavitej');
  const [password, setPassword] = useState('Bhargavi@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: 'bhargavi' | 'owner' | 'sales') => {
    if (user === 'bhargavi') {
      setIdentifier('bhargavitej');
      setPassword('Bhargavi@123');
    } else {
      setIdentifier(user);
      setPassword('password123');
    }
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Store size={36} color={Colors.white} />
            </View>
            <Text style={styles.appName}>FreshStock</Text>
            <Text style={styles.tagline}>
              Family Grocery Store Inventory & Dual-Pricing System
            </Text>
          </View>

          {/* Login Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In to Store</Text>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Input
              label="Username or Email"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="e.g. owner or sales"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.signInButton}
            />

            {/* Quick Demo Switcher */}
            <View style={styles.quickFillSection}>
              <Text style={styles.quickFillLabel}>Demo Accounts (Single-Tap Fill):</Text>
              <View style={styles.quickFillButtons}>
                <Button
                  title="👑 Bhargavi (Owner)"
                  variant={identifier === 'bhargavitej' ? 'secondary' : 'outline'}
                  size="sm"
                  onPress={() => handleQuickFill('bhargavi')}
                  style={styles.quickBtn}
                />
                <Button
                  title="🛒 Salesperson"
                  variant={identifier === 'sales' ? 'secondary' : 'outline'}
                  size="sm"
                  onPress={() => handleQuickFill('sales')}
                  style={styles.quickBtn}
                />
              </View>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Secure multi-device store synchronization via Node & MongoDB Atlas
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkForest,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    padding: Spacing.xl,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: '#FDEAEB',
    color: Colors.error,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  signInButton: {
    marginTop: Spacing.sm,
  },
  quickFillSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borders,
  },
  quickFillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
