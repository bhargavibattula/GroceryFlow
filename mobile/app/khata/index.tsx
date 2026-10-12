import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  Users,
  Truck,
  Bell,
  FileText,
  ChevronRight,
  Clock,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { khataApi } from '../../src/api/khata';

export default function KhataDashboardScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['khata-dashboard'],
    queryFn: khataApi.getDashboard,
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Hero Header Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <BookOpen size={16} color={Colors.white} />
            <Text style={styles.heroBadgeText}>
              {language === 'te' ? 'డిజిటల్ బాహీ ఖాతా' : 'FreshStock Bahi Khata'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.heroActionBtn}
            onPress={() => router.push('/khata/reports/index' as any)}
          >
            <FileText size={16} color={Colors.white} />
            <Text style={styles.heroActionBtnText}>
              {language === 'te' ? 'రిపోర్టులు' : 'Reports'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.white} style={{ marginVertical: 32 }} />
        ) : (
          <>
            {/* Dual Dues Row */}
            <View style={styles.duesRow}>
              {/* Customer Receivables */}
              <View style={[styles.dueBox, styles.dueBoxReceivable]}>
                <View style={styles.dueBoxTop}>
                  <ArrowDownLeft size={18} color="#15803D" />
                  <Text style={styles.dueLabel}>
                    {language === 'te' ? 'కస్టమర్ల నుండి రావాల్సినవి' : 'Customers Owe Us'}
                  </Text>
                </View>
                <Text style={[styles.dueAmount, { color: '#15803D' }]}>
                  ₹{(data?.totalCustomerReceivables || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.dueSub}>
                  {data?.customersWithDues || 0} {language === 'te' ? 'కస్టమర్లు' : 'accounts with dues'}
                </Text>
              </View>

              {/* Supplier Payables */}
              <View style={[styles.dueBox, styles.dueBoxPayable]}>
                <View style={styles.dueBoxTop}>
                  <ArrowUpRight size={18} color="#B45309" />
                  <Text style={styles.dueLabel}>
                    {language === 'te' ? 'మనం సప్లయర్లకు ఇవ్వాల్సినవి' : 'We Owe Suppliers'}
                  </Text>
                </View>
                <Text style={[styles.dueAmount, { color: '#B45309' }]}>
                  ₹{(data?.totalSupplierPayables || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.dueSub}>
                  {data?.suppliersAwaitingPayment || 0} {language === 'te' ? 'సప్లయర్లు' : 'accounts payable'}
                </Text>
              </View>
            </View>

            {/* Today's Cash Flow Badges */}
            <View style={styles.flowRow}>
              <View style={styles.flowChip}>
                <Text style={styles.flowChipLabel}>
                  {language === 'te' ? 'ఈరోజు వసూలు:' : 'Collected Today:'}
                </Text>
                <Text style={styles.flowChipValue}>
                  ₹{(data?.collectedToday || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.flowChip}>
                <Text style={styles.flowChipLabel}>
                  {language === 'te' ? 'ఈరోజు చెల్లించినవి:' : 'Paid Today:'}
                </Text>
                <Text style={styles.flowChipValue}>
                  ₹{(data?.paidToSuppliersToday || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/khata/accounts/add')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
            <UserPlus size={20} color="#0284C7" />
          </View>
          <Text style={styles.quickActionText}>
            {language === 'te' ? 'ఖాతా చేర్చు' : 'Add Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/khata/transactions/add')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Plus size={20} color="#16A34A" />
          </View>
          <Text style={styles.quickActionText}>
            {language === 'te' ? 'నమోదు చేయి' : 'Add Entry'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/khata/reminders/index' as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Bell size={20} color="#D97706" />
          </View>
          <Text style={styles.quickActionText}>
            {language === 'te' ? 'రిమైండర్లు' : 'Reminders'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/khata/accounts/index' as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Users size={20} color="#9333EA" />
          </View>
          <Text style={styles.quickActionText}>
            {language === 'te' ? 'డైరెక్టరీ' : 'Directory'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Directory Tab Selector */}
      <View style={styles.sectionHeader}>
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, activeTab === 'CUSTOMERS' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('CUSTOMERS')}
          >
            <Users size={16} color={activeTab === 'CUSTOMERS' ? Colors.white : Colors.secondaryText} />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'CUSTOMERS' && styles.tabSwitchTextActive,
              ]}
            >
              {language === 'te' ? 'కస్టమర్ బాకీలు' : 'Top Customers'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabSwitchBtn, activeTab === 'SUPPLIERS' && styles.tabSwitchBtnActive]}
            onPress={() => setActiveTab('SUPPLIERS')}
          >
            <Truck size={16} color={activeTab === 'SUPPLIERS' ? Colors.white : Colors.secondaryText} />
            <Text
              style={[
                styles.tabSwitchText,
                activeTab === 'SUPPLIERS' && styles.tabSwitchTextActive,
              ]}
            >
              {language === 'te' ? 'సప్లయర్ బాకీలు' : 'Top Suppliers'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/khata/accounts/index' as any)}>
          <Text style={styles.viewAllLink}>
            {language === 'te' ? 'అన్నీ చూడండి →' : 'View All →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Accounts List */}
      <View style={styles.accountsCard}>
        {activeTab === 'CUSTOMERS' ? (
          data?.topCustomers && data.topCustomers.length > 0 ? (
            data.topCustomers.map((customer) => (
              <TouchableOpacity
                key={customer._id}
                style={styles.accountRow}
                onPress={() => router.push(`/khata/accounts/${customer._id}` as any)}
              >
                <View style={styles.accountAvatar}>
                  <Text style={styles.avatarLetter}>{customer.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{customer.name}</Text>
                  <Text style={styles.accountPhone}>{customer.phone || 'No phone recorded'}</Text>
                </View>
                <View style={styles.accountBalanceCol}>
                  <Text style={styles.balanceTagReceivable}>
                    {language === 'te' ? 'రావాలి' : "You'll Get"}
                  </Text>
                  <Text style={styles.balanceAmountReceivable}>
                    ₹{(customer.currentBalance || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <ChevronRight size={18} color="#A0AEC0" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'te' ? 'ప్రస్తుతం కస్టమర్ బాకీలు ఏమీ లేవు 🎉' : 'No customer dues currently 🎉'}
              </Text>
            </View>
          )
        ) : data?.topSuppliers && data.topSuppliers.length > 0 ? (
          data.topSuppliers.map((supplier) => (
            <TouchableOpacity
              key={supplier._id}
              style={styles.accountRow}
              onPress={() => router.push(`/khata/accounts/${supplier._id}` as any)}
            >
              <View style={[styles.accountAvatar, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.avatarLetter, { color: '#B45309' }]}>
                  {supplier.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{supplier.name}</Text>
                <Text style={styles.accountPhone}>{supplier.phone || 'No phone recorded'}</Text>
              </View>
              <View style={styles.accountBalanceCol}>
                <Text style={styles.balanceTagPayable}>
                  {language === 'te' ? 'ఇవ్వాలి' : "You'll Give"}
                </Text>
                <Text style={styles.balanceAmountPayable}>
                  ₹{(supplier.currentBalance || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <ChevronRight size={18} color="#A0AEC0" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'te' ? 'సప్లయర్లకు ఇవ్వాల్సిన బాకీలు ఏమీ లేవు 🎉' : 'No supplier payables pending 🎉'}
            </Text>
          </View>
        )}
      </View>

      {/* Recent Ledger Transactions */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>
          {language === 'te' ? 'ఇటీవలి ఖాతా లావాదేవీలు' : 'Recent Khata Activity'}
        </Text>
      </View>

      <View style={styles.transactionsCard}>
        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          data.recentTransactions.map((tx) => {
            const accName =
              typeof tx.accountId === 'object' && tx.accountId ? tx.accountId.name : 'Account';
            const isIncoming = tx.transactionType === 'PAYMENT_RECEIVED' || tx.transactionType === 'PAYMENT_MADE';
            const isDebit = tx.direction === 'DEBIT';

            return (
              <View key={tx._id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIconCircle,
                    { backgroundColor: isIncoming ? '#DCFCE7' : '#FEF3C7' },
                  ]}
                >
                  <Clock size={16} color={isIncoming ? '#16A34A' : '#D97706'} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txAccountName}>{accName}</Text>
                  <Text style={styles.txType}>
                    {tx.notes || tx.transactionType.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.transactionDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isDebit ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {isDebit ? '-' : '+'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'te' ? 'లావాదేవీలు ఇంకా నమోదు కాలేదు' : 'No recent transactions'}
            </Text>
          </View>
        )}
      </View>
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
  heroCard: {
    backgroundColor: Colors.dockBg,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroBadgeText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroActionBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  duesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dueBox: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
  },
  dueBoxReceivable: {
    backgroundColor: '#ECFDF5',
  },
  dueBoxPayable: {
    backgroundColor: '#FFFBEB',
  },
  dueBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    flexShrink: 1,
  },
  dueAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  dueSub: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  flowRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  flowChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flowChipLabel: {
    color: '#E6F4EA',
    fontSize: 11,
    fontWeight: '500',
  },
  flowChipValue: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  quickActionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#293A33',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6EFE9',
    borderRadius: 20,
    padding: 3,
  },
  tabSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabSwitchBtnActive: {
    backgroundColor: Colors.dockBg,
  },
  tabSwitchText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  tabSwitchTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 12,
    color: Colors.dockBg,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#293A33',
  },
  accountsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  accountPhone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  accountBalanceCol: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  balanceTagReceivable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  balanceAmountReceivable: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  balanceTagPayable: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  balanceAmountPayable: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  transactionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txInfo: {
    flex: 1,
  },
  txAccountName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  txType: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  txDate: {
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
