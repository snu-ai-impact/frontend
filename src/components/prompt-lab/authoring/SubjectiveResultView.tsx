"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Textarea } from "@/components/ui/Card";
import { REVIEW_STATUSES } from "@/lib/authoring-constants";
import type { GenSubjectiveResult, GenerationRun } from "@/lib/authoring-types";

const SELF_CHECK_LABELS: Record<string, string> = {
  curriculumDependent: "교안 의존",
  financeNeutral: "금융 중립",
  scoringSelfSufficient: "채점 자족",
  criteriaAllObservable: "기준 관찰가능",
  noDoubleScoring: "이중채점 없음",
  modelAnswerFullMarks: "모범답안 만점",
  anchorsConsistent: "앵커 정합",
  levelWithinBand: "밴드 내 수준",
};

const REVIEW_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  승인: "success",
  수정필요: "warning",
  폐기: "danger",
  미검토: "neutral",
};

function KeyVal({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12.5px]">
      <span className="shrink-0 font-medium text-ink-500">{label}</span>
      <span className="whitespace-pre-wrap text-ink-800">{value}</span>
    </div>
  );
}

export function SubjectiveResultView({
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
  const [reviewStatus, setReviewStatus] = useState(run.review_status);
  const [note, setNote] = useState(run.review_note ?? "");
  const [savingReview, setSavingReview] = useState(false);

  const view = (run.result as GenSubjectiveResult | null) ?? null;

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
  const design = view.design;
  const level = design?.levelPlan;
  const meta = view.meta ?? {};
  const rubric = view.rubric;
  const criteria = rubric?.criteria ?? [];
  const anchors = view.anchors ?? [];
  const flaws = view.commonFlaws ?? [];
  const critNames = criteria.map((c) => c.name ?? "");

  return (
    <div className="space-y-4">
      {/* 과제 카드 */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-surface-200">
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 px-5 py-3">
          <Badge tone="brand">{meta.examLevel || run.exam_level}</Badge>
          <Badge tone="violet">{meta.taskType || level?.taskType || "주관식"}</Badge>
          {(meta.industry || run.industry) && (
            <Badge tone="neutral">{meta.industry || run.industry}</Badge>
          )}
          {rubric?.totalPoints != null && <Badge tone="lightblue">{rubric.totalPoints}점</Badge>}
        </div>
        <div className="space-y-3 px-5 py-4">
          {item.scenario && (
            <p className="whitespace-pre-wrap rounded-lg bg-surface-50 p-3 text-[13px] leading-6 text-ink-800 ring-1 ring-surface-200">
              {item.scenario}
            </p>
          )}
          {(item.materials ?? []).length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                제시 자료
              </div>
              <ul className="space-y-1.5">
                {(item.materials ?? []).map((m, i) => (
                  <li
                    key={i}
                    className="whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-[12.5px] leading-6 text-ink-800 ring-1 ring-surface-200"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.task && (
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                요구사항
              </div>
              <p className="whitespace-pre-wrap text-[14px] font-semibold leading-6 text-ink-900">
                {item.task}
              </p>
            </div>
          )}
          {item.constraints && (
            <p className="text-[12px] text-ink-500">
              <span className="font-medium">제약 </span>
              {item.constraints}
            </p>
          )}
        </div>
      </div>

      {/* 루브릭 표 */}
      {criteria.length > 0 && (
        <Card
          title="채점 루브릭"
          subtitle={rubric?.totalPoints != null ? `총 ${rubric.totalPoints}점` : undefined}
          padding="p-0"
        >
          <div className="divide-y divide-surface-100">
            {criteria.map((c, i) => (
              <div key={i} className="px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink-900">{c.name}</span>
                  {c.weight != null && <Badge tone="lightblue">가중 {c.weight}</Badge>}
                </div>
                <div className="space-y-1">
                  {(c.levels ?? []).map((lv, j) => (
                    <div key={j} className="flex gap-2 text-[12px] leading-5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-surface-100 text-[11px] font-bold text-ink-600">
                        {lv.score}
                      </span>
                      <span className="text-ink-700">{lv.descriptor}</span>
                    </div>
                  ))}
                </div>
                {(c.gatingRules ?? []).length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {(c.gatingRules ?? []).map((g, k) => (
                      <p key={k} className="flex items-start gap-1 text-[11px] text-rose-600">
                        <Icon name="alert" className="mt-0.5 h-3 w-3 shrink-0" />
                        게이팅: {g}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {rubric?.scoringProcedure && (
            <div className="border-t border-surface-200 bg-surface-50 px-4 py-2.5 text-[12px] leading-5 text-ink-600">
              <span className="font-medium text-ink-500">채점 절차 </span>
              {rubric.scoringProcedure}
            </div>
          )}
        </Card>
      )}

      {/* 모범답안 */}
      {view.modelAnswer?.best && (
        <Card title="모범답안 (만점)" padding="p-4">
          <p className="whitespace-pre-wrap rounded-lg bg-emerald-50 p-3 text-[12.5px] leading-6 text-emerald-900 ring-1 ring-emerald-200">
            {view.modelAnswer.best}
          </p>
          {view.modelAnswer.selfScoredCheck && (
            <p className="mt-2 text-[12px] text-ink-600">
              <span className="font-medium text-ink-500">자가 채점 </span>
              {view.modelAnswer.selfScoredCheck}
            </p>
          )}
        </Card>
      )}

      {/* 앵커 답안 */}
      {anchors.length > 0 && (
        <Card title="앵커 답안 (등급별)" padding="p-4">
          <div className="space-y-3">
            {anchors.map((a, i) => (
              <div key={i} className="rounded-lg bg-surface-50 p-3 ring-1 ring-surface-200">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone="violet">{a.gradeLevel}</Badge>
                  {a.expectedScores &&
                    Object.entries(a.expectedScores).map(([k, v]) => (
                      <span key={k} className="text-[10.5px] text-ink-500">
                        {k} {v}
                      </span>
                    ))}
                </div>
                <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-ink-800">{a.answer}</p>
                {a.rationale && (
                  <p className="mt-1 text-[11.5px] text-ink-500">
                    <span className="font-medium">근거 </span>
                    {a.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 흔한 결함 패턴 */}
      {flaws.length > 0 && (
        <Card title="흔한 결함 패턴" padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-surface-200 text-left text-ink-500">
                  <th className="px-3 py-2 font-medium">패턴</th>
                  <th className="px-3 py-2 font-medium">기준</th>
                  <th className="px-3 py-2 font-medium">감점</th>
                  <th className="px-3 py-2 font-medium">하위 등급 한계</th>
                </tr>
              </thead>
              <tbody>
                {flaws.map((f, i) => (
                  <tr key={i} className="border-b border-surface-100 align-top last:border-0">
                    <td className="px-3 py-2 text-ink-800">{f.pattern}</td>
                    <td className="px-3 py-2 text-ink-600">{f.linkedCriterion}</td>
                    <td className="px-3 py-2 text-ink-600">{f.deduction}</td>
                    <td className="px-3 py-2 text-ink-500">{f.lowerGradeLink}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 해설 */}
      {view.explanation?.forExaminee && (
        <Card title="해설" padding="p-4">
          <p className="whitespace-pre-wrap text-[12.5px] leading-6 text-ink-700">
            {view.explanation.forExaminee}
          </p>
        </Card>
      )}

      {/* 설계 · 자가검증 · 메타 */}
      {!compact && (
        <Card title="설계 · 자가 검증 · 메타" padding="p-4">
          <div className="space-y-1.5">
            <KeyVal label="증거 명제" value={design?.evidenceClaim} />
            <KeyVal label="기대 점수 구간" value={level?.expectedScoreBands} />
            <KeyVal label="복잡도" value={level?.complexityNote} />
            <KeyVal label="근거 인용" value={design?.source?.quote} />
            <KeyVal label="출처 위치" value={design?.source?.location} />
          </div>
          {view.selfCheck && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-surface-100 pt-3">
              {Object.entries(SELF_CHECK_LABELS).map(([key, label]) => {
                const on = view.selfCheck?.[key] === true;
                return (
                  <Badge key={key} tone={on ? "success" : "danger"}>
                    <Icon name={on ? "check" : "x"} className="h-3 w-3" />
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-surface-100 pt-3 font-mono text-[11px] text-ink-500">
            <span>weights: {meta.criterionWeights || "-"}</span>
            <span>criteria: {critNames.join("·") || "-"}</span>
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
