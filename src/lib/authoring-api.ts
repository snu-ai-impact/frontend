import type {
  AggregateResponse,
  AssemblyConfig,
  Block,
  BlockVersion,
  GenParams,
  GenerationRun,
  PreviewResult,
  QcConfig,
  ReviewRun,
  ReviewedQcConfig,
  RunListItem,
} from "./authoring-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ROOT = `${API_BASE}/api/v1/authoring`;

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = `API error: ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- 블록 / 버전 ----
export const listBlocks = (group?: string) =>
  jfetch<Block[]>(`/blocks${group ? `?group=${encodeURIComponent(group)}` : ""}`);

export const createBlockVersion = (
  blockKey: string,
  body: {
    version_label: string;
    content: string;
    band?: string | null;
    parent_version_id?: string | null;
    notes?: string | null;
  },
) =>
  jfetch<Block>(`/blocks/${blockKey}/versions`, {
    method: "POST",
    body: JSON.stringify(body),
  });

// ---- 조합 ----
export const listConfigs = (promptType?: string) =>
  jfetch<AssemblyConfig[]>(
    `/configs${promptType ? `?prompt_type=${encodeURIComponent(promptType)}` : ""}`,
  );

export const createConfig = (body: {
  name: string;
  mapping: Record<string, string>;
  prompt_type?: string;
}) => jfetch<AssemblyConfig>("/configs", { method: "POST", body: JSON.stringify(body) });

export const updateConfig = (
  id: string,
  body: { name?: string; mapping?: Record<string, string> },
) => jfetch<AssemblyConfig>(`/configs/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const duplicateConfig = (id: string) =>
  jfetch<AssemblyConfig>(`/configs/${id}/duplicate`, { method: "POST" });

// ---- 미리보기 / 실행 ----
export const previewAssembly = (config_id: string, params: GenParams) =>
  jfetch<PreviewResult>("/preview", {
    method: "POST",
    body: JSON.stringify({ config_id, params }),
  });

export const createRun = (body: {
  config_id: string;
  params: GenParams;
  model: string;
  temperature: number;
  max_tokens: number | null;
}) => jfetch<GenerationRun>("/runs", { method: "POST", body: JSON.stringify(body) });

export const retryRun = (runId: string) =>
  jfetch<GenerationRun>(`/runs/${runId}/retry`, { method: "POST" });

export const getRun = (runId: string) => jfetch<GenerationRun>(`/runs/${runId}`);

export const updateReview = (
  runId: string,
  body: { review_status: string; review_note: string | null },
) => jfetch<GenerationRun>(`/runs/${runId}/review`, { method: "PATCH", body: JSON.stringify(body) });

export interface RunFilters {
  prompt_type?: string;
  gen_config?: string;
  exam_level?: string;
  domain?: string;
  target_boundary?: string;
  topic_id?: string;
  status?: string;
  review_status?: string;
  final_verdict?: string;
  gate_all_pass?: boolean;
  blind_mismatch?: boolean;
  limit?: number;
}

export const listRuns = (filters: RunFilters = {}) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return jfetch<{ items: RunListItem[]; total: number }>(`/runs${s ? `?${s}` : ""}`);
};

// ---- LLM 검수 (QC1v2) ----
export const listQcConfigs = () => jfetch<QcConfig[]>("/qc-configs");

export const runReview = (runId: string, qcConfigId?: string) =>
  jfetch<ReviewRun>(`/runs/${runId}/review`, {
    method: "POST",
    body: JSON.stringify(qcConfigId ? { qc_config_id: qcConfigId } : {}),
  });

export const listReviews = (runId: string) =>
  jfetch<ReviewRun[]>(`/runs/${runId}/reviews`);

export const getReview = (reviewId: string) => jfetch<ReviewRun>(`/reviews/${reviewId}`);

// ---- 조합 집계 ----
export const listReviewedQcConfigs = () =>
  jfetch<ReviewedQcConfig[]>("/reviews/qc-configs");

export const aggregateReviews = (qcConfig: string) =>
  jfetch<AggregateResponse>(`/reviews/aggregate?qc_config=${encodeURIComponent(qcConfig)}`);

export type {
  AggregateResponse,
  AssemblyConfig,
  Block,
  BlockVersion,
  GenerationRun,
  QcConfig,
  ReviewRun,
  RunListItem,
};
