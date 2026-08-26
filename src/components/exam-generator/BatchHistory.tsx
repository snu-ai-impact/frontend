"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getBatchRun, listBatchRuns, type BatchRunFilters } from "@/lib/exam-batch-api";
import type { BatchRun, BatchRunListItem } from "@/lib/exam-batch-types";
import { BatchResultView } from "./BatchResultView";
import { describeSource, DOMAINS, EXAM_LEVELS, RUN_STATUS_TONE } from "./constants";

function SourceCell({ item }: { item: BatchRunListItem }) {
  const desc = describeSource(item.source_files);
  if (desc) {
    const tooltip = `${desc.folder ? desc.folder + "/\n" : ""}${desc.names.join("\n")}`;
    return (
      <div className="max-w-[240px]" title={tooltip}>
        {desc.folder && (
          <div className="truncate font-mono text-[10.5px] text-ink-500">{desc.folder}</div>
        )}
        <div className="truncate text-ink-700">
          {desc.names.length === 1 ? desc.names[0] : `${desc.names.length}개 md · ${desc.names[0]} 외`}
        </div>
      </div>
    );
  }
  // 구버전 실행: source_files 없으면 curriculum_id/course_name 로 폴백
  const fallback = item.curriculum_id || item.course_name;
  return fallback ? (
    <span className="text-ink-700">{fallback}</span>
  ) : (
    <span className="text-ink-300">–</span>
  );
}

const sel =
  "h-8 rounded-md bg-white px-2 text-[12px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

export function BatchHistory() {
  const [filters, setFilters] = useState<BatchRunFilters>({});
  const [items, setItems] = useState<BatchRunListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BatchRun | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBatchRuns(filters);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = (patch: Partial<BatchRunFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const openDetail = async (id: string) => setDetail(await getBatchRun(id));

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-thin min-w-0 flex-1 min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select className={sel} value={filters.exam_level ?? ""} onChange={(e) => setFilter({ exam_level: e.target.value || undefined })}>
            <option value="">급수 전체</option>
            {EXAM_LEVELS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select className={sel} value={filters.domain ?? ""} onChange={(e) => setFilter({ domain: e.target.value || undefined })}>
            <option value="">영역 전체</option>
            {DOMAINS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select className={sel} value={filters.status ?? ""} onChange={(e) => setFilter({ status: e.target.value || undefined })}>
            <option value="">status 전체</option>
            {["ok", "failed", "error"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span className="ml-auto text-[11.5px] text-ink-500">{loading ? "불러오는 중…" : `${total}건`}</span>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-surface-200">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-surface-200 text-left text-ink-500">
                <th className="px-3 py-2 font-medium">일시</th>
                <th className="px-3 py-2 font-medium">gen_config</th>
                <th className="px-3 py-2 font-medium">자료</th>
                <th className="px-3 py-2 font-medium">좌표</th>
                <th className="px-3 py-2 font-medium">문항</th>
                <th className="px-3 py-2 font-medium">모델</th>
                <th className="px-3 py-2 font-medium">status</th>
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
                  <td className="px-3 py-2">
                    <SourceCell item={r} />
                  </td>
                  <td className="px-3 py-2 text-ink-700">
                    {[r.exam_level, r.domain].filter(Boolean).join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-ink-700">
                    {r.ok_count}/{r.item_count}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-500">{r.model}</td>
                  <td className="px-3 py-2">
                    <Badge tone={RUN_STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[12.5px] text-ink-500">
                    배치 실행 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="scrollbar-thin w-[52%] shrink-0 min-h-0 overflow-y-auto border-l border-surface-200 bg-surface-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-500">{detail.gen_config}</span>
            <Button variant="ghost" size="sm" icon={<Icon name="x" className="h-3.5 w-3.5" />} onClick={() => setDetail(null)}>
              닫기
            </Button>
          </div>
          <BatchResultView run={detail} />
        </div>
      )}
    </div>
  );
}
