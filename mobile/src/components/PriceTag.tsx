import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

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
  const { language } = useLanguage();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.priceBlock,
          selectedPriceType === 'RESELLER' && styles.highlightReseller,
        ]}
      >
        <Text style={styles.label}>
          {language === 'te' ? 'హోల్‌సేల్' : 'Wholesale'}
        </Text>
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
        <Text style={styles.label}>
          {language === 'te' ? 'రిటైల్' : 'Retail'}
        </Text>
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
    backgroundColor: '#FFFFFFCC',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  priceBlock: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  highlightReseller: {
    backgroundColor: '#E4F4EB',
  },
  highlightRetail: {
    backgroundColor: '#FDF1E6',
  },
  label: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.secondaryText,
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  unitText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.secondaryText,
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E6EFE9',
    marginHorizontal: 4,
  },
});
