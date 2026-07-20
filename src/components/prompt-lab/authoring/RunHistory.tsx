"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Card";
import { getRun, listRuns, retryRun, updateReview, type RunFilters } from "@/lib/authoring-api";
import {
  DOMAINS,
  EXAM_LEVELS,
  REVIEW_STATUSES,
  RUN_STATUSES,
  VERDICT_LABEL,
  VERDICT_TONE,
  VERDICTS,
  type Verdict,
} from "@/lib/authoring-constants";
import type { AssemblyConfig, GenerationRun, RunListItem } from "@/lib/authoring-types";
import { ReviewPanel } from "./ReviewPanel";
import { RunResultView } from "./RunResultView";

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  ok: "success",
  failed: "warning",
  error: "danger",
};
const REVIEW_TONE: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  승인: "success",
  수정필요: "warning",
  폐기: "danger",
  미검토: "neutral",
};

function VerdictCell({ item }: { item: RunListItem }) {
  const v = item.latest_review_verdict as Verdict | null;
  if (!v) return <span className="text-ink-300">–</span>;
  return (
    <div className="flex items-center gap-1">
      <Badge tone={VERDICT_TONE[v]}>{VERDICT_LABEL[v]}</Badge>
      {item.latest_blind_mismatch && (
        <span title="블라인드 풀이 답이 정답과 불일치">
          <Icon name="alert" className="h-3.5 w-3.5 text-rose-500" />
        </span>
      )}
    </div>
  );
}

const sel =
  "h-8 rounded-md bg-white px-2 text-[12px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

export function RunHistory({
  configs,
  focusRunId,
  promptType = "mcq",
}: {
  configs: AssemblyConfig[];
  focusRunId?: string | null;
  promptType?: string;
}) {
  const isSubjective = promptType === "subjective";
  const [filters, setFilters] = useState<RunFilters>({ prompt_type: promptType });
  const [items, setItems] = useState<RunListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<GenerationRun | null>(null);
  const [detailTab, setDetailTab] = useState<"item" | "review">("item");
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRuns(filters);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (focusRunId) void openDetail(focusRunId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRunId]);

  const openDetail = async (id: string) => {
    setDetail(await getRun(id));
    setDetailTab("item");
  };

  const setFilter = (patch: Partial<RunFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const genConfigs = Array.from(new Set(configs.map((c) => c.gen_config)));

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-thin min-w-0 flex-1 min-h-0 overflow-y-auto p-4">
        {/* 필터 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            className={sel}
            value={filters.gen_config ?? ""}
            onChange={(e) => setFilter({ gen_config: e.target.value || undefined })}
          >
            <option value="">gen_config 전체</option>
            {genConfigs.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select className={sel} value={filters.exam_level ?? ""} onChange={(e) => setFilter({ exam_level: e.target.value || undefined })}>
            <option value="">급수 전체</option>
            {EXAM_LEVELS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {!isSubjective && (
            <>
              <select className={sel} value={filters.domain ?? ""} onChange={(e) => setFilter({ domain: e.target.value || undefined })}>
                <option value="">영역 전체</option>
                {DOMAINS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <Input
                className="h-8 w-32 text-[12px]"
                placeholder="target_boundary"
                value={filters.target_boundary ?? ""}
                onChange={(e) => setFilter({ target_boundary: e.target.value || undefined })}
              />
            </>
          )}
          <select className={sel} value={filters.status ?? ""} onChange={(e) => setFilter({ status: e.target.value || undefined })}>
            <option value="">status 전체</option>
            {RUN_STATUSES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select className={sel} value={filters.review_status ?? ""} onChange={(e) => setFilter({ review_status: e.target.value || undefined })}>
            <option value="">검토 전체</option>
            {REVIEW_STATUSES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {!isSubjective && (
            <>
              <select
                className={sel}
                value={filters.final_verdict ?? ""}
                onChange={(e) => setFilter({ final_verdict: e.target.value || undefined })}
              >
                <option value="">판정 전체</option>
                {VERDICTS.map((v) => (
                  <option key={v} value={v}>
                    {VERDICT_LABEL[v]}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1 text-[11.5px] text-ink-600">
                <input
                  type="checkbox"
                  checked={filters.blind_mismatch === true}
                  onChange={(e) => setFilter({ blind_mismatch: e.target.checked ? true : undefined })}
                />
                블라인드 불일치만
              </label>
            </>
          )}
          <span className="ml-auto text-[11.5px] text-ink-500">{loading ? "불러오는 중…" : `${total}건`}</span>
        </div>

        {/* 목록 */}
        <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-surface-200">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-surface-200 text-left text-ink-500">
                <th className="px-3 py-2 font-medium">일시</th>
                <th className="px-3 py-2 font-medium">gen_config</th>
                <th className="px-3 py-2 font-medium">좌표</th>
                <th className="px-3 py-2 font-medium">status</th>
                {!isSubjective && <th className="px-3 py-2 font-medium">검수 판정</th>}
                <th className="px-3 py-2 font-medium">검토</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openDetail(r.id)}
                  className={`cursor-pointer border-b border-surface-100 last:border-0 hover:bg-surface-50 ${
                    detail?.id === r.id ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-ink-600">
                    {new Date(r.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-700">{r.gen_config}</td>
                  <td className="px-3 py-2 text-ink-700">
                    {[r.exam_level, r.domain, r.target_boundary].filter(Boolean).join(" · ")}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                  </td>
                  {!isSubjective && (
                    <td className="px-3 py-2">
                      <VerdictCell item={r} />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <Badge tone={REVIEW_TONE[r.review_status] ?? "neutral"}>{r.review_status}</Badge>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={isSubjective ? 5 : 6} className="px-3 py-10 text-center text-[12.5px] text-ink-500">
                    조건에 맞는 실행 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 */}
      {detail && (
        <div className="scrollbar-thin w-[46%] shrink-0 min-h-0 overflow-y-auto border-l border-surface-200 bg-surface-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-500">{detail.gen_config}</span>
            <Button variant="ghost" size="sm" icon={<Icon name="x" className="h-3.5 w-3.5" />} onClick={() => setDetail(null)}>
              닫기
            </Button>
          </div>

          {/* 문항 / LLM 검수 탭 (검수는 mcq·성공 문항만) */}
          {detail.prompt_type === "mcq" && detail.status === "ok" && (
            <div className="mb-3 flex items-center gap-1 rounded-lg bg-surface-100 p-0.5">
              {([
                { key: "item", label: "문항", icon: "file" as const },
                { key: "review", label: "LLM 검수", icon: "clipboard" as const },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setDetailTab(t.key)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                    detailTab === t.key
                      ? "bg-white text-brand-700 shadow-sm ring-1 ring-surface-200"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  <Icon name={t.icon} className="h-3.5 w-3.5" />
                  {t.label}
                  {t.key === "review" && detail.latest_review_verdict && (
                    <Badge tone={VERDICT_TONE[detail.latest_review_verdict as Verdict]}>
                      {VERDICT_LABEL[detail.latest_review_verdict as Verdict]}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {detailTab === "review" && detail.prompt_type === "mcq" && detail.status === "ok" ? (
            <ReviewPanel runId={detail.id} />
          ) : (
            <RunResultView
              run={detail}
              retrying={retrying}
              onRetry={async () => {
                setRetrying(true);
                try {
                  const r = await retryRun(detail.id);
                  setDetail(r);
                  await load();
                } finally {
                  setRetrying(false);
                }
              }}
              onReview={async (status, note) => {
                const r = await updateReview(detail.id, { review_status: status, review_note: note || null });
                setDetail(r);
                await load();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
