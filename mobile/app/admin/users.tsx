import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, User, ShieldCheck } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function UserManagementScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'SALESPERSON' | 'OWNER'>('SALESPERSON');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data?.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      Alert.alert(
        language === 'te' ? 'విజయవంతమైంది' : 'User Created',
        language === 'te' ? 'నూతన ఖాతా విజయవంతంగా సృష్టించబడింది.' : 'New account can now log in.'
      );
      setShowAddForm(false);
      setName('');
      setEmail('');
      setUsername('');
    },
    onError: (err: any) => {
      Alert.alert('Creation Failed', err.message || 'Unable to create user.');
    },
  });

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !username.trim()) {
      Alert.alert(
        'Validation Error',
        language === 'te' ? 'అన్ని వివరాలు అవసరం.' : 'All fields are required.'
      );
      return;
    }
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
      permissions: role === 'OWNER' ? ['all'] : ['process_sales', 'view_inventory'],
    });
  };

  const renderUser = ({ item, index }: { item: any; index: number }) => {
    const tint = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <View style={[styles.userCard, { backgroundColor: tint }]}>
        <View style={styles.row}>
          <View style={styles.avatarCircle}>
            <User size={20} color={Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userUsername}>@{item.username} • {item.email}</Text>
          </View>
          <Badge
            label={item.role === 'OWNER' ? t('ownerBadge') : t('salesBadge')}
            variant={item.role === 'OWNER' ? 'reseller' : 'retail'}
          />
        </View>
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
            {language === 'te' ? 'షాప్ బృందం & అనుమతులు' : 'Store Team & Roles'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>
            {language === 'te' ? 'యూజర్‌ను చేర్చు' : 'Add User'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.formWrapper}>
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {language === 'te' ? 'నూతన బృంద సభ్యుని ఖాతా' : 'New Team Member Account'}
            </Text>

            <Input
              label={language === 'te' ? 'పూర్తి పేరు' : 'Full Name *'}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Ramesh Reddy"
            />
            <Input
              label={language === 'te' ? 'ఈమెయిల్' : 'Email Address *'}
              value={email}
              onChangeText={setEmail}
              placeholder="ramesh@freshstock.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label={language === 'te' ? 'యూజర్‌నేమ్' : 'Username *'}
              value={username}
              onChangeText={setUsername}
              placeholder="ramesh"
              autoCapitalize="none"
            />
            <Input
              label={language === 'te' ? 'పాస్‌వర్డ్' : 'Initial Password *'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Role Switcher */}
            <Text style={styles.inputLabel}>{language === 'te' ? 'పాత్ర (రోల్)' : 'Role'}</Text>
            <View style={styles.roleToggleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'SALESPERSON' && styles.activeRoleBtn]}
                onPress={() => setRole('SALESPERSON')}
              >
                <Text style={[styles.roleBtnText, role === 'SALESPERSON' && styles.activeRoleBtnText]}>
                  {t('salesBadge')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'OWNER' && styles.activeRoleBtn]}
                onPress={() => setRole('OWNER')}
              >
                <Text style={[styles.roleBtnText, role === 'OWNER' && styles.activeRoleBtnText]}>
                  {t('ownerBadge')}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={
                mutation.isPending
                  ? language === 'te'
                    ? 'సృష్టిస్తోంది...'
                    : 'Creating User...'
                  : language === 'te'
                  ? 'ఖాతాను సృష్టించండి'
                  : 'Create Account'
              }
              onPress={handleCreate}
              loading={mutation.isPending}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </Card>
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: 6,
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F8F5',
    borderRadius: 16,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRoleBtn: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeRoleBtnText: {
    color: Colors.darkForest,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  userUsername: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
});
