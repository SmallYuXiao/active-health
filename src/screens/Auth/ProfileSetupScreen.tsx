import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useHealthEngineStore } from '../../store/useHealthEngineStore';
import type { Gender, ProgramId } from '../../types/health';

type ProfileSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
  const updateUserProfile = useHealthEngineStore(state => state.updateUserProfile);

  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [age, setAge] = useState<string>('30');
  const [conditions, setConditions] = useState<ProgramId[]>(['lbp_msk']);

  const handleComplete = () => {
    updateUserProfile({
      gender,
      age: parseInt(age, 10) || undefined,
      conditions,
    });
  };

  const toggleCondition = (conditionId: ProgramId) => {
    setConditions(prev => 
      prev.includes(conditionId) 
        ? prev.filter(c => c !== conditionId)
        : [...prev, conditionId]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>建立您的健康档案</Text>
        <Text style={styles.headerSubtitle}>这些信息将帮助引擎为您生成千人千面的康复方案。</Text>

        <View style={styles.section}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.row}>
            {['male', 'female', 'other'].map(g => (
              <Pressable
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g as Gender)}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                  {g === 'male' ? '男性' : g === 'female' ? '女性' : '其他'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>年龄 (岁)</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="例如: 35"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>慢病和痛症 (多选)</Text>
          <View style={styles.row}>
            {[
              { id: 'lbp_msk', label: '下背痛/脊柱' }
            ].map(cond => {
              const active = conditions.includes(cond.id as ProgramId);
              return (
                <Pressable
                  key={cond.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleCondition(cond.id as ProgramId)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cond.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.button, conditions.length === 0 && styles.buttonDisabled]} 
          onPress={handleComplete}
          disabled={conditions.length === 0}
        >
          <Text style={styles.buttonText}>生成我的康复计划</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 24, gap: 32 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  section: { gap: 12 },
  label: { fontSize: 16, fontWeight: '700', color: '#374151' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FCE7F3', borderColor: '#F43F5E' },
  chipText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  chipTextActive: { color: '#E11D48' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16 },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  button: { backgroundColor: '#E11D48', padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#FCA5A5' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
