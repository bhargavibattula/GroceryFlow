import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FileText, Share2, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi } from '../../../src/api/khata';

export default function KhataReportsScreen() {
  const { language } = useLanguage();
  const [reportType, setReportType] = useState<'OUTSTANDING' | 'COLLECTIONS' | 'SUPPLIER_PAYMENTS'>('OUTSTANDING');

  const { data: outstandingData, isLoading: isOutLoading } = useQuery({
    queryKey: ['khata-report-outstanding'],
    queryFn: () => khataApi.getOutstandingReport(),
    enabled: reportType === 'OUTSTANDING',
  });

  const { data: collectionsData, isLoading: isCollLoading } = useQuery({
    queryKey: ['khata-report-collections'],
    queryFn: () => khataApi.getCollectionsReport(),
    enabled: reportType === 'COLLECTIONS',
  });

  const { data: supplierPaymentsData, isLoading: isSuppPayLoading } = useQuery({
    queryKey: ['khata-report-supplier-payments'],
    queryFn: () => khataApi.getSupplierPaymentsReport(),
    enabled: reportType === 'SUPPLIER_PAYMENTS',
  });

  const handleShareReport = async () => {
    let text = `*BHARGAVI KIRANA & GENERAL STORES - KHATA REPORT*\nDate: ${new Date().toLocaleDateString('en-IN')}\n\n`;

    if (reportType === 'OUTSTANDING') {
      text += `Total Outstanding Dues: ₹${outstandingData?.totalOutstanding || 0}\n`;
      text += `Total Accounts with Dues: ${outstandingData?.count || 0}\n\n`;
      if (outstandingData?.accounts) {
        outstandingData.accounts.forEach((a: any, i: number) => {
          text += `${i + 1}. ${a.name} (${a.type}): ₹${a.currentBalance}\n`;
        });
      }
    } else if (reportType === 'COLLECTIONS') {
      text += `Total Collections: ₹${collectionsData?.totalCollected || 0}\n`;
      text += `Number of Collections: ${collectionsData?.count || 0}\n`;
    } else {
      text += `Total Supplier Payments: ₹${supplierPaymentsData?.totalPaid || 0}\n`;
      text += `Number of Payments: ${supplierPaymentsData?.count || 0}\n`;
    }

    try {
      await Share.share({ message: text });
    } catch (e) {
      // ignore
    }
  };

  const isLoading = isOutLoading || isCollLoading || isSuppPayLoading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>
            {language === 'te' ? 'బాహీ ఖాతా నివేదికలు' : 'Khata Statements & Reports'}
          </Text>
          <Text style={styles.subHeading}>
            {language === 'te' ? 'బాకీలు, వసూళ్లు మరియు చెల్లింపుల పూర్తి వివరాలు' : 'Audited summaries and payment breakdowns'}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport}>
          <Share2 size={16} color={Colors.white} />
          <Text style={styles.shareBtnText}>{language === 'te' ? 'షేర్' : 'Share'}</Text>
        </TouchableOpacity>
      </View>

      {/* Report Type Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, reportType === 'OUTSTANDING' && styles.tabBtnActive]}
          onPress={() => setReportType('OUTSTANDING')}
        >
          <Text style={[styles.tabBtnText, reportType === 'OUTSTANDING' && styles.tabBtnTextActive]}>
            {language === 'te' ? 'మొత్తం బాకీలు' : 'Outstanding'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, reportType === 'COLLECTIONS' && styles.tabBtnActive]}
          onPress={() => setReportType('COLLECTIONS')}
        >
          <Text style={[styles.tabBtnText, reportType === 'COLLECTIONS' && styles.tabBtnTextActive]}>
            {language === 'te' ? 'వసూళ్లు' : 'Collections'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, reportType === 'SUPPLIER_PAYMENTS' && styles.tabBtnActive]}
          onPress={() => setReportType('SUPPLIER_PAYMENTS')}
        >
          <Text
            style={[
              styles.tabBtnText,
              reportType === 'SUPPLIER_PAYMENTS' && styles.tabBtnTextActive,
            ]}
          >
            {language === 'te' ? 'సప్లయర్ చెల్లింపులు' : 'Supplier Paid'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.dockBg} style={{ marginTop: 40 }} />
      ) : reportType === 'OUTSTANDING' ? (
        <>
          {/* Outstanding Summary Hero */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              {language === 'te' ? 'మొత్తం యాక్టివ్ బాకీలు' : 'Total Outstanding Balance'}
            </Text>
            <Text style={styles.metricVal}>
              ₹{(outstandingData?.totalOutstanding || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>
              {outstandingData?.count || 0} {language === 'te' ? 'ఖాతాదారులు' : 'accounts with pending balance'}
            </Text>
          </View>

          {/* List of accounts */}
          <View style={styles.reportListCard}>
            {outstandingData?.accounts?.map((acc: any, idx: number) => (
              <View key={acc._id} style={styles.reportRow}>
                <Text style={styles.indexCol}>{idx + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{acc.name}</Text>
                  <Text style={styles.rowSub}>{acc.phone || 'No phone'} • {acc.type}</Text>
                </View>
                <Text style={styles.rowAmount}>₹{(acc.currentBalance || 0).toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </>
      ) : reportType === 'COLLECTIONS' ? (
        <>
          <View style={[styles.metricCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Text style={styles.metricLabel}>
              {language === 'te' ? 'మొత్తం వసూలైన మొత్తం' : 'Total Collections'}
            </Text>
            <Text style={[styles.metricVal, { color: '#15803D' }]}>
              ₹{(collectionsData?.totalCollected || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>
              {collectionsData?.count || 0} {language === 'te' ? 'చెల్లింపుల రికార్డులు' : 'payment records'}
            </Text>
          </View>

          <View style={styles.reportListCard}>
            {collectionsData?.collections?.map((c: any) => (
              <View key={c._id} style={styles.reportRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{c.accountId?.name || 'Customer'}</Text>
                  <Text style={styles.rowSub}>
                    {new Date(c.paymentDate).toLocaleDateString('en-IN')} • {c.method}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: '#15803D' }]}>
                  +₹{(c.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.metricCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={styles.metricLabel}>
              {language === 'te' ? 'సప్లయర్లకు చెల్లించిన మొత్తం' : 'Total Paid to Suppliers'}
            </Text>
            <Text style={[styles.metricVal, { color: '#B45309' }]}>
              ₹{(supplierPaymentsData?.totalPaid || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>
              {supplierPaymentsData?.count || 0} {language === 'te' ? 'చెల్లింపుల రికార్డులు' : 'payments recorded'}
            </Text>
          </View>

          <View style={styles.reportListCard}>
            {supplierPaymentsData?.payments?.map((p: any) => (
              <View key={p._id} style={styles.reportRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{p.accountId?.name || 'Supplier'}</Text>
                  <Text style={styles.rowSub}>
                    {new Date(p.paymentDate).toLocaleDateString('en-IN')} • {p.method}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: '#B45309' }]}>
                  ₹{(p.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  subHeading: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dockBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  shareBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E6EFE9',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.dockBg,
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  metricCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  metricVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  reportListCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  indexCol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 24,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  rowSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
});
