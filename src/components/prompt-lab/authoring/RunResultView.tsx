"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Textarea } from "@/components/ui/Card";
import { REVIEW_STATUSES } from "@/lib/authoring-constants";
import type { GenItemResult, GenerationRun } from "@/lib/authoring-types";

const SELF_CHECK_LABELS: Record<string, string> = {
  curriculumDependent: "교안 의존",
  financeNeutral: "금융 중립",
  lowerGradeFails: "하위등급 탈락",
  singleBestAnswer: "단일 정답",
  optionsHomogeneous: "선지 균질",
  noCueWords: "단서어 없음",
};

const REVIEW_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  승인: "success",
  수정필요: "warning",
  폐기: "danger",
  미검토: "neutral",
};

// 셔플 역변환: shuffle_map = old_to_new(old_to_new[old]=new) → 원본 순서 복원
function unshuffle(result: GenItemResult, map: number[]): GenItemResult {
  const n = map.length;
  const newToOld: number[] = new Array(n);
  map.forEach((newPos, old) => {
    newToOld[newPos] = old;
  });
  const remap = (idx: number | undefined) =>
    typeof idx === "number" && idx >= 0 && idx < n ? newToOld[idx] : idx;

  const item = result.item ?? {};
  const shuffled = item.choices ?? [];
  const originalChoices = shuffled.length === n ? map.map((newPos) => shuffled[newPos]) : shuffled;

  return {
    ...result,
    item: { ...item, choices: originalChoices, answerIndex: remap(item.answerIndex) },
    distractorMap: (result.distractorMap ?? []).map((d) => ({ ...d, choiceIndex: remap(d.choiceIndex)! })),
    explanation: result.explanation
      ? {
          ...result.explanation,
          wrongExplanations: (result.explanation.wrongExplanations ?? []).map((w) => ({
            ...w,
            choiceIndex: remap(w.choiceIndex)!,
          })),
        }
      : result.explanation,
  };
}

function KeyVal({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12.5px]">
      <span className="shrink-0 font-medium text-ink-500">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}

export function RunResultView({
  run,
  onReview,
  onRetry,
  retrying,
  compact = false,
}: {
  run: GenerationRun;
  onReview?: (reviewStatus: string, note: string) => Promise<void>;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(run.review_status);
  const [note, setNote] = useState(run.review_note ?? "");
  const [savingReview, setSavingReview] = useState(false);

  const shuffled = run.result;
  const view = useMemo<GenItemResult | null>(() => {
    if (!shuffled) return null;
    if (showOriginal && run.shuffle_map) return unshuffle(shuffled, run.shuffle_map);
    return shuffled;
  }, [shuffled, showOriginal, run.shuffle_map]);

  if (run.status !== "ok" || !view?.item) {
    return (
      <Card className="ring-rose-200">
        <div className="flex gap-3">
          <Icon name="alert" className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone="danger">{run.status === "error" ? "API 에러" : "생성 실패"}</Badge>
              <span className="font-mono text-[11px] text-ink-500">{run.gen_config}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[12.5px] text-ink-700">
              {run.fail_reason || "사유 미기록"}
            </p>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                icon={<Icon name="refresh" className="h-3.5 w-3.5" />}
                onClick={onRetry}
                disabled={retrying}
              >
                {retrying ? "재시도 중…" : "재시도"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const item = view.item;
  const answerIndex = item.answerIndex ?? -1;
  const design = view.design;
  const bp = design?.boundaryPlan;
  const meta = view.meta ?? {};
  const distractors = view.distractorMap ?? [];
  const wrongs = view.explanation?.wrongExplanations ?? [];

  return (
    <div className="space-y-4">
      {/* 시험지 카드 */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-surface-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{meta.examLevel || run.exam_level}</Badge>
            <Badge tone="violet">{meta.domain || run.domain}</Badge>
            <Badge tone="lightblue">{bp?.targetBoundary || run.target_boundary}</Badge>
            {meta.industry && <Badge tone="neutral">{meta.industry}</Badge>}
          </div>
          {run.shuffle_map && (
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-700 hover:underline"
            >
              <Icon name="refresh" className="h-3 w-3" />
              {showOriginal ? "셔플본 보기" : "원본 순서 보기"}
            </button>
          )}
        </div>
        <div className="px-5 py-4">
          {item.scenario && (
            <p className="whitespace-pre-wrap rounded-lg bg-surface-50 p-3 text-[13px] leading-6 text-ink-800 ring-1 ring-surface-200">
              {item.scenario}
            </p>
          )}
          <p className="mt-3 text-[14px] font-semibold leading-6 text-ink-900">{item.question}</p>
          <ol className="mt-3 space-y-2">
            {(item.choices ?? []).map((choice, i) => {
              const correct = i === answerIndex;
              return (
                <li
                  key={i}
                  className={`flex gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-6 ring-1 ${
                    correct
                      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                      : "bg-white text-ink-800 ring-surface-200"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      correct ? "bg-emerald-600 text-white" : "bg-surface-100 text-ink-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-pre-wrap">{choice}</span>
                  {correct && (
                    <Icon name="check" className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* design / boundaryPlan */}
      {(design || bp) && (
        <Card title="설계 · 경계 계획" padding="p-4">
          <div className="space-y-1.5">
            <KeyVal label="증거 명제" value={design?.evidenceClaim} />
            <KeyVal label="타겟 경계" value={bp?.targetBoundary} />
            <KeyVal
              label="목표 정답률"
              value={
                typeof run.params?.target_p === "number" ? `${run.params.target_p}% (예상)` : undefined
              }
            />
            <KeyVal
              label="레버"
              value={
                bp?.levers
                  ? `인지 ${bp.levers.cognitive ?? "-"} · 거리 ${bp.levers.distractorDistance ?? "-"} · 정보 ${bp.levers.infoStructure ?? "-"}`
                  : undefined
              }
            />
            <KeyVal label="2군 사양" value={bp?.twoGroupSpec} />
            <KeyVal label="근거 인용" value={design?.source?.quote} />
            <KeyVal label="출처 위치" value={design?.source?.location} />
          </div>
        </Card>
      )}

      {/* distractorMap 표 */}
      {distractors.length > 0 && (
        <Card title="오답 지도 (distractorMap)" padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-surface-200 text-left text-ink-500">
                  <th className="px-3 py-2 font-medium">선지</th>
                  <th className="px-3 py-2 font-medium">오개념</th>
                  <th className="px-3 py-2 font-medium">끌리는 응시자상</th>
                </tr>
              </thead>
              <tbody>
                {distractors.map((d, i) => (
                  <tr key={i} className="border-b border-surface-100 align-top last:border-0">
                    <td className="px-3 py-2 font-mono text-ink-700">{(d.choiceIndex ?? 0) + 1}번</td>
                    <td className="px-3 py-2 text-ink-800">{d.misconception}</td>
                    <td className="px-3 py-2 text-ink-600">{d.attractsWho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 해설 */}
      {view.explanation && (
        <Card title="해설" padding="p-4">
          {view.explanation.answerExplanation && (
            <div className="rounded-lg bg-emerald-50 p-3 text-[12.5px] leading-6 text-emerald-900 ring-1 ring-emerald-200">
              <span className="font-semibold">정답 </span>
              {view.explanation.answerExplanation}
            </div>
          )}
          <ul className="mt-2 space-y-1.5">
            {wrongs.map((w, i) => (
              <li key={i} className="text-[12.5px] leading-6 text-ink-700">
                <span className="font-mono text-ink-500">{(w.choiceIndex ?? 0) + 1}번 </span>
                {w.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* selfCheck + meta */}
      {!compact && view.selfCheck && (
        <Card title="자가 검증 · 메타" padding="p-4">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SELF_CHECK_LABELS).map(([key, label]) => {
              const val = view.selfCheck?.[key];
              const on = val === true;
              return (
                <Badge key={key} tone={on ? "success" : "danger"}>
                  <Icon name={on ? "check" : "x"} className="h-3 w-3" />
                  {label}
                </Badge>
              );
            })}
          </div>
          {typeof view.selfCheck.relativePosition === "string" && (
            <p className="mt-2 text-[12px] text-ink-600">
              <span className="font-medium text-ink-500">상대 위치 </span>
              {view.selfCheck.relativePosition}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-surface-100 pt-3 font-mono text-[11px] text-ink-500">
            <span>evidence: {meta.evidenceCanDo || "-"}</span>
            <span>tokens: {run.token_count ?? "-"}</span>
            <span>model: {run.model}</span>
            <span>temp: {run.temperature}</span>
          </div>
        </Card>
      )}

      {/* 리뷰 액션 */}
      {onReview && (
        <Card title="리뷰" padding="p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {REVIEW_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setReviewStatus(s)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset transition ${
                  reviewStatus === s
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-ink-700 ring-surface-300 hover:bg-surface-50"
                }`}
              >
                {s}
              </button>
            ))}
            <Badge tone={REVIEW_TONE[run.review_status] ?? "neutral"} className="ml-auto">
              저장됨: {run.review_status}
            </Badge>
          </div>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="검토 코멘트 (1개)"
            className="mt-2 text-[12.5px]"
          />
          <div className="mt-2 flex justify-end">
            <Button
              variant="brand"
              size="sm"
              icon={<Icon name="save" className="h-3.5 w-3.5" />}
              disabled={savingReview}
              onClick={async () => {
                if (!onReview) return;
                setSavingReview(true);
                try {
                  await onReview(reviewStatus, note);
                } finally {
                  setSavingReview(false);
                }
              }}
            >
              {savingReview ? "저장 중…" : "리뷰 저장"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
