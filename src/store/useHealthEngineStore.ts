import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { healthEngineStorage } from '../bridge/storage';
import { DEFAULT_PROGRAM, getProgramById } from '../data/programCatalog';
import { submitQueueJob } from '../services/mockSyncApi';
import type {
  AssessmentAnswerMap,
  AssessmentSubmissionRecord,
  HealthBaseline,
  NetworkQuality,
  ProgramId,
  QueueJob,
  TaskCompletionRecord,
  UserProfile,
} from '../types/health';
import {
  buildAssessmentPayload,
  calculateAssessmentScore,
  getAssessmentCompletion,
  resolveRiskBand,
} from '../utils/assessment';
import {
  computeProgramStreakDays,
  getDayKey,
  getLatestAssessmentSubmission,
  getProgramTaskProgressForDay,
} from '../utils/engine';

interface SyncResult {
  synced: number;
  failed: number;
}

interface HealthEngineState {
  userProfile: UserProfile | null;
  healthBaseline: HealthBaseline | null;
  activeProgramId: ProgramId;
  totalPoints: number;
  taskCompletions: TaskCompletionRecord[];
  assessmentSubmissions: AssessmentSubmissionRecord[];
  queueJobs: QueueJob[];
  networkQuality: NetworkQuality;
  syncInFlight: boolean;
  lastSyncedAt?: string;
  isHydrated: boolean;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateBaseline: (baseline: Partial<HealthBaseline>) => void;
  evaluateAlerts: () => { hasRedFlags: boolean; messages: string[] };
  setActiveProgram: (programId: ProgramId) => void;
  setNetworkQuality: (networkQuality: NetworkQuality) => void;
  setHydrated: (isHydrated: boolean) => void;
  completeTask: (taskId: string, programId?: ProgramId, dayKey?: string) => void;
  submitAssessment: (
    answers: AssessmentAnswerMap,
    programId?: ProgramId,
  ) => { ok: boolean; reason?: string; submissionId?: string };
  syncPendingSubmissions: () => Promise<SyncResult>;
}

const createLocalId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const updateTaskSyncState = (
  completions: TaskCompletionRecord[],
  recordId: string,
  patch: Partial<TaskCompletionRecord>,
) =>
  completions.map(completion =>
    completion.id === recordId ? { ...completion, ...patch } : completion,
  );

const updateAssessmentSyncState = (
  submissions: AssessmentSubmissionRecord[],
  recordId: string,
  patch: Partial<AssessmentSubmissionRecord>,
) =>
  submissions.map(submission =>
    submission.id === recordId ? { ...submission, ...patch } : submission,
  );

const updateQueueJob = (
  queueJobs: QueueJob[],
  jobId: string,
  patch: Partial<QueueJob>,
) => queueJobs.map(job => (job.id === jobId ? { ...job, ...patch } : job));

export const useHealthEngineStore = create<HealthEngineState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      healthBaseline: null,
      activeProgramId: DEFAULT_PROGRAM.id,
      totalPoints: 0,
      taskCompletions: [],
      assessmentSubmissions: [],
      queueJobs: [],
      networkQuality: 'online',
      syncInFlight: false,
      lastSyncedAt: undefined,
      isHydrated: false,
      setHydrated: isHydrated => set({ isHydrated }),
      updateUserProfile: profile => 
        set(state => ({
          userProfile: state.userProfile 
            ? { ...state.userProfile, ...profile }
            : { ...profile, id: createLocalId('user'), createdAt: new Date().toISOString() } as UserProfile
        })),
      updateBaseline: baseline =>
        set(state => ({
          healthBaseline: state.healthBaseline
            ? { ...state.healthBaseline, ...baseline, lastUpdatedAt: new Date().toISOString() }
            : { ...baseline, lastUpdatedAt: new Date().toISOString() } as HealthBaseline
        })),
      evaluateAlerts: () => {
        const baseline = get().healthBaseline;
        const msgs: string[] = [];
        let hasRedFlags = false;
        if (baseline?.bloodPressureSys && baseline.bloodPressureSys >= 180) {
          msgs.push('血压告警: 收缩压危急值');
          hasRedFlags = true;
        }
        if (baseline?.painLevel && baseline.painLevel >= 8) {
          msgs.push('急性严重背痛告警');
          hasRedFlags = true;
        }
        return { hasRedFlags, messages: msgs };
      },
      setActiveProgram: activeProgramId =>
        set({ activeProgramId: getProgramById(activeProgramId).id }),
      setNetworkQuality: networkQuality => {
        set({ networkQuality });

        if (networkQuality !== 'offline') {
          get()
            .syncPendingSubmissions()
            .catch(() => undefined);
        }
      },
      completeTask: (taskId, maybeProgramId, dayKey = getDayKey()) => {
        const programId = maybeProgramId ?? get().activeProgramId;
        const program = getProgramById(programId);
        const task = program.tasks.find(item => item.id === taskId);

        if (!task) {
          return;
        }

        const alreadyCompleted = get().taskCompletions.some(
          completion =>
            completion.programId === programId &&
            completion.taskId === taskId &&
            completion.dayKey === dayKey,
        );

        if (alreadyCompleted) {
          return;
        }

        const queueJobId = createLocalId('queue');
        const recordId = createLocalId('task');
        const completedAt = new Date().toISOString();

        const completion: TaskCompletionRecord = {
          id: recordId,
          queueJobId,
          programId,
          taskId,
          dayKey,
          completedAt,
          pointsAwarded: task.points,
          syncStatus: 'queued',
          syncAttempts: 0,
        };

        const queueJob: QueueJob = {
          id: queueJobId,
          type: 'task_completion',
          recordId,
          programId,
          createdAt: completedAt,
          attempts: 0,
          status: 'queued',
          payload: {
            taskId,
            dayKey,
            completedAt,
            pointsAwarded: task.points,
          },
        };

        set(state => ({
          totalPoints: state.totalPoints + task.points,
          taskCompletions: [completion, ...state.taskCompletions],
          queueJobs: [queueJob, ...state.queueJobs],
        }));

        if (get().networkQuality !== 'offline') {
          get()
            .syncPendingSubmissions()
            .catch(() => undefined);
        }
      },
      submitAssessment: (answers, maybeProgramId) => {
        const programId = maybeProgramId ?? get().activeProgramId;
        const program = getProgramById(programId);
        const completion = getAssessmentCompletion(program.assessment, answers);

        if (!completion.isComplete) {
          return { ok: false, reason: 'visible_required_missing' };
        }

        const { payload, visibleQuestionIds } = buildAssessmentPayload(
          program.assessment,
          answers,
        );
        const score = calculateAssessmentScore(program.assessment, payload);
        const riskBand = resolveRiskBand(program.assessment, score);
        const queueJobId = createLocalId('queue');
        const recordId = createLocalId('assessment');
        const submittedAt = new Date().toISOString();

        const submission: AssessmentSubmissionRecord = {
          id: recordId,
          queueJobId,
          programId,
          schemaId: program.assessment.id,
          submittedAt,
          answers: payload,
          visibleQuestionIds,
          score,
          riskBandId: riskBand.id,
          syncStatus: 'queued',
          syncAttempts: 0,
        };

        const queueJob: QueueJob = {
          id: queueJobId,
          type: 'assessment_submission',
          recordId,
          programId,
          createdAt: submittedAt,
          attempts: 0,
          status: 'queued',
          payload: {
            schemaId: program.assessment.id,
            score,
            riskBandId: riskBand.id,
            answers: payload,
          },
        };

        set(state => ({
          assessmentSubmissions: [submission, ...state.assessmentSubmissions],
          queueJobs: [queueJob, ...state.queueJobs],
        }));

        if (get().networkQuality !== 'offline') {
          get()
            .syncPendingSubmissions()
            .catch(() => undefined);
        }

        return { ok: true, submissionId: recordId };
      },
      syncPendingSubmissions: async () => {
        const { networkQuality, syncInFlight } = get();

        if (networkQuality === 'offline' || syncInFlight) {
          return { synced: 0, failed: 0 };
        }

        const jobs = [...get().queueJobs].sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        );

        if (jobs.length === 0) {
          return { synced: 0, failed: 0 };
        }

        set({ syncInFlight: true });

        let synced = 0;
        let failed = 0;

        for (const job of jobs) {
          const startedAt = new Date().toISOString();

          set(state => ({
            queueJobs: updateQueueJob(state.queueJobs, job.id, { status: 'syncing' }),
            taskCompletions:
              job.type === 'task_completion'
                ? updateTaskSyncState(state.taskCompletions, job.recordId, {
                    syncStatus: 'syncing',
                    lastAttemptAt: startedAt,
                  })
                : state.taskCompletions,
            assessmentSubmissions:
              job.type === 'assessment_submission'
                ? updateAssessmentSyncState(state.assessmentSubmissions, job.recordId, {
                    syncStatus: 'syncing',
                    lastAttemptAt: startedAt,
                  })
                : state.assessmentSubmissions,
          }));

          try {
            const receipt = await submitQueueJob(
              { ...job, attempts: job.attempts },
              get().networkQuality,
            );

            set(state => ({
              queueJobs: state.queueJobs.filter(queueJob => queueJob.id !== job.id),
              taskCompletions:
                job.type === 'task_completion'
                  ? updateTaskSyncState(state.taskCompletions, job.recordId, {
                      syncStatus: 'synced',
                      syncedAt: receipt.syncedAt,
                      lastError: undefined,
                    })
                  : state.taskCompletions,
              assessmentSubmissions:
                job.type === 'assessment_submission'
                  ? updateAssessmentSyncState(state.assessmentSubmissions, job.recordId, {
                      syncStatus: 'synced',
                      syncedAt: receipt.syncedAt,
                      lastError: undefined,
                    })
                  : state.assessmentSubmissions,
              lastSyncedAt: receipt.syncedAt,
            }));

            synced += 1;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown sync failure';
            const attempts = job.attempts + 1;
            const failedAt = new Date().toISOString();

            set(state => ({
              queueJobs: updateQueueJob(state.queueJobs, job.id, {
                attempts,
                error: message,
                status: 'failed',
              }),
              taskCompletions:
                job.type === 'task_completion'
                  ? updateTaskSyncState(state.taskCompletions, job.recordId, {
                      syncStatus: 'failed',
                      syncAttempts: attempts,
                      lastError: message,
                      lastAttemptAt: failedAt,
                    })
                  : state.taskCompletions,
              assessmentSubmissions:
                job.type === 'assessment_submission'
                  ? updateAssessmentSyncState(state.assessmentSubmissions, job.recordId, {
                      syncStatus: 'failed',
                      syncAttempts: attempts,
                      lastError: message,
                      lastAttemptAt: failedAt,
                    })
                  : state.assessmentSubmissions,
            }));

            failed += 1;
          }
        }

        set({ syncInFlight: false });
        return { synced, failed };
      },
    }),
    {
      name: 'active-health-engine-store',
      storage: createJSONStorage(() => healthEngineStorage),
      partialize: state => ({
        userProfile: state.userProfile,
        healthBaseline: state.healthBaseline,
        activeProgramId: state.activeProgramId,
        totalPoints: state.totalPoints,
        taskCompletions: state.taskCompletions,
        assessmentSubmissions: state.assessmentSubmissions,
        queueJobs: state.queueJobs,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          state.setActiveProgram(state.activeProgramId);
        }

        state?.setHydrated(true);
      },
    },
  ),
);

export const getProgramSnapshot = (
  state: Pick<
    HealthEngineState,
    'activeProgramId' | 'assessmentSubmissions' | 'queueJobs' | 'taskCompletions' | 'totalPoints'
  >,
  maybeProgramId?: ProgramId,
) => {
  const programId = maybeProgramId ?? state.activeProgramId;
  const program = getProgramById(programId);
  const todayKey = getDayKey();
  const todayProgress = getProgramTaskProgressForDay(
    program,
    state.taskCompletions,
    todayKey,
  );
  const latestAssessment = getLatestAssessmentSubmission(
    state.assessmentSubmissions,
    programId,
  );

  return {
    program,
    todayKey,
    todayProgress,
    streakDays: computeProgramStreakDays(program, state.taskCompletions, todayKey),
    pendingJobs: state.queueJobs.filter(job => job.programId === programId).length,
    latestAssessment,
    totalPoints: state.totalPoints,
  };
};
