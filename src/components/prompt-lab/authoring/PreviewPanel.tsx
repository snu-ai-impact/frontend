"use client";

import { Icon } from "@/components/icons/Icon";
import { Card } from "@/components/ui/Card";
import type { PreviewResult } from "@/lib/authoring-types";

export function PreviewPanel({ preview }: { preview: PreviewResult }) {
  return (
    <Card
      title="조립 미리보기"
      subtitle="저장되는 resolved_prompt = 실제 전송 프롬프트"
      padding="p-0"
      right={
        <span className="font-mono text-[10.5px] text-ink-500">{preview.gen_config}</span>
      }
    >
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-5 text-ink-800">
          {preview.static_prefix}
        </pre>
        <div className="flex items-center gap-2 border-y border-dashed border-amber-300 bg-amber-50 px-4 py-1.5 text-[11px] font-medium text-amber-800">
          <Icon name="layers" className="h-3.5 w-3.5" />
          캐시 경계 · cache boundary (위=정적부 캐시 대상 / 아래=호출별 param)
        </div>
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-5 text-ink-900">
          {preview.param_part}
        </pre>
      </div>
    </Card>
  );
}
