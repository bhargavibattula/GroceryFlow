import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  MessageCircle,
  Share2,
  Plus,
  Minus,
  RotateCcw,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi, KhataTransaction } from '../../../src/api/khata';

export default function AccountLedgerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const {
    data: accountData,
    isLoading: isAccountLoading,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ['khata-account', id],
    queryFn: () => khataApi.getAccountById(id!),
    enabled: !!id,
  });

  const {
    data: ledger = [],
    isLoading: isLedgerLoading,
    refetch: refetchLedger,
    isRefetching,
  } = useQuery({
    queryKey: ['khata-ledger', id],
    queryFn: () => khataApi.getLedger(id!),
    enabled: !!id,
  });

  const reverseMutation = useMutation({
    mutationFn: ({ txId, reason }: { txId: string; reason: string }) =>
      khataApi.reverseTransaction(txId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khata-account', id] });
      queryClient.invalidateQueries({ queryKey: ['khata-ledger', id] });
      queryClient.invalidateQueries({ queryKey: ['khata-dashboard'] });
      Alert.alert('Reversed', 'Transaction reversed and ledger balance updated.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to reverse transaction.');
    },
  });

  const account = accountData?.account;
  const isCustomer = account?.type === 'CUSTOMER' || account?.type === 'BOTH';

  const handleCall = () => {
    if (account?.phone) Linking.openURL(`tel:${account.phone}`);
  };

  const handleWhatsApp = () => {
    if (!account?.phone) return;
    const cleanPhone = account.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg =
      language === 'te'
        ? `నమస్తే ${account.name} గారు, భార్గవి కిరాణా & జనరల్ స్టోర్స్ నుండి. మీ ఖాతా బకాయి మొత్తం ₹${account.currentBalance}. దయచేసి త్వరలో చెల్లించగలరు. ధన్యవాదాలు!`
        : `Hello ${account.name}, reminder from Bhargavi Kirana Stores. Outstanding balance is ₹${account.currentBalance}. Please clear when convenient. Thank you!`;

    Linking.openURL(`whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`).catch(() => {
      Linking.openURL(`sms:${account.phone}?body=${encodeURIComponent(msg)}`);
    });
  };

  const handleShareStatement = async () => {
    if (!account) return;
    const text =
      `*BHARGAVI KIRANA & GENERAL STORES*\n` +
      `Account: ${account.name}\n` +
      `Phone: ${account.phone || 'N/A'}\n` +
      `Current Balance: ₹${account.currentBalance}\n` +
      `Status: ${account.currentBalance > 0 ? (isCustomer ? "You'll Get" : "You'll Give") : 'Settled'}\n` +
      `Date: ${new Date().toLocaleDateString('en-IN')}`;

    try {
      await Share.share({ message: text });
    } catch (e) {
      // ignore
    }
  };

  const promptReverse = (tx: KhataTransaction) => {
    Alert.alert(
      language === 'te' ? 'లావాదేవీ రద్దు' : 'Reverse Transaction',
      language === 'te'
        ? `₹${tx.amount} ఎంట్రీని రద్దు చేసి బ్యాలెన్స్ సరిచేయాలా?`
        : `Reverse ₹${tx.amount} entry and adjust running balance?`,
      [
        { text: language === 'te' ? 'వద్దు' : 'Cancel', style: 'cancel' },
        {
          text: language === 'te' ? 'రద్దు చేయి' : 'Reverse',
          style: 'destructive',
          onPress: () =>
            reverseMutation.mutate({
              txId: tx._id,
              reason: 'Reversed by store user from mobile ledger',
            }),
        },
      ]
    );
  };

  const renderLedgerItem = ({ item }: { item: KhataTransaction }) => {
    const isDebit = item.direction === 'DEBIT';
    const isReversed = item.status === 'REVERSED';

    // Contextual badge label
    let typeLabel = item.transactionType.replace(/_/g, ' ');
    if (language === 'te') {
      if (item.transactionType === 'CREDIT_SALE') typeLabel = 'ఉద్దెర అమ్మకం';
      else if (item.transactionType === 'PAYMENT_RECEIVED') typeLabel = 'వసూలు చెల్లింపు';
      else if (item.transactionType === 'CREDIT_PURCHASE') typeLabel = 'సరుకు కొనుగోలు';
      else if (item.transactionType === 'PAYMENT_MADE') typeLabel = 'సప్లయర్ చెల్లింపు';
      else if (item.transactionType === 'OPENING_BALANCE') typeLabel = 'ప్రారంభ బాకీ';
    }

    return (
      <View style={[styles.txCard, isReversed && styles.txCardReversed]}>
        <View style={styles.txTopRow}>
          <View style={styles.txDateRow}>
            <Calendar size={13} color="#6B7280" />
            <Text style={styles.txDateText}>
              {new Date(item.transactionDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            {item.invoiceNumber ? (
              <Text style={styles.invoiceBadge}>#{item.invoiceNumber}</Text>
            ) : null}
          </View>

          {isReversed ? (
            <View style={styles.reversedBadge}>
              <Text style={styles.reversedText}>
                {language === 'te' ? 'రద్దు చేయబడింది' : 'REVERSED'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => promptReverse(item)}>
              <RotateCcw size={15} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.txDetailsRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.txTypeText, isReversed && { textDecorationLine: 'line-through' }]}>
              {typeLabel}
            </Text>
            {item.notes ? <Text style={styles.txNotesText}>{item.notes}</Text> : null}
            {item.paymentMethod ? (
              <Text style={styles.paymentMethodText}>Mode: {item.paymentMethod}</Text>
            ) : null}
          </View>

          <View style={styles.txAmountCol}>
            <Text
              style={[
                styles.txAmountMain,
                { color: isDebit ? '#DC2626' : '#16A34A' },
                isReversed && { color: '#9CA3AF', textDecorationLine: 'line-through' },
              ]}
            >
              {isDebit ? '-' : '+'}₹{item.amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.runningBalanceLabel}>
              {language === 'te' ? 'మిగిలిన బాకీ:' : 'Balance:'} ₹
              {item.runningBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isAccountLoading || !account) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dockBg} />
      </View>
    );
  }

  const currentBal = account.currentBalance;

  return (
    <View style={styles.container}>
      {/* Account Info & Hero Balance Banner */}
      <View style={styles.headerHero}>
        <View style={styles.contactBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>{account.name}</Text>
            <Text style={styles.accountSubtitle}>
              {account.phone || 'No phone'} • {account.type}
            </Text>
          </View>

          <View style={styles.actionIconRow}>
            {account.phone ? (
              <>
                <TouchableOpacity style={styles.headerIconBtn} onPress={handleCall}>
                  <Phone size={18} color="#0284C7" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerIconBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={handleWhatsApp}
                >
                  <MessageCircle size={18} color="#16A34A" />
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity style={styles.headerIconBtn} onPress={handleShareStatement}>
              <Share2 size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Big Balance Box */}
        <View
          style={[
            styles.balanceHeroBox,
            currentBal > 0
              ? isCustomer
                ? styles.balanceReceivableBox
                : styles.balancePayableBox
              : styles.balanceSettledBox,
          ]}
        >
          <View>
            <Text style={styles.balanceHeroTag}>
              {currentBal > 0
                ? isCustomer
                  ? language === 'te'
                    ? 'మీకు రావాల్సిన మొత్తం'
                    : "You'll Get (Receivable)"
                  : language === 'te'
                  ? 'మీరు ఇవ్వాల్సిన మొత్తం'
                  : "You'll Give (Payable)"
                : language === 'te'
                ? 'ఖాతా క్లియర్ చేయబడింది'
                : 'Settled / No Dues'}
            </Text>
            <Text
              style={[
                styles.balanceHeroAmount,
                { color: currentBal > 0 ? (isCustomer ? '#15803D' : '#B45309') : '#374151' },
              ]}
            >
              ₹{Math.abs(currentBal).toLocaleString('en-IN')}
            </Text>
          </View>

          {currentBal > 0 && account.phone ? (
            <TouchableOpacity style={styles.remindBtn} onPress={handleWhatsApp}>
              <Text style={styles.remindBtnText}>
                {language === 'te' ? 'రిమైండర్' : 'Remind'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Ledger History List */}
      <FlatList
        data={ledger}
        keyExtractor={(item) => item._id}
        renderItem={renderLedgerItem}
        contentContainerStyle={styles.ledgerListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchAccount();
              refetchLedger();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'te' ? 'ఎలాంటి లావాదేవీలు లేవు' : 'No entries yet in this ledger'}
            </Text>
          </View>
        }
      />

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomBtnRed]}
          onPress={() =>
            router.push(
              `/khata/transactions/add?accountId=${account._id}&defaultType=${
                isCustomer ? 'CREDIT_SALE' : 'CREDIT_PURCHASE'
              }`
            )
          }
        >
          <Minus size={18} color={Colors.white} />
          <Text style={styles.bottomBtnText}>
            {isCustomer
              ? language === 'te'
                ? 'ఉద్దెర ఇచ్చాం'
                : 'You Gave (Credit)'
              : language === 'te'
              ? 'సరుకు వచ్చింది'
              : 'Purchased (Bill)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomBtnGreen]}
          onPress={() =>
            router.push(
              `/khata/transactions/add?accountId=${account._id}&defaultType=${
                isCustomer ? 'PAYMENT_RECEIVED' : 'PAYMENT_MADE'
              }`
            )
          }
        >
          <Plus size={18} color={Colors.white} />
          <Text style={styles.bottomBtnText}>
            {isCustomer
              ? language === 'te'
                ? 'డబ్బులు వచ్చాయి'
                : 'You Got (Payment)'
              : language === 'te'
              ? 'చెల్లించాం'
              : 'You Paid (Payment)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  headerHero: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAE5',
  },
  contactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  accountSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionIconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceHeroBox: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceReceivableBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  balancePayableBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  balanceSettledBox: {
    backgroundColor: '#F3F4F6',
  },
  balanceHeroTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  balanceHeroAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  remindBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  remindBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  ledgerListContent: {
    padding: 16,
    paddingBottom: 90,
  },
  txCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  txCardReversed: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txDateText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  invoiceBadge: {
    fontSize: 10,
    backgroundColor: '#E5E7EB',
    color: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
  },
  reversedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reversedText: {
    fontSize: 9,
    color: '#DC2626',
    fontWeight: '800',
  },
  txDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  txNotesText: {
    fontSize: 11.5,
    color: '#4B5563',
    marginTop: 2,
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountMain: {
    fontSize: 16,
    fontWeight: '800',
  },
  runningBalanceLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EAE5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bottomBtnRed: {
    backgroundColor: '#DC2626',
  },
  bottomBtnGreen: {
    backgroundColor: '#16A34A',
  },
  bottomBtnText: {
    color: Colors.white,
    fontSize: 13.5,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
