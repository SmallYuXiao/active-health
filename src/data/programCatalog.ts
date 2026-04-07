import type { ProgramDefinition } from '../types/health';

const LBP_PROGRAM: ProgramDefinition = {
  id: 'lbp_msk',
  title: '下背痛与肌肉骨骼',
  shortLabel: 'MSK',
  summary: '红旗筛查、症状自评与循序恢复建议。',
  description: '围绕下背痛与肌肉骨骼问题设计的分步评估路径，先做知情同意和红旗排查，再进入功能与疼痛影响评估。',
  // 使用新的“恢复感”主色调：陶土橙
  accentColor: '#C2410C',
  accentSurface: '#FFEDD5',
  assessmentConsent: {
    title: '使用条款与知情同意',
    body: '开始评估前，请先确认你理解：本问卷用于自我管理与风险筛查，不能替代医生面诊或急诊判断。如出现明显危险信号，请优先联系专业医疗人员。',
    footnote: '点击下方按钮，即表示你同意继续完成下背痛与肌骨评估。',
    acceptLabel: '我已了解，开始评估',
  },
  assessmentGate: {
    questionId: 'lbp_red_flags',
    blockingValues: [
      'neuro',
      'worsening',
      'persistent',
      'injury',
      'systemic',
      'history',
      'daily_impact',
    ],
    title: '检测到红旗信号',
    message: '当前回答提示可能存在需要优先就医评估的风险信号。建议先联系医生或专业医疗机构，不继续进行自我评估。',
  },
  tasks: [
    {
      id: 'lbp_symptom_log',
      title: '记录今天的疼痛',
      description: '客观记录疼痛影响与诱因，不要被分数定义。',
      category: 'measurement',
      points: 10,
      cadenceLabel: '每日',
    },
    {
      id: 'lbp_mobility',
      title: '温和活动 10 分钟',
      description: '轻柔走动、日常活动即可，避免剧烈拉伸。',
      category: 'movement',
      points: 20,
      cadenceLabel: '每日',
    },
    {
      id: 'lbp_recovery',
      title: '恢复放松 1 次',
      description: '做 3 轮缓慢呼吸，或针对紧张部位热敷 15 分钟。',
      category: 'recovery',
      points: 20,
      cadenceLabel: '每日',
    },
  ],
  assessment: {
    id: 'lbp_daily_assessment',
    title: '下背痛自我评估',
    description: '先确认没有危险信号，再评估疼痛和心理负担。',
    submitLabel: '查看今天恢复方案',
    riskBands: [
      {
        id: 'stable',
        label: '适合自我管理',
        minScore: 0,
        tone: 'positive',
        summary: '当前症状在正常自我恢复范围内，坚持轻度活动是最好的选择。',
      },
      {
        id: 'attention',
        label: '建议保守恢复',
        minScore: 4,
        tone: 'warning',
        summary: '疼痛对身体和情绪有了干扰，今天建议放缓节奏，观察为主。',
      },
      {
        id: 'elevated',
        label: '建议优先面诊',
        minScore: 8,
        tone: 'critical',
        summary: '目前的症状负担非常显著，建议您联系专业康复师或医生判断风险。',
      },
    ],
    sections: [
      {
        id: 'lbp_red_flags_section',
        title: '先确认有没有需要优先就医的情况',
        description: '任何一项“是”都代表可能不适合立刻自己干预。',
        questions: [
          {
            id: 'lbp_red_flags',
            type: 'multi_select',
            title: '以下哪些情况符合你现在的状态？',
            helperText: '可多选；如果都没有，请直接选择“没有以上情况”。',
            required: true,
            options: [
              { id: 'none', label: '没有以上情况', value: 'none', score: 0 },
              {
                id: 'neuro',
                label: '腿部分布广泛麻木或无力，或大小便失控',
                description: '不仅是下背痛，并伴随神经受损的明确表现。',
                value: 'neuro',
                score: 10,
              },
              {
                id: 'injury',
                label: '最近有跌倒、车祸等外伤导致突然剧痛',
                description: '外力导致的严重疼痛需要排除骨折等可能。',
                value: 'injury',
                score: 10,
              },
              {
                id: 'systemic',
                label: '伴有发热、寒战、剧烈夜间盗汗等全身反应',
                description: '可能存在感染或其他全身体统风险。',
                value: 'systemic',
                score: 10,
              },
            ],
          },
        ],
      },
      {
        id: 'lbp_assessment_1',
        title: '基础概览',
        questions: [
          {
            id: 'lbp_onset',
            type: 'single_select',
            title: '这次加重/发作什么时候开始的？',
            required: true,
            options: [
              { id: 'recent', label: '最近几天到几周 (急性)', value: 'recent', score: 1 },
              { id: 'longer', label: '好几个月了 (慢性)', value: 'longer', score: 0 },
            ],
          },
          {
            id: 'lbp_radiating_leg',
            type: 'boolean',
            title: '疼痛有放射到臀部乃至腿上吗？',
            required: true,
            trueLabel: '有',
            falseLabel: '目前没有',
            scoreRules: [{ operator: 'equals', value: true, score: 2 }],
          },
        ],
      },
      {
        id: 'lbp_assessment_2',
        title: '对功能的影响程度',
        questions: [
          {
            id: 'lbp_short_distance',
            type: 'boolean',
            title: '现在哪怕走很短的一段路都觉得困难吗？',
            required: true,
            trueLabel: '走几步就疼',
            falseLabel: '走短距还可以',
            scoreRules: [{ operator: 'equals', value: true, score: 2 }],
          },
          {
            id: 'lbp_dressing_slow',
            type: 'boolean',
            title: '穿鞋穿内裤这类日常动作变得极度缓慢？',
            required: true,
            trueLabel: '是',
            falseLabel: '稍微慢点但能应对',
            scoreRules: [{ operator: 'equals', value: true, score: 1 }],
          },
          {
            id: 'lbp_activity_safety',
            type: 'boolean',
            title: '潜意识里是否觉得“一动就会伤到脊椎，所以我一动都不敢动”？',
            required: true,
            trueLabel: '是，很害怕发力',
            falseLabel: '否',
            scoreRules: [{ operator: 'equals', value: true, score: 2 }],
          },
        ],
      },
      {
        id: 'lbp_assessment_3',
        title: '情绪与心理负担',
        questions: [
          {
            id: 'lbp_worrying_thoughts',
            type: 'boolean',
            title: '这几天是不是反复担心背痛再也好不起来？',
            required: true,
            trueLabel: '非常担心',
            falseLabel: '偶尔但还能调整',
            scoreRules: [{ operator: 'equals', value: true, score: 2 }],
          },
          {
            id: 'lbp_no_enjoyment',
            type: 'boolean',
            title: '疼痛导致你对原本喜欢的事都不感兴趣了？',
            required: true,
            trueLabel: '是',
            falseLabel: '否',
            scoreRules: [{ operator: 'equals', value: true, score: 1 }],
          },
        ],
      },
    ],
  },
  interventions: [], // 我们将抛弃通用Intervention，这部分可以直接置空
};

// 强制导出单一项目，剔除其他病种代码
export const PROGRAMS: ProgramDefinition[] = [LBP_PROGRAM];

export const DEFAULT_PROGRAM = LBP_PROGRAM;

export const getProgramById = (id: string): ProgramDefinition => {
  const program = PROGRAMS.find(p => p.id === id);
  // Default to LBP_PROGRAM if the stored id is an old one (e.g. hypertension, diabetes)
  return program || LBP_PROGRAM;
};
