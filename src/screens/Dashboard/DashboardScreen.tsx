import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useShallow } from 'zustand/react/shallow';
import { Card } from '../../components/Card';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { getProgramSnapshot, useHealthEngineStore } from '../../store/useHealthEngineStore';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const {
    activeProgramId,
    totalPoints,
    taskCompletions,
    assessmentSubmissions,
    queueJobs,
  } = useHealthEngineStore(
    useShallow(state => ({
      activeProgramId: state.activeProgramId,
      totalPoints: state.totalPoints,
      taskCompletions: state.taskCompletions,
      assessmentSubmissions: state.assessmentSubmissions,
      queueJobs: state.queueJobs,
    })),
  );

  const snapshot = getProgramSnapshot(
    {
      activeProgramId,
      totalPoints,
      taskCompletions,
      assessmentSubmissions,
      queueJobs,
    },
    activeProgramId,
  );

  const latestRiskBand = snapshot.latestAssessment
    ? snapshot.program.assessment.riskBands.find(
        (band: any) => band.id === snapshot.latestAssessment?.riskBandId,
      )
    : undefined;

  let todayStatusText = '建议您先完成一次快速红旗自评，以获取更精准的今日恢复计划。';
  let todayStatusTitle = '等待初步评估';
  
  if (latestRiskBand) {
    todayStatusTitle = '当前状态：' + latestRiskBand.label;
    if (latestRiskBand.tone === 'positive') {
      todayStatusText = '今天适合保持轻度活动，切忌完全卧床。正常的步态非常有利于下背部筋膜放松。';
    } else if (latestRiskBand.tone === 'warning') {
      todayStatusText = '今天症状偏重，建议以温和的呼吸与热敷为主，活动量以不加重疼痛为底线。';
    } else {
      todayStatusText = '目前风险较高，强烈建议先由专业医生面诊再考虑家庭恢复。';
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>MSK 恢复助手</Text>
            <Text style={styles.heroTitle}>今天的背椎恢复计划</Text>
            <Text style={styles.heroSubtitle}>先做 1 次短检查，再完成 3 个小任务</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakValue}>{snapshot.streakDays}</Text>
            <Text style={styles.streakLabel}>连续天数</Text>
          </View>
        </View>

        {/* Today's Status Card */}
        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>{todayStatusTitle}</Text>
          <Text style={styles.statusText}>{todayStatusText}</Text>
          {latestRiskBand?.tone === 'critical' ? (
            <Pressable
              style={[styles.actionButton, styles.criticalButton]}
              onPress={() => navigation.navigate('RedFlagAlert')}
            >
              <Text style={styles.actionButtonText}>查看高风险说明</Text>
            </Pressable>
          ) : (
             <View style={styles.buttonRow}>
               <Pressable
                 style={[styles.actionButton, styles.primaryButton]}
                 onPress={() => navigation.navigate('Tracker')}
               >
                 <Text style={styles.actionButtonText}>开始今日任务</Text>
               </Pressable>
               <Pressable
                 style={[styles.actionButton, styles.secondaryButton]}
                 onPress={() => navigation.navigate('Assessment')}
               >
                 <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>重做自评</Text>
               </Pressable>
             </View>
          )}
        </Card>

        {/* Task List */}
        <View style={styles.taskSection}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>今日 3 项任务</Text>
             <Text style={styles.progressText}>
               {snapshot.todayProgress.completedCount} / {snapshot.todayProgress.totalCount} 已完成
             </Text>
          </View>
          <Card style={styles.taskListCard}>
            <View style={styles.taskPreviewList}>
              {snapshot.program.tasks.map((task: any) => {
                const completed = taskCompletions.some(
                  completion =>
                    completion.programId === snapshot.program.id &&
                    completion.taskId === task.id &&
                    completion.dayKey === snapshot.todayKey,
                );

                return (
                  <Pressable 
                     key={task.id} 
                     style={styles.taskPreviewRow}
                     onPress={() => navigation.navigate('Tracker')}
                  >
                    <View
                      style={[
                        styles.taskPreviewDot,
                        completed && styles.taskPreviewDotCompleted,
                      ]}
                    />
                    <View style={styles.taskPreviewCopy}>
                      <Text style={[
                        styles.taskPreviewTitle,
                        completed && styles.taskPreviewTitleCompleted
                      ]}>{task.title}</Text>
                      <Text style={styles.taskPreviewDescription}>{task.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Recommendation / Recovery Plan link */}
        <Pressable 
          style={styles.recommendationBanner}
          onPress={() => navigation.navigate('RecoveryPlan')}
        >
          <View style={styles.recommendationCopy}>
            <Text style={styles.recommendationTitle}>担心这会加重疼痛？</Text>
            <Text style={styles.recommendationSubtitle}>查看我们的全套缓痛与安全恢复计划</Text>
          </View>
          <View style={styles.recommendationArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Sand / Off-white background
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#65A30D', // Olive green for recovery focus
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#78716C',
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: '#FFEDD5', // Light terracotta
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#C2410C', // Terracotta orange
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 22,
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#C2410C', // Terracotta Main
  },
  secondaryButton: {
    backgroundColor: '#F5F5F4',
  },
  criticalButton: {
    backgroundColor: '#991B1B',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#4B5563',
  },
  taskSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#65A30D', // Olive Green
  },
  taskListCard: {
    padding: 20,
  },
  taskPreviewList: {
    gap: 16,
  },
  taskPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  taskPreviewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  taskPreviewDotCompleted: {
    borderColor: '#65A30D',
    backgroundColor: '#65A30D',
  },
  taskPreviewCopy: {
    flex: 1,
    gap: 4,
  },
  taskPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  taskPreviewTitleCompleted: {
    color: '#A8A29E',
    textDecorationLine: 'line-through',
  },
  taskPreviewDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78716C',
  },
  recommendationBanner: {
    backgroundColor: '#F0FDF4', // Very light green
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationCopy: {
    flex: 1,
    gap: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  recommendationSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#15803D',
  },
  recommendationArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
});
