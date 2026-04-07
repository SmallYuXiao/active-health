import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type TelemedScreenProps = NativeStackScreenProps<RootStackParamList, 'Telemed'>;

export const TelemedScreen: React.FC<TelemedScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>返回</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🩺</Text>
        </View>
        <Text style={styles.title}>在线互联网医院</Text>
        <Text style={styles.subtitle}>您的健康档案已对医生开放。医生将结合评估基线为您解答当前的干预风险。</Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>发起图文咨询</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 16 },
  headerBtn: { fontSize: 16, color: '#2563EB' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  iconContainer: { padding: 24, backgroundColor: '#EFF6FF', borderRadius: 40 },
  icon: { fontSize: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E40AF' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  button: { backgroundColor: '#2563EB', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, marginTop: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
