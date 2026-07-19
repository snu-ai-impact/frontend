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

export interface Block {
  id: string;
  block_key: string;
  display_name: string;
  block_type: string;
  position: number;
  versions: BlockVersion[];
}

export interface AssemblyConfig {
  id: string;
  name: string;
  mapping: Record<string, string>;
  gen_config: string;
  created_at: string;
}

export interface GenParams {
  exam_level: string;
  target_boundary: string;
  cognitive_demand: string;
  domain: string;
  target_p: number;
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

export interface GenerationRun {
  id: string;
  assembly_config_id: string;
  gen_config: string;
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
  result: GenItemResult | null;
  shuffle_map: number[] | null;
  status: string;
  fail_reason: string | null;
  token_count: number | null;
  review_status: string;
  review_note: string | null;
  created_at: string;
}

export interface RunListItem {
  id: string;
  gen_config: string;
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
