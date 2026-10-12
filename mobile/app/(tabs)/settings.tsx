import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  FileText,
  Users,
  Truck,
  RotateCcw,
  LogOut,
  ChevronRight,
  Store,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isOwner, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of FreshStock?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Store Settings" subtitle="Account, permissions & administration" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <User size={30} color={Colors.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Store User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@freshstock.com'}</Text>
            <View style={styles.roleBadgeRow}>
              <Badge
                label={isOwner ? '👑 Store Owner (Full Access)' : '🛒 Salesperson'}
                variant={isOwner ? 'reseller' : 'retail'}
              />
            </View>
          </View>
        </Card>

        {/* Store Profile */}
        <Card>
          <View style={styles.storeHeader}>
            <Store size={20} color={Colors.primary} />
            <Text style={styles.storeHeading}>{user?.store?.name || 'FreshStock Groceries'}</Text>
          </View>
          <Text style={styles.storeDetail}>Currency: Indian Rupee (INR - ₹)</Text>
          <Text style={styles.storeDetail}>Timezone: Asia/Kolkata (IST)</Text>
        </Card>

        {/* Store Management (Owner Only) */}
        {isOwner && (
          <>
            <Text style={styles.menuHeading}>Owner Administration</Text>

            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/audit-logs')}
              >
                <View style={styles.menuLeft}>
                  <FileText size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>Audit Trail Logs</Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/users')}
              >
                <View style={styles.menuLeft}>
                  <Users size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>Users & Role Permissions</Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/suppliers')}
              >
                <View style={styles.menuLeft}>
                  <Truck size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>Suppliers Directory</Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={() => router.push('/purchase/history')}
              >
                <View style={styles.menuLeft}>
                  <Shield size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>Bulk Purchase History</Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* General Management */}
        <Text style={styles.menuHeading}>Operations</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/sales/history')}
          >
            <View style={styles.menuLeft}>
              <RotateCcw size={18} color={Colors.darkForest} />
              <Text style={styles.menuText}>Sales History & Returns</Text>
            </View>
            <ChevronRight size={18} color={Colors.secondaryText} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of FreshStock"
          onPress={handleLogout}
          variant="destructive"
          icon={<LogOut size={16} color={Colors.white} />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  roleBadgeRow: {
    marginTop: 6,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  storeDetail: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  menuHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  logoutBtn: {
    marginTop: Spacing.xl,
  },
});
