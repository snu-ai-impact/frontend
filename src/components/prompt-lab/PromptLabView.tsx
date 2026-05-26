"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge, ModelBadge, QualityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Textarea } from "@/components/ui/Card";
import {
  fetchDefaultSystemPrompt,
  generateQuestionApi,
  updateMultipleCommentApi,
  updateMultipleQualityApi,
  updateSubjectiveCommentApi,
  updateSubjectiveQualityApi,
} from "@/lib/api";
import { multipleToQuestion, subjectiveToQuestion } from "@/lib/subjective-from-api";
import { ReferenceMaterialsInput } from "@/components/prompt-lab/ReferenceMaterialsInput";
import { QuestionDetailContent } from "@/components/question/QuestionDetailContent";
import { CommentEditor } from "@/components/question/QuestionExtras";
import { QualityStatusPicker } from "@/components/ui/QualityStatusPicker";
import type { QuestionOriginalData } from "@/lib/types";
import type {
  GeneratedAssessmentPreview,
  PromptLabFormState,
  Provider,
  QuestionType,
  QualityStatus,
  SQuestion,
} from "@/lib/types";

const GEMINI_MODEL = "gemini-3.5-flash";

const MODEL_OPTIONS: { key: Provider; label: string; sub: string }[] = [
  { key: "gemini", label: "Gemini 3.5 Flash", sub: "Google" },
];

const QUESTION_TYPE_OPTIONS: { key: QuestionType; label: string; sub: string }[] = [
  { key: "subjective", label: "주관식", sub: "모범답안과 채점 기준 생성" },
  { key: "multiple", label: "객관식", sub: "5지선다와 정답 번호 생성" },
];

const initialForm: Omit<PromptLabFormState, "systemPrompt"> = {
  provider: "gemini",
  questionType: "subjective",
  referenceFiles: [],
};

type Phase = "empty" | "loading" | "result" | "error";

function ModelToggle({ value, onChange }: { value: Provider; onChange: (v: Provider) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {MODEL_OPTIONS.map((m) => {
        const on = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            className={`relative rounded-xl p-3.5 text-left ring-1 transition ${
              on ? "bg-brand-50 shadow-card ring-brand-500/60" : "bg-white ring-surface-200 hover:ring-surface-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-ink-900">{m.label}</div>
                <div className="font-mono text-[11px] text-ink-500">{m.sub}</div>
              </div>
            </div>
            <span
              className={`absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full transition ${
                on ? "bg-brand-600 text-white" : "bg-white ring-1 ring-surface-300"
              }`}
            >
              {on && <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuestionTypeToggle({
  value,
  onChange,
}: {
  value: QuestionType;
  onChange: (v: QuestionType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {QUESTION_TYPE_OPTIONS.map((option) => {
        const on = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-xl p-3 text-left ring-1 transition ${
              on ? "bg-brand-50 shadow-card ring-brand-500/60" : "bg-white ring-surface-200 hover:ring-surface-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-ink-900">{option.label}</span>
              <span
                className={`grid h-4 w-4 place-items-center rounded-full transition ${
                  on ? "bg-brand-600 text-white" : "bg-white ring-1 ring-surface-300"
                }`}
              >
                {on && <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-ink-500">{option.sub}</p>
          </button>
        );
      })}
    </div>
  );
}

function ResultPreview({
  preview,
  questionType,
  questionId,
  files,
  qualityStatus,
  savedQuality,
  onQualityChange,
  onQualitySave,
  savingQuality,
  onRegenerate,
  originalData,
  comment,
  savedComment,
  onCommentChange,
  onCommentSave,
  savingComment,
}: {
  preview: GeneratedAssessmentPreview;
  questionType: QuestionType;
  questionId: string | null;
  files: SQuestion["files"];
  qualityStatus: QualityStatus;
  savedQuality: QualityStatus;
  onQualityChange: (v: QualityStatus) => void;
  onQualitySave: () => void;
  savingQuality: boolean;
  onRegenerate: () => void;
  originalData: QuestionOriginalData | null;
  comment: string;
  savedComment: string;
  onCommentChange: (v: string) => void;
  onCommentSave: () => void;
  savingComment: boolean;
}) {
  const qualityDirty = qualityStatus !== savedQuality;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-surface-200">
        <div className="border-b border-surface-200 px-6 pb-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" icon={<Icon name="sparkles" className="h-3 w-3" />}>
                  생성 완료
                </Badge>
                <ModelBadge model={GEMINI_MODEL} />
                <Badge tone="neutral">{questionType === "multiple" ? "객관식" : "주관식"}</Badge>
                <QualityBadge value={qualityStatus} />
              </div>
              <h3 className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-ink-900">
                {preview.title || `${preview.itemMetadata.category || "GLAT"} 평가 문항`}
              </h3>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Button variant="secondary" size="sm" icon={<Icon name="refresh" className="h-3.5 w-3.5" />} onClick={onRegenerate}>
                다시 생성
              </Button>
            </div>
          </div>
        </div>
      </div>

      <QuestionDetailContent
        preview={preview}
        originalData={originalData}
        files={files}
        questionId={questionId}
        questionType={questionType}
        variant="contained"
      />

      <Card title="품질 검토" subtitle="문항 검토 상태">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <QualityStatusPicker
            value={qualityStatus}
            onChange={onQualityChange}
            disabled={savingQuality}
          />
          <Button
            variant="brand"
            size="sm"
            icon={<Icon name="save" className="h-3.5 w-3.5" />}
            disabled={!qualityDirty || savingQuality}
            onClick={onQualitySave}
          >
            {savingQuality ? "저장 중…" : qualityDirty ? "품질 저장" : "저장됨"}
          </Button>
        </div>
      </Card>

      <CommentEditor
        value={comment}
        savedValue={savedComment}
        onChange={onCommentChange}
        onSave={onCommentSave}
        saving={savingComment}
      />
    </div>
  );
}

export function PromptLabView({
  initialSystemPrompt = "",
  initialPromptLoadError = null,
}: {
  initialSystemPrompt?: string;
  initialPromptLoadError?: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("empty");
  const [form, setForm] = useState<PromptLabFormState>({
    ...initialForm,
    systemPrompt: initialSystemPrompt,
  });
  const [preview, setPreview] = useState<GeneratedAssessmentPreview | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<SQuestion["files"]>(null);
  const [generatedQuestionType, setGeneratedQuestionType] = useState<QuestionType>("subjective");
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>("pending");
  const [savedQuality, setSavedQuality] = useState<QualityStatus>("pending");
  const [backendQuestionId, setBackendQuestionId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<QuestionOriginalData | null>(null);
  const [comment, setComment] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [error, setError] = useState<string | null>(initialPromptLoadError);
  const [savingQuality, setSavingQuality] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const canGenerate = form.referenceFiles.length > 0;

  const loadSystemPrompt = useCallback(async (questionType: QuestionType = form.questionType) => {
    try {
      const text = await fetchDefaultSystemPrompt(questionType);
      setForm((f) => ({ ...f, systemPrompt: text }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "시스템 프롬프트 로드 실패");
    }
  }, [form.questionType]);

  const handleQuestionTypeChange = useCallback(
    (questionType: QuestionType) => {
      setForm((f) => ({ ...f, questionType }));
      void loadSystemPrompt(questionType);
    },
    [loadSystemPrompt],
  );

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError("참고자료를 1개 이상 업로드한 뒤 문제를 생성할 수 있습니다.");
      return;
    }
    setPhase("loading");
    setError(null);
    setBackendQuestionId(null);
    setGeneratedFiles(null);
    setOriginalData(null);
    setComment("");
    setSavedComment("");
    try {
      const res = await generateQuestionApi(form);
      const generated =
        res.question_type === "multiple"
          ? res.multiple
            ? multipleToQuestion(res.multiple)
            : null
          : res.subjective
            ? subjectiveToQuestion(res.subjective)
            : null;
      if (!generated) {
        throw new Error("생성된 문항 응답이 비어 있습니다.");
      }
      setPreview(generated.metadata);
      setGeneratedQuestionType(res.question_type);
      setQualityStatus(generated.qualityStatus);
      setSavedQuality(generated.qualityStatus);
      setBackendQuestionId(generated.id);
      setGeneratedFiles(generated.files);
      setOriginalData(generated.originalData);
      const initialComment = generated.comment;
      setComment(initialComment);
      setSavedComment(initialComment);
      setPhase("result");
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "생성 실패");
      setPhase("error");
    }
  };

  const handleQualitySave = async () => {
    if (!backendQuestionId) return;
    setSavingQuality(true);
    setError(null);
    try {
      if (generatedQuestionType === "multiple") {
        await updateMultipleQualityApi(backendQuestionId, qualityStatus);
      } else {
        await updateSubjectiveQualityApi(backendQuestionId, qualityStatus);
      }
      setSavedQuality(qualityStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "품질 상태 저장 실패");
    } finally {
      setSavingQuality(false);
    }
  };

  const handleCommentSave = async () => {
    setSavingComment(true);
    setError(null);
    try {
      if (backendQuestionId) {
        if (generatedQuestionType === "multiple") {
          await updateMultipleCommentApi(backendQuestionId, comment);
        } else {
          await updateSubjectiveCommentApi(backendQuestionId, comment);
        }
      }
      setSavedComment(comment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "코멘트 저장 실패");
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-thin w-1/2 min-h-0 overflow-y-auto p-6 flex flex-col gap-4 xl:w-[42%]">
        <Card title="문항 유형">
          <QuestionTypeToggle
            value={form.questionType}
            onChange={handleQuestionTypeChange}
          />
        </Card>

        <Card title="AI 모델">
          <ModelToggle value={form.provider} onChange={(p) => setForm((f) => ({ ...f, provider: p }))} />
        </Card>

        <Card title="프롬프트" subtitle="Chief Assessment Architect · 수정 가능">
          <Textarea
            rows={8}
            value={form.systemPrompt}
            onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            className="font-mono text-xs"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => void loadSystemPrompt()}>
            기본값 복원
          </Button>
        </Card>

        <ReferenceMaterialsInput
          files={form.referenceFiles}
          onChange={(referenceFiles) => setForm((f) => ({ ...f, referenceFiles }))}
        />

        <div className="sticky bottom-0 z-10 w-full rounded-xl bg-ink-900 p-3.5 shadow-pop mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/70">
              {canGenerate
                ? "참고자료를 바탕으로 문항을 생성합니다."
                : "참고자료를 1개 이상 업로드해 주세요."}
            </span>
            <Button
              variant="brand"
              size="lg"
              disabled={phase === "loading" || !canGenerate}
              onClick={handleGenerate}
              icon={<Icon name="sparkles" className="h-4 w-4" />}
            >
              {phase === "loading" ? "생성 중…" : "AI로 문제 생성"}
            </Button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin w-1/2 min-h-0 overflow-y-auto p-6 flex flex-col gap-4 xl:w-[58%]">
        {phase === "empty" && (
          <div className="grid min-h-[560px] place-items-center rounded-2xl bg-white p-10 ring-1 ring-dashed ring-surface-300">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                <Icon name="sparkles" className="h-7 w-7 text-brand-600" />
              </div>
              <h3 className="text-[16px] font-semibold text-ink-900">AI가 만든 문항이 여기에 표시됩니다</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-500">
                참고자료를 1개 이상 업로드한 뒤 「AI로 문제 생성」을 눌러 주세요.
              </p>
            </div>
          </div>
        )}
        {phase === "loading" && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="spin h-10 w-10 rounded-full border-2 border-brand-100 border-t-brand-600" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-ink-900">
                  AI가 문항을 생성하는 중<span className="dot1">.</span>
                  <span className="dot2">.</span>
                  <span className="dot3">.</span>
                </div>
                <p className="mt-0.5 text-[12px] text-ink-500">참고자료 업로드 → JSON 파싱</p>
              </div>
            </div>
          </Card>
        )}
        {phase === "error" && error && (
          <Card className="ring-rose-200">
            <div className="flex gap-3">
              <Icon name="alert" className="h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <h4 className="font-semibold text-ink-900">생성 실패</h4>
                <p className="mt-1 text-[12.5px] text-ink-500">{error}</p>
                <Button variant="brand" size="sm" className="mt-3" onClick={handleGenerate}>
                  다시 시도
                </Button>
              </div>
            </div>
          </Card>
        )}
        {phase === "result" && error && (
          <Card className="mb-4 ring-rose-200">
            <p className="text-[12.5px] text-rose-700">{error}</p>
          </Card>
        )}
        {phase === "result" && preview && (
          <ResultPreview
            preview={preview}
            questionType={generatedQuestionType}
            questionId={backendQuestionId}
            files={generatedFiles}
            qualityStatus={qualityStatus}
            savedQuality={savedQuality}
            onQualityChange={setQualityStatus}
            onQualitySave={() => void handleQualitySave()}
            savingQuality={savingQuality}
            onRegenerate={handleGenerate}
            originalData={originalData}
            comment={comment}
            savedComment={savedComment}
            onCommentChange={setComment}
            onCommentSave={() => void handleCommentSave()}
            savingComment={savingComment}
          />
        )}
      </div>
    </div>
  );
}
