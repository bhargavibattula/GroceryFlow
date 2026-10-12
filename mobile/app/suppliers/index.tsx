import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Phone, MapPin, Plus } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function SuppliersScreen() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers');
      return res.data?.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/suppliers', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      Alert.alert('Supplier Added', 'Vendor added to catalogue.');
      setShowAdd(false);
      setName('');
      setPhone('');
      setAddress('');
    },
  });

  const renderSupplier = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Truck size={18} color={Colors.primary} />
        <Text style={styles.suppName}>{item.name}</Text>
      </View>
      {item.phone ? (
        <View style={styles.infoRow}>
          <Phone size={14} color={Colors.secondaryText} />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      ) : null}
      {item.address ? (
        <View style={styles.infoRow}>
          <MapPin size={14} color={Colors.secondaryText} />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Wholesale Suppliers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>New Supplier</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Wholesale Vendor</Text>
          <Input label="Supplier Business Name *" value={name} onChangeText={setName} placeholder="e.g. Sri Venkateswara Mills" />
          <Input label="Phone Contact" value={phone} onChangeText={setPhone} placeholder="+91 94401 23456" keyboardType="phone-pad" />
          <Input label="Address / Yard Location" value={address} onChangeText={setAddress} placeholder="Market Yard, Shop #12" />
          <Button
            title="Save Supplier"
            onPress={() => {
              if (!name.trim()) return Alert.alert('Error', 'Supplier name is required');
              mutation.mutate({ name: name.trim(), phone: phone.trim(), address: address.trim() });
            }}
            loading={mutation.isPending}
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item._id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  formCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  suppName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
});
