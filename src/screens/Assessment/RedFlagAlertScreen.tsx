import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RedFlagAlert'>;

export const RedFlagAlertScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.alertHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.alertIcon}>!</Text>
          </View>
          <Text style={styles.alertTitle}>需要优先就医</Text>
        </View>

        <Text style={styles.description}>
          根据您的反馈，我们发现了一些可能的“红旗”症状（例如放射痛、严重外伤史或伴随其他系统性症状）。
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>为什么看到这个页面？</Text>
          <Text style={styles.infoText}>
            背痛恢复计划专为普通的机械性下背痛设计。对于伴随特定神经系统、骨骼或内脏症状的背痛，必须由专业医生先排除严重隐患。
          </Text>
        </View>

        <View style={styles.actionList}>
          <Text style={styles.actionSectionTitle}>今天您的首要任务：</Text>
          <View style={styles.actionItem}>
            <Text style={styles.actionDot}>•</Text>
            <Text style={styles.actionText}>停止任何自行恢复训练。</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionDot}>•</Text>
            <Text style={styles.actionText}>尽快预约骨科、康复科或急诊进行专业面诊。</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionDot}>•</Text>
            <Text style={styles.actionText}>保持最舒适的姿势休息，避免剧烈活动。</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.primaryButtonText}>知道了，返回首页</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white background
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2', // Light red background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#991B1B', // Dark red
  },
  alertTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#991B1B', // Dark red
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 32,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFBEB', // Amber light bg
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E', // Amber text
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#92400E',
  },
  actionList: {
    gap: 12,
  },
  actionSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionDot: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: -2,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#991B1B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
