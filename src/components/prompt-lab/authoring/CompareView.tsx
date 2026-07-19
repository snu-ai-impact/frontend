"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Input } from "@/components/ui/Card";
import { getRun, listRuns } from "@/lib/authoring-api";
import type { GenerationRun } from "@/lib/authoring-types";
import { RunResultView } from "./RunResultView";

export function CompareView() {
  const [topicId, setTopicId] = useState("");
  const [boundary, setBoundary] = useState("");
  const [runs, setRuns] = useState<GenerationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    if (!topicId.trim() || !boundary.trim()) {
      setError("topic_id 와 target_boundary 를 모두 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await listRuns({
        topic_id: topicId.trim(),
        target_boundary: boundary.trim(),
        status: "ok",
      });
      // gen_config 별 최신 1건, 최대 3개 열
      const byConfig = new Map<string, string>();
      for (const item of res.items) {
        if (!byConfig.has(item.gen_config)) byConfig.set(item.gen_config, item.id);
      }
      const ids = Array.from(byConfig.values()).slice(0, 3);
      if (res.items.length > 0 && byConfig.size > ids.length) {
        setNote(`gen_config ${byConfig.size}종 중 3종만 표시합니다.`);
      }
      const full = await Promise.all(ids.map((id) => getRun(id)));
      setRuns(full);
      if (full.length === 0) setError("조건에 맞는 성공(ok) 실행이 없습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 bg-white px-4 py-3">
        <Input
          className="h-9 w-44 text-[12.5px]"
          placeholder="topic_id"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
        />
        <Input
          className="h-9 w-40 text-[12.5px]"
          placeholder="target_boundary 예: BM/BH(70)"
          value={boundary}
          onChange={(e) => setBoundary(e.target.value)}
        />
        <Button
          variant="brand"
          size="md"
          icon={<Icon name="target" className="h-4 w-4" />}
          onClick={load}
          disabled={loading}
        >
          {loading ? "불러오는 중…" : "고정 비교"}
        </Button>
        {note && <span className="text-[11.5px] text-amber-700">{note}</span>}
        {error && <span className="text-[11.5px] text-rose-600">{error}</span>}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4">
        {runs.length === 0 ? (
          <div className="grid min-h-[300px] place-items-center text-center">
            <div className="max-w-sm">
              <Icon name="target" className="mx-auto h-8 w-8 text-ink-300" />
              <p className="mt-2 text-[12.5px] text-ink-500">
                같은 (topic_id × target_boundary)에서 gen_config가 다른 실행들을 나란히 비교합니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${runs.length}, minmax(320px, 1fr))` }}>
            {runs.map((run) => (
              <div key={run.id} className="min-w-0">
                <Card padding="p-3" className="mb-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{run.gen_config}</Badge>
                    <span className="ml-auto font-mono text-[10.5px] text-ink-400">
                      {new Date(run.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </Card>
                <RunResultView run={run} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
