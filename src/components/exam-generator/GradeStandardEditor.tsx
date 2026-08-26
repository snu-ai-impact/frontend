"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Textarea } from "@/components/ui/Card";
import { listGradeStandards, updateGradeStandard } from "@/lib/exam-batch-api";
import type { GradeStandard } from "@/lib/exam-batch-types";
import { DOMAIN_LABELS, DOMAINS, GRADES } from "./constants";

export function GradeStandardEditor() {
  const [domain, setDomain] = useState<string>("P");
  const [rows, setRows] = useState<GradeStandard[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await listGradeStandards(d);
      setRows(res);
      setDrafts(Object.fromEntries(res.map((r) => [r.id, r.content])));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(domain);
  }, [domain, load]);

  const save = async (row: GradeStandard) => {
    setSavingId(row.id);
    try {
      const updated = await updateGradeStandard(row.id, drafts[row.id] ?? "");
      setRows((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setSavingId(null);
    }
  };

  const byGrade = (g: string) => rows.find((r) => r.grade === g);

  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[12.5px] font-semibold text-ink-800">영역 등급 기준 (시트2)</span>
        <div className="ml-2 flex items-center gap-0.5 rounded-lg bg-surface-100 p-0.5">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              className={`rounded-md px-3 py-1 text-[12px] font-semibold transition ${
                domain === d ? "bg-white text-brand-700 shadow-sm ring-1 ring-surface-200" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-400">{DOMAIN_LABELS[domain]}</span>
        {loading && <span className="text-[11px] text-ink-400">불러오는 중…</span>}
      </div>

      <p className="mb-3 rounded-lg bg-surface-50 px-3 py-2 text-[11.5px] text-ink-600 ring-1 ring-surface-200">
        여기서 편집한 기준은 배치 생성 시 <b>[영역 등급 기준]</b>으로 프롬프트에 주입됩니다. 초안(placeholder)은
        임시 문안이므로, 실제 시트2 원문으로 교체하세요.
      </p>

      <div className="space-y-3">
        {GRADES.map((g) => {
          const row = byGrade(g);
          if (!row) return null;
          const dirty = (drafts[row.id] ?? "") !== row.content;
          return (
            <Card
              key={row.id}
              padding="p-4"
              title={g}
              right={
                row.is_placeholder ? (
                  <Badge tone="warning">초안</Badge>
                ) : (
                  <Badge tone="success">
                    <Icon name="check" className="h-3 w-3" /> 확정
                  </Badge>
                )
              }
            >
              <Textarea
                rows={4}
                className="text-[12px]"
                value={drafts[row.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                {dirty && <span className="text-[11px] text-amber-700">저장 안 됨</span>}
                <Button
                  variant="brand"
                  size="sm"
                  icon={<Icon name="save" className="h-3.5 w-3.5" />}
                  disabled={!dirty || savingId === row.id}
                  onClick={() => save(row)}
                >
                  {savingId === row.id ? "저장 중…" : "저장"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
