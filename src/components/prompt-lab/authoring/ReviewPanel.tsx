"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listQcConfigs, listReviews, runReview } from "@/lib/authoring-api";
import {
  AXIS_META,
  GATE_META,
  VERDICT_LABEL,
  VERDICT_TONE,
  type Verdict,
} from "@/lib/authoring-constants";
import type { QcConfig, ReviewRun } from "@/lib/authoring-types";

const sel =
  "h-8 rounded-md bg-white px-2 text-[12px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

function AxisBar({ label, hint, score, comment }: { label: string; hint: string; score?: number; comment?: string }) {
  const s = typeof score === "number" ? score : 0;
  const pct = Math.max(0, Math.min(100, (s / 5) * 100));
  const tone = s >= 4 ? "bg-emerald-500" : s >= 3 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-surface-200">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold text-ink-800">{label}</span>
        <span className="font-mono text-[15px] font-bold text-ink-900">
          {typeof score === "number" ? score : "-"}
          <span className="text-[11px] font-normal text-ink-400">/5</span>
        </span>
      </div>
      <div className="mt-1 text-[10.5px] text-ink-400">{hint}</div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {comment && <p className="mt-2 text-[11.5px] leading-5 text-ink-600">{comment}</p>}
    </div>
  );
}

function VerdictHeader({ review }: { review: ReviewRun }) {
  const verdict = (review.final_verdict ?? "reject") as Verdict;
  return (
    <div className="rounded-xl bg-white p-4 shadow-card ring-1 ring-surface-200">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-bold ring-1 ring-inset ${
            VERDICT_TONE[verdict] === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : VERDICT_TONE[verdict] === "warning"
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-rose-50 text-rose-700 ring-rose-200"
          }`}
        >
          <Icon
            name={verdict === "pass" ? "check" : verdict === "revise" ? "edit" : "x"}
            className="h-4 w-4"
          />
          {VERDICT_LABEL[verdict]}
        </span>
        {review.gate_all_pass === false && (
          <Badge tone="danger">
            <Icon name="alert" className="h-3 w-3" /> 게이트 실패
          </Badge>
        )}
        {typeof review.axis_sum === "number" && (
          <Badge tone="neutral">축 합 {review.axis_sum}/15</Badge>
        )}
        {review.mismatch && (
          <Badge tone="warning" className="ml-auto">
            <Icon name="info" className="h-3 w-3" /> 코드·LLM 판정 불일치
            {review.llm_recommendation ? ` (LLM: ${VERDICT_LABEL[review.llm_recommendation]})` : ""}
          </Badge>
        )}
      </div>
      {review.result?.verdict?.rationale && (
        <p className="mt-2.5 text-[12.5px] leading-6 text-ink-700">
          {review.result.verdict.rationale}
        </p>
      )}
    </div>
  );
}

function BlindSolve({ review }: { review: ReviewRun }) {
  const chosen = review.blind_chosen_index;
  const answer = review.answer_index;
  const mismatch =
    typeof chosen === "number" && typeof answer === "number" && chosen !== answer;
  return (
    <Card title="블라인드 풀이" padding="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={mismatch ? "danger" : "success"}>
          검수자 선택 {typeof chosen === "number" ? chosen + 1 : "-"}번
        </Badge>
        <Icon name="arrowUp" className="h-3 w-3 rotate-90 text-ink-300" />
        <Badge tone="neutral">정답 {typeof answer === "number" ? answer + 1 : "-"}번</Badge>
        {mismatch && (
          <Badge tone="danger" className="ml-1">
            <Icon name="alert" className="h-3 w-3" /> 불일치
          </Badge>
        )}
      </div>
      {review.result?.blindSolve?.reasoning && (
        <p className="mt-2 text-[12px] leading-6 text-ink-600">
          {review.result.blindSolve.reasoning}
        </p>
      )}
    </Card>
  );
}

export function ReviewPanel({ runId }: { runId: string }) {
  const [reviews, setReviews] = useState<ReviewRun[]>([]);
  const [qcConfigs, setQcConfigs] = useState<QcConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qcConfigId, setQcConfigId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rv, qc] = await Promise.all([listReviews(runId), listQcConfigs()]);
      setReviews(rv);
      setQcConfigs(qc);
      setSelectedId((cur) => cur ?? rv[0]?.id ?? null);
      setQcConfigId((cur) => cur || qc[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "검수 이력 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const doReview = async () => {
    setRunning(true);
    setError(null);
    try {
      const rv = await runReview(runId, qcConfigId || undefined);
      const list = await listReviews(runId);
      setReviews(list);
      setSelectedId(rv.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검수 실행 실패");
    } finally {
      setRunning(false);
    }
  };

  const review = reviews.find((r) => r.id === selectedId) ?? reviews[0] ?? null;

  return (
    <div className="space-y-4">
      {/* 검수 실행 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-surface-200">
        <select className={sel} value={qcConfigId} onChange={(e) => setQcConfigId(e.target.value)}>
          {qcConfigs.length === 0 && <option value="">qc_config 없음</option>}
          {qcConfigs.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>
        <Button
          variant="brand"
          size="sm"
          icon={<Icon name="sparkles" className="h-3.5 w-3.5" />}
          onClick={doReview}
          disabled={running || qcConfigs.length === 0}
        >
          {running ? "검수 중…" : reviews.length ? "재검수" : "검수 실행"}
        </Button>
        {reviews.length > 0 && (
          <select
            className={`${sel} ml-auto max-w-[240px]`}
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.created_at).toLocaleString("ko-KR")} · {r.qc_config}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-10">
          <div className="spin h-6 w-6 rounded-full border-2 border-brand-100 border-t-brand-600" />
        </div>
      ) : !review ? (
        <div className="grid place-items-center py-10 text-center">
          <div className="max-w-xs">
            <Icon name="clipboard" className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-2 text-[12.5px] text-ink-500">
              아직 검수 이력이 없습니다. qc_config 를 선택하고 검수를 실행하세요.
            </p>
          </div>
        </div>
      ) : review.status === "error" ? (
        <Card className="ring-rose-200">
          <div className="flex gap-2">
            <Icon name="alert" className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <Badge tone="danger">검수 에러</Badge>
              <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] text-ink-700">
                {review.fail_reason || "사유 미기록"}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <VerdictHeader review={review} />

          {/* 3축 점수 — 상단 크게 (§5.4 delta 4) */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {AXIS_META.map((a) => {
              const axis = review.result?.scores?.[a.key as keyof typeof review.result.scores];
              return (
                <AxisBar
                  key={a.key}
                  label={a.label}
                  hint={a.hint}
                  score={axis?.score}
                  comment={axis?.comment}
                />
              );
            })}
          </div>

          {/* 게이트 5종 */}
          <Card title="게이트 검사" padding="p-4">
            <div className="space-y-1.5">
              {GATE_META.map((g) => {
                const gate = review.result?.gates?.[g.key];
                const pass = gate?.pass === true;
                return (
                  <div key={g.key} className="flex items-start gap-2 text-[12px]">
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                        pass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <Icon name={pass ? "check" : "x"} className="h-2.5 w-2.5" />
                    </span>
                    <span className="w-20 shrink-0 font-medium text-ink-700">{g.label}</span>
                    <span className="text-ink-600">{gate?.note}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 결함 목록 */}
          {(review.result?.defects?.length ?? 0) > 0 && (
            <Card title={`결함 (${review.result?.defects?.length})`} padding="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-surface-200 text-left text-ink-500">
                      <th className="px-3 py-2 font-medium">기준</th>
                      <th className="px-3 py-2 font-medium">위치</th>
                      <th className="px-3 py-2 font-medium">심각도</th>
                      <th className="px-3 py-2 font-medium">문제 · 수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.result?.defects?.map((d, i) => (
                      <tr key={i} className="border-b border-surface-100 align-top last:border-0">
                        <td className="px-3 py-2 font-mono text-[11px] text-ink-700">{d.ruleRef}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-ink-600">{d.location}</td>
                        <td className="px-3 py-2">
                          <Badge tone={d.severity === "major" ? "danger" : "warning"}>
                            {d.severity}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-ink-700">
                          {d.issue}
                          <div className="mt-0.5 text-ink-500">
                            <span className="font-medium">수정 </span>
                            {d.fix}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <BlindSolve review={review} />

          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 font-mono text-[10.5px] text-ink-400">
            <span>qc: {review.qc_config}</span>
            <span>tokens: {review.token_count ?? "-"}</span>
          </div>
        </>
      )}
    </div>
  );
}
