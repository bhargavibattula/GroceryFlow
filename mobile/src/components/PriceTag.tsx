import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { formatCurrency } from '../utils/format';

interface PriceTagProps {
  resellerPrice: number;
  retailPrice: number;
  selectedPriceType?: 'RESELLER' | 'RETAIL';
  unit?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  resellerPrice,
  retailPrice,
  selectedPriceType,
  unit,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.priceBlock,
          selectedPriceType === 'RESELLER' && styles.highlightReseller,
        ]}
      >
        <Text style={styles.label}>Reseller</Text>
        <Text style={styles.priceText}>
          {formatCurrency(resellerPrice)}
          {unit ? <Text style={styles.unitText}>/{unit}</Text> : null}
        </Text>
      </View>

      <View style={styles.divider} />

      <View
        style={[
          styles.priceBlock,
          selectedPriceType === 'RETAIL' && styles.highlightRetail,
        ]}
      >
        <Text style={styles.label}>Retail</Text>
        <Text style={styles.priceText}>
          {formatCurrency(retailPrice)}
          {unit ? <Text style={styles.unitText}>/{unit}</Text> : null}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightMint,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  priceBlock: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highlightReseller: {
    backgroundColor: '#CEE8D8',
  },
  highlightRetail: {
    backgroundColor: '#FDEEE0',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.secondaryText,
  },
  divider: {
    width: 1,
    height: '75%',
    backgroundColor: Colors.borders,
    marginHorizontal: 4,
  },
});
