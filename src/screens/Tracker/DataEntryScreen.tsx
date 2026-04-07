import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useHealthEngineStore } from '../../store/useHealthEngineStore';

type DataEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'DataEntry'>;

export const DataEntryScreen: React.FC<DataEntryScreenProps> = ({ navigation }) => {
  const { updateBaseline, evaluateAlerts } = useHealthEngineStore();
  const [painLevel, setPainLevel] = useState<string>('');
  const [bpSys, setBpSys] = useState<string>('');

  const handleSubmit = () => {
    updateBaseline({
      painLevel: painLevel ? parseInt(painLevel, 10) : undefined,
      bloodPressureSys: bpSys ? parseInt(bpSys, 10) : undefined,
    });
    
    // Check engine alerts mock
    const { hasRedFlags, messages } = evaluateAlerts();
    if (hasRedFlags) {
      Alert.alert('⚠️ 系统警告', messages.join('\n'));
    } else {
      Alert.alert('记录成功', '您的基线指标已更新。');
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>健康日记打卡</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>当前疼痛等级 (0-10)</Text>
          <TextInput
            style={styles.input}
            value={painLevel}
            onChangeText={setPainLevel}
            keyboardType="number-pad"
            placeholder="例如: 3"
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>收缩压 (mmHg) - 选填</Text>
          <TextInput
            style={styles.input}
            value={bpSys}
            onChangeText={setBpSys}
            keyboardType="number-pad"
            placeholder="例如: 120"
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>提交记录</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  headerBtn: { fontSize: 16, color: '#2563EB' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: 20, gap: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16 },
  footer: { padding: 20, backgroundColor: '#FFF' },
  button: { backgroundColor: '#E11D48', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
