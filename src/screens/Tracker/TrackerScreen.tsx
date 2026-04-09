import React from 'react';
import {
  Alert,
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
import { ChipButton } from '../../components/ChipButton';
import { TaskItem } from '../../components/TaskItem';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { getProgramSnapshot, useHealthEngineStore } from '../../store/useHealthEngineStore';
import type { NetworkQuality, QueueJob } from '../../types/health';
import { formatTimestamp, getTaskCompletionForDay } from '../../utils/engine';

type TrackerScreenProps = NativeStackScreenProps<RootStackParamList, 'Tracker'>;

const NETWORK_OPTIONS: NetworkQuality[] = ['offline', 'weak', 'online'];
const NETWORK_LABELS: Record<NetworkQuality, string> = {
  offline: '离线',
  weak: '弱网',
  online: '在线',
};
const SHOW_SYNC_ENV_CARD = false;
const SHOW_QUEUE_REPLAY_CARD = false;

const QUEUE_STATUS_LABELS = {
  queued: '已排队',
  syncing: '同步中',
  synced: '已同步',
  failed: '失败',
} as const;

export const TrackerScreen: React.FC<TrackerScreenProps> = ({ navigation }) => {
  const {
    activeProgramId,
    totalPoints,
    taskCompletions,
    assessmentSubmissions,
    queueJobs,
    networkQuality,
    syncInFlight,
    setNetworkQuality,
    completeTask,
    syncPendingSubmissions,
  } = useHealthEngineStore(
    useShallow(state => ({
      activeProgramId: state.activeProgramId,
      totalPoints: state.totalPoints,
      taskCompletions: state.taskCompletions,
      assessmentSubmissions: state.assessmentSubmissions,
      queueJobs: state.queueJobs,
      networkQuality: state.networkQuality,
      syncInFlight: state.syncInFlight,
      setNetworkQuality: state.setNetworkQuality,
      completeTask: state.completeTask,
      syncPendingSubmissions: state.syncPendingSubmissions,
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
  const recentJobs = queueJobs
    .filter(job => job.programId === activeProgramId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5);
  const programCompletions = taskCompletions.filter(
    item => item.programId === activeProgramId,
  );

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId, activeProgramId);
  };

  const handleSyncNow = async () => {
    const result = await syncPendingSubmissions();
    Alert.alert(
      '队列处理结果',
      `${result.synced} 条已同步，${result.failed} 条仍在等待更好的网络。`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.title}>进度追踪</Text>
          <Text style={styles.subtitle}>
            {snapshot.program.title}
            。本地状态机会立即接收写入，并在稍后完成同步。
          </Text>
        </View>

        <Card style={[styles.highlightCard, { backgroundColor: snapshot.program.accentSurface }]}>
          <Text style={styles.highlightTitle}>今日连续打卡</Text>
          <View style={styles.highlightMetrics}>
            <View style={styles.highlightMetric}>
              <Text style={styles.highlightMetricLabel}>连续天数</Text>
              <Text style={styles.highlightMetricValue}>{snapshot.streakDays}</Text>
            </View>
            <View style={styles.highlightMetric}>
              <Text style={styles.highlightMetricLabel}>已完成</Text>
              <Text style={styles.highlightMetricValue}>
                {snapshot.todayProgress.completedCount}/{snapshot.todayProgress.totalCount}
              </Text>
            </View>
            <View style={styles.highlightMetric}>
              <Text style={styles.highlightMetricLabel}>队列</Text>
              <Text style={styles.highlightMetricValue}>{snapshot.pendingJobs}</Text>
            </View>
          </View>
        </Card>

        {SHOW_SYNC_ENV_CARD ? (
          <Card>
            <Text style={styles.cardTitle}>同步环境</Text>
            <Text style={styles.cardCopy}>
              用它模拟离线和弱网补偿逻辑，无需改后端代码。
            </Text>
            <View style={styles.networkOptions}>
              {NETWORK_OPTIONS.map(option => (
                <ChipButton
                  key={option}
                  compact
                  label={NETWORK_LABELS[option]}
                  selected={networkQuality === option}
                  onPress={() => setNetworkQuality(option)}
                  selectedBackgroundColor={
                    option === 'online'
                      ? '#166534'
                      : option === 'weak'
                        ? '#B45309'
                        : '#B91C1C'
                  }
                  selectedBorderColor={
                    option === 'online'
                      ? '#166534'
                      : option === 'weak'
                        ? '#B45309'
                        : '#B91C1C'
                  }
                  style={styles.networkChip}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleSyncNow}
              disabled={networkQuality === 'offline' || syncInFlight}
              style={({ pressed }) => [
                styles.syncButton,
                (networkQuality === 'offline' || syncInFlight) && styles.disabledButton,
                pressed && styles.pressedButton,
              ]}
            >
              <Text style={styles.syncButtonText}>
                {syncInFlight ? '同步中...' : '立即处理队列'}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日任务</Text>
          {snapshot.program.tasks.map(task => {
            const completion = getTaskCompletionForDay(
              programCompletions,
              task.id,
              snapshot.todayKey,
            );

            return (
              <TaskItem
                key={task.id}
                title={task.title}
                description={task.description}
                cadenceLabel={task.cadenceLabel}
                points={task.points}
                completed={Boolean(completion)}
                syncStatus={completion?.syncStatus}
                accentColor={snapshot.program.accentColor}
                onActionPress={() => handleCompleteTask(task.id)}
              />
            );
          })}
        </View>

        {SHOW_QUEUE_REPLAY_CARD ? (
          <Card>
            <Text style={styles.cardTitle}>队列回放</Text>
            <Text style={styles.cardCopy}>
              失败任务会保留在本地，待网络好转后可以重试。
            </Text>
            <View style={styles.queueList}>
              {recentJobs.length === 0 ? (
                <Text style={styles.emptyText}>当前方案没有待处理任务。</Text>
              ) : (
                recentJobs.map(job => (
                  <QueueTimelineItem
                    key={job.id}
                    job={job}
                    accentColor={snapshot.program.accentColor}
                  />
                ))
              )}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const QueueTimelineItem = ({
  job,
  accentColor,
}: {
  job: QueueJob;
  accentColor: string;
}) => {
  const label =
    job.type === 'task_completion' ? '任务完成' : '评估提交';

  return (
    <View style={styles.queueItem}>
      <View style={[styles.queueDot, { backgroundColor: accentColor }]} />
      <View style={styles.queueCopy}>
        <Text style={styles.queueTitle}>{label}</Text>
        <Text style={styles.queueDescription}>
          创建于 {formatTimestamp(job.createdAt)}。已尝试 {job.attempts} 次。
        </Text>
        <Text style={styles.queueDescription}>
          状态：{QUEUE_STATUS_LABELS[job.status]}。{job.error ?? '等待传输。'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  backText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  highlightCard: {
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#D6D3D1',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  highlightMetrics: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightMetric: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  highlightMetricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  highlightMetricValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  cardCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 16,
  },
  networkOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  networkChip: {
    flex: 1,
  },
  syncButton: {
    borderRadius: 18,
    backgroundColor: '#111827',
    paddingVertical: 15,
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    paddingHorizontal: 4,
  },
  queueList: {
    gap: 14,
  },
  queueItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  queueDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 6,
  },
  queueCopy: {
    flex: 1,
    gap: 4,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  queueDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  pressedButton: {
    opacity: 0.9,
  },
  disabledButton: {
    opacity: 0.55,
  },
});
