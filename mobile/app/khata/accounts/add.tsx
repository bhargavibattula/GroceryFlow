import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Building, Phone, MapPin, IndianRupee, Clock, FileText } from 'lucide-react-native';
import { Colors } from '../../../src/theme/colors';
import { useLanguage } from '../../../src/context/LanguageContext';
import { khataApi } from '../../../src/api/khata';

export default function AddAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const [type, setType] = useState<'CUSTOMER' | 'SUPPLIER' | 'BOTH'>('CUSTOMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [direction, setDirection] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [creditTermsDays, setCreditTermsDays] = useState('15');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => khataApi.createAccount(data),
    onSuccess: (newAccount) => {
      queryClient.invalidateQueries({ queryKey: ['khata-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['khata-dashboard'] });
      Alert.alert(
        language === 'te' ? 'విజయవంతం!' : 'Success!',
        language === 'te'
          ? `"${newAccount.name}" ఖాతా విజయవంతంగా సృష్టించబడింది.`
          : `Account "${newAccount.name}" created successfully.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/khata/accounts/${newAccount._id}` as any),
          },
        ]
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create account.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', language === 'te' ? 'దయచేసి ఖాతాదారుని పేరు నమోదు చేయండి' : 'Please enter an account name.');
      return;
    }

    const cleanBalance = parseFloat(openingBalance) || 0;

    createMutation.mutate({
      name: name.trim(),
      type,
      phone: phone.trim(),
      businessName: businessName.trim(),
      address: address.trim(),
      openingBalance: cleanBalance,
      openingBalanceDirection: cleanBalance > 0 ? direction : 'ZERO',
      creditTermsDays: parseInt(creditTermsDays, 10) || 15,
      notes: notes.trim(),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.screenHeading}>
        {language === 'te' ? 'కొత్త ఖాతా సృష్టించండి' : 'Add New Khata Account'}
      </Text>
      <Text style={styles.screenSub}>
        {language === 'te'
          ? 'కస్టమర్ లేదా సప్లయర్ వివరాలు నమోదు చేసి బాకీలు ట్రాక్ చేయండి'
          : 'Track credit, payments, and running balances easily'}
      </Text>

      {/* Account Type Selector */}
      <View style={styles.typeSelectorRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'CUSTOMER' && styles.typeBtnActive]}
          onPress={() => {
            setType('CUSTOMER');
            setDirection('RECEIVABLE');
          }}
        >
          <Text style={[styles.typeBtnText, type === 'CUSTOMER' && styles.typeBtnTextActive]}>
            {language === 'te' ? 'కస్టమర్' : 'Customer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, type === 'SUPPLIER' && styles.typeBtnActive]}
          onPress={() => {
            setType('SUPPLIER');
            setDirection('PAYABLE');
          }}
        >
          <Text style={[styles.typeBtnText, type === 'SUPPLIER' && styles.typeBtnTextActive]}>
            {language === 'te' ? 'సప్లయర్' : 'Supplier'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, type === 'BOTH' && styles.typeBtnActive]}
          onPress={() => setType('BOTH')}
        >
          <Text style={[styles.typeBtnText, type === 'BOTH' && styles.typeBtnTextActive]}>
            {language === 'te' ? 'రెండు' : 'Both'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'పేరు *' : 'Name *'}
          </Text>
          <View style={styles.inputWrap}>
            <UserCheck size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'te' ? 'ఉదా. రమేష్ నాయుడు' : 'e.g. Ramesh Naidu'}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'మొబైల్ నంబర్' : 'Phone Number'}
          </Text>
          <View style={styles.inputWrap}>
            <Phone size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'దుకాణం / వ్యాపార పేరు (ఐచ్ఛికం)' : 'Business / Shop Name (Optional)'}
          </Text>
          <View style={styles.inputWrap}>
            <Building size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'te' ? 'ఉదా. శ్రీ లక్ష్మి ప్రొవిజన్స్' : 'e.g. Sri Lakshmi Provisions'}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'చిరునామా (ఐచ్ఛికం)' : 'Address (Optional)'}
          </Text>
          <View style={styles.inputWrap}>
            <MapPin size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'te' ? 'గ్రామం / కాలనీ' : 'Street or Village'}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>
      </View>

      {/* Opening Balance Card */}
      <View style={styles.formCard}>
        <Text style={styles.sectionCardTitle}>
          {language === 'te' ? 'ప్రారంభ బాకీ (Opening Balance)' : 'Opening Balance'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'మొత్తం (₹)' : 'Amount (₹)'}
          </Text>
          <View style={styles.inputWrap}>
            <IndianRupee size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder="0"
              keyboardType="numeric"
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />
          </View>
        </View>

        {parseFloat(openingBalance) > 0 ? (
          <View style={styles.directionToggleRow}>
            <TouchableOpacity
              style={[
                styles.directionBtn,
                direction === 'RECEIVABLE' && styles.directionBtnActiveReceivable,
              ]}
              onPress={() => setDirection('RECEIVABLE')}
            >
              <Text
                style={[
                  styles.directionBtnText,
                  direction === 'RECEIVABLE' && styles.directionBtnTextActive,
                ]}
              >
                {language === 'te' ? 'కస్టమర్ ఇవ్వాలి (రావాలి)' : "You'll Get (Receivable)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.directionBtn,
                direction === 'PAYABLE' && styles.directionBtnActivePayable,
              ]}
              onPress={() => setDirection('PAYABLE')}
            >
              <Text
                style={[
                  styles.directionBtnText,
                  direction === 'PAYABLE' && styles.directionBtnTextActive,
                ]}
              >
                {language === 'te' ? 'మనం ఇవ్వాలి (చెల్లించాలి)' : "You'll Give (Payable)"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'క్రెడిట్ గడువు (రోజులు)' : 'Credit Due Period (Days)'}
          </Text>
          <View style={styles.inputWrap}>
            <Clock size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder="15"
              keyboardType="numeric"
              value={creditTermsDays}
              onChangeText={setCreditTermsDays}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'te' ? 'గమనికలు / నోట్స్' : 'Notes'}
          </Text>
          <View style={styles.inputWrap}>
            <FileText size={18} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder={language === 'te' ? 'ఐచ్ఛిక వివరణ' : 'Optional notes'}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>
            {language === 'te' ? 'ఖాతా సేవ్ చేయండి' : 'Create Khata Account'}
          </Text>
        )}
      </TouchableOpacity>
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
  screenHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  screenSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E6EFE9',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: Colors.dockBg,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  typeBtnTextActive: {
    color: Colors.white,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5EAE5',
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  directionToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  directionBtnActiveReceivable: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  directionBtnActivePayable: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  directionBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  directionBtnTextActive: {
    fontWeight: '700',
    color: '#1F2937',
  },
  submitBtn: {
    backgroundColor: Colors.dockBg,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
