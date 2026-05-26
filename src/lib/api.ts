import type { PromptLabFormState, QualityStatus, QuestionType } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
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
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function fetchDefaultSystemPrompt(
  questionType: QuestionType = "subjective",
): Promise<string> {
  const data = await apiFetch<{ system_prompt: string }>(
    `/api/v1/prompt-lab/system-prompt?question_type=${questionType}`,
  );
  return data.system_prompt;
}

export interface ApiSubjectiveRow {
  id: string;
  prompt_id: string;
  model: string;
  files?: unknown;
  created_at: string;
  status: string;
  quality_status: string;
  title: string | null;
  question: string;
  best_practice: string;
  curriculum_reference: string | null;
  scoring_criteria: string | Record<string, unknown> | unknown[] | null;
  distractor_analysis: string | null;
  difficulty: string | null;
  metadata?: Record<string, unknown> | null;
  prompt_text?: string | null;
  comment?: string | null;
  originalData?: Record<string, unknown> | null;
  original_data?: Record<string, unknown> | null;
}

export interface ApiMultipleRow {
  id: string;
  prompt_id: string;
  model: string;
  files?: unknown;
  created_at: string;
  status: string;
  quality_status: string;
  title: string | null;
  question: string;
  category: string;
  choice01: string;
  choice02: string;
  choice03: string;
  choice04: string;
  choice05: string;
  correct_choice_no: number;
  curriculum_reference: string | null;
  distractor_analysis: string | null;
  difficulty: string | null;
  metadata?: Record<string, unknown> | null;
  prompt_text?: string | null;
  comment?: string | null;
  originalData?: Record<string, unknown> | null;
  original_data?: Record<string, unknown> | null;
}

export interface ApiGenerateResponse {
  prompt_id: string;
  question_type: QuestionType;
  subjective: ApiSubjectiveRow | null;
  multiple: ApiMultipleRow | null;
}

export async function generateQuestionApi(
  form: PromptLabFormState,
): Promise<ApiGenerateResponse> {
  const formData = new FormData();
  formData.append("system_prompt", form.systemPrompt);
  formData.append("question_type", form.questionType);
  for (const item of form.referenceFiles) {
    formData.append("reference_files", item.file, item.name);
  }

  const res = await fetch(`${API_BASE}/api/v1/prompt-lab/generate`, {
    method: "POST",
    body: formData,
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

  return res.json() as Promise<ApiGenerateResponse>;
}

export async function updateSubjectiveQualityApi(
  questionId: string,
  qualityStatus: QualityStatus,
): Promise<{ id: string; quality_status: string }> {
  return apiFetch(`/api/v1/question-bank/subjective/${questionId}/quality`, {
    method: "PATCH",
    body: JSON.stringify({ quality_status: qualityStatus }),
  });
}

export async function updateSubjectiveCommentApi(
  questionId: string,
  comment: string,
): Promise<{ id: string; comment: string | null }> {
  return apiFetch(`/api/v1/question-bank/subjective/${questionId}/comment`, {
    method: "PATCH",
    body: JSON.stringify({ comment: comment || null }),
  });
}

export async function updateMultipleQualityApi(
  questionId: string,
  qualityStatus: QualityStatus,
): Promise<{ id: string; quality_status: string }> {
  return apiFetch(`/api/v1/question-bank/multiple/${questionId}/quality`, {
    method: "PATCH",
    body: JSON.stringify({ quality_status: qualityStatus }),
  });
}

export async function updateMultipleCommentApi(
  questionId: string,
  comment: string,
): Promise<{ id: string; comment: string | null }> {
  return apiFetch(`/api/v1/question-bank/multiple/${questionId}/comment`, {
    method: "PATCH",
    body: JSON.stringify({ comment: comment || null }),
  });
}

export async function deleteSubjectiveQuestionApi(questionId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/question-bank/subjective/${questionId}`, {
    method: "DELETE",
  });
}

export async function deleteMultipleQuestionApi(questionId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/question-bank/multiple/${questionId}`, {
    method: "DELETE",
  });
}

export function subjectiveReferenceFileUrl(questionId: string, fileIndex: number): string {
  return `${API_BASE}/api/v1/question-bank/subjective/${questionId}/references/${fileIndex}`;
}

export function multipleReferenceFileUrl(questionId: string, fileIndex: number): string {
  return `${API_BASE}/api/v1/question-bank/multiple/${questionId}/references/${fileIndex}`;
}

export async function listSubjectiveQuestionsApi(params?: {
  q?: string;
  limit?: number;
}): Promise<{ items: ApiSubjectiveRow[]; total: number }> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch(`/api/v1/question-bank/subjective${qs ? `?${qs}` : ""}`);
}

export async function listMultipleQuestionsApi(params?: {
  q?: string;
  limit?: number;
}): Promise<{ items: ApiMultipleRow[]; total: number }> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch(`/api/v1/question-bank/multiple${qs ? `?${qs}` : ""}`);
}
