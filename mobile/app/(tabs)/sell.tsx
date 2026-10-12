import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Plus, Minus, Check, ArrowRight } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useCart, CustomerType } from '../../src/context/CartContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

export default function QuickSellScreen() {
  const router = useRouter();
  const { customerType, setCustomerType, items, addItem, updateQuantity, grandTotal, itemCount } =
    useCart();

  const [search, setSearch] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['sell-products', search],
    queryFn: async () => {
      const res = await apiClient.get(`/products?search=${encodeURIComponent(search)}&active=true`);
      return res.data?.data || [];
    },
  });

  const getCartQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product: any) => {
    if (product.availableQuantity <= 0) {
      Alert.alert('Out of Stock', `"${product.name}" has 0 available stock in inventory.`);
      return;
    }
    const currentQty = getCartQuantity(product._id);
    if (currentQty + 1 > product.availableQuantity) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${product.availableQuantity} ${product.baseUnit} available in stock.`
      );
      return;
    }
    addItem(product, 1);
  };

  const renderProduct = ({ item }: { item: any }) => {
    const currentQty = getCartQuantity(item._id);
    const applicablePrice =
      customerType === 'RESELLER' ? item.resellerPrice : item.retailPrice;
    const isOut = item.availableQuantity <= 0;

    return (
      <Card style={[styles.productCard, currentQty > 0 && styles.activeItemCard]}>
        <View style={styles.cardTop}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productMeta}>
              Stock: {item.availableQuantity} {item.baseUnit} • SKU: {item.sku}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>{formatCurrency(applicablePrice)}</Text>
            <Text style={styles.priceUnit}>/{item.baseUnit}</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <View style={styles.altPriceHint}>
            <Text style={styles.altPriceText}>
              {customerType === 'RESELLER' ? 'Retail: ' : 'Reseller: '}
              {formatCurrency(
                customerType === 'RESELLER' ? item.retailPrice : item.resellerPrice
              )}
            </Text>
          </View>

          {currentQty === 0 ? (
            <Button
              title={isOut ? 'Out of Stock' : '+ Add to Bill'}
              variant={isOut ? 'secondary' : 'primary'}
              size="sm"
              disabled={isOut}
              onPress={() => handleAddToCart(item)}
              style={styles.addBtn}
            />
          ) : (
            <View style={styles.quantityPicker}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item._id, currentQty - 1)}
              >
                <Minus size={16} color={Colors.darkForest} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>
                {currentQty} {item.baseUnit}
              </Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (currentQty + 1 > item.availableQuantity) {
                    Alert.alert('Stock Limit', `Cannot exceed available ${item.availableQuantity} ${item.baseUnit}.`);
                    return;
                  }
                  updateQuantity(item._id, currentQty + 1);
                }}
              >
                <Plus size={16} color={Colors.darkForest} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Quick Sell / POS" subtitle="Select customer type and create bill" />

      {/* Customer Type Selector Toggle */}
      <View style={styles.customerTypeWrapper}>
        <Text style={styles.customerTypeHeading}>Pricing Mode:</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              customerType === 'RETAIL' && styles.activeToggleRetail,
            ]}
            onPress={() => setCustomerType('RETAIL')}
          >
            <Text
              style={[
                styles.toggleText,
                customerType === 'RETAIL' && styles.activeToggleText,
              ]}
            >
              🛍️ Normal / Retail Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              customerType === 'RESELLER' && styles.activeToggleReseller,
            ]}
            onPress={() => setCustomerType('RESELLER')}
          >
            <Text
              style={[
                styles.toggleText,
                customerType === 'RESELLER' && styles.activeToggleText,
              ]}
            >
              🏢 Wholesale / Reseller
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search product name or SKU to bill..."
          placeholderTextColor="#9EA8A1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={[styles.listContent, itemCount > 0 && { paddingBottom: 100 }]}
      />

      {/* Floating Cart Checkout Bar */}
      {itemCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View>
            <Text style={styles.cartCountText}>{itemCount} item(s) in bill</Text>
            <Text style={styles.cartTotalText}>{formatCurrency(grandTotal)}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartProceedBtn}
            onPress={() => router.push('/sell/cart')}
          >
            <Text style={styles.cartProceedText}>Review Bill</Text>
            <ArrowRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  customerTypeWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  customerTypeHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borders,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeToggleRetail: {
    backgroundColor: '#FDEEE0',
  },
  activeToggleReseller: {
    backgroundColor: '#CEE8D8',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeToggleText: {
    color: Colors.darkForest,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.mainText,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  productCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  activeItemCard: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FAFDFB',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  productMeta: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  priceUnit: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borders,
  },
  altPriceHint: {
    flex: 1,
  },
  altPriceText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  addBtn: {
    paddingHorizontal: 16,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightMint,
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
    minWidth: 40,
    textAlign: 'center',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.darkForest,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  cartCountText: {
    color: '#B3C8BF',
    fontSize: 12,
    fontWeight: '500',
  },
  cartTotalText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  cartProceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  cartProceedText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
