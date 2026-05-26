"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useQuestionData } from "@/components/providers/QuestionDataProvider";
import { Badge, ModelBadge, QualityBadge, StatCard } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Card";
import { filterQuestions, type QuestionFilters } from "@/lib/filter-questions";
import { QUALITY_MAP } from "@/lib/design-maps";
import { deleteMultipleQuestionApi, deleteSubjectiveQuestionApi } from "@/lib/api";
import { getDisplayQuestion, questionTitleFromBody } from "@/lib/format-question-body";
import { persistQuestionComment } from "@/lib/save-comment";
import { persistQuestionQuality } from "@/lib/save-quality";
import { QuestionDetailContent } from "@/components/question/QuestionDetailContent";
import { CommentEditorControlled } from "@/components/question/QuestionExtras";
import { QualityStatusPicker } from "@/components/ui/QualityStatusPicker";
import type { QualityStatus, SQuestion } from "@/lib/types";

const defaultFilters: QuestionFilters = {
  search: "",
  questionType: "",
  model: "",
  qualityStatus: "",
  dateFrom: "",
  dateTo: "",
};

function questionTitle(q: SQuestion) {
  if (q.title.trim()) return q.title;
  return questionTitleFromBody(getDisplayQuestion(q.question, q.metadata?.scenarioEvidence));
}

function QuestionTypeBadge({ type }: { type: SQuestion["questionType"] }) {
  return (
    <Badge tone={type === "multiple" ? "lightblue" : "brand"}>
      {type === "multiple" ? "객관식" : "주관식"}
    </Badge>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "all" && value !== "";
  const display =
    options.find((o) => o.value === value)?.label ||
    (value === "" ? "전체" : value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] ring-1 ring-inset transition ${
          active
            ? "bg-brand-50 text-brand-700 ring-brand-200"
            : "bg-white text-ink-800 ring-surface-300 hover:bg-surface-50"
        }`}
      >
        <span className="text-ink-500">{label}</span>
        <span className="font-semibold">{display}</span>
        <Icon name="chevron" className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute z-20 mt-1.5 min-w-[200px] rounded-lg bg-white py-1 shadow-pop ring-1 ring-surface-200">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] ${
                  o.value === value
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-800 hover:bg-surface-50"
                }`}
              >
                {o.value === value ? (
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="h-3.5 w-3.5" />
                )}
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailPanel({
  item,
  onClose,
  onCopy,
  onDelete,
  onAddToExam,
  onSaveQuality,
  onSaveComment,
}: {
  item: SQuestion;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAddToExam: () => void;
  onSaveQuality: (qualityStatus: QualityStatus) => Promise<void>;
  onSaveComment: (comment: string) => Promise<void>;
}) {
  const [qualityDraft, setQualityDraft] = useState<QualityStatus>(item.qualityStatus);
  const [savingQuality, setSavingQuality] = useState(false);
  const qualityDirty = qualityDraft !== item.qualityStatus;
  const created = new Date(item.createdAt).toLocaleString("ko-KR");

  return (
    <aside className="flex w-[460px] shrink-0 flex-col border-l border-surface-200 bg-white">
      <div className="flex h-14 items-center justify-between border-b border-surface-200 px-5">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[10.5px] text-ink-500">{item.id}</span>
        </div>
        <IconButton icon={<Icon name="x" className="h-4 w-4" />} label="닫기" onClick={onClose} />
      </div>

      <div className="border-b border-surface-200 px-5 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <ModelBadge model={item.model} />
          <QuestionTypeBadge type={item.questionType} />
          <QualityBadge value={qualityDraft} />
        </div>
        <h2
          className="mt-2.5 text-[17px] font-semibold leading-snug tracking-tight text-ink-900"
          style={{ textWrap: "balance" }}
        >
          {questionTitle(item)}
        </h2>
        <p className="mt-1 font-sans text-[12px] text-ink-500">
          {created}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <QualityStatusPicker value={qualityDraft} onChange={setQualityDraft} disabled={savingQuality} />
          <div className="flex items-center gap-2">
            <Button
              variant="brand"
              size="sm"
              icon={<Icon name="save" className="h-3.5 w-3.5" />}
              disabled={!qualityDirty || savingQuality}
              onClick={async () => {
                setSavingQuality(true);
                try {
                  await onSaveQuality(qualityDraft);
                } finally {
                  setSavingQuality(false);
                }
              }}
            >
              {savingQuality ? "저장 중…" : qualityDirty ? "품질 저장" : "저장됨"}
            </Button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-5">
        <QuestionDetailContent
          preview={item.metadata}
          originalData={item.originalData}
          files={item.files}
          questionId={item.backendId ?? item.id}
          questionType={item.questionType}
        />
        <CommentEditorControlled
          comment={item.comment}
          onSave={async (next) => {
            await onSaveComment(next);
          }}
        />
      </div>

      <div className="flex items-center justify-between border-t border-surface-200 bg-white p-3">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" icon={<Icon name="copy" className="h-3.5 w-3.5" />} onClick={onCopy}>
            복사
          </Button>
          <Button variant="danger" size="sm" icon={<Icon name="trash" className="h-3.5 w-3.5" />} onClick={onDelete}>
            삭제
          </Button>
        </div>
        <Button variant="brand" size="sm" icon={<Icon name="addList" className="h-3.5 w-3.5" />} onClick={onAddToExam}>
          시험에 추가
        </Button>
      </div>
    </aside>
  );
}

export function QuestionBankView() {
  const { questions, removeQuestion, updateQuestion } = useQuestionData();
  const [filters, setFilters] = useState(defaultFilters);
  const [typeFilter, setTypeFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const applied = useMemo((): QuestionFilters => {
    let dateFrom = "";
    const dateTo = "";
    const now = new Date();
    if (dateRange === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (dateRange === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      dateFrom = d.toISOString().slice(0, 10);
    }
    return {
      ...filters,
      questionType: typeFilter === "all" ? "" : typeFilter,
      model: modelFilter === "all" ? "" : modelFilter,
      qualityStatus: qualityFilter === "all" ? "" : qualityFilter,
      dateFrom,
      dateTo,
    };
  }, [filters, typeFilter, modelFilter, qualityFilter, dateRange]);

  const models = useMemo(
    () => [...new Set(questions.map((q) => q.model))].sort(),
    [questions],
  );

  const filtered = useMemo(
    () => filterQuestions(questions, applied),
    [questions, applied],
  );

  const selected = filtered.find((q) => q.id === selectedId) ?? null;
  const activeFilters =
    (typeFilter !== "all" ? 1 : 0) +
    (modelFilter !== "all" ? 1 : 0) +
    (qualityFilter !== "all" ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0);

  const pending = questions.filter((q) => q.qualityStatus === "pending").length;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        <div className="px-7 pb-3 pt-6">
          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="전체 문항" value={questions.length} delta="+12" tone="neutral" icon="bank" />
            <StatCard
              label="이번 주 생성"
              value={Math.min(questions.length, 34)}
              delta="+18%"
              tone="brand"
              icon="sparkles"
            />
            <StatCard label="검토 필요" value={pending} delta="-3" tone="warning" icon="alert" />
            <StatCard label="승인 완료" value={questions.filter((q) => q.qualityStatus === "approved").length} delta="+9" tone="success" icon="clipboard" />
          </div>

          <div className="rounded-xl bg-white p-3.5 shadow-card ring-1 ring-surface-200">
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <Input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="문제 본문, Item ID로 검색…"
                  icon={<Icon name="search" className="h-4 w-4" />}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <Icon name="filter" className="h-4 w-4 text-ink-500" />
                <span className="text-[12px] text-ink-500">필터</span>
                {activeFilters > 0 && <Badge tone="brand">{activeFilters}</Badge>}
              </div>
              <FilterDropdown
                label="유형:"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: "all", label: "전체" },
                  { value: "subjective", label: "주관식" },
                  { value: "multiple", label: "객관식" },
                ]}
              />
              <FilterDropdown
                label="모델:"
                value={modelFilter}
                onChange={setModelFilter}
                options={[
                  { value: "all", label: "전체" },
                  ...models.map((m) => ({ value: m, label: m.includes("gemini") ? "Gemini" : m })),
                ]}
              />
              <FilterDropdown
                label="품질:"
                value={qualityFilter}
                onChange={setQualityFilter}
                options={[
                  { value: "all", label: "전체" },
                  ...(Object.keys(QUALITY_MAP) as QualityStatus[]).map((k) => ({
                    value: k,
                    label: QUALITY_MAP[k].label,
                  })),
                ]}
              />
              <FilterDropdown
                label="기간:"
                value={dateRange}
                onChange={setDateRange}
                options={[
                  { value: "all", label: "전체" },
                  { value: "7d", label: "최근 7일" },
                  { value: "30d", label: "최근 30일" },
                ]}
              />
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setModelFilter("all");
                    setTypeFilter("all");
                    setQualityFilter("all");
                    setDateRange("all");
                  }}
                  className="inline-flex h-9 items-center gap-1 px-2 text-[12px] text-ink-500 hover:text-ink-900"
                >
                  <Icon name="x" className="h-3.5 w-3.5" /> 필터 초기화
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-7 mb-7 overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-surface-200">
          <div className="flex h-11 items-center justify-between border-b border-surface-200 bg-surface-50/60 px-4">
            <div className="text-[12px] text-ink-600">
              <span className="font-semibold text-ink-900">{filtered.length}</span>개 문항
              {activeFilters > 0 && <span className="text-ink-500"> · 필터 적용됨</span>}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="font-sans text-[10.5px] uppercase tracking-wider text-ink-500">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium">문제</th>
                <th className="w-24 py-2.5 pr-3 text-left font-medium">유형</th>
                <th className="w-24 py-2.5 pr-3 text-left font-medium">모델</th>
                <th className="w-28 py-2.5 pr-3 text-left font-medium">품질</th>
                <th className="w-45 py-2.5 pr-4 text-left font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-surface-100">
                      <Icon name="search" className="h-5 w-5 text-ink-500" />
                    </div>
                    <div className="text-[13px] font-medium text-ink-900">
                      조건에 맞는 문항이 없습니다
                    </div>
                    <div className="mt-1 text-[12px] text-ink-500">
                      검색어나 필터를 조정하거나{" "}
                      <Link href="/prompt-lab" className="text-brand-600 hover:underline">
                        프롬프트랩
                      </Link>
                      에서 새 문항을 생성해 보세요.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const active = q.id === selectedId;
                  const dt = new Date(q.createdAt);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedId(q.id)}
                      className={`cursor-pointer border-t border-surface-200 transition ${
                        active ? "bg-brand-50/40" : "hover:bg-surface-50"
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-start gap-2.5">
                          {active && (
                            <span className="-ml-2.5 h-9 w-0.5 shrink-0 rounded-full bg-brand-600" />
                          )}
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-900">
                              {questionTitle(q)}
                            </div>
                            <div className="mt-1 font-sans text-[11px] text-ink-500">{q.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <QuestionTypeBadge type={q.questionType} />
                      </td>
                      <td className="py-3 pr-3">
                        <ModelBadge model={q.model} />
                      </td>
                      <td className="py-3 pr-3">
                        <QualityBadge value={q.qualityStatus} />
                      </td>
                      <td className="py-3 pr-4 font-sans text-[12px] text-ink-600">
                        {dt.toLocaleDateString("ko-KR")}
                        <span className="ml-1 text-ink-500">
                          {dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="flex h-12 items-center justify-between border-t border-surface-200 bg-surface-50/40 px-4">
            <div className="font-sans text-[12px] text-ink-500">
              1–{filtered.length} of {questions.length}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DetailPanel
          key={selected.id}
          item={selected}
          onClose={() => setSelectedId(null)}
          onSaveQuality={async (qualityStatus) => {
            await persistQuestionQuality(selected, qualityStatus, updateQuestion);
          }}
          onSaveComment={async (next) => {
            await persistQuestionComment(selected, next, updateQuestion);
          }}
          onCopy={() => void navigator.clipboard.writeText(selected.question)}
          onDelete={() => {
            if (window.confirm("이 문항을 삭제할까요?")) {
              const deleteQuestion =
                selected.questionType === "multiple"
                  ? deleteMultipleQuestionApi
                  : deleteSubjectiveQuestionApi;
              void deleteQuestion(selected.backendId ?? selected.id).then(() => {
                removeQuestion(selected.id);
                setSelectedId(null);
              });
            }
          }}
          onAddToExam={() => {
            window.alert("시험 편성 API가 아직 연결되지 않았습니다.");
          }}
        />
      )}
    </div>
  );
}
