"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { BatchBuilder } from "./BatchBuilder";
import { BatchHistory } from "./BatchHistory";
import { GradeStandardEditor } from "./GradeStandardEditor";

type Tab = "builder" | "history" | "standards";

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { key: "builder", label: "배치 생성", icon: "sparkles" },
  { key: "history", label: "생성 히스토리", icon: "history" },
  { key: "standards", label: "영역 등급 기준", icon: "book" },
];

export function ExamGeneratorView() {
  const [tab, setTab] = useState<Tab>("builder");

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
      </div>

      {tab === "builder" && <BatchBuilder />}
      {tab === "history" && <BatchHistory />}
      {tab === "standards" && <GradeStandardEditor />}
    </div>
  );
}
