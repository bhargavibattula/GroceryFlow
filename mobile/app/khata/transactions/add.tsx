import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Calendar, FileText, CreditCard, ChevronDown } from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi, KhataAccount } from '../../../src/api/khata';

export default function AddTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ accountId?: string; defaultType?: string }>();

  const [selectedAccountId, setSelectedAccountId] = useState(params.accountId || '');
  const [transactionType, setTransactionType] = useState<any>(params.defaultType || 'CREDIT_SALE');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDays, setDueDays] = useState('15');

  // Load accounts for dropdown
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ['khata-accounts-all'],
    queryFn: () => khataApi.getAccounts({}),
  });

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);
  const isCustomer = selectedAccount ? selectedAccount.type === 'CUSTOMER' || selectedAccount.type === 'BOTH' : true;

  // Set default type if account type switches
  useEffect(() => {
    if (selectedAccount) {
      if (selectedAccount.type === 'SUPPLIER') {
        if (transactionType === 'CREDIT_SALE' || transactionType === 'PAYMENT_RECEIVED') {
          setTransactionType('CREDIT_PURCHASE');
        }
      } else {
        if (transactionType === 'CREDIT_PURCHASE' || transactionType === 'PAYMENT_MADE') {
          setTransactionType('CREDIT_SALE');
        }
      }
    }
  }, [selectedAccountId, selectedAccount]);

  const postMutation = useMutation({
    mutationFn: (payload: any) => khataApi.postTransaction(selectedAccountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khata-account', selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['khata-ledger', selectedAccountId] });
      queryClient.invalidateQueries({ queryKey: ['khata-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['khata-dashboard'] });
      Alert.alert(
        language === 'te' ? 'విజయవంతం!' : 'Success!',
        language === 'te' ? 'లావాదేవీ విజయవంతంగా నమోదైంది.' : 'Transaction successfully recorded in Khata.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to post transaction.');
    },
  });

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert('Required', language === 'te' ? 'దయచేసి ఖాతాను ఎంచుకోండి' : 'Please select an account.');
      return;
    }

    const cleanAmount = parseFloat(amount);
    if (!cleanAmount || cleanAmount <= 0) {
      Alert.alert('Required', language === 'te' ? 'దయచేసి సరైన మొత్తాన్ని నమోదు చేయండి' : 'Please enter a valid amount.');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(dueDays, 10) || 15));

    postMutation.mutate({
      transactionType,
      amount: cleanAmount,
      paymentMethod,
      invoiceNumber: invoiceNumber.trim(),
      notes: notes.trim(),
      dueDate,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>
        {language === 'te' ? 'ఖాతా నమోదు చేయండి' : 'Record Khata Entry'}
      </Text>

      {/* Select Account Bar */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>
          {language === 'te' ? 'ఖాతాదారుని ఎంచుకోండి *' : 'Select Account *'}
        </Text>
        {isAccountsLoading ? (
          <ActivityIndicator color={Colors.dockBg} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
            {accounts.map((acc) => {
              const isSelected = acc._id === selectedAccountId;
              return (
                <TouchableOpacity
                  key={acc._id}
                  style={[styles.accountChip, isSelected && styles.accountChipActive]}
                  onPress={() => setSelectedAccountId(acc._id)}
                >
                  <Text style={[styles.accountChipText, isSelected && styles.accountChipTextActive]}>
                    {acc.name} ({acc.type})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Entry Type Buttons */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>
          {language === 'te' ? 'ఎంట్రీ రకం *' : 'Entry Type *'}
        </Text>
        <View style={styles.typeButtonsGrid}>
          {isCustomer ? (
            <>
              <TouchableOpacity
                style={[
                  styles.entryTypeBtn,
                  transactionType === 'CREDIT_SALE' && styles.entryTypeBtnGave,
                ]}
                onPress={() => setTransactionType('CREDIT_SALE')}
              >
                <Text
                  style={[
                    styles.entryTypeText,
                    transactionType === 'CREDIT_SALE' && styles.entryTypeTextActive,
                  ]}
                >
                  {language === 'te' ? 'ఉద్దెర ఇచ్చాం (-)' : 'You Gave / Credit (-)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.entryTypeBtn,
                  transactionType === 'PAYMENT_RECEIVED' && styles.entryTypeBtnGot,
                ]}
                onPress={() => setTransactionType('PAYMENT_RECEIVED')}
              >
                <Text
                  style={[
                    styles.entryTypeText,
                    transactionType === 'PAYMENT_RECEIVED' && styles.entryTypeTextActive,
                  ]}
                >
                  {language === 'te' ? 'డబ్బులు వచ్చాయి (+)' : 'You Got / Payment (+)'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.entryTypeBtn,
                  transactionType === 'CREDIT_PURCHASE' && styles.entryTypeBtnGave,
                ]}
                onPress={() => setTransactionType('CREDIT_PURCHASE')}
              >
                <Text
                  style={[
                    styles.entryTypeText,
                    transactionType === 'CREDIT_PURCHASE' && styles.entryTypeTextActive,
                  ]}
                >
                  {language === 'te' ? 'సరుకు వచ్చింది (బిల్లు)' : 'Purchased Goods (Bill)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.entryTypeBtn,
                  transactionType === 'PAYMENT_MADE' && styles.entryTypeBtnGot,
                ]}
                onPress={() => setTransactionType('PAYMENT_MADE')}
              >
                <Text
                  style={[
                    styles.entryTypeText,
                    transactionType === 'PAYMENT_MADE' && styles.entryTypeTextActive,
                  ]}
                >
                  {language === 'te' ? 'చెల్లించాం (పేమెంట్)' : 'You Paid (Supplier)'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Amount & Reference Details */}
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'మొత్తం (₹) *' : 'Amount (₹) *'}
          </Text>
          <View style={styles.amountInputWrap}>
            <IndianRupee size={22} color={Colors.dockBg} />
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'చెల్లింపు మోడ్' : 'Payment Mode'}
          </Text>
          <View style={styles.methodRow}>
            {(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodChip, paymentMethod === m && styles.methodChipActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text
                  style={[styles.methodChipText, paymentMethod === m && styles.methodChipTextActive]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'బిల్లు లేదా రిఫరెన్స్ నంబర్' : 'Bill or Reference #'}
          </Text>
          <TextInput
            style={styles.simpleInput}
            placeholder="e.g. FS-20261012-0001"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'గడువు రోజులు' : 'Due Days'}
          </Text>
          <View style={styles.dueDaysRow}>
            {['7', '15', '30'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dueDayChip, dueDays === d && styles.dueDayChipActive]}
                onPress={() => setDueDays(d)}
              >
                <Text style={[styles.dueDayText, dueDays === d && styles.dueDayTextActive]}>
                  {d} {language === 'te' ? 'రోజులు' : 'Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'వివరణ / నోట్స్' : 'Notes'}
          </Text>
          <TextInput
            style={styles.simpleInput}
            placeholder={language === 'te' ? 'ఉదా. బియ్యం బస్తా తీసుకున్నారు' : 'e.g. Rice bag taken'}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={postMutation.isPending}
      >
        {postMutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>
            {language === 'te' ? 'ఎంట్రీ నమోదు చేయండి' : 'Save Khata Entry'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  accountsScroll: {
    flexDirection: 'row',
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  accountChipActive: {
    backgroundColor: Colors.dockBg,
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  accountChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  typeButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  entryTypeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  entryTypeBtnGave: {
    backgroundColor: '#DC2626',
  },
  entryTypeBtnGot: {
    backgroundColor: '#16A34A',
  },
  entryTypeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  entryTypeTextActive: {
    color: Colors.white,
  },
  inputGroup: {
    marginBottom: 14,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#15803D',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  methodChipActive: {
    backgroundColor: Colors.dockBg,
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  methodChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  simpleInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    color: '#1F2937',
  },
  dueDaysRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dueDayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  dueDayChipActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  dueDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  dueDayTextActive: {
    fontWeight: '700',
    color: '#16A34A',
  },
  submitBtn: {
    backgroundColor: Colors.dockBg,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
