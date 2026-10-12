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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle, Phone, Calendar, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi, KhataAccount } from '../../../src/api/khata';

export default function RemindersScreen() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  // Load all accounts with positive balances (customers who owe or suppliers we owe)
  const { data: accounts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['khata-accounts-dues'],
    queryFn: () => khataApi.getAccounts({}),
  });

  const dueAccounts = accounts.filter((a) => a.currentBalance > 0);

  const handleSendWhatsApp = (account: KhataAccount) => {
    if (!account.phone) {
      Alert.alert('No Phone', 'This account has no phone number recorded.');
      return;
    }

    const cleanPhone = account.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const isCustomer = account.type === 'CUSTOMER' || account.type === 'BOTH';

    const msg = isCustomer
      ? language === 'te'
        ? `నమస్తే ${account.name} గారు, భార్గవి కిరాణా & జనరల్ స్టోర్స్ నుండి నమస్కారాలు. మీ ఖాతా బకాయి మొత్తం ₹${account.currentBalance}. దయచేసి వీలైనంత త్వరగా చెల్లించగలరు. ధన్యవాదాలు! 🙏`
        : `Hello ${account.name}, gentle reminder from Bhargavi Kirana Stores. Your outstanding balance is ₹${account.currentBalance}. Please clear when convenient. Thank you! 🙏`
      : language === 'te'
      ? `నమస్తే ${account.name} గారు, భార్గవి కిరాణా నుండి. మా షాపు నుండి మీకు చెల్లించాల్సిన మొత్తం ₹${account.currentBalance} రికార్డ్ చేయబడింది. త్వరలో చెల్లింపు చేస్తాము.`
      : `Hello ${account.name}, payment acknowledgment from Bhargavi Kirana Stores. We have an outstanding payable of ₹${account.currentBalance}. Payment will be initiated shortly.`;

    Linking.openURL(`whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`).catch(() => {
      Linking.openURL(`sms:${account.phone}?body=${encodeURIComponent(msg)}`);
    });
  };

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const renderDueItem = ({ item }: { item: KhataAccount }) => {
    const isCustomer = item.type === 'CUSTOMER' || item.type === 'BOTH';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone || 'No phone'} • {item.type}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.dueAmount, { color: isCustomer ? '#15803D' : '#B45309' }]}>
              ₹{item.currentBalance.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.dueTypeTag}>
              {isCustomer
                ? language === 'te'
                  ? 'రావాల్సినవి'
                  : 'Receivable'
                : language === 'te'
                ? 'ఇవ్వాల్సినవి'
                : 'Payable'}
            </Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={() => handleSendWhatsApp(item)}
          >
            <MessageCircle size={16} color={Colors.white} />
            <Text style={styles.whatsAppBtnText}>
              {language === 'te' ? 'వాట్సాప్ రిమైండర్ పంపండి' : 'Send WhatsApp Reminder'}
            </Text>
          </TouchableOpacity>

          {item.phone ? (
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone)}>
              <Phone size={16} color="#0284C7" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoBanner}>
        <Bell size={18} color="#D97706" />
        <Text style={styles.infoBannerText}>
          {language === 'te'
            ? 'బాకీ ఉన్న కస్టమర్లకు ఒకే ట్యాప్‌తో వాట్సాప్ లేదా ఎస్ఎంఎస్ రిమైండర్లు పంపండి'
            : 'Send polite WhatsApp or SMS reminders with a single tap'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dockBg} />
        </View>
      ) : (
        <FlatList
          data={dueAccounts}
          keyExtractor={(item) => item._id}
          renderItem={renderDueItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={36} color="#16A34A" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>
                {language === 'te' ? 'బాకీలు ఏమీ లేవు!' : 'All Accounts Settled!'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'te'
                  ? 'ప్రస్తుతం రిమైండర్ అవసరమైన బాకీలు ఏమీ లేవు'
                  : 'No outstanding dues requiring reminders at this time.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  phone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  dueAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  dueTypeTag: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
  },
  whatsAppBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12.5,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
  },
});
