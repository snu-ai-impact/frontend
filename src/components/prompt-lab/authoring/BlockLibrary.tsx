"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Input, Textarea } from "@/components/ui/Card";
import { createBlockVersion } from "@/lib/authoring-api";
import { BLOCK_TYPE_LABEL } from "@/lib/authoring-constants";
import type { Block, BlockVersion } from "@/lib/authoring-types";

type DiffRow = { type: "same" | "add" | "del"; text: string };

function lineDiff(a: string, b: string): DiffRow[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const m = A.length;
  const n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      rows.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "del", text: A[i] });
      i++;
    } else {
      rows.push({ type: "add", text: B[j] });
      j++;
    }
  }
  while (i < m) rows.push({ type: "del", text: A[i++] });
  while (j < n) rows.push({ type: "add", text: B[j++] });
  return rows;
}

const BANDS = ["초급", "중급", "고급"];

export function BlockLibrary({
  blocks,
  onBlocksChange,
  promptType = "mcq",
}: {
  blocks: Block[];
  onBlocksChange: (next: Block[]) => void;
  promptType?: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(blocks[0]?.block_key ?? null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [diffA, setDiffA] = useState<string | null>(null);
  const [diffB, setDiffB] = useState<string | null>(null);

  const [draftLabel, setDraftLabel] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftBand, setDraftBand] = useState("초급");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const block = useMemo(
    () => blocks.find((b) => b.block_key === selectedKey) ?? null,
    [blocks, selectedKey],
  );
  const versions = block?.versions ?? [];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null;

  const selectBlock = (key: string) => {
    setSelectedKey(key);
    setSelectedVersionId(null);
    setEditing(false);
    setDiffMode(false);
    setDiffA(null);
    setDiffB(null);
    setError(null);
  };

  const startEdit = (from: BlockVersion) => {
    setDraftLabel("");
    setDraftContent(from.content);
    setDraftNotes("");
    setDraftBand(from.band ?? "초급");
    setEditing(true);
    setError(null);
  };

  // 모든 블록 공용 "새 버전 만들기" 진입점.
  // 선택된 버전이 있으면 그 내용을 시드로 깔고 부모로 연결(파생), 없으면 빈 버전.
  const startNew = () => {
    setDraftLabel("");
    setDraftContent(selectedVersion?.content ?? "");
    setDraftNotes("");
    setDraftBand(selectedVersion?.band ?? (block?.block_type === "band" ? "중급" : "초급"));
    setEditing(true);
    setError(null);
  };

  const saveVersion = async () => {
    if (!block || !draftLabel.trim()) {
      setError("새 버전 라벨을 입력하세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await createBlockVersion(block.block_key, {
        version_label: draftLabel.trim(),
        content: draftContent,
        band: block.block_type === "band" ? draftBand : null,
        parent_version_id: selectedVersion?.id ?? null,
        notes: draftNotes || null,
      });
      onBlocksChange(blocks.map((b) => (b.block_key === updated.block_key ? updated : b)));
      setEditing(false);
      const newest = updated.versions[updated.versions.length - 1];
      setSelectedVersionId(newest?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "버전 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const toggleDiffPick = (id: string) => {
    if (diffA === id) return setDiffA(null);
    if (diffB === id) return setDiffB(null);
    if (!diffA) return setDiffA(id);
    if (!diffB) return setDiffB(id);
    setDiffA(id);
    setDiffB(null);
  };

  const diffRows =
    diffMode && diffA && diffB
      ? lineDiff(
          versions.find((v) => v.id === diffA)?.content ?? "",
          versions.find((v) => v.id === diffB)?.content ?? "",
        )
      : null;

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      {/* 블록 목록 */}
      <div className="scrollbar-thin w-[220px] shrink-0 min-h-0 overflow-y-auto border-r border-surface-200 p-3">
        <div className="px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
          {promptType === "subjective" ? "주관식" : "객관식"} 블록 {blocks.length}종
        </div>
        {blocks.map((b) => (
          <button
            key={b.block_key}
            type="button"
            onClick={() => selectBlock(b.block_key)}
            className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
              selectedKey === b.block_key ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-100"
            }`}
          >
            <span className="w-7 shrink-0 font-mono text-[11px] font-bold text-ink-700">
              {b.block_key}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-ink-800">
                {b.display_name}
              </span>
              <span className="text-[10px] text-ink-400">
                {BLOCK_TYPE_LABEL[b.block_type]} · {b.versions.length}버전
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* 버전 히스토리 */}
      <div className="scrollbar-thin w-[300px] shrink-0 min-h-0 overflow-y-auto border-r border-surface-200 p-3">
        {block && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink-800">
                {block.block_key} 버전 히스토리
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDiffMode((v) => !v);
                    setDiffA(null);
                    setDiffB(null);
                  }}
                  icon={<Icon name="layers" className="h-3.5 w-3.5" />}
                >
                  {diffMode ? "diff 종료" : "diff"}
                </Button>
              </div>
            </div>
            <Button
              variant={editing ? "ghost" : "secondary"}
              size="sm"
              className="mb-2 w-full"
              icon={<Icon name="plus" className="h-3.5 w-3.5" />}
              onClick={startNew}
            >
              {selectedVersion ? `이 버전 기반 새 버전` : "새 버전 만들기"}
            </Button>
            {versions.length === 0 && (
              <p className="rounded-lg bg-surface-50 p-3 text-[12px] text-ink-500 ring-1 ring-surface-200">
                버전이 없습니다. 위 “새 버전 만들기”로 첫 버전을 등록하세요
                {block.block_type === "band" ? " (밴드 초급·중급·고급을 각각 등록)" : ""}.
              </p>
            )}
            {versions.map((v) => {
              const picked = diffA === v.id || diffB === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => (diffMode ? toggleDiffPick(v.id) : setSelectedVersionId(v.id))}
                  className={`mb-1.5 block w-full rounded-lg px-3 py-2 text-left ring-1 transition ${
                    (diffMode ? picked : selectedVersionId === v.id)
                      ? "bg-brand-50 ring-brand-300"
                      : "bg-white ring-surface-200 hover:bg-surface-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[12px] font-semibold text-ink-800">
                      {v.version_label}
                    </span>
                    {v.band && <Badge tone="lightblue">{v.band}</Badge>}
                    {diffMode && picked && (
                      <span className="ml-auto text-[10px] font-bold text-brand-600">
                        {diffA === v.id ? "A" : "B"}
                      </span>
                    )}
                  </div>
                  {v.notes && <div className="mt-0.5 text-[11px] text-ink-500">{v.notes}</div>}
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-400">
                    <span>{new Date(v.created_at).toLocaleString("ko-KR")}</span>
                    {v.parent_version_id && (
                      <span className="inline-flex items-center gap-0.5">
                        <Icon name="chevronR" className="h-2.5 w-2.5" /> 파생
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* 내용 / 편집 / diff */}
      <div className="scrollbar-thin min-w-0 flex-1 min-h-0 overflow-y-auto p-4">
        {error && (
          <Card className="mb-3 ring-rose-200" padding="p-3">
            <p className="text-[12.5px] text-rose-700">{error}</p>
          </Card>
        )}

        {diffMode && (
          <Card title="버전 비교 (텍스트 diff)" subtitle="A·B 두 버전을 선택하세요" padding="p-0">
            {diffRows ? (
              <pre className="max-h-[70vh] overflow-auto scrollbar-thin px-4 py-3 font-mono text-[11px] leading-5">
                {diffRows.map((r, i) => (
                  <div
                    key={i}
                    className={
                      r.type === "add"
                        ? "bg-emerald-50 text-emerald-800"
                        : r.type === "del"
                          ? "bg-rose-50 text-rose-700"
                          : "text-ink-700"
                    }
                  >
                    <span className="select-none text-ink-400">
                      {r.type === "add" ? "+ " : r.type === "del" ? "- " : "  "}
                    </span>
                    {r.text || " "}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="p-4 text-[12.5px] text-ink-500">
                왼쪽 히스토리에서 비교할 두 버전을 클릭하세요.
              </p>
            )}
          </Card>
        )}

        {!diffMode && editing && block && (
          <Card title={`${block.block_key} 새 버전`} subtitle="원본 불변 · 새 version_label 로 저장" padding="p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-medium text-ink-600">version_label</span>
                <Input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} placeholder="예: v3-무배합표" />
              </label>
              {block.block_type === "band" && (
                <label className="block">
                  <span className="mb-1 block text-[11.5px] font-medium text-ink-600">band</span>
                  <select
                    className="h-10 w-full rounded-lg bg-white px-2.5 text-[13px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    value={draftBand}
                    onChange={(e) => setDraftBand(e.target.value)}
                  >
                    {BANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11.5px] font-medium text-ink-600">notes</span>
              <Input value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="변경 사유" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11.5px] font-medium text-ink-600">content</span>
              <Textarea
                rows={18}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="font-mono text-[11.5px]"
              />
            </label>
            {block.block_type !== "param" && (
              <p className="mt-1 text-[11px] text-amber-700">
                정적/밴드/예시 블록에는 {"{{슬롯}}"} 을 넣을 수 없습니다 (저장 시 차단).
              </p>
            )}
            <div className="mt-3 flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button
                variant="brand"
                size="sm"
                icon={<Icon name="save" className="h-3.5 w-3.5" />}
                onClick={saveVersion}
                disabled={saving}
              >
                {saving ? "저장 중…" : "새 버전 저장"}
              </Button>
            </div>
          </Card>
        )}

        {!diffMode && !editing && selectedVersion && (
          <Card
            title={`${block?.block_key} · ${selectedVersion.version_label}`}
            subtitle={selectedVersion.band ? `밴드 ${selectedVersion.band}` : undefined}
            padding="p-0"
            right={
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="edit" className="h-3.5 w-3.5" />}
                onClick={() => startEdit(selectedVersion)}
              >
                이 버전에서 편집
              </Button>
            }
          >
            <pre className="max-h-[70vh] overflow-auto scrollbar-thin whitespace-pre-wrap px-4 py-3 font-mono text-[11.5px] leading-5 text-ink-800">
              {selectedVersion.content}
            </pre>
          </Card>
        )}

        {!diffMode && !editing && !selectedVersion && (
          <div className="grid min-h-[300px] place-items-center text-center">
            <p className="text-[12.5px] text-ink-500">버전을 선택하면 내용이 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
