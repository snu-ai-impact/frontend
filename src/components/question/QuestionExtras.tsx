"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Card, Textarea } from "@/components/ui/Card";
import { QualityStatusPicker } from "@/components/ui/QualityStatusPicker";
import { formatOriginalData } from "@/lib/original-data";
import type { GeneratedAssessmentPreview, QualityStatus, QuestionOriginalData } from "@/lib/types";

function RubricSection({
  icon,
  title,
  children,
  boxed = false,
}: {
  icon: ComponentProps<typeof Icon>["name"];
  title: string;
  children: ReactNode;
  boxed?: boolean;
}) {
  return (
    <section className={boxed ? "rounded-xl bg-white p-5 shadow-card ring-1 ring-surface-200" : ""}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-50 text-brand-700">
          <Icon name={icon} className="h-3 w-3" />
        </span>
        <h4 className="text-[12.5px] font-semibold uppercase tracking-tight text-ink-900">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function RubricBody({ text }: { text: string | null | undefined, className?: string }) {
  if (!text?.trim()) {
    return <p className="text-[12px] text-ink-500">—</p>;
  }
  return (
    <pre className="whitespace-pre-wrap rounded-lg bg-surface-50 p-3 font-sans text-[12.5px] leading-6 text-ink-800 ring-1 ring-surface-200">
      {text}
    </pre>
  );
}

function ChoiceList({
  choices,
  correctChoiceNo,
}: {
  choices: string[];
  correctChoiceNo?: number;
}) {
  return (
    <ol className="space-y-2">
      {choices.map((choice, index) => {
        const no = index + 1;
        const correct = correctChoiceNo === no;
        return (
          <li
            key={`${no}-${choice}`}
            className={`flex gap-3 rounded-lg p-3 text-[12.5px] leading-5 ring-1 ${
              correct
                ? "bg-brand-50 text-brand-900 ring-brand-200"
                : "bg-surface-50 text-ink-800 ring-surface-200"
            }`}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                correct ? "bg-brand-600 text-white" : "bg-white text-ink-600 ring-1 ring-surface-300"
              }`}
            >
              {no}
            </span>
            <span className="min-w-0 flex-1">{choice}</span>
            {correct && <span className="shrink-0 text-[11px] font-semibold">정답</span>}
          </li>
        );
      })}
    </ol>
  );
}

function PromptBody({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) {
    return <p className="text-[12px] text-ink-500">저장된 프롬프트가 없습니다.</p>;
  }
  return (
    <pre className="scrollbar-thin max-h-[min(60vh,520px)] overflow-auto whitespace-pre-wrap rounded-lg bg-surface-50 p-3 font-sans text-[12.5px] leading-6 text-ink-800 ring-1 ring-surface-200">
      {text}
    </pre>
  );
}

/** 문제은행 상세 — 생성에 사용된 시스템 프롬프트 전문 */
export function UsedPromptSection({
  promptText,
  promptId,
}: {
  promptText: string | null;
  promptId?: string;
}) {
  return (
    <section className="rounded-xl bg-white shadow-card ring-1 ring-surface-200">
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-50 text-brand-700">
            <Icon name="sparkles" className="h-3 w-3" />
          </span>
          <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">사용된 시스템 프롬프트</h3>
        </div>
        {promptId && (
          <p className="mb-2 font-sans text-[11px] text-ink-500">prompt_id: {promptId}</p>
        )}
        <PromptBody text={promptText} />
      </div>
    </section>
  );
}

/** Best Practice ~ Distractor Analysis — 항목별 독립 섹션 */
export function RubricDetailSections({
  itemMetadata,
  questionBody,
  choices,
  correctChoiceNo,
  bestPractice,
  curriculumReference,
  scoringCriteria,
  distractorAnalysis,
  boxed = false,
}: {
  itemMetadata?: GeneratedAssessmentPreview["itemMetadata"];
  questionBody?: string;
  choices?: string[];
  correctChoiceNo?: number;
  bestPractice?: string | null;
  curriculumReference: string | null;
  scoringCriteria?: string | null;
  distractorAnalysis: string | null;
  boxed?: boolean;
}) {
  return (
    <>
      {itemMetadata && (
        <RubricSection icon="info" title="Item Metadata" boxed={boxed}>
          <RubricBody
            text={`Reference: ${itemMetadata.referenceSource}\nCompetency: ${itemMetadata.glatCompetency}\nTarget: ${itemMetadata.targetAudience}`}
          />
        </RubricSection>
      )}
      {questionBody && (
        <RubricSection icon="book" title="문항 본문" boxed={boxed}>
          <RubricBody text={questionBody} />
        </RubricSection>
      )}
      {choices && choices.length > 0 && (
        <RubricSection icon="clipboard" title="선택지" boxed={boxed}>
          <ChoiceList choices={choices} correctChoiceNo={correctChoiceNo} />
        </RubricSection>
      )}
      {bestPractice !== undefined && bestPractice !== null && (
        <RubricSection icon="bookmark" title="Best Practice" boxed={boxed}>
          <RubricBody text={bestPractice}/>
        </RubricSection>
      )}
      <RubricSection icon="book" title="Curriculum Reference" boxed={boxed}>
        <RubricBody text={curriculumReference} />
      </RubricSection>
      {scoringCriteria !== undefined && scoringCriteria !== null && (
        <RubricSection icon="target" title="Scoring Criteria" boxed={boxed}>
          <RubricBody text={scoringCriteria} />
        </RubricSection>
      )}
      <RubricSection icon="alert" title="Distractor Analysis" boxed={boxed}>
        <RubricBody text={distractorAnalysis} />
      </RubricSection>
    </>
  );
}

export function OriginalDataPanel({
  originalData,
  defaultOpen = false,
}: {
  originalData: QuestionOriginalData | null | undefined;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl bg-white shadow-card ring-1 ring-surface-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface-50/80"
      >
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">Original Data</h3>
          <p className="mt-0.5 text-[12px] text-ink-500">생성 시점의 원본 데이터 전체</p>
        </div>
        <Icon
          name="chevron"
          className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-surface-200 p-5 pt-4">
          <pre className="scrollbar-thin max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-surface-50 p-4 font-mono text-[11px] leading-5 text-ink-800 ring-1 ring-surface-200">
            {formatOriginalData(originalData)}
          </pre>
        </div>
      )}
    </section>
  );
}

export function CommentEditor({
  value,
  savedValue,
  onChange,
  onSave,
  saving,
  qualityStatus,
  onQualityChange,
}: {
  value: string;
  savedValue: string;
  onChange: (v: string) => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
  qualityStatus?: QualityStatus;
  onQualityChange?: (v: QualityStatus) => void;
}) {
  const dirty = value !== savedValue;
  const showQuality = qualityStatus !== undefined && onQualityChange !== undefined;

  return (
    <Card title="코멘트" subtitle="검토 메모 · 수정 후 저장">
      {showQuality && (
        <div className="mb-4">
          <p className="mb-2 text-[12px] font-medium text-ink-700">품질 검토</p>
          <QualityStatusPicker value={qualityStatus} onChange={onQualityChange} />
        </div>
      )}
      <Textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="품질 검토 의견, 수정 요청 사항 등을 기록하세요."
        disabled={saving}
      />
      <div className="mt-3 flex justify-end">
        <Button
          variant="brand"
          size="sm"
          icon={<Icon name="save" className="h-3.5 w-3.5" />}
          disabled={!dirty || saving}
          onClick={() => void onSave()}
        >
          {saving ? "저장 중…" : dirty ? "코멘트 저장" : "저장됨"}
        </Button>
      </div>
    </Card>
  );
}

/** 문제은행 상세 패널용 — 저장된 코멘트와 동기화 */
export function CommentEditorControlled({
  comment,
  onSave,
}: {
  comment: string;
  onSave: (comment: string) => Promise<void>;
}) {
  return <CommentEditorDraft key={comment} comment={comment} onSave={onSave} />;
}

function CommentEditorDraft({
  comment,
  onSave,
}: {
  comment: string;
  onSave: (comment: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(comment);
  const [saving, setSaving] = useState(false);

  return (
    <CommentEditor
      value={draft}
      savedValue={comment}
      onChange={setDraft}
      saving={saving}
      onSave={async () => {
        setSaving(true);
        try {
          await onSave(draft);
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
