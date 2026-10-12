import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, ArrowUpDown, Tag } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useCart } from '../../src/context/CartContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { ProductGridCard } from '../../src/components/ProductGridCard';
import { formatCurrency } from '../../src/utils/format';

export default function QuickSellScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { customerType, setCustomerType, items, addItem, updateQuantity, grandTotal, itemCount } =
    useCart();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['sell-products', search],
    queryFn: async () => {
      const res = await apiClient.get(`/products?search=${encodeURIComponent(search)}&active=true`);
      return res.data?.data || [];
    },
  });

  const categoryFilters = [
    { id: 'ALL', nameEn: 'All', nameTe: 'అన్నీ' },
    { id: 'GRAINS', nameEn: 'Grains & Rice', nameTe: 'బియ్యం & ధాన్యాలు', match: 'RICE' },
    { id: 'DALS', nameEn: 'Dals & Pulses', nameTe: 'పప్పు దినుసులు', match: 'DAL' },
    { id: 'OILS', nameEn: 'Cooking Oils', nameTe: 'నూనెలు', match: 'OIL' },
    { id: 'SNACKS', nameEn: 'Biscuits & Snacks', nameTe: 'స్నాక్స్ & బిస్కెట్లు', match: 'BISCUIT' },
    { id: 'DRINKS', nameEn: 'Beverages', nameTe: 'టీ & కాఫీ', match: 'TEA' },
  ];

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    const cat = categoryFilters.find((c) => c.id === selectedCategory);
    if (!cat?.match) return products;
    return products.filter((p: any) => {
      const target = (p.sku + ' ' + p.name).toUpperCase();
      return target.includes(cat.match);
    });
  }, [products, selectedCategory]);

  const getCartQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleIncrement = (product: any) => {
    if (product.availableQuantity <= 0) {
      Alert.alert(
        language === 'te' ? 'స్టాక్ అయిపోయింది' : 'Out of Stock',
        language === 'te'
          ? `"${product.name}" ప్రస్తుతం దుకాణంలో అందుబాటులో లేదు.`
          : `"${product.name}" has 0 stock in inventory.`
      );
      return;
    }
    const currentQty = getCartQuantity(product._id);
    if (currentQty + 1 > product.availableQuantity) {
      Alert.alert(
        language === 'te' ? 'స్టాక్ పరిమితి' : 'Insufficient Stock',
        language === 'te'
          ? `షాపులో కేవలం ${product.availableQuantity} ${product.baseUnit} మాత్రమే ఉన్నాయి.`
          : `Only ${product.availableQuantity} ${product.baseUnit} available in stock.`
      );
      return;
    }
    addItem(product, 1);
  };

  const handleDecrement = (product: any) => {
    const currentQty = getCartQuantity(product._id);
    if (currentQty > 0) {
      updateQuantity(product._id, currentQty - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t('quickSell')}
        subtitle={
          customerType === 'RESELLER'
            ? language === 'te'
              ? '🏢 హోల్‌సేల్ / రీసెల్లర్ బిల్లింగ్'
              : '🏢 Wholesale Pricing Active'
            : language === 'te'
            ? '🛍️ సాధారణ రిటైల్ బిల్లింగ్'
            : '🛍️ Retail Customer Pricing'
        }
      />

      {/* Customer Pricing Toggle */}
      <View style={styles.pricingToggleContainer}>
        <View style={styles.pricingTogglePill}>
          <TouchableOpacity
            style={[
              styles.toggleTab,
              customerType === 'RETAIL' && styles.activeRetailTab,
            ]}
            onPress={() => setCustomerType('RETAIL')}
          >
            <Text
              style={[
                styles.toggleTabText,
                customerType === 'RETAIL' && styles.activeTabText,
              ]}
            >
              🛍️ {t('retail')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleTab,
              customerType === 'RESELLER' && styles.activeResellerTab,
            ]}
            onPress={() => setCustomerType('RESELLER')}
          >
            <Text
              style={[
                styles.toggleTabText,
                customerType === 'RESELLER' && styles.activeTabText,
              ]}
            >
              🏢 {t('reseller')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Horizontal Pill Chips matching Reference Image */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.activeCategoryChip]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.activeCategoryChipText,
                  ]}
                >
                  {language === 'te' ? cat.nameTe : cat.nameEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchProduct')}
          placeholderTextColor="#9EA8A1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Popular Items Heading */}
      <View style={styles.itemsHeaderRow}>
        <Text style={styles.itemsHeaderTitle}>
          {language === 'te' ? 'సరుకుల జాబితా' : 'Popular Items'}
        </Text>
        <View style={styles.itemsHeaderRight}>
          <Text style={styles.itemCountBadge}>
            {filteredProducts.length} {language === 'te' ? 'సరుకులు' : 'items'}
          </Text>
          <ArrowUpDown size={16} color={Colors.secondaryText} />
        </View>
      </View>

      {/* 2-Column Product Grid matching Reference Screen */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.gridColumnWrapper}
        contentContainerStyle={[
          styles.listContent,
          itemCount > 0 ? { paddingBottom: 120 } : { paddingBottom: 80 },
        ]}
        renderItem={({ item, index }) => (
          <View style={styles.gridItemWrapper}>
            <ProductGridCard
              product={item}
              cardIndex={index}
              cartQuantity={getCartQuantity(item._id)}
              onIncrement={() => handleIncrement(item)}
              onDecrement={() => handleDecrement(item)}
              selectedPriceType={customerType}
              onPressCard={() => router.push(`/product/${item._id}`)}
            />
          </View>
        )}
      />

      {/* Bottom Floating Pill Cart Drawer matching Reference Screen */}
      {itemCount > 0 && (
        <View style={styles.floatingCartDrawer}>
          <View style={styles.cartInfoLeft}>
            <Text style={styles.cartTotalLabel}>
              {language === 'te' ? 'మొత్తం' : 'Total'} : {itemCount}x
            </Text>
            <Text style={styles.cartTotalAmount}>{formatCurrency(grandTotal)}</Text>
          </View>

          <TouchableOpacity
            style={styles.whiteCartBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/sell/cart')}
          >
            <Text style={styles.whiteCartBtnText}>{t('cart')}</Text>
            <ShoppingBag size={18} color={Colors.darkForest} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.mintBackground,
  },
  pricingToggleContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  pricingTogglePill: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRetailTab: {
    backgroundColor: '#FDF1E6',
  },
  activeResellerTab: {
    backgroundColor: '#EAF7EE',
  },
  toggleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeTabText: {
    color: Colors.darkForest,
    fontWeight: '800',
  },
  categoriesSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeCategoryChip: {
    backgroundColor: '#FEF3D6',
    borderColor: '#F6D99F',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeCategoryChipText: {
    color: '#8A5306',
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: 4,
    marginBottom: Spacing.xs,
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: Colors.mainText,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: 6,
  },
  itemsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  itemsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCountBadge: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItemWrapper: {
    flex: 1,
    maxWidth: '48.5%',
  },
  floatingCartDrawer: {
    position: 'absolute',
    bottom: 84, // Sits comfortably above floating dock
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#229E74',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  cartInfoLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cartTotalLabel: {
    color: '#E0F5EC',
    fontSize: 13,
    fontWeight: '700',
  },
  cartTotalAmount: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '900',
  },
  whiteCartBtn: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  whiteCartBtnText: {
    color: Colors.darkForest,
    fontSize: 13,
    fontWeight: '800',
  },
});
