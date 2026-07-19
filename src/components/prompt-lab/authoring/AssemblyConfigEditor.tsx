"use client";

import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Card, Input } from "@/components/ui/Card";
import { BLOCK_ORDER, BLOCK_TYPE_LABEL } from "@/lib/authoring-constants";
import type { AssemblyConfig, Block } from "@/lib/authoring-types";

// gen_config 라이브 계산 (백엔드 derive_gen_config 와 동일 규칙)
export function blockToken(blockKey: string, band: string | null, label: string): string {
  const prefix = `${blockKey}${band ?? ""}`;
  const sep = label.startsWith("v") ? "" : "-";
  return `${prefix}${sep}${label}`;
}

export function computeGenConfig(blocks: Block[], mapping: Record<string, string>): string {
  const byKey = new Map(blocks.map((b) => [b.block_key, b]));
  const tokens: string[] = [];
  for (const key of BLOCK_ORDER) {
    const block = byKey.get(key);
    if (!block || block.block_type === "param") continue;
    const version = block.versions.find((v) => v.id === mapping[key]);
    if (!version) continue;
    tokens.push(blockToken(key, version.band, version.version_label));
  }
  return tokens.join(".");
}

const selectCls =
  "h-8 w-full rounded-md bg-white px-2 text-[12px] text-ink-900 ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-surface-50 disabled:text-ink-400";

export function AssemblyConfigEditor({
  blocks,
  configs,
  selectedConfigId,
  name,
  mapping,
  dirty,
  onSelectConfig,
  onNameChange,
  onMappingChange,
  onSave,
  onSaveAsNew,
  onDuplicate,
  saving,
}: {
  blocks: Block[];
  configs: AssemblyConfig[];
  selectedConfigId: string | null;
  name: string;
  mapping: Record<string, string>;
  dirty: boolean;
  onSelectConfig: (id: string) => void;
  onNameChange: (name: string) => void;
  onMappingChange: (mapping: Record<string, string>) => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onDuplicate: () => void;
  saving: boolean;
}) {
  const genConfig = computeGenConfig(blocks, mapping);
  const byKey = new Map(blocks.map((b) => [b.block_key, b]));

  return (
    <Card title="실험 구성 (조합)" subtitle="블록별 버전 선택 · gen_config 실시간" padding="p-4">
      <div className="flex items-center gap-2">
        <select
          className="h-9 flex-1 rounded-lg bg-white px-2.5 text-[12.5px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          value={selectedConfigId ?? ""}
          onChange={(e) => onSelectConfig(e.target.value)}
        >
          <option value="" disabled>
            조합 선택…
          </option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="copy" className="h-3.5 w-3.5" />}
          onClick={onDuplicate}
          disabled={!selectedConfigId}
        >
          복제
        </Button>
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-[11.5px] font-medium text-ink-600">조합 이름</span>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="조합 이름" />
      </div>

      <div className="mt-3 space-y-1.5">
        {BLOCK_ORDER.map((key) => {
          const block = byKey.get(key);
          if (!block) return null;
          const isParam = block.block_type === "param";
          const isBand = block.block_type === "band";
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-8 shrink-0 font-mono text-[11px] font-semibold text-ink-700">
                {key}
              </span>
              <span className="w-11 shrink-0 text-[10px] text-ink-400">
                {BLOCK_TYPE_LABEL[block.block_type]}
              </span>
              <select
                className={selectCls}
                value={mapping[key] ?? ""}
                onChange={(e) => onMappingChange({ ...mapping, [key]: e.target.value })}
              >
                {block.versions.length === 0 && <option value="">(버전 없음)</option>}
                {block.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {isBand ? `${v.band ?? "-"} · ${v.version_label}` : v.version_label}
                  </option>
                ))}
              </select>
              {isBand && (
                <span className="shrink-0 text-[10px] text-ink-400" title="B1은 실행 시 exam_level 밴드로 결정">
                  <Icon name="info" className="h-3 w-3" />
                </span>
              )}
              {isParam && <span className="w-3 shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-ink-900 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-white/40">gen_config</div>
        <div className="mt-0.5 break-all font-mono text-[11.5px] text-brand-200">
          {genConfig || "—"}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Button
          variant="brand"
          size="sm"
          icon={<Icon name="save" className="h-3.5 w-3.5" />}
          onClick={onSave}
          disabled={saving || !selectedConfigId || !dirty}
        >
          {saving ? "저장 중…" : dirty ? "저장" : "저장됨"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="addList" className="h-3.5 w-3.5" />}
          onClick={onSaveAsNew}
          disabled={saving}
        >
          새 조합으로 저장
        </Button>
      </div>
    </Card>
  );
}
