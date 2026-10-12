import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
  Globe,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isOwner, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('signOut'),
      language === 'te'
        ? 'మీరు ఖచ్చితంగా ఫ్రెష్‌స్టాక్ నుండి లాగౌట్ కావాలనుకుంటున్నారా?'
        : 'Are you sure you want to log out of FreshStock?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={language === 'te' ? 'స్టోర్ సెట్టింగ్స్' : 'Store Settings'}
        subtitle={
          language === 'te'
            ? 'ఖాతా, భాష & దుకాణ నిర్వహణ'
            : 'Account, language & administration'
        }
      />

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
                label={isOwner ? t('ownerBadge') : t('salesBadge')}
                variant={isOwner ? 'reseller' : 'retail'}
              />
            </View>
          </View>
        </Card>

        {/* Language Selection Card */}
        <Text style={styles.menuHeading}>{t('language')}</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={[styles.langOptionRow, language === 'te' && styles.activeLangRow]}
            onPress={() => setLanguage('te')}
          >
            <View style={styles.langLeft}>
              <Text style={styles.langFlag}>🇮🇳</Text>
              <View>
                <Text style={styles.langTitle}>తెలుగు (Telugu)</Text>
                <Text style={styles.langSubtitle}>యాప్ అంతటా తెలుగు భాష</Text>
              </View>
            </View>
            {language === 'te' && <Check size={20} color={Colors.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langOptionRow, language === 'en' && styles.activeLangRow, { borderBottomWidth: 0 }]}
            onPress={() => setLanguage('en')}
          >
            <View style={styles.langLeft}>
              <Text style={styles.langFlag}>🌐</Text>
              <View>
                <Text style={styles.langTitle}>English</Text>
                <Text style={styles.langSubtitle}>English throughout the app</Text>
              </View>
            </View>
            {language === 'en' && <Check size={20} color={Colors.primary} />}
          </TouchableOpacity>
        </Card>

        {/* Store Profile */}
        <Text style={styles.menuHeading}>{language === 'te' ? 'దుకాణం వివరాలు' : 'Store Details'}</Text>
        <Card style={styles.menuCard}>
          <View style={styles.storeHeader}>
            <View style={styles.storeLogoCircle}>
              <Image
                source={require('../../assets/icon-mark.png')}
                style={styles.storeLogoImage}
                resizeMode="cover"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeHeading}>
                {language === 'te' ? 'భార్గవి కిరాణా & జనరల్ స్టోర్స్' : 'Bhargavi Kirana & General Stores'}
              </Text>
              <Text style={styles.storeSub}>FreshStock Inventory & Dual-Pricing</Text>
            </View>
          </View>
          <Text style={styles.storeDetail}>
            {language === 'te' ? 'కరెన్సీ: భారత రూపాయి (INR - ₹)' : 'Currency: Indian Rupee (INR - ₹)'}
          </Text>
          <Text style={styles.storeDetail}>
            {language === 'te' ? 'సమయ మండలం: Asia/Kolkata (IST)' : 'Timezone: Asia/Kolkata (IST)'}
          </Text>
        </Card>

        {/* Store Management (Owner Only) */}
        {isOwner && (
          <>
            <Text style={styles.menuHeading}>
              {language === 'te' ? 'ఓనర్ నిర్వాహక ప్యానెల్' : 'Owner Administration'}
            </Text>

            <Card style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/audit-logs')}
              >
                <View style={styles.menuLeft}>
                  <FileText size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>
                    {language === 'te' ? 'ఆడిట్ లాగ్స్ & రికార్డులు' : 'Audit Trail Logs'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin/users')}
              >
                <View style={styles.menuLeft}>
                  <Users size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>
                    {language === 'te' ? 'యూజర్లు & అనుమతులు' : 'Users & Role Permissions'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/suppliers')}
              >
                <View style={styles.menuLeft}>
                  <Truck size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>
                    {language === 'te' ? 'సప్లయర్ల డైరెక్టరీ' : 'Suppliers Directory'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={() => router.push('/purchase/history')}
              >
                <View style={styles.menuLeft}>
                  <Shield size={18} color={Colors.darkForest} />
                  <Text style={styles.menuText}>
                    {language === 'te' ? 'హోల్‌సేల్ కొనుగోళ్ల చరిత్ర' : 'Bulk Purchase History'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.secondaryText} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* General Management */}
        <Text style={styles.menuHeading}>
          {language === 'te' ? 'అమ్మకాల నిర్వహణ' : 'Operations'}
        </Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/sales/history')}
          >
            <View style={styles.menuLeft}>
              <RotateCcw size={18} color={Colors.darkForest} />
              <Text style={styles.menuText}>
                {language === 'te' ? 'అమ్మకాల చరిత్ర & రిటర్న్స్' : 'Sales History & Returns'}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.secondaryText} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <Button
          title={language === 'te' ? 'ఫ్రెష్‌స్టాక్ నుండి లాగౌట్ అవ్వండి' : 'Sign Out of FreshStock'}
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
    backgroundColor: Colors.mintBackground,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90, // Room for floating dock
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 22,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  userEmail: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  roleBadgeRow: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  menuHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  activeLangRow: {
    backgroundColor: '#FAFDFB',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langFlag: {
    fontSize: 24,
  },
  langTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  langSubtitle: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  storeLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#D4E8DC',
  },
  storeLogoImage: {
    width: '100%',
    height: '100%',
  },
  storeHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  storeSub: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  storeDetail: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  logoutBtn: {
    marginTop: Spacing.lg,
    borderRadius: 20,
  },
});
