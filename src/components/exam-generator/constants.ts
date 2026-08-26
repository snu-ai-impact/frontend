// 시험 문항 생성(배치) UI 상수

export const EXAM_LEVELS = ["초급", "중급", "고급"] as const;
export const DOMAINS = ["P", "E", "D", "W"] as const;
export const DOMAIN_LABELS: Record<string, string> = {
  P: "P · 프롬프트 리터러시",
  E: "E · 윤리/보안",
  D: "D · 데이터 리터러시",
  W: "W · 워크플로우 설계",
};
export const GRADES = ["초급", "중급", "고급"] as const;
export const DIFFICULTIES = ["하", "중", "상"] as const;

// 모델 옵션 — 프롬프트랩(ParamForm)과 동일 목록. 접두사로 프로바이더 자동 판별(gemini/claude/gpt).
export const MODEL_OPTIONS = [
  { key: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { key: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { key: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
  { key: "claude-fable-5", label: "Claude Fable 5" },
  { key: "claude-opus-5", label: "Claude Opus 5" },
  { key: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { key: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
  { key: "gpt-5.6-terra", label: "GPT-5.6 Terra" },
];

export const DIFFICULTY_TONE: Record<string, "success" | "warning" | "danger"> = {
  하: "success",
  중: "warning",
  상: "danger",
};

export const RUN_STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  failed: "warning",
  error: "danger",
};

// 투입 자료 파일 목록 → 공통 폴더 경로 + 파일명들로 요약
export function describeSource(
  files: { name: string; path: string }[] | null | undefined,
): { folder: string; names: string[] } | null {
  if (!files || files.length === 0) return null;
  const names = files.map((f) => f.name || f.path.split("/").pop() || f.path);
  // 각 파일 경로에서 마지막 세그먼트(파일명)를 뗀 디렉터리들의 공통 접두 경로
  const dirs = files.map((f) => f.path.split("/").slice(0, -1));
  let common = dirs[0] ?? [];
  for (const d of dirs.slice(1)) {
    let i = 0;
    while (i < common.length && i < d.length && common[i] === d[i]) i++;
    common = common.slice(0, i);
  }
  return { folder: common.join("/"), names };
}
