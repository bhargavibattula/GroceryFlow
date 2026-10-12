import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Phone, MapPin, Plus, ArrowLeft } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';

export default function SuppliersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { data: suppliers = [], isLoading, refetch, isRefetching } = useQuery({
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
      Alert.alert(
        language === 'te' ? 'విజయవంతమైంది' : 'Supplier Added',
        language === 'te' ? 'నూతన సప్లయర్ విజయవంతంగా చేర్చబడ్డారు.' : 'Vendor added to catalogue.'
      );
      setShowAdd(false);
      setName('');
      setPhone('');
      setAddress('');
    },
  });

  const renderSupplier = ({ item, index }: { item: any; index: number }) => {
    const tint = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <View style={[styles.card, { backgroundColor: tint }]}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Truck size={18} color={Colors.primary} />
          </View>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.darkForest} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'te' ? 'హోల్‌సేల్ సప్లయర్లు' : 'Wholesale Suppliers'}
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>
            {language === 'te' ? 'కొత్త సప్లయర్' : 'New Vendor'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formWrapper}>
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {language === 'te' ? 'నూతన సప్లయర్‌ను నమోదు చేయండి' : 'Add New Wholesale Vendor'}
            </Text>
            <Input
              label={language === 'te' ? 'సప్లయర్ / వ్యాపార పేరు *' : 'Supplier Business Name *'}
              value={name}
              onChangeText={setName}
              placeholder={language === 'te' ? 'ఉదా. శ్రీ వెంకటేశ్వర రైస్ మిల్' : 'e.g. Sri Venkateswara Mills'}
            />
            <Input
              label={language === 'te' ? 'ఫోన్ నంబర్' : 'Phone Contact'}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 94401 23456"
              keyboardType="phone-pad"
            />
            <Input
              label={language === 'te' ? 'చిరునామా / మార్కెట్ యార్డ్' : 'Address / Market Yard'}
              value={address}
              onChangeText={setAddress}
              placeholder="Market Yard, Shop #12"
            />
            <Button
              title={
                mutation.isPending
                  ? language === 'te'
                    ? 'సేవ్ అవుతోంది...'
                    : 'Saving...'
                  : language === 'te'
                  ? 'సప్లయర్‌ను భద్రపరచండి'
                  : 'Save Supplier'
              }
              onPress={() => {
                if (!name.trim()) {
                  return Alert.alert(
                    'Error',
                    language === 'te' ? 'సప్లయర్ పేరు అవసరం' : 'Supplier name is required'
                  );
                }
                mutation.mutate({ name: name.trim(), phone: phone.trim(), address: address.trim() });
              }}
              loading={mutation.isPending}
              style={{ marginTop: 8 }}
            />
          </Card>
        </View>
      )}

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item._id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={language === 'te' ? 'సప్లయర్లు లేరు' : 'No Suppliers Found'}
              description={
                language === 'te'
                  ? 'మీ హోల్‌సేల్ సప్లయర్లు మరియు డీలర్ల వివరాలను ఇక్కడ భద్రపరచండి.'
                  : 'Add verified grocery distributors, mills, and wholesale vendors.'
              }
              actionTitle={language === 'te' ? 'సప్లయర్‌ను చేర్చండి' : 'Add First Supplier'}
              onActionPress={() => setShowAdd(true)}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12.5,
  },
  formWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suppName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
    paddingLeft: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
});
