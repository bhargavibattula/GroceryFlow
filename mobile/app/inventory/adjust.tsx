import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, Sparkles } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function StockAdjustScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const { productId, currentStock } = useLocalSearchParams<{
    productId: string;
    currentStock: string;
  }>();

  const [newQuantity, setNewQuantity] = useState(currentStock || '0');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/inventory/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-details', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert(
        language === 'te' ? 'స్టాక్ సవరించబడింది' : 'Stock Adjusted',
        language === 'te'
          ? 'సరుకు నిల్వ విజయవంతంగా నవీకరించబడింది మరియు ఆడిట్ లాగ్ భద్రపరచబడింది.'
          : 'Inventory balance updated and audit movement logged.'
      );
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Adjustment Failed', err.message || 'Unable to adjust stock.');
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert(
        language === 'te' ? 'కారణం అవసరం' : 'Reason Required',
        language === 'te'
          ? 'స్టాక్ మార్పునకు తప్పనిసరిగా కారణం పేర్కొనాలి (ఉదా. భౌతిక లెక్కింపు వ్యత్యాసం).'
          : 'A mandatory reason is required for manual stock adjustments.'
      );
      return;
    }

    mutation.mutate({
      productId,
      newQuantity: Number(newQuantity),
      reason: reason.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'స్టాక్ మాన్యువల్ సర్దుబాటు' : 'Stock Adjustment'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.title}>
            {language === 'te' ? 'భౌతిక నిల్వ సవరణ' : 'Manual Stock Adjustment'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'te'
              ? 'షాపులోని నిజమైన సరుకును లెక్కించి, వివరాలను ఇక్కడ నవీకరించండి.'
              : 'Adjust available physical quantity and document the reason in audit trail.'}
          </Text>

          <View style={styles.currentStockBox}>
            <Text style={styles.currentLabel}>
              {language === 'te' ? 'ప్రస్తుత నమోదిత స్టాక్:' : 'Current Recorded Stock:'}
            </Text>
            <Text style={styles.currentVal}>{currentStock || 0} units</Text>
          </View>

          <Input
            label={language === 'te' ? 'నిజమైన భౌతిక స్టాక్ పరిమాణం *' : 'Correct Physical Count Quantity *'}
            value={newQuantity}
            onChangeText={setNewQuantity}
            keyboardType="numeric"
          />

          <Input
            label={language === 'te' ? 'సర్దుబాటుకు గల కారణం *' : 'Mandatory Reason for Adjustment *'}
            value={reason}
            onChangeText={setReason}
            placeholder={
              language === 'te'
                ? 'ఉదా. నెలాఖరు భౌతిక లెక్కింపు వ్యత్యాసం / పాడైన సరుకు'
                : 'e.g. Month-end physical count discrepancy'
            }
            helper={language === 'te' ? 'ఆడిట్ ట్రాకింగ్ కోసం అవసరం' : 'Required for audit log compliance'}
          />
        </Card>

        <Button
          title={
            mutation.isPending
              ? language === 'te'
                ? 'సేవ్ అవుతోంది...'
                : 'Saving Adjustment...'
              : language === 'te'
              ? 'స్టాక్ మార్పును భద్రపరచండి'
              : 'Save Adjustment'
          }
          onPress={handleSubmit}
          loading={mutation.isPending}
          size="lg"
          style={styles.saveBtn}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.darkForest,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  currentStockBox: {
    backgroundColor: '#F3F9F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  currentVal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  saveBtn: {
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
  },
});
