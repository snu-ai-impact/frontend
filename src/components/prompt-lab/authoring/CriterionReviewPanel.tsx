"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  listReviewCriteria,
  runCriterionReview,
  type CriterionMeta,
  type CriterionResult,
} from "@/lib/authoring-api";

const sel =
  "h-8 rounded-md bg-white px-2 text-[12px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

// 요소별 검수 모델. "" = 기본 모델(백엔드 gemini).
const MODEL_OPTIONS = [
  { key: "", label: "기본 모델" },
  { key: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
  { key: "claude-fable-5", label: "Claude Fable 5" },
  { key: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
];

function scoreTone(score: number): { bar: string; text: string; label: string } {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-700", label: "양호" };
  if (score >= 50) return { bar: "bg-amber-400", text: "text-amber-700", label: "주의" };
  return { bar: "bg-rose-500", text: "text-rose-700", label: "미흡" };
}

const VERDICT_TONE: Record<string, "success" | "warning" | "danger"> = {
  pass: "success",
  revise: "warning",
  reject: "danger",
};

/** indicators 를 사람이 읽는 칩으로. 배열은 개수·요약으로. */
function indicatorChips(ind: Record<string, unknown>): { k: string; v: string }[] {
  const out: { k: string; v: string }[] = [];
  for (const [k, val] of Object.entries(ind)) {
    if (Array.isArray(val)) {
      out.push({ k, v: `${val.length}건` });
    } else if (typeof val === "boolean") {
      out.push({ k, v: val ? "예" : "아니오" });
    } else if (val !== null && typeof val === "object") {
      continue;
    } else {
      out.push({ k, v: String(val) });
    }
  }
  return out;
}

function CriterionCard({
  meta,
  result,
  running,
  onRun,
}: {
  meta: CriterionMeta;
  result?: CriterionResult;
  running: boolean;
  onRun: () => void;
}) {
  const tone = result ? scoreTone(result.score) : null;
  return (
    <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-surface-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-white">
              {meta.id}
            </span>
            <span className="truncate text-[13px] font-semibold text-ink-900">{meta.name}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink-500">{meta.short}</p>
        </div>
        <Button
          variant="brand"
          size="sm"
          icon={<Icon name="sparkles" className="h-3.5 w-3.5" />}
          onClick={onRun}
          disabled={running}
        >
          {running ? "검수 중…" : result ? "재실행" : "실행"}
        </Button>
      </div>

      {result && tone && (
        <div className="mt-2.5">
          {/* 큰 수치 + 게이지 */}
          <div className="flex items-end justify-between">
            <span className="text-[10.5px] text-ink-400">{meta.unit}</span>
            <span className={`font-mono text-[22px] font-bold leading-none ${tone.text}`}>
              {result.score}
              <span className="text-[11px] font-normal text-ink-400">/100</span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-100">
            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${result.score}%` }} />
          </div>

          {/* 판정 + 지표 칩 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {result.verdict && (
              <Badge tone={VERDICT_TONE[result.verdict] ?? "neutral"}>{result.verdict}</Badge>
            )}
            {indicatorChips(result.indicators).map((c) => (
              <span
                key={c.k}
                className="inline-flex items-center gap-1 rounded-md bg-surface-50 px-1.5 py-0.5 text-[10.5px] text-ink-600 ring-1 ring-inset ring-surface-200"
              >
                <span className="text-ink-400">{c.k}</span>
                <span className="font-semibold text-ink-800">{c.v}</span>
              </span>
            ))}
          </div>

          {result.comment && (
            <p className="mt-2 whitespace-pre-wrap text-[11.5px] leading-5 text-ink-700">{result.comment}</p>
          )}
          {result.evidence?.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {result.evidence.slice(0, 3).map((e, i) => (
                <p key={i} className="border-l-2 border-surface-300 pl-2 text-[10.5px] text-ink-500">
                  “{e}”
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CriterionReviewPanel({ runId, promptType }: { runId: string; promptType: string }) {
  const [criteria, setCriteria] = useState<CriterionMeta[]>([]);
  const [results, setResults] = useState<Record<string, CriterionResult>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => {
    listReviewCriteria(promptType).then(setCriteria).catch(() => setCriteria([]));
  }, [promptType]);

  const runOne = useCallback(
    async (cid: string) => {
      setRunning((r) => ({ ...r, [cid]: true }));
      setError(null);
      try {
        const res = await runCriterionReview(runId, cid, model || undefined);
        setResults((r) => ({ ...r, [cid]: res }));
      } catch (e) {
        setError(`${cid}: ${e instanceof Error ? e.message : "검수 실패"}`);
      } finally {
        setRunning((r) => ({ ...r, [cid]: false }));
      }
    },
    [runId, model],
  );

  const runAll = async () => {
    setRunningAll(true);
    for (const c of criteria) {
      await runOne(c.id); // 순차 실행(rate limit 완화)
    }
    setRunningAll(false);
  };

  const done = Object.keys(results).length;
  const avg =
    done > 0
      ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / done)
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-surface-200">
        <span className="text-[12.5px] font-semibold text-ink-800">요소별 검수 (C1~C9)</span>
        <span className="text-[11px] text-ink-500">9개 측정 요소를 하나씩 실행해 수치로 확인</span>
        <select className={`${sel} ml-auto`} value={model} onChange={(e) => setModel(e.target.value)}>
          {MODEL_OPTIONS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="sparkles" className="h-3.5 w-3.5" />}
          onClick={runAll}
          disabled={runningAll || criteria.length === 0}
        >
          {runningAll ? "전체 검수 중…" : "전체 실행"}
        </Button>
        {avg !== null && (
          <Badge tone={avg >= 80 ? "success" : avg >= 50 ? "warning" : "danger"}>
            평균 {avg}/100 ({done}/{criteria.length})
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {criteria.map((c) => (
          <CriterionCard
            key={c.id}
            meta={c}
            result={results[c.id]}
            running={!!running[c.id]}
            onRun={() => runOne(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
