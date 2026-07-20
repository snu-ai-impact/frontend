"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { aggregateReviews, listReviewedQcConfigs } from "@/lib/authoring-api";
import { AXIS_META, VERDICT_BAR, VERDICT_LABEL } from "@/lib/authoring-constants";
import type { AggregateRow, ReviewedQcConfig } from "@/lib/authoring-types";

const sel =
  "h-9 rounded-md bg-white px-2 text-[12.5px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const pct = (v: number) => `${Math.round(v * 100)}%`;

function VerdictBar({ row }: { row: AggregateRow }) {
  const segs: { key: "pass" | "revise" | "reject"; n: number }[] = [
    { key: "pass", n: row.pass_count },
    { key: "revise", n: row.revise_count },
    { key: "reject", n: row.reject_count },
  ];
  return (
    <div>
      <div className="flex h-5 overflow-hidden rounded-md ring-1 ring-surface-200">
        {row.total === 0 ? (
          <div className="flex-1 bg-surface-100" />
        ) : (
          segs.map((s) =>
            s.n > 0 ? (
              <div
                key={s.key}
                className={`${VERDICT_BAR[s.key]} grid place-items-center text-[10px] font-bold text-white`}
                style={{ width: `${(s.n / row.total) * 100}%` }}
                title={`${VERDICT_LABEL[s.key]} ${s.n}건`}
              >
                {s.n}
              </div>
            ) : null,
          )
        )}
      </div>
      <div className="mt-1 flex gap-3 text-[10.5px] text-ink-500">
        <span className="text-emerald-600">통과 {pct(row.pass_rate)}</span>
        <span className="text-amber-600">수정 {pct(row.revise_rate)}</span>
        <span className="text-rose-600">반려 {pct(row.reject_rate)}</span>
      </div>
    </div>
  );
}

export function ReviewAggregateView() {
  const [qcConfigs, setQcConfigs] = useState<ReviewedQcConfig[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rows, setRows] = useState<AggregateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const qc = await listReviewedQcConfigs();
        setQcConfigs(qc);
        setSelected((cur) => cur || qc[0]?.qc_config || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "qc_config 목록 로드 실패");
      }
    })();
  }, []);

  const load = useCallback(async (qc: string) => {
    if (!qc) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await aggregateReviews(qc);
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "집계 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(selected);
  }, [selected, load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 bg-white px-4 py-3">
        <Icon name="chart" className="h-4 w-4 text-brand-600" />
        <span className="text-[12.5px] font-semibold text-ink-800">조합 집계</span>
        <select className={`${sel} ml-2 min-w-[280px]`} value={selected} onChange={(e) => setSelected(e.target.value)}>
          {qcConfigs.length === 0 && <option value="">검수 이력이 있는 qc_config 없음</option>}
          {qcConfigs.map((q) => (
            <option key={q.qc_config} value={q.qc_config}>
              {q.qc_config} ({q.review_count}건)
            </option>
          ))}
        </select>
        <span className="text-[11px] text-ink-400">동일 qc_config 안에서만 비교합니다</span>
        {error && <span className="ml-auto text-[11.5px] text-rose-600">{error}</span>}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4">
        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="spin h-7 w-7 rounded-full border-2 border-brand-100 border-t-brand-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="grid min-h-[280px] place-items-center text-center">
            <div className="max-w-sm">
              <Icon name="chart" className="mx-auto h-8 w-8 text-ink-300" />
              <p className="mt-2 text-[12.5px] text-ink-500">
                이 qc_config 로 검수된 생성 조합이 없습니다. 히스토리에서 문항을 검수하면 여기에
                genConfig 별 판정 분포가 쌓입니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-surface-200">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-surface-200 text-left text-ink-500">
                  <th className="px-3 py-2.5 font-medium">gen_config</th>
                  <th className="px-3 py-2.5 font-medium">n</th>
                  <th className="w-[220px] px-3 py-2.5 font-medium">판정 분포 (pass율 정렬)</th>
                  <th className="px-3 py-2.5 font-medium">게이트</th>
                  <th className="px-3 py-2.5 font-medium">3축 평균</th>
                  <th className="px-3 py-2.5 font-medium">결함 빈도 (ruleRef)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.gen_config} className="border-b border-surface-100 align-top last:border-0">
                    <td className="px-3 py-3 font-mono text-[11px] text-ink-700">{row.gen_config}</td>
                    <td className="px-3 py-3 text-ink-600">{row.total}</td>
                    <td className="px-3 py-3">
                      <VerdictBar row={row} />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`font-mono font-semibold ${
                          row.gate_pass_rate >= 0.8
                            ? "text-emerald-600"
                            : row.gate_pass_rate >= 0.5
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}
                      >
                        {pct(row.gate_pass_rate)}
                      </span>
                      {row.blind_mismatch_count > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10.5px] text-rose-500">
                          <Icon name="alert" className="h-3 w-3" />
                          블라인드 불일치 {row.blind_mismatch_count}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-0.5 font-mono text-[11px] text-ink-600">
                        {AXIS_META.map((a) => (
                          <div key={a.key} className="flex justify-between gap-2">
                            <span className="text-ink-400">{a.label}</span>
                            <span className="font-semibold text-ink-800">
                              {row.axis_avg[a.key] ?? "-"}
                            </span>
                          </div>
                        ))}
                        <div className="mt-0.5 flex justify-between gap-2 border-t border-surface-100 pt-0.5">
                          <span className="text-ink-400">축 합</span>
                          <span className="font-semibold text-ink-800">{row.axis_sum_avg ?? "-"}/15</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {row.top_defects.length === 0 ? (
                        <span className="text-ink-300">–</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.top_defects.map((d) => (
                            <Badge key={d.rule_ref} tone="neutral">
                              <span className="font-mono">{d.rule_ref}</span>
                              <span className="text-ink-400">×{d.count}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
