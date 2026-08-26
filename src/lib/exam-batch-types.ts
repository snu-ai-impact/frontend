// 시험 문항 배치 생성 (프롬프트 A) API 타입 — 백엔드 snake_case 그대로

export type Grade = "초급" | "중급" | "고급";
export type Domain = "P" | "E" | "D" | "W";
export type Difficulty = "하" | "중" | "상";

// ---- 영역 등급 기준 (시트2) ----
export interface GradeStandard {
  id: string;
  domain: string;
  grade: string;
  content: string;
  is_placeholder: boolean;
  updated_at: string;
}

// ---- 배치 파라미터 ----
export interface DifficultyMix {
  하: number;
  중: number;
  상: number;
}

export interface SourceFileRef {
  name: string;
  path: string; // 자료실 상대경로: 등급/강좌/과목/…/파일.md
}

export interface BatchParams {
  exam_level: string;
  domain: string;
  difficulty_mix: DifficultyMix;
  avoid_list: string;
  curriculum_id: string;
  course_name: string;
  source_files: SourceFileRef[];
  fewshot_enabled: boolean;
  curriculum_material: string;
}

export interface BatchPreview {
  gen_config: string;
  static_prefix: string;
  param_part: string;
  resolved_prompt: string;
}

// ---- 배치 결과(파싱된 LLM 출력) ----
// 난이도 v4 세 레버
export interface BatchLevers {
  cognitive?: string; // 기억이해 | 적용분석 | 평가
  attractiveDistractors?: number; // 0~3
  conceptCount?: number; // 1~2
}

export interface BatchAssignment {
  itemId: string;
  topicId?: string;
  difficulty?: string;
  levers?: BatchLevers;
  stage?: string;
}

export interface SurplusInfo {
  info?: string;
  pairedChoice?: number;
}

export interface BatchPointPool {
  topicId?: string;
  point?: string;
  gradeFit?: string;
}

export interface BatchItem {
  itemId: string;
  status?: string; // ok | failed
  failReason?: string | null;
  design?: {
    source?: {
      curriculumId?: string;
      topicId?: string;
      quote?: string;
      location?: string;
      topicId2?: string;
      quote2?: string;
      location2?: string;
    };
    evidenceClaim?: string;
    boundaryPlan?: {
      difficulty?: string;
      levers?: BatchLevers;
      targetPValue?: string;
      deltaNote?: string;
      surplusInfoMap?: SurplusInfo[];
      decisionCriterion?: string;
      deviationNote?: string;
    };
  };
  item?: {
    scenario?: string;
    question?: string;
    choices?: string[];
    answerIndex?: number;
    choicesOrdered?: boolean;
  };
  distractorMap?: {
    choiceIndex: number;
    type?: string; // ⓐ단계누락 | ⓑ원칙오적용 | ⓒ흔한오해 | 채움
    derivation?: string;
    attractRationale?: string | null;
  }[];
  explanation?: {
    answerExplanation?: string;
    wrongExplanations?: { choiceIndex: number; text: string }[];
  };
  selfCheck?: {
    leversRealized?: BatchLevers;
    leversMatchAssignment?: boolean;
    simulatedSolve?: string;
    answerNotLongest?: boolean;
    noCueWords?: boolean;
    keyVocabSpread?: boolean;
    bestnessDefensible?: string;
    difficultyShift?: string;
  };
  meta?: Record<string, string>;
}

export interface BatchResult {
  batchPlan?: {
    pointPool?: BatchPointPool[];
    assignment?: BatchAssignment[];
    gradeFitNote?: string | null;
    shortfallNote?: string | null;
  };
  items?: BatchItem[];
  batchCheck?: {
    topicDiversity?: boolean;
    noCrossItemLeakage?: boolean;
    noMisconceptionReuse?: boolean;
    answerPositionSpread?: string;
    notes?: string | null;
  };
}

export interface BatchRun {
  id: string;
  params: BatchParams;
  exam_level: string | null;
  domain: string | null;
  num_requested: number;
  model: string;
  temperature: number;
  max_tokens: number | null;
  gen_config: string;
  resolved_prompt: string;
  raw_response: unknown;
  result: BatchResult | null;
  shuffle_maps: (number[] | null)[] | null;
  status: string; // ok | failed | error
  fail_reason: string | null;
  token_count: number | null;
  item_count: number;
  ok_count: number;
  created_at: string;
}

export interface BatchRunListItem {
  id: string;
  gen_config: string;
  exam_level: string | null;
  domain: string | null;
  num_requested: number;
  item_count: number;
  ok_count: number;
  model: string;
  status: string;
  token_count: number | null;
  curriculum_id: string | null;
  course_name: string | null;
  source_files: SourceFileRef[];
  created_at: string;
}
