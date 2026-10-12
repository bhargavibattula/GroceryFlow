import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatDate } from '../../src/utils/format';

export default function AuditLogsScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs-list'],
    queryFn: async () => {
      const res = await apiClient.get('/audit-logs');
      return res.data?.data || [];
    },
  });

  const renderLog = ({ item, index }: { item: any; index: number }) => {
    const tint = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <View style={[styles.card, { backgroundColor: tint }]}>
        <View style={styles.topRow}>
          <Text style={styles.actionText}>{item.action}</Text>
          <Badge label={item.entityType} variant="neutral" />
        </View>
        <Text style={styles.userText}>
          {language === 'te' ? 'యూజర్' : 'By'}: {item.userNameSnapshot || item.userId?.name || 'User'} • {formatDate(item.timestamp)}
        </Text>
        {item.relevantChanges ? (
          <View style={styles.changesBox}>
            <Text style={styles.changesText}>
              {JSON.stringify(item.relevantChanges, null, 2)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'సిస్టమ్ ఆడిట్ ట్రయల్ లాగ్స్' : 'Audit Trail Logs'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={language === 'te' ? 'లాగ్స్ లేవు' : 'No Audit Logs'}
              description={
                language === 'te'
                  ? 'ధర మార్పులు, అమ్మకాలు లేదా స్టాక్ సర్దుబాట్లు జరిగినప్పుడు ఇక్కడ నమోదు చేయబడతాయి.'
                  : 'Audit actions will appear here as stock and price operations occur.'
              }
            />
          ) : null
        }
      />
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  userText: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginBottom: 8,
  },
  changesBox: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  changesText: {
    fontSize: 10.5,
    fontFamily: 'monospace',
    color: Colors.darkForest,
  },
});
