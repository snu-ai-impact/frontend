"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
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

export interface PickedFile {
  content: string;
  name: string;
  path: string;
  truncated: boolean;
}

export function FileSourcePicker({
  onPick,
  onClose,
}: {
  onPick: (file: PickedFile) => void;
  onClose: () => void;
}) {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<FileSourceEntryApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileSourcePreviewApi | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
            <span className="text-[14px] font-semibold text-ink-900">자료실에서 교안 선택</span>
            <Badge tone="neutral">local</Badge>
          </div>
          <Button variant="ghost" size="sm" icon={<Icon name="x" className="h-4 w-4" />} onClick={onClose}>
            닫기
          </Button>
        </div>

        {/* 브레드크럼 */}
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
                const selected = preview?.path === entry.path;
                return (
                  <button
                    key={entry.path}
                    type="button"
                    onClick={() => (isDir ? loadDir(entry.path) : openFile(entry))}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                      selected ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-100"
                    }`}
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
                    variant="brand"
                    size="sm"
                    icon={<Icon name="check" className="h-3.5 w-3.5" />}
                    disabled={!preview.previewable || !preview.content.trim()}
                    onClick={() =>
                      onPick({
                        content: preview.content,
                        name: preview.name,
                        path: preview.path,
                        truncated: preview.truncated,
                      })
                    }
                  >
                    이 자료 사용
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
                  왼쪽에서 폴더를 열고 텍스트 교안 파일을 선택하면 내용이 여기에 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
