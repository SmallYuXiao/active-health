export type ProgramId =
  | 'lbp_msk'
  | 'hypertension'
  | 'diabetes'
  | 'copd'
  | 'ckd'
  | 'weight';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  id: string;
  name?: string;
  gender: Gender;
  age?: number;
  conditions: ProgramId[];
  createdAt: string;
}

export interface HealthBaseline {
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  painLevel?: number; // 0-10
  bmi?: number;
  lastUpdatedAt: string;
}

export interface Prescription {
  nutrition?: string[];
  movement?: string[];
  behavioral?: string[];
  medications?: string[];
}

export type TaskCategory =
  | 'measurement'
  | 'medication'
  | 'movement'
  | 'nutrition'
  | 'recovery';

export type NetworkQuality = 'offline' | 'weak' | 'online';

export type QueueJobType = 'task_completion' | 'assessment_submission';
export type QueueJobStatus = 'queued' | 'syncing' | 'failed';
export type SyncStatus = 'queued' | 'syncing' | 'synced' | 'failed';

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'includes'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal';

export type PrimitiveAnswer = string | number | boolean;
export type AssessmentAnswer = PrimitiveAnswer | string[];
export type AssessmentAnswerMap = Record<string, AssessmentAnswer>;

export interface AssessmentVisibilityRule {
  questionId: string;
  operator: RuleOperator;
  value: PrimitiveAnswer | string[];
}

export interface ScoreRule {
  operator: RuleOperator;
  value: PrimitiveAnswer | string[];
  score: number;
  reason?: string;
}

export interface AssessmentOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  score?: number;
}

interface QuestionBase<T extends string> {
  id: string;
  type: T;
  title: string;
  description?: string;
  helperText?: string;
  required?: boolean;
  visibleWhen?: AssessmentVisibilityRule[];
  scoreRules?: ScoreRule[];
}

export interface SingleSelectQuestion extends QuestionBase<'single_select'> {
  options: AssessmentOption[];
}

export interface MultiSelectQuestion extends QuestionBase<'multi_select'> {
  options: AssessmentOption[];
}

export interface ScaleQuestion extends QuestionBase<'scale'> {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface BooleanQuestion extends QuestionBase<'boolean'> {
  trueLabel?: string;
  falseLabel?: string;
}

export interface NumberQuestion extends QuestionBase<'number'> {
  placeholder?: string;
  unit?: string;
}

export interface TextQuestion extends QuestionBase<'text'> {
  placeholder?: string;
}

export type AssessmentQuestion =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | ScaleQuestion
  | BooleanQuestion
  | NumberQuestion
  | TextQuestion;

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentRiskBand {
  id: string;
  label: string;
  minScore: number;
  tone: 'positive' | 'warning' | 'critical';
  summary: string;
}

export interface AssessmentSchema {
  id: string;
  title: string;
  description: string;
  submitLabel: string;
  sections: AssessmentSection[];
  riskBands: AssessmentRiskBand[];
}

export interface AssessmentConsentConfig {
  title: string;
  body: string;
  footnote?: string;
  acceptLabel: string;
}

export interface AssessmentGateConfig {
  questionId: string;
  blockingValues: string[];
  title: string;
  message: string;
}

export interface HabitTaskDefinition {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  cadenceLabel: string;
}

export interface InterventionRecommendation {
  id: string;
  title: string;
  description: string;
  coachNote: string;
  taskIds: string[];
  riskBandIds?: string[];
}

export interface ProgramDefinition {
  id: ProgramId;
  title: string;
  shortLabel: string;
  summary: string;
  description: string;
  accentColor: string;
  accentSurface: string;
  assessment: AssessmentSchema;
  assessmentConsent?: AssessmentConsentConfig;
  assessmentGate?: AssessmentGateConfig;
  tasks: HabitTaskDefinition[];
  interventions: InterventionRecommendation[];
}

export interface TaskCompletionRecord {
  id: string;
  queueJobId: string;
  programId: ProgramId;
  taskId: string;
  dayKey: string;
  completedAt: string;
  pointsAwarded: number;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastError?: string;
  lastAttemptAt?: string;
  syncedAt?: string;
}

export interface AssessmentSubmissionRecord {
  id: string;
  queueJobId: string;
  programId: ProgramId;
  schemaId: string;
  submittedAt: string;
  answers: AssessmentAnswerMap;
  visibleQuestionIds: string[];
  score: number;
  riskBandId: string;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastError?: string;
  lastAttemptAt?: string;
  syncedAt?: string;
}

export interface QueueJob {
  id: string;
  type: QueueJobType;
  recordId: string;
  programId: ProgramId;
  createdAt: string;
  attempts: number;
  status: QueueJobStatus;
  error?: string;
  payload: Record<string, unknown>;
}
