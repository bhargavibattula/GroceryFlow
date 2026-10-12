import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  UserPlus,
  Phone,
  MessageCircle,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi, KhataAccount } from '../../../src/api/khata';

export default function AccountsDirectoryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'name' | 'recent'>('balance_desc');

  const { data: accounts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['khata-accounts', filterType, search, sortBy],
    queryFn: () =>
      khataApi.getAccounts({
        type: filterType,
        search: search.trim() || undefined,
        sort: sortBy,
      }),
  });

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (account: KhataAccount) => {
    if (!account.phone) return;
    const cleanPhone = account.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg =
      language === 'te'
        ? `నమస్తే ${account.name} గారు, భార్గవి కిరాణా & జనరల్ స్టోర్స్ నుండి. మీ ఖాతా బకాయి మొత్తం ₹${account.currentBalance}. దయచేసి త్వరలో చెల్లించగలరు. ధన్యవాదాలు!`
        : `Hello ${account.name}, gentle reminder from Bhargavi Kirana Stores. Your outstanding balance is ₹${account.currentBalance}. Please clear when convenient. Thank you!`;

    Linking.openURL(`whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(msg)}`).catch(() => {
      Linking.openURL(`sms:${account.phone}?body=${encodeURIComponent(msg)}`);
    });
  };

  const renderAccountItem = ({ item }: { item: KhataAccount }) => {
    const isCustomer = item.type === 'CUSTOMER' || item.type === 'BOTH';
    const isReceivable = isCustomer && item.currentBalance > 0;
    const isPayable = !isCustomer && item.currentBalance > 0;
    const isSettled = item.currentBalance === 0;

    return (
      <TouchableOpacity
        style={styles.accountCard}
        onPress={() => router.push(`/khata/accounts/${item._id}` as any)}
      >
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isCustomer ? '#DCFCE7' : '#FEF3C7' },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isCustomer ? '#15803D' : '#B45309' },
              ]}
            >
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.nameText}>{item.name}</Text>
            {item.businessName ? (
              <Text style={styles.businessText}>{item.businessName}</Text>
            ) : null}
            <Text style={styles.phoneText}>{item.phone || 'No phone'}</Text>
          </View>

          <View style={styles.balanceBlock}>
            {isReceivable && (
              <>
                <Text style={styles.balanceTagReceivable}>
                  {language === 'te' ? 'రావాలి' : "You'll Get"}
                </Text>
                <Text style={styles.balanceAmountReceivable}>
                  ₹{item.currentBalance.toLocaleString('en-IN')}
                </Text>
              </>
            )}
            {isPayable && (
              <>
                <Text style={styles.balanceTagPayable}>
                  {language === 'te' ? 'ఇవ్వాలి' : "You'll Give"}
                </Text>
                <Text style={styles.balanceAmountPayable}>
                  ₹{item.currentBalance.toLocaleString('en-IN')}
                </Text>
              </>
            )}
            {isSettled && (
              <Text style={styles.balanceSettled}>
                {language === 'te' ? 'బాకీ లేదు (₹0)' : 'Settled (₹0)'}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Contact & Ledger Shortcut Bar */}
        <View style={styles.cardActionRow}>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{item.type}</Text>
          </View>

          <View style={styles.actionButtons}>
            {item.phone ? (
              <>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleCall(item.phone)}
                >
                  <Phone size={15} color="#0284C7" />
                </TouchableOpacity>

                {item.currentBalance > 0 ? (
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: '#DCFCE7' }]}
                    onPress={() => handleWhatsApp(item)}
                  >
                    <MessageCircle size={15} color="#16A34A" />
                  </TouchableOpacity>
                ) : null}
              </>
            ) : null}

            <View style={styles.ledgerBtn}>
              <Text style={styles.ledgerBtnText}>
                {language === 'te' ? 'ఖాతా చూడండి' : 'Ledger'}
              </Text>
              <ChevronRight size={14} color={Colors.dockBg} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            language === 'te'
              ? 'పేరు లేదా ఫోన్ నంబర్ ద్వారా వెతకండి...'
              : 'Search account name or phone...'
          }
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterType('ALL')}
        >
          <Text
            style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}
          >
            {language === 'te' ? 'అన్నీ' : 'All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'CUSTOMER' && styles.filterChipActive]}
          onPress={() => setFilterType('CUSTOMER')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'CUSTOMER' && styles.filterChipTextActive,
            ]}
          >
            {language === 'te' ? 'కస్టమర్లు' : 'Customers'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'SUPPLIER' && styles.filterChipActive]}
          onPress={() => setFilterType('SUPPLIER')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'SUPPLIER' && styles.filterChipTextActive,
            ]}
          >
            {language === 'te' ? 'సప్లయర్లు' : 'Suppliers'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Accounts List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dockBg} />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item._id}
          renderItem={renderAccountItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {language === 'te' ? 'ఖాతాలు ఏవీ కనుగొనబడలేదు' : 'No Accounts Found'}
              </Text>
              <Text style={styles.emptySub}>
                {language === 'te'
                  ? 'కస్టమర్ లేదా సప్లయర్‌ను జోడించడానికి క్రింది బటన్ నొక్కండి'
                  : 'Tap the button below to add your first customer or supplier account'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Account Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => router.push('/khata/accounts/add')}
      >
        <UserPlus size={22} color={Colors.white} />
        <Text style={styles.fabBtnText}>
          {language === 'te' ? 'కొత్త ఖాతా' : 'Add Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F9F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#E6EFE9',
  },
  filterChipActive: {
    backgroundColor: Colors.dockBg,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  businessText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 1,
  },
  phoneText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  balanceBlock: {
    alignItems: 'flex-end',
  },
  balanceTagReceivable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  balanceAmountReceivable: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  balanceTagPayable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  balanceAmountPayable: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
  },
  balanceSettled: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleTag: {
    backgroundColor: '#F1F8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#EAF6EF',
  },
  ledgerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dockBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: Colors.dockBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  fabBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
