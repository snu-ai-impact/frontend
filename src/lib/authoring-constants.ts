// 요청서 §4·상수 — UI 옵션·기본값

export type ExamLevel = "초급" | "중급" | "고급";
export type Domain = "P" | "E" | "D" | "W";
export type CognitiveDemand = "재인" | "식별" | "적용" | "진단";

export const EXAM_LEVELS: ExamLevel[] = ["초급", "중급", "고급"];
export const DOMAINS: Domain[] = ["P", "E", "D", "W"];
export const DOMAIN_LABELS: Record<Domain, string> = {
  P: "P · 프롬프트 리터러시",
  E: "E · 윤리/보안",
  D: "D · 데이터 리터러시",
  W: "W · 워크플로우 설계",
};
export const COGNITIVE_DEMANDS: CognitiveDemand[] = ["재인", "식별", "적용", "진단"];

// exam_level 별 target_boundary 옵션 (조립 순서 = 컷 40/55/70/85 순)
export const TARGET_BOUNDARIES: Record<ExamLevel, string[]> = {
  초급: ["NC/BL(40)", "BL/BM(55)", "BM/BH(70)", "BH/IL(85)"],
  중급: ["NC/BH(40)", "BH/IL(55)", "IL/IH(70)", "IH/AL(85)"],
  고급: ["NC/IL(40)", "IL/IH(55)", "IH/AL(70)", "AL/AH(85)"],
};

// 경계 index(0~3) → cognitive_demand 기본값 (§4)
export const COGNITIVE_BY_BOUNDARY_INDEX: CognitiveDemand[] = ["재인", "식별", "적용", "진단"];

// 컷 점수 → 목표 p 밴드 (툴팁)
export const TARGET_P_BAND: Record<string, string> = {
  "40": ".85+",
  "55": ".70~.85",
  "70": ".50~.70",
  "85": ".30~.55",
};

export const TWO_GROUP_SPEC = "상위군 ≥.75 / 하위군 ≤.40";

export function boundaryCut(boundary: string): string | null {
  const m = boundary.match(/\((\d+)\)/);
  return m ? m[1] : null;
}

export function boundaryTooltip(boundary: string): string {
  const cut = boundaryCut(boundary);
  const p = cut ? TARGET_P_BAND[cut] : null;
  return `2군 사양 ${TWO_GROUP_SPEC}${p ? ` · 목표 p ${p}` : ""}`;
}

// 경계별 기본 목표 정답률(%) — 목표 p 밴드 중앙값 (§4 목표 p 밴드)
export const DEFAULT_P_BY_CUT: Record<string, number> = {
  "40": 88,
  "55": 78,
  "70": 60,
  "85": 42,
};

export function defaultTargetP(boundary: string): number {
  const cut = boundaryCut(boundary);
  return (cut && DEFAULT_P_BY_CUT[cut]) || 60;
}

// 블록 조립 순서 (표시용) — 객관식
export const BLOCK_ORDER: string[] = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "B1",
  "F",
  "P1",
  "P3",
  "P4",
];

// 블록 조립 순서 — 주관식 (B1은 객관식과 공유)
export const SUBJECTIVE_BLOCK_ORDER: string[] = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "B1",
  "RF",
  "RP1",
  "RP3",
  "RP4",
];

export function blockOrderFor(promptType: string): string[] {
  return promptType === "subjective" ? SUBJECTIVE_BLOCK_ORDER : BLOCK_ORDER;
}

// 유형 전환 스위치
export const PROMPT_TYPES = [
  { key: "mcq", label: "객관식" },
  { key: "subjective", label: "주관식" },
] as const;

// 주관식 파라미터 옵션
export const TASK_TYPES = ["설계", "개선", "감사보완"] as const;
export const INDUSTRIES = ["은행", "증권", "보험", "운용"] as const;
export const DEFAULT_CRITERION_WEIGHTS = "맥락4·출력4·가드레일4·워크플로3";
export const DEFAULT_ITEM_POINTS = 15;

export const BLOCK_TYPE_LABEL: Record<string, string> = {
  static: "정적",
  band: "밴드",
  fewshot: "예시",
  param: "파라미터",
};

export const REVIEW_STATUSES = ["미검토", "승인", "수정필요", "폐기"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const RUN_STATUSES = ["ok", "failed", "error"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

// ---- LLM 검수(QC1v2) 표시 상수 ----
export const VERDICTS = ["pass", "revise", "reject"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "통과",
  revise: "수정 필요",
  reject: "반려",
};

export const VERDICT_TONE: Record<Verdict, "success" | "warning" | "danger"> = {
  pass: "success",
  revise: "warning",
  reject: "danger",
};

// 판정 분포 누적 막대 색 (§5.5)
export const VERDICT_BAR: Record<Verdict, string> = {
  pass: "bg-emerald-500",
  revise: "bg-amber-400",
  reject: "bg-rose-500",
};

// 3축 라벨 (§0 · scores 키 순서)
export const AXIS_META: { key: string; label: string; hint: string }[] = [
  { key: "instructionCompliance", label: "지시 이행", hint: "요청한 대로 만들었는가" },
  { key: "intentAchievement", label: "의도 도달", hint: "재려던 것을 재는가" },
  { key: "examineeQuality", label: "응시자 완성도", hint: "푸는 사람에게 좋은 문항인가" },
];

// 게이트 5종 라벨
export const GATE_META: { key: string; label: string }[] = [
  { key: "answerReproduced", label: "정답 재현" },
  { key: "quoteVerified", label: "인용 실재" },
  { key: "contentCeiling", label: "콘텐츠 상한" },
  { key: "singleBestAnswer", label: "단일 정답" },
  { key: "schemaSemantics", label: "스키마 의미" },
];
