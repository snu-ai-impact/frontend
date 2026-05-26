"use client";

import { QUALITY_MAP } from "@/lib/design-maps";
import type { QualityStatus } from "@/lib/types";

const ORDER: QualityStatus[] = ["pending", "approved", "rejected"];

export function QualityStatusPicker({
  value,
  onChange,
  disabled,
  className = "",
}: {
  value: QualityStatus;
  onChange: (v: QualityStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="radiogroup" aria-label="품질 상태">
      {ORDER.map((key) => {
        const m = QUALITY_MAP[key];
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ring-1 ring-inset transition disabled:cursor-not-allowed disabled:opacity-50 ${
              on ? m.chip : "bg-white text-ink-700 ring-surface-300 hover:bg-surface-50"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${on ? m.dot : "bg-ink-300"}`} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
