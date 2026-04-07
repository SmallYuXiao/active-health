import type { NetworkQuality, QueueJob } from '../types/health';

interface SyncReceipt {
  remoteId: string;
  syncedAt: string;
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const submitQueueJob = async (
  job: QueueJob,
  networkQuality: NetworkQuality,
): Promise<SyncReceipt> => {
  await wait(networkQuality === 'online' ? 320 : 900);

  if (networkQuality === 'offline') {
    throw new Error('设备离线，提交已保留在队列中。');
  }

  if (networkQuality === 'weak' && job.attempts < 1) {
    throw new Error('当前网络较弱，提交已保存在本地，稍后会自动重试。');
  }

  return {
    remoteId: `${job.type}_${job.recordId}_${job.attempts + 1}`,
    syncedAt: new Date().toISOString(),
  };
};
