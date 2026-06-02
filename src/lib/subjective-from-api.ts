import type { Difficulty, GeneratedAssessmentPreview, QualityStatus, SQuestion } from "./types";
import type { ApiMultipleRow, ApiSubjectiveRow } from "./api";
import { getDisplayQuestion } from "./format-question-body";

const SCENARIO_KEY = "scenarioEvidence(문제 상황)";
const QUESTION_KEY = "question(평가 문항)";
const CHOICES_KEY = "choices(선택지)";
const CORRECT_KEY = "correctChoiceNo(정답 번호)";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function normalizeQuality(value: string): QualityStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function normalizeDifficulty(value: string | null): Difficulty | null {
  return value === "상" || value === "중" || value === "하" ? value : null;
}

function originalDataFromRow(row: ApiSubjectiveRow): Record<string, unknown> | null {
  return row.originalData ?? row.original_data ?? null;
}

function multipleOriginalDataFromRow(row: ApiMultipleRow): Record<string, unknown> | null {
  return row.originalData ?? row.original_data ?? null;
}

function itemMetadataFromOriginal(
  originalData: Record<string, unknown> | null | undefined,
): GeneratedAssessmentPreview["itemMetadata"] {
  const ai = asRecord(originalData?.aiResponse);
  const meta = asRecord(ai?.itemMetadata) ?? {};
  return {
    referenceSource: asString(meta.referenceSource),
    glatCompetency: asString(meta.glatCompetency),
    targetAudience: asString(meta.targetAudience),
    category: meta.category != null ? String(meta.category) : undefined,
    difficulty: normalizeDifficulty(meta.difficulty != null ? String(meta.difficulty) : null) ?? undefined,
  };
}

export function subjectiveToPreviewShape(row: ApiSubjectiveRow): GeneratedAssessmentPreview {
  const originalData = originalDataFromRow(row);
  const ai = asRecord(originalData?.aiResponse);
  const questionPart = asRecord(ai?.questionPart);
  const meta =
    itemMetadataFromOriginal(originalData) ??
    (asRecord(row.metadata) as GeneratedAssessmentPreview["itemMetadata"] | null);
  const scoring = row.scoring_criteria;
  return {
    title: (row.title ?? asString(ai?.title)) || "제목 없음",
    itemMetadata: meta,
    scenarioEvidence: asString(questionPart?.[SCENARIO_KEY]),
    question: asString(questionPart?.[QUESTION_KEY]) || row.question,
    bestPractice: row.best_practice,
    curriculumReference: row.curriculum_reference ?? "",
    scoringCriteria:
      typeof scoring === "string" ? scoring : scoring != null ? JSON.stringify(scoring, null, 2) : "",
    distractorAnalysis: row.distractor_analysis ?? "",
  };
}

export function multipleToPreviewShape(row: ApiMultipleRow): GeneratedAssessmentPreview {
  const originalData = multipleOriginalDataFromRow(row);
  const ai = asRecord(originalData?.aiResponse);
  const questionPart = asRecord(ai?.questionPart);
  const choices = asRecord(questionPart?.[CHOICES_KEY]);
  const meta = itemMetadataFromOriginal(originalData);
  const correctFromOriginal = Number(questionPart?.[CORRECT_KEY]);
  return {
    title: (row.title ?? asString(ai?.title)) || "제목 없음",
    itemMetadata: meta,
    scenarioEvidence: asString(questionPart?.[SCENARIO_KEY]),
    question: asString(questionPart?.[QUESTION_KEY]) || row.question,
    choices: [
      asString(choices?.choice01) || row.choice01,
      asString(choices?.choice02) || row.choice02,
      asString(choices?.choice03) || row.choice03,
      asString(choices?.choice04) || row.choice04,
      asString(choices?.choice05) || row.choice05,
    ],
    correctChoiceNo:
      correctFromOriginal >= 1 && correctFromOriginal <= 5
        ? correctFromOriginal
        : row.correct_choice_no,
    curriculumReference: row.curriculum_reference ?? "",
    distractorAnalysis: row.distractor_analysis ?? "",
  };
}

function filesFromApi(value: unknown): SQuestion["files"] {
  const files = Array.isArray(value)
    ? value
    : Array.isArray(asRecord(value)?.files)
      ? (asRecord(value)?.files as unknown[])
      : null;

  if (!files) return null;
  return files.map((item) => {
    const row = asRecord(item) ?? {};
    return {
      name: asString(row.name ?? row.filename),
      type: asString(row.type ?? row.content_type),
      sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : undefined,
      s3Url: asString(row.s3_url) || undefined,
      s3Key: asString(row.s3_key) || undefined,
    };
  });
}

export function subjectiveToQuestion(row: ApiSubjectiveRow): SQuestion {
  const originalData = originalDataFromRow(row);
  const preview = subjectiveToPreviewShape(row);
  const files = filesFromApi(row.files);
  return {
    id: row.id,
    backendId: row.id,
    questionType: "subjective",
    promptId: row.prompt_id,
    promptText: row.prompt_text ?? null,
    model: row.model,
    files,
    createdAt: row.created_at,
    status: row.status === "review" || row.status === "published" || row.status === "archived" ? row.status : "draft",
    qualityStatus: normalizeQuality(row.quality_status),
    title: preview.title,
    question: getDisplayQuestion(row.question, preview.scenarioEvidence),
    bestPractice: row.best_practice,
    curriculumReference: row.curriculum_reference,
    scoringCriteria: preview.scoringCriteria ?? null,
    distractorAnalysis: row.distractor_analysis,
    difficulty: normalizeDifficulty(row.difficulty),
    tokenCount: typeof row.token_count === "number" ? row.token_count : null,
    metadata: preview,
    category: preview.itemMetadata.category ?? "",
    targetAudience: preview.itemMetadata.targetAudience,
    competency: preview.itemMetadata.glatCompetency,
    comment: row.comment ?? "",
    originalData,
  };
}

export function multipleToQuestion(row: ApiMultipleRow): SQuestion {
  const originalData = multipleOriginalDataFromRow(row);
  const preview = multipleToPreviewShape(row);
  const files = filesFromApi(row.files);
  return {
    id: row.id,
    backendId: row.id,
    questionType: "multiple",
    promptId: row.prompt_id,
    promptText: row.prompt_text ?? null,
    model: row.model,
    files,
    createdAt: row.created_at,
    status: row.status === "review" || row.status === "published" || row.status === "archived" ? row.status : "draft",
    qualityStatus: normalizeQuality(row.quality_status),
    title: preview.title,
    question: getDisplayQuestion(row.question, preview.scenarioEvidence),
    bestPractice: "",
    curriculumReference: row.curriculum_reference,
    scoringCriteria: null,
    distractorAnalysis: row.distractor_analysis,
    difficulty: normalizeDifficulty(row.difficulty),
    tokenCount: typeof row.token_count === "number" ? row.token_count : null,
    metadata: preview,
    category: row.category || preview.itemMetadata.category || "",
    targetAudience: preview.itemMetadata.targetAudience,
    competency: preview.itemMetadata.glatCompetency,
    comment: row.comment ?? "",
    originalData,
  };
}
