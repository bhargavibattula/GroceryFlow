import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, FileText } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatDate } from '../../src/utils/format';

export default function AuditLogsScreen() {
  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-logs-list'],
    queryFn: async () => {
      const res = await apiClient.get('/audit-logs');
      return res.data?.data || [];
    },
  });

  const renderLog = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.actionText}>{item.action}</Text>
        <Badge label={item.entityType} variant="neutral" />
      </View>
      <Text style={styles.userText}>
        By: {item.userNameSnapshot || item.userId?.name || 'User'} • {formatDate(item.timestamp)}
      </Text>
      {item.relevantChanges ? (
        <View style={styles.changesBox}>
          <Text style={styles.changesText}>
            {JSON.stringify(item.relevantChanges, null, 2)}
          </Text>
        </View>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>System Audit Trail</Text>
        <Text style={styles.subtitle}>
          Immutable log of all price changes, sales, and manual stock movements
        </Text>
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
              title="No Audit Logs"
              description="Audit actions will appear here as stock and price operations occur."
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
    backgroundColor: Colors.lightMint,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  userText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginBottom: 6,
  },
  changesBox: {
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
  },
  changesText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.mainText,
  },
});
