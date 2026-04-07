import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SyncStatus } from '../../types/health';

interface TaskItemProps {
  title: string;
  description: string;
  cadenceLabel: string;
  points: number;
  completed: boolean;
  syncStatus?: SyncStatus;
  accentColor: string;
  onActionPress?: () => void;
}

const SYNC_STATUS_META: Record<
  SyncStatus,
  { label: string; backgroundColor: string; textColor: string }
> = {
  queued: {
    label: '已排队',
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
  },
  syncing: {
    label: '同步中',
    backgroundColor: '#DBEAFE',
    textColor: '#1D4ED8',
  },
  synced: {
    label: '已同步',
    backgroundColor: '#DCFCE7',
    textColor: '#166534',
  },
  failed: {
    label: '需重试',
    backgroundColor: '#FEE2E2',
    textColor: '#B91C1C',
  },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  title,
  description,
  cadenceLabel,
  points,
  completed,
  syncStatus,
  accentColor,
  onActionPress,
}) => {
  const syncMeta = syncStatus ? SYNC_STATUS_META[syncStatus] : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.copyBlock}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.pointsBadge, { borderColor: accentColor }]}>
            <Text style={[styles.pointsText, { color: accentColor }]}>+{points}</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{cadenceLabel}</Text>
          {syncMeta ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: syncMeta.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: syncMeta.textColor }]}>
                {syncMeta.label}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onActionPress}
        style={({ pressed }) => [
          styles.actionButton,
          completed
            ? styles.completedActionButton
            : { backgroundColor: accentColor },
          pressed && styles.pressedButton,
        ]}
        disabled={completed}
      >
        <Text
          style={[
            styles.actionText,
            completed && styles.completedActionText,
          ]}
        >
          {completed ? '已完成' : '标记完成'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  copyBlock: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pointsBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedActionButton: {
    backgroundColor: '#E7E5E4',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completedActionText: {
    color: '#57534E',
  },
  pressedButton: {
    opacity: 0.88,
  },
});
