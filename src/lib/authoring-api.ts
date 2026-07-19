import type {
  AssemblyConfig,
  Block,
  BlockVersion,
  GenParams,
  GenerationRun,
  PreviewResult,
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
export const listBlocks = () => jfetch<Block[]>("/blocks");

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
export const listConfigs = () => jfetch<AssemblyConfig[]>("/configs");

export const createConfig = (body: { name: string; mapping: Record<string, string> }) =>
  jfetch<AssemblyConfig>("/configs", { method: "POST", body: JSON.stringify(body) });

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
  gen_config?: string;
  exam_level?: string;
  domain?: string;
  target_boundary?: string;
  topic_id?: string;
  status?: string;
  review_status?: string;
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

export type { AssemblyConfig, Block, BlockVersion, GenerationRun, RunListItem };
