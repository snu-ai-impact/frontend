"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { listBlocks, listConfigs } from "@/lib/authoring-api";
import type { AssemblyConfig, Block, GenerationRun } from "@/lib/authoring-types";
import { BlockLibrary } from "./BlockLibrary";
import { CompareView } from "./CompareView";
import { ExperimentBuilder } from "./ExperimentBuilder";
import { RunHistory } from "./RunHistory";

type Tab = "builder" | "library" | "history" | "compare";

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { key: "builder", label: "실험 구성", icon: "flask" },
  { key: "library", label: "블록 라이브러리", icon: "layers" },
  { key: "history", label: "런 히스토리", icon: "history" },
  { key: "compare", label: "비교 뷰", icon: "target" },
];

export function AuthoringWorkbench() {
  const [tab, setTab] = useState<Tab>("builder");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [configs, setConfigs] = useState<AssemblyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusRunId, setFocusRunId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, c] = await Promise.all([listBlocks(), listConfigs()]);
      setBlocks(b);
      setConfigs(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRunInHistory = (run: GenerationRun) => {
    setFocusRunId(run.id);
    setTab("history");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b border-surface-200 bg-white px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[12.5px] font-medium transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            <Icon name={t.icon} className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[11.5px] text-ink-500 hover:text-ink-800"
          title="새로고침"
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="grid flex-1 place-items-center">
          <div className="spin h-8 w-8 rounded-full border-2 border-brand-100 border-t-brand-600" />
        </div>
      ) : error ? (
        <div className="grid flex-1 place-items-center">
          <div className="max-w-md text-center">
            <Icon name="alert" className="mx-auto h-8 w-8 text-rose-500" />
            <p className="mt-2 text-[13px] text-ink-700">{error}</p>
            <p className="mt-1 text-[11.5px] text-ink-500">
              백엔드(authoring API)가 실행 중인지 확인하세요.
            </p>
          </div>
        </div>
      ) : (
        <>
          {tab === "builder" && (
            <ExperimentBuilder
              blocks={blocks}
              configs={configs}
              onConfigsChange={setConfigs}
              onOpenRun={openRunInHistory}
            />
          )}
          {tab === "library" && <BlockLibrary blocks={blocks} onBlocksChange={setBlocks} />}
          {tab === "history" && <RunHistory configs={configs} focusRunId={focusRunId} />}
          {tab === "compare" && <CompareView />}
        </>
      )}
    </div>
  );
}
