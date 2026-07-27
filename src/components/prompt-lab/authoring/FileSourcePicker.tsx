"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  collectFileSources,
  fetchFileSourcePreview,
  listFileSourceEntries,
  type FileSourceEntryApi,
  type FileSourcePreviewApi,
} from "@/lib/api";

function fmtSize(n: number | null): string {
  if (n == null) return "";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

/** 여러 파일/폴더를 합쳐 만든 교안 자료 선택 결과. */
export interface PickedSelection {
  content: string;
  files: { name: string; path: string; truncated: boolean }[];
  truncated: boolean;
  skipped: string[];
}

type PickedItem = { name: string; type: "dir" | "file" };

export function FileSourcePicker({
  onPick,
  onClose,
}: {
  onPick: (selection: PickedSelection) => void;
  onClose: () => void;
}) {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<FileSourceEntryApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileSourcePreviewApi | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // 선택 바구니: 경로 → {이름, 종류}. 폴더를 담으면 수집 시 내부 텍스트 파일을 재귀로 가져온다.
  const [picked, setPicked] = useState<Record<string, PickedItem>>({});
  const [collecting, setCollecting] = useState(false);

  const loadDir = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await listFileSourceEntries("local", target);
      setEntries(res.entries);
      setPath(res.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "폴더를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDir("");
  }, [loadDir]);

  const openFile = async (entry: FileSourceEntryApi) => {
    setPreviewLoading(true);
    setError(null);
    try {
      setPreview(await fetchFileSourcePreview("local", entry.path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "미리보기 실패");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggle = (entry: FileSourceEntryApi) => {
    setPicked((cur) => {
      const next = { ...cur };
      if (next[entry.path]) delete next[entry.path];
      else next[entry.path] = { name: entry.name, type: entry.type };
      return next;
    });
  };

  const removePicked = (p: string) => {
    setPicked((cur) => {
      const next = { ...cur };
      delete next[p];
      return next;
    });
  };

  const pickedPaths = Object.keys(picked);

  const useSelection = async () => {
    if (pickedPaths.length === 0) return;
    setCollecting(true);
    setError(null);
    try {
      const res = await collectFileSources("local", pickedPaths);
      if (res.files.length === 0) {
        setError(
          "선택 항목에서 사용할 텍스트 파일을 찾지 못했습니다. (MD·TXT·CSV·JSON 등 텍스트 파일이 필요)",
        );
        return;
      }
      onPick({
        content: res.combined,
        files: res.files.map((f) => ({ name: f.name, path: f.path, truncated: f.truncated })),
        truncated: res.truncated,
        skipped: res.skipped,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "자료 수집 실패");
    } finally {
      setCollecting(false);
    }
  };

  const segments = path ? path.split("/") : [];
  const crumbTo = (idx: number) => segments.slice(0, idx + 1).join("/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex h-[76vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-surface-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="bank" className="h-4 w-4 text-brand-600" />
            <span className="text-[14px] font-semibold text-ink-900">자료실에서 교안 선택 (여러 개 가능)</span>
            <Badge tone="neutral">local</Badge>
          </div>
          <Button variant="ghost" size="sm" icon={<Icon name="x" className="h-4 w-4" />} onClick={onClose}>
            닫기
          </Button>
        </div>

        {/* 브레드크럼 + 현재 폴더 통째 담기 */}
        <div className="flex flex-wrap items-center gap-1 border-b border-surface-200 bg-surface-50 px-5 py-2 text-[12px]">
          <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => loadDir("")}>
            루트
          </button>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <Icon name="chevronR" className="h-3 w-3 text-ink-400" />
              <button
                type="button"
                className="text-ink-700 hover:underline"
                onClick={() => loadDir(crumbTo(i))}
              >
                {seg}
              </button>
            </span>
          ))}
          {path && (
            <button
              type="button"
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50"
              onClick={() => setPicked((cur) => ({ ...cur, [path]: { name: segments[segments.length - 1] || path, type: "dir" } }))}
              title="이 폴더 안의 모든 텍스트 파일을 선택에 추가"
            >
              <Icon name="layers" className="h-3.5 w-3.5" /> 이 폴더 전체 추가
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1">
          {/* 파일 목록 */}
          <div className="scrollbar-thin w-[44%] shrink-0 overflow-y-auto border-r border-surface-200 p-2">
            {loading ? (
              <div className="grid h-full place-items-center">
                <div className="spin h-6 w-6 rounded-full border-2 border-brand-100 border-t-brand-600" />
              </div>
            ) : entries.length === 0 ? (
              <p className="p-4 text-[12px] text-ink-500">비어 있는 폴더입니다.</p>
            ) : (
              entries.map((entry) => {
                const isDir = entry.type === "dir";
                const active = preview?.path === entry.path;
                const checked = !!picked[entry.path];
                return (
                  <div
                    key={entry.path}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                      active ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-100"
                    }`}
                  >
                    {/* 체크박스 (파일·폴더 모두 선택 가능) */}
                    <button
                      type="button"
                      onClick={() => toggle(entry)}
                      title={checked ? "선택 해제" : isDir ? "폴더 전체 선택" : "선택"}
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded ring-1 ring-inset transition ${
                        checked
                          ? "bg-brand-600 text-white ring-brand-600"
                          : "bg-white text-transparent ring-surface-300 hover:ring-brand-400"
                      }`}
                    >
                      <Icon name="check" className="h-2.5 w-2.5" />
                    </button>
                    {/* 이름: 폴더면 이동, 파일이면 미리보기 */}
                    <button
                      type="button"
                      onClick={() => (isDir ? loadDir(entry.path) : openFile(entry))}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Icon
                        name={isDir ? "layers" : "file"}
                        className={`h-4 w-4 shrink-0 ${isDir ? "text-amber-500" : "text-ink-400"}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-800">{entry.name}</span>
                      {isDir ? (
                        <Icon name="chevronR" className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                      ) : (
                        <span className="shrink-0 font-mono text-[10px] text-ink-400">{fmtSize(entry.size)}</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 미리보기 */}
          <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-4">
            {error && <p className="mb-2 text-[12.5px] text-rose-600">{error}</p>}
            {previewLoading ? (
              <div className="grid h-full place-items-center">
                <div className="spin h-6 w-6 rounded-full border-2 border-brand-100 border-t-brand-600" />
              </div>
            ) : preview ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-ink-900">{preview.name}</span>
                  <Button
                    variant={picked[preview.path] ? "secondary" : "brand"}
                    size="sm"
                    icon={<Icon name={picked[preview.path] ? "check" : "plus"} className="h-3.5 w-3.5" />}
                    disabled={!preview.previewable}
                    onClick={() =>
                      setPicked((cur) => {
                        const next = { ...cur };
                        if (next[preview.path]) delete next[preview.path];
                        else next[preview.path] = { name: preview.name, type: "file" };
                        return next;
                      })
                    }
                  >
                    {picked[preview.path] ? "선택됨" : "선택에 추가"}
                  </Button>
                </div>
                {preview.previewable ? (
                  <>
                    {preview.truncated && (
                      <p className="mb-1 text-[11px] text-amber-700">
                        미리보기가 최대 길이에서 잘렸습니다. 잘린 내용까지만 사용됩니다.
                      </p>
                    )}
                    <pre className="whitespace-pre-wrap rounded-lg bg-surface-50 p-3 font-mono text-[11px] leading-5 text-ink-800 ring-1 ring-surface-200">
                      {preview.content || "(빈 파일)"}
                    </pre>
                  </>
                ) : (
                  <p className="rounded-lg bg-amber-50 p-3 text-[12px] text-amber-800 ring-1 ring-amber-200">
                    텍스트로 미리보기할 수 없는 형식입니다({preview.ext || "?"}). 교안 자료로는 MD·TXT·CSV·JSON
                    같은 텍스트 파일을 선택하세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center">
                <p className="max-w-xs text-[12.5px] text-ink-500">
                  왼쪽에서 체크박스로 여러 파일을 선택하거나, 폴더를 통째로 담을 수 있습니다. 파일 이름을
                  누르면 내용 미리보기가 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 선택 바구니 + 실행 */}
        <div className="border-t border-surface-200 bg-surface-50 px-5 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {pickedPaths.length === 0 ? (
                <p className="text-[12px] text-ink-500">선택된 자료가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {pickedPaths.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11.5px] text-ink-700 ring-1 ring-inset ring-surface-300"
                    >
                      <Icon
                        name={picked[p].type === "dir" ? "layers" : "file"}
                        className={`h-3 w-3 ${picked[p].type === "dir" ? "text-amber-500" : "text-ink-400"}`}
                      />
                      <span className="max-w-[180px] truncate">{picked[p].name}</span>
                      <button type="button" onClick={() => removePicked(p)} className="text-ink-400 hover:text-rose-600">
                        <Icon name="x" className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="brand"
              size="sm"
              icon={<Icon name="check" className="h-3.5 w-3.5" />}
              disabled={pickedPaths.length === 0 || collecting}
              onClick={useSelection}
            >
              {collecting ? "수집 중…" : `선택 자료 사용${pickedPaths.length ? ` (${pickedPaths.length})` : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
