import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Package } from 'lucide-react-native';
import { Colors, Spacing } from '../theme/colors';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

interface ProductGridCardProps {
  product: any;
  cardIndex?: number;
  cartQuantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onPressCard?: () => void;
  selectedPriceType?: 'RESELLER' | 'RETAIL';
}

const EMOJI_MAP: Record<string, string> = {
  RICE: '🍚',
  DAL: '🍲',
  SUGAR: '🍬',
  OIL: '🌻',
  FLOUR: '🌾',
  SNK: '🍪',
  CARE: '🧼',
  BEV: '☕',
};

function getProductEmoji(sku: string, name: string): string {
  const upper = (sku + ' ' + name).toUpperCase();
  if (upper.includes('RICE')) return '🍚';
  if (upper.includes('DAL')) return '🥣';
  if (upper.includes('SUGAR')) return '🧂';
  if (upper.includes('OIL')) return '🌻';
  if (upper.includes('ATTA') || upper.includes('FLOUR') || upper.includes('WHEAT')) return '🌾';
  if (upper.includes('BISCUIT') || upper.includes('PARLE')) return '🍪';
  if (upper.includes('SOAP')) return '🧼';
  if (upper.includes('TEA') || upper.includes('COFFEE')) return '☕';
  return '📦';
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  cardIndex = 0,
  cartQuantity,
  onIncrement,
  onDecrement,
  onPressCard,
  selectedPriceType = 'RETAIL',
}) => {
  const { language, t } = useLanguage();

  const tintBg = Colors.cardTints[cardIndex % Colors.cardTints.length];
  const emoji = getProductEmoji(product.sku, product.name);
  const activePrice = selectedPriceType === 'RESELLER' ? product.resellerPrice : product.retailPrice;
  const isOutOfStock = product.availableQuantity <= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPressCard}
      style={[styles.card, { backgroundColor: tintBg }]}
    >
      {/* Top Row: Stock Badge & Stepper */}
      <View style={styles.topRow}>
        <View style={[styles.stockPill, isOutOfStock && styles.outStockPill]}>
          <Text style={[styles.stockPillText, isOutOfStock && styles.outStockText]}>
            {isOutOfStock
              ? t('outOfStock')
              : `${product.availableQuantity} ${product.baseUnit}`}
          </Text>
        </View>

        {/* Stepper pill matching the reference design */}
        <View style={styles.stepperPill}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={onIncrement}
            disabled={isOutOfStock}
          >
            <Plus size={14} color={Colors.darkForest} />
          </TouchableOpacity>
          {cartQuantity > 0 ? (
            <>
              <Text style={styles.qtyText}>{cartQuantity}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={onDecrement}>
                <Minus size={14} color={Colors.darkForest} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {/* Visual Product Representation */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emojiText}>{emoji}</Text>
      </View>

      {/* Product Details */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brandText} numberOfLines={1}>
          {product.brand || product.sku}
        </Text>

        {/* Dual Pricing Pill */}
        <View style={styles.priceContainer}>
          <View style={styles.mainPriceRow}>
            <Text style={styles.activePriceText}>{formatCurrency(activePrice)}</Text>
            <Text style={styles.unitText}>/{product.baseUnit}</Text>
          </View>

          <View style={styles.dualPriceBadges}>
            <View
              style={[
                styles.smallBadge,
                selectedPriceType === 'RESELLER' && styles.highlightBadge,
              ]}
            >
              <Text style={styles.smallBadgeText}>
                {language === 'te' ? 'హోల్‌సేల్' : 'Wholesale'}: {formatCurrency(product.resellerPrice)}
              </Text>
            </View>
            <View
              style={[
                styles.smallBadge,
                selectedPriceType === 'RETAIL' && styles.highlightBadge,
              ]}
            >
              <Text style={styles.smallBadgeText}>
                {language === 'te' ? 'రిటైల్' : 'Retail'}: {formatCurrency(product.retailPrice)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flex: 1,
    minHeight: 220,
    justifyContent: 'space-between',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stockPill: {
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  outStockPill: {
    backgroundColor: '#FDEAEB',
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  outStockText: {
    color: Colors.error,
  },
  stepperPill: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stepBtn: {
    padding: 3,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkForest,
    marginVertical: 2,
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emojiText: {
    fontSize: 44,
  },
  infoContainer: {
    marginTop: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkForest,
    lineHeight: 18,
  },
  brandText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
    marginBottom: 6,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF99',
    paddingTop: 6,
  },
  mainPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  activePriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  unitText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginLeft: 2,
  },
  dualPriceBadges: {
    marginTop: 4,
    gap: 2,
  },
  smallBadge: {
    backgroundColor: '#FFFFFF99',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    alignSelf: 'flex-start',
  },
  highlightBadge: {
    backgroundColor: '#229E7422',
  },
  smallBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.darkForest,
  },
});
