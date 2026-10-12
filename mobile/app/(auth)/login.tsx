import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiClient, API_URL } from '../../src/api/client';
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

  // Connection check state
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [serverMessage, setServerMessage] = useState('');

  const checkConnection = async () => {
    try {
      setServerStatus('checking');
      const res = await apiClient.get('/health');
      if (res.data?.status === 'ok') {
        setServerStatus('connected');
        setServerMessage(`Connected to ${API_URL}`);
      } else {
        setServerStatus('disconnected');
        setServerMessage('Unexpected server response.');
      }
    } catch (err: any) {
      setServerStatus('disconnected');
      setServerMessage(err.message || `Cannot connect to ${API_URL}`);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

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
      setError(err.message || 'Login failed. Please check credentials or connection.');
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

          {/* Connection Status Badge */}
          <TouchableOpacity
            style={[
              styles.connectionBadge,
              serverStatus === 'connected' && styles.connConnected,
              serverStatus === 'disconnected' && styles.connDisconnected,
            ]}
            onPress={checkConnection}
          >
            {serverStatus === 'checking' ? (
              <ActivityIndicator size="small" color={Colors.darkForest} />
            ) : serverStatus === 'connected' ? (
              <CheckCircle2 size={16} color={Colors.success} />
            ) : (
              <WifiOff size={16} color={Colors.error} />
            )}
            <Text
              style={[
                styles.connText,
                serverStatus === 'connected' && { color: Colors.success },
                serverStatus === 'disconnected' && { color: Colors.error },
              ]}
              numberOfLines={1}
            >
              {serverStatus === 'checking'
                ? 'Testing connection to server...'
                : serverStatus === 'connected'
                ? `Server Online (${API_URL})`
                : `Offline: ${serverMessage} (Tap to retry)`}
            </Text>
          </TouchableOpacity>

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
              🔒 Multi-device store synchronization via Node & MongoDB Atlas
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
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
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
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.md,
    gap: 6,
  },
  connConnected: {
    backgroundColor: '#E7F7ED',
    borderColor: '#C6EAD1',
  },
  connDisconnected: {
    backgroundColor: '#FDEAEB',
    borderColor: '#F8BFC2',
  },
  connText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
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
