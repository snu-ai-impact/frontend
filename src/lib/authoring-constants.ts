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

// 블록 조립 순서 (표시용)
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
