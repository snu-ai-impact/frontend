"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { listBlocks, listConfigs } from "@/lib/authoring-api";
import { PROMPT_TYPES } from "@/lib/authoring-constants";
import type { AssemblyConfig, Block, GenerationRun, PromptType } from "@/lib/authoring-types";
import { BlockLibrary } from "./BlockLibrary";
import { CompareView } from "./CompareView";
import { ExperimentBuilder } from "./ExperimentBuilder";
import { ReviewAggregateView } from "./ReviewAggregateView";
import { RunHistory } from "./RunHistory";

type Tab = "builder" | "library" | "history" | "compare" | "aggregate";

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { key: "builder", label: "실험 구성", icon: "flask" },
  { key: "library", label: "블록 라이브러리", icon: "layers" },
  { key: "history", label: "런 히스토리", icon: "history" },
  { key: "compare", label: "비교 뷰", icon: "target" },
  { key: "aggregate", label: "조합 집계", icon: "chart" },
];

export function AuthoringWorkbench() {
  const [promptType, setPromptType] = useState<PromptType>("mcq");
  const [tab, setTab] = useState<Tab>("builder");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [configs, setConfigs] = useState<AssemblyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusRunId, setFocusRunId] = useState<string | null>(null);

  // 선택한 유형 + 공유(shared) 블록만, 그리고 해당 유형 조합만 노출
  const typeBlocks = useMemo(
    () => blocks.filter((b) => b.block_group === promptType || b.block_group === "shared"),
    [blocks, promptType],
  );
  const typeConfigs = useMemo(
    () => configs.filter((c) => c.prompt_type === promptType),
    [configs, promptType],
  );

  // 자식은 필터된 서브셋만 다루므로, 전체 상태에 되돌려 병합해 다른 유형 데이터를 보존한다.
  const handleBlocksChange = useCallback((next: Block[]) => {
    setBlocks((all) => {
      const byKey = new Map(next.map((b) => [b.block_key, b]));
      return all.map((b) => byKey.get(b.block_key) ?? b);
    });
  }, []);

  const handleConfigsChange = useCallback(
    (nextTypeConfigs: AssemblyConfig[]) => {
      setConfigs((all) => [
        ...nextTypeConfigs,
        ...all.filter((c) => c.prompt_type !== promptType),
      ]);
    },
    [promptType],
  );

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
        {/* 객관식 / 주관식 전환 스위치 */}
        <div className="mr-3 flex items-center gap-0.5 rounded-lg bg-surface-100 p-0.5">
          {PROMPT_TYPES.map((pt) => (
            <button
              key={pt.key}
              type="button"
              onClick={() => {
                setPromptType(pt.key);
                setFocusRunId(null);
              }}
              className={`rounded-md px-3 py-1 text-[12.5px] font-semibold transition ${
                promptType === pt.key
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-surface-200"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
        <div className="mr-1 h-5 w-px bg-surface-200" />
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
              key={promptType}
              promptType={promptType}
              blocks={typeBlocks}
              configs={typeConfigs}
              onConfigsChange={handleConfigsChange}
              onOpenRun={openRunInHistory}
            />
          )}
          {tab === "library" && (
            <BlockLibrary
              key={promptType}
              promptType={promptType}
              blocks={typeBlocks}
              onBlocksChange={handleBlocksChange}
            />
          )}
          {tab === "history" && (
            <RunHistory
              key={promptType}
              promptType={promptType}
              configs={typeConfigs}
              focusRunId={focusRunId}
            />
          )}
          {tab === "compare" && <CompareView />}
          {tab === "aggregate" && <ReviewAggregateView />}
        </>
      )}
    </div>
  );
}
