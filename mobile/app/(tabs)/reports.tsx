import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  BarChart,
  Calendar,
  Layers,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { MetricCard } from '../../src/components/MetricCard';
import { formatCurrency } from '../../src/utils/format';

export default function ReportsScreen() {
  const { isOwner } = useAuth();
  const { language, t } = useLanguage();
  const [range, setRange] = useState<'today' | '7days' | '30days'>('today');

  const { data: salesReport, isLoading: salesLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales-report', range],
    queryFn: async () => {
      let startDate: string | undefined;
      const now = new Date();
      if (range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (range === '7days') {
        startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      } else if (range === '30days') {
        startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      }

      const res = await apiClient.get(`/reports/sales?startDate=${startDate || ''}`);
      return res.data?.data;
    },
  });

  const { data: profitReport } = useQuery({
    queryKey: ['profit-report', range],
    queryFn: async () => {
      let startDate: string | undefined;
      const now = new Date();
      if (range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (range === '7days') {
        startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      } else if (range === '30days') {
        startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      }

      const res = await apiClient.get(`/reports/profit?startDate=${startDate || ''}`);
      return res.data?.data;
    },
    enabled: isOwner,
  });

  const totalSales = salesReport?.totalSalesAmount || 0;
  const resellerSales = salesReport?.resellerTotal || 0;
  const retailSales = salesReport?.retailTotal || 0;
  const paymentBreakdown = salesReport?.paymentMethodBreakdown || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={language === 'te' ? 'వ్యాపార రిపోర్టులు' : 'Business Reports'}
        subtitle={
          language === 'te'
            ? 'అమ్మకాలు & అంచనా లాభాల విశ్లేషణ'
            : 'Sales performance & estimated profitability'
        }
      />

      {/* Date Range Selector */}
      <View style={styles.rangeRow}>
        {(['today', '7days', '30days'] as const).map((r) => {
          const labelMap: Record<string, string> = {
            today: language === 'te' ? 'ఈరోజు' : 'Today',
            '7days': language === 'te' ? 'గత 7 రోజులు' : 'Past 7 Days',
            '30days': language === 'te' ? 'ఈ నెల' : 'This Month',
          };
          return (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.activeRangeBtn]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeBtnText, range === r && styles.activeRangeBtnText]}>
                {labelMap[r]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* KPI Metrics */}
        <View style={styles.kpiRow}>
          <MetricCard
            label={t('todaysSales')}
            value={formatCurrency(totalSales)}
            subtitle={`${salesReport?.totalSalesCount || 0} ${language === 'te' ? 'బిల్లులు' : 'orders'}`}
            bgVariant="mint"
            icon={<TrendingUp size={18} color={Colors.primary} />}
          />

          {isOwner && profitReport && (
            <MetricCard
              label={t('todaysProfit')}
              value={formatCurrency(profitReport.totalEstimatedGrossProfit)}
              subtitle={`Margin: ${profitReport.overallGrossMarginPercent}%`}
              bgVariant="cream"
              icon={<TrendingUp size={18} color="#A2591F" />}
            />
          )}
        </View>

        {/* Reseller vs Retail Split */}
        <Card style={styles.roundedCard}>
          <Text style={styles.cardHeading}>
            {language === 'te' ? 'హోల్‌సేల్ vs రిటైల్ అమ్మకాల నిష్పత్తి' : 'Customer Sales Distribution'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {language === 'te'
              ? 'హోల్‌సేల్ మరియు రిటైల్ కస్టమర్ల అమ్మకాల పోలిక'
              : 'Comparing wholesale/reseller volume against retail customers'}
          </Text>

          <View style={styles.distributionRow}>
            <View style={styles.distBlock}>
              <View style={[styles.colorDot, { backgroundColor: Colors.darkForest }]} />
              <View>
                <Text style={styles.distLabel}>{t('reseller')}</Text>
                <Text style={styles.distValue}>{formatCurrency(resellerSales)}</Text>
                <Text style={styles.distPercent}>
                  {totalSales > 0 ? ((resellerSales / totalSales) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>

            <View style={styles.distDivider} />

            <View style={styles.distBlock}>
              <View style={[styles.colorDot, { backgroundColor: '#C9892B' }]} />
              <View>
                <Text style={styles.distLabel}>{t('retail')}</Text>
                <Text style={styles.distValue}>{formatCurrency(retailSales)}</Text>
                <Text style={styles.distPercent}>
                  {totalSales > 0 ? ((retailSales / totalSales) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Visual Progress Bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFillReseller,
                {
                  flex: resellerSales > 0 ? resellerSales : 1,
                },
              ]}
            />
            <View
              style={[
                styles.progressFillRetail,
                {
                  flex: retailSales > 0 ? retailSales : 1,
                },
              ]}
            />
          </View>
        </Card>

        {/* Payment Channels Breakdown */}
        <Card style={styles.roundedCard}>
          <Text style={styles.cardHeading}>{t('paymentMethod')}</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>{language === 'te' ? '💵 నగదు (Cash)' : '💵 Cash'}</Text>
              <Text style={styles.payAmount}>{formatCurrency(paymentBreakdown.CASH || 0)}</Text>
            </View>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>{language === 'te' ? '📱 యూపీఐ (UPI)' : '📱 UPI'}</Text>
              <Text style={styles.payAmount}>{formatCurrency(paymentBreakdown.UPI || 0)}</Text>
            </View>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>{language === 'te' ? '💳 కార్డు / స్ప్లిట్' : '💳 Card / Split'}</Text>
              <Text style={styles.payAmount}>
                {formatCurrency((paymentBreakdown.CARD || 0) + (paymentBreakdown.SPLIT || 0))}
              </Text>
            </View>
          </View>
        </Card>

        {/* Costing Engine Note */}
        {isOwner && (
          <View style={styles.accountingNote}>
            <Info size={16} color={Colors.darkForest} />
            <Text style={styles.accountingNoteText}>
              {language === 'te'
                ? 'FIFO (First-In, First-Out) విధానంలో ప్రతి బ్యాచ్ ల్యాండెడ్ కాస్ట్ ఆధారంగా లాభం లెక్కించబడుతుంది.'
                : 'FIFO (First-In, First-Out) costing engine deducts exact batch landed costs.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.mintBackground,
  },
  rangeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
    alignItems: 'center',
  },
  activeRangeBtn: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  rangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeRangeBtnText: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90, // Leave room for floating dock
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  roundedCard: {
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  distBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  distDivider: {
    width: 1,
    backgroundColor: '#E6EFE9',
    marginHorizontal: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  distValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 1,
  },
  distPercent: {
    fontSize: 10.5,
    color: Colors.secondaryText,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E6EFE9',
  },
  progressFillReseller: {
    backgroundColor: Colors.darkForest,
  },
  progressFillRetail: {
    backgroundColor: '#C9892B',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentBox: {
    flex: 1,
    backgroundColor: '#F3F9F5',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  payName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  payAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  accountingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3EE',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  accountingNoteText: {
    fontSize: 11,
    color: Colors.darkForest,
    flex: 1,
    lineHeight: 16,
  },
});
