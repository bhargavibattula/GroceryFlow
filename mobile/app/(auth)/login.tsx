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
import { Store, WifiOff, CheckCircle2, Globe } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiClient, API_URL } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

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
      setError(
        language === 'te'
          ? 'దయచేసి యూజర్‌నేమ్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.'
          : 'Please enter your username and password.'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(
        err.message ||
          (language === 'te'
            ? 'లాగిన్ విఫలమైంది. యూజర్‌నేమ్ లేదా పాస్‌వర్డ్ సరిచూసుకోండి.'
            : 'Login failed. Please check credentials or connection.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: 'bhargavi' | 'sales') => {
    if (user === 'bhargavi') {
      setIdentifier('bhargavitej');
      setPassword('Bhargavi@123');
    } else {
      setIdentifier('sales');
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
          {/* Top Bar with Language Toggle */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.langPill}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <Globe size={14} color={Colors.darkForest} />
              <Text style={styles.langPillText}>
                {language === 'te' ? 'తెలుగు (Telugu)' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Store size={38} color={Colors.white} />
            </View>
            <Text style={styles.appName}>{t('appName')}</Text>
            <Text style={styles.tagline}>{t('tagline')}</Text>
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
                ? language === 'te'
                  ? 'సర్వర్‌తో కనెక్షన్ తనిఖీ చేస్తోంది...'
                  : 'Testing connection to server...'
                : serverStatus === 'connected'
                ? `Server Online (${API_URL})`
                : `${language === 'te' ? 'ఆఫ్‌లైన్' : 'Offline'}: ${serverMessage}`}
            </Text>
          </TouchableOpacity>

          {/* Login Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {language === 'te' ? 'షాప్ ఖాతాలోకి లాగిన్ అవ్వండి' : 'Sign In to Store'}
            </Text>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Input
              label={language === 'te' ? 'యూజర్‌నేమ్ లేదా ఈమెయిల్' : 'Username or Email'}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="e.g. bhargavitej or sales"
              autoCapitalize="none"
            />

            <Input
              label={language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />

            <Button
              title={loading ? (language === 'te' ? 'లాగిన్ అవుతోంది...' : 'Signing in...') : t('signIn')}
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.signInButton}
            />

            {/* Quick Demo Switcher */}
            <View style={styles.quickFillSection}>
              <Text style={styles.quickFillLabel}>{t('demoAccounts')}:</Text>
              <View style={styles.quickFillButtons}>
                <Button
                  title={t('bhargaviOwner')}
                  variant={identifier === 'bhargavitej' ? 'secondary' : 'outline'}
                  size="sm"
                  onPress={() => handleQuickFill('bhargavi')}
                  style={styles.quickBtn}
                />
                <Button
                  title={t('salesBadge')}
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
              🔒 Node.js & MongoDB Atlas Dual-User Cloud Sync
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
    backgroundColor: Colors.mintBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borders,
    gap: 6,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkForest,
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
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.darkForest,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.md,
    gap: 8,
  },
  connConnected: {
    backgroundColor: '#EAF7EE',
    borderColor: '#BFE7D0',
  },
  connDisconnected: {
    backgroundColor: '#FDECEF',
    borderColor: '#F7CAD2',
  },
  connText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.secondaryText,
    flexShrink: 1,
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: 24,
    backgroundColor: Colors.white,
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    backgroundColor: '#FDECEF',
    color: Colors.error,
    padding: 10,
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  signInButton: {
    marginTop: Spacing.sm,
    borderRadius: 18,
    backgroundColor: Colors.primary,
  },
  quickFillSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  quickFillLabel: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    fontWeight: '700',
    marginBottom: 8,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});
