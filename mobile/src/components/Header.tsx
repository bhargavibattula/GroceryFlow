import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Store, ShoppingBag, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
  rightAction,
}) => {
  const router = useRouter();
  const { user, isOwner } = useAuth();
  const { itemCount } = useCart();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.avatarCircle}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || (language === 'te' ? 'భార్గవి కిరాణా & జనరల్ స్టోర్స్' : 'Bhargavi Kirana & General Stores')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle || (isOwner ? t('ownerBadge') : t('salesBadge'))}
          </Text>
        </View>
      </View>

      <View style={styles.rightActionsRow}>
        {/* Instant Telugu / English Switcher */}
        {showLanguageToggle && (
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Globe size={14} color={Colors.darkForest} />
            <Text style={styles.langText}>
              {language === 'te' ? 'తెలుగు' : 'EN'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Shopping bag with badge */}
        <TouchableOpacity
          style={styles.cartIconBtn}
          onPress={() => router.push('/sell/cart')}
        >
          <ShoppingBag size={20} color={Colors.darkForest} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.mintBackground,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#D4E8DC',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  subtitle: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borders,
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  cartIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF5757',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
