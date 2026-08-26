import type {
  BatchParams,
  BatchPreview,
  BatchRun,
  BatchRunListItem,
  GradeStandard,
} from "./exam-batch-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ROOT = `${API_BASE}/api/v1/exam-batch`;

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

// ---- 영역 등급 기준 (시트2) ----
export const listGradeStandards = (domain?: string) =>
  jfetch<GradeStandard[]>(
    `/grade-standards${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`,
  );

export const updateGradeStandard = (id: string, content: string) =>
  jfetch<GradeStandard>(`/grade-standards/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });

// ---- 배치 생성 ----
export interface BatchRunBody {
  params: BatchParams;
  model: string;
  temperature: number;
  max_tokens: number | null;
}

export const previewBatch = (body: BatchRunBody) =>
  jfetch<BatchPreview>("/preview", { method: "POST", body: JSON.stringify(body) });

export const createBatchRun = (body: BatchRunBody) =>
  jfetch<BatchRun>("/runs", { method: "POST", body: JSON.stringify(body) });

export const getBatchRun = (runId: string) => jfetch<BatchRun>(`/runs/${runId}`);

export interface BatchRunFilters {
  exam_level?: string;
  domain?: string;
  status?: string;
  limit?: number;
}

export const listBatchRuns = (filters: BatchRunFilters = {}) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return jfetch<{ items: BatchRunListItem[]; total: number }>(`/runs${s ? `?${s}` : ""}`);
};
