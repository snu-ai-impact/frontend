// authoring API 응답 타입 (백엔드 snake_case 그대로)

export interface BlockVersion {
  id: string;
  block_id: string;
  version_label: string;
  content: string;
  band: string | null;
  parent_version_id: string | null;
  notes: string | null;
  created_at: string;
}

export type PromptType = "mcq" | "subjective";

export interface Block {
  id: string;
  block_key: string;
  display_name: string;
  block_type: string;
  position: number;
  block_group: string; // mcq | subjective | shared
  versions: BlockVersion[];
}

export interface AssemblyConfig {
  id: string;
  name: string;
  prompt_type: string; // mcq | subjective
  mapping: Record<string, string>;
  gen_config: string;
  created_at: string;
}

export interface GenParams {
  exam_level: string;
  // 객관식(mcq) 전용
  target_boundary: string;
  cognitive_demand: string;
  domain: string;
  target_p: number;
  // 주관식(subjective) 전용
  task_type: string;
  industry: string;
  item_points: number;
  criterion_weights: string;
  // 공용
  avoid_list: string;
  curriculum_id: string;
  topic_id: string;
  topic_name: string;
  curriculum_material: string;
}

export interface PreviewResult {
  gen_config: string;
  static_prefix: string;
  param_part: string;
  resolved_prompt: string;
}

// S6 스키마 파싱 결과 (result 필드)
export interface GenItemResult {
  status?: string;
  failReason?: string | null;
  design?: {
    source?: { curriculumId?: string; topicId?: string; quote?: string; location?: string };
    evidenceClaim?: string;
    boundaryPlan?: {
      targetBoundary?: string;
      levers?: { cognitive?: string; distractorDistance?: string; infoStructure?: string };
      twoGroupSpec?: string;
    };
  };
  item?: {
    scenario?: string;
    question?: string;
    choices?: string[];
    answerIndex?: number;
  };
  distractorMap?: { choiceIndex: number; misconception: string; attractsWho: string }[];
  explanation?: {
    answerExplanation?: string;
    wrongExplanations?: { choiceIndex: number; text: string }[];
  };
  selfCheck?: Record<string, boolean | string>;
  meta?: Record<string, string>;
}

// 주관식(R6 스키마) 파싱 결과
export interface SubjRubricCriterion {
  name?: string;
  weight?: number;
  levels?: { score?: number; descriptor?: string }[];
  gatingRules?: string[];
}
export interface GenSubjectiveResult {
  status?: string;
  failReason?: string | null;
  design?: {
    source?: { curriculumId?: string; topicId?: string; quote?: string; location?: string };
    evidenceClaim?: string;
    levelPlan?: {
      examLevel?: string;
      taskType?: string;
      complexityNote?: string;
      expectedScoreBands?: string;
    };
  };
  item?: { scenario?: string; materials?: string[]; task?: string; constraints?: string };
  rubric?: { totalPoints?: number; criteria?: SubjRubricCriterion[]; scoringProcedure?: string };
  modelAnswer?: { best?: string; selfScoredCheck?: string };
  anchors?: {
    gradeLevel?: string;
    answer?: string;
    expectedScores?: Record<string, number>;
    rationale?: string;
  }[];
  commonFlaws?: {
    pattern?: string;
    linkedCriterion?: string;
    deduction?: string;
    lowerGradeLink?: string;
  }[];
  explanation?: { forExaminee?: string };
  selfCheck?: Record<string, boolean | string>;
  meta?: Record<string, string>;
}

// 최신 LLM 검수(review_run) 요약 비정규화 캐시 — 히스토리/필터 공용
export interface ReviewSummary {
  latest_review_verdict: string | null;
  latest_gate_all_pass: boolean | null;
  latest_axis_sum: number | null;
  latest_blind_mismatch: boolean | null;
}

export interface GenerationRun extends ReviewSummary {
  id: string;
  assembly_config_id: string;
  gen_config: string;
  prompt_type: string;
  params: GenParams;
  exam_level: string | null;
  domain: string | null;
  target_boundary: string | null;
  cognitive_demand: string | null;
  industry: string | null;
  topic_id: string | null;
  model: string;
  temperature: number;
  max_tokens: number | null;
  resolved_prompt: string;
  raw_response: unknown;
  result: GenItemResult | GenSubjectiveResult | null;
  shuffle_map: number[] | null;
  status: string;
  fail_reason: string | null;
  token_count: number | null;
  review_status: string;
  review_note: string | null;
  created_at: string;
}

export interface RunListItem extends ReviewSummary {
  id: string;
  gen_config: string;
  prompt_type: string;
  exam_level: string | null;
  domain: string | null;
  target_boundary: string | null;
  topic_id: string | null;
  cognitive_demand: string | null;
  industry: string | null;
  status: string;
  review_status: string;
  token_count: number | null;
  created_at: string;
}

// ---- LLM 검수 (QC1v2) ----
export type Verdict = "pass" | "revise" | "reject";

export interface QcConfig {
  id: string;
  name: string;
  qc_config: string;
  qc_block_version_id: string;
  standard_versions: Record<string, string>;
  model: string;
  temperature: number;
  created_at: string;
}

export interface ReviewGate {
  pass: boolean;
  note: string;
}
export interface ReviewAxis {
  score: number;
  comment: string;
}
export interface ReviewDefect {
  ruleRef: string;
  location: string;
  severity: string; // major | minor
  issue: string;
  fix: string;
}
// QC1v2 파싱 결과 (review_run.result)
export interface ReviewResult {
  blindSolve?: { chosenIndex?: number; reasoning?: string };
  gates?: Record<string, ReviewGate>;
  defects?: ReviewDefect[];
  scores?: {
    instructionCompliance?: ReviewAxis;
    intentAchievement?: ReviewAxis;
    examineeQuality?: ReviewAxis;
  };
  verdict?: { recommendation?: Verdict; rationale?: string };
  meta?: { qcConfig?: string; reviewedGenConfig?: string };
}

export interface ReviewRun {
  id: string;
  generation_run_id: string;
  qc_config_id: string;
  qc_config: string;
  status: string; // ok | error
  fail_reason: string | null;
  gate_all_pass: boolean | null;
  axis_sum: number | null;
  final_verdict: Verdict | null;
  llm_recommendation: Verdict | null;
  mismatch: boolean;
  blind_chosen_index: number | null;
  answer_index: number | null;
  token_count: number | null;
  result: ReviewResult | null;
  resolved_prompt: string;
  created_at: string;
}

// ---- 조합 집계 (§5.4) ----
export interface ReviewedQcConfig {
  qc_config: string;
  review_count: number;
}
export interface AggregateDefect {
  rule_ref: string;
  count: number;
}
export interface AggregateRow {
  gen_config: string;
  total: number;
  pass_count: number;
  revise_count: number;
  reject_count: number;
  pass_rate: number;
  revise_rate: number;
  reject_rate: number;
  gate_pass_rate: number;
  blind_mismatch_count: number;
  axis_avg: Record<string, number | null>;
  axis_sum_avg: number | null;
  top_defects: AggregateDefect[];
}
export interface AggregateResponse {
  qc_config: string;
  rows: AggregateRow[];
}
