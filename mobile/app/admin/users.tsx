import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Shield, Plus, Key } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function UserManagementScreen() {
  const queryClient = useQueryClient();
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
      Alert.alert('User Created', 'New account can now log in.');
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
      Alert.alert('Validation Error', 'All fields are required.');
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

  const renderUser = ({ item }: { item: any }) => (
    <Card style={styles.userCard}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userUsername}>@{item.username} • {item.email}</Text>
        </View>
        <Badge
          label={item.role === 'OWNER' ? '👑 Owner' : '🛒 Salesperson'}
          variant={item.role === 'OWNER' ? 'reseller' : 'retail'}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Store Team & Roles</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>New Team Member Account</Text>
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Ramesh" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="e.g. ramesh@store.com" />
          <Input label="Username" value={username} onChangeText={setUsername} placeholder="e.g. ramesh" autoCapitalize="none" />
          <Input label="Initial Password" value={password} onChangeText={setPassword} secureTextEntry />

          <View style={styles.rolePickerRow}>
            <TouchableOpacity
              style={[styles.rolePickBtn, role === 'SALESPERSON' && styles.activeRolePick]}
              onPress={() => setRole('SALESPERSON')}
            >
              <Text style={[styles.rolePickText, role === 'SALESPERSON' && styles.activeRoleText]}>
                Salesperson
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rolePickBtn, role === 'OWNER' && styles.activeRolePick]}
              onPress={() => setRole('OWNER')}
            >
              <Text style={[styles.rolePickText, role === 'OWNER' && styles.activeRoleText]}>
                Store Owner
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Create Account"
            onPress={handleCreate}
            loading={mutation.isPending}
            style={{ marginTop: 8 }}
          />
        </Card>
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
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  rolePickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.veryLightMint,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeRolePick: {
    backgroundColor: Colors.darkForest,
  },
  rolePickText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  activeRoleText: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  userUsername: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
});
