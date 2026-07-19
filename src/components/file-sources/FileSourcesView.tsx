"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import {
  createFileSourceFolder,
  fetchFileSourcePreview,
  listFileSourceEntries,
  listFileSourceProviders,
  uploadFileSourceFiles,
  type FileSourceEntryApi,
  type FileSourcePreviewApi,
  type FileSourceProviderApi,
} from "@/lib/api";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

function parentPath(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(0, idx) : "";
}

export function FileSourcesView() {
  const [providers, setProviders] = useState<FileSourceProviderApi[]>([]);
  const [provider, setProvider] = useState("local");
  const [path, setPath] = useState("");
  const [root, setRoot] = useState("");
  const [entries, setEntries] = useState<FileSourceEntryApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileSourcePreviewApi | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWrite = !!providers.find((p) => p.id === provider)?.writable;

  useEffect(() => {
    listFileSourceProviders()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFileSourceEntries(provider, path);
      setEntries(data.entries);
      setRoot(data.root);
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [provider, path]);

  useEffect(() => {
    // 마운트/경로 변경 시 목록 로드 (로딩 상태 표시를 위한 의도된 setState).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const openFile = useCallback(
    async (entry: FileSourceEntryApi) => {
      setSelected(entry.path);
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(true);
      try {
        const data = await fetchFileSourcePreview(provider, entry.path);
        setPreview(data);
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : "미리보기를 불러오지 못했습니다.");
      } finally {
        setPreviewLoading(false);
      }
    },
    [provider],
  );

  const goTo = (next: string) => {
    setPath(next);
    setSelected(null);
    setPreview(null);
    setCreating(false);
    setActionError(null);
  };

  const submitFolder = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setActionError(null);
    try {
      await createFileSourceFolder(provider, path, name);
      setNewName("");
      setCreating(false);
      await loadEntries();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "폴더 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    e.target.value = ""; // 같은 파일을 다시 선택할 수 있도록 초기화
    setBusy(true);
    setActionError(null);
    try {
      await uploadFileSourceFiles(provider, path, files);
      await loadEntries();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const crumbs = path ? path.split("/") : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-6">
      {/* 프로바이더 선택 */}
      <div className="flex items-center gap-2">
        {providers.map((p) => {
          const active = p.id === provider;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!p.available}
              onClick={() => {
                if (!p.available) return;
                setProvider(p.id);
                goTo("");
              }}
              title={p.available ? undefined : "준비 중"}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium ring-1 ring-inset transition ${
                active
                  ? "bg-brand-600 text-white ring-brand-600"
                  : p.available
                    ? "bg-white text-ink-700 ring-surface-300 hover:bg-surface-100"
                    : "cursor-not-allowed bg-surface-100 text-ink-400 ring-surface-200"
              }`}
            >
              {p.label}
              {!p.available && <span className="text-[9.5px]">Soon</span>}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          {root && (
            <span className="hidden font-mono text-[11px] text-ink-400 lg:inline">{root}</span>
          )}
          <button
            type="button"
            onClick={loadEntries}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white text-ink-600 ring-1 ring-inset ring-surface-300 transition hover:bg-surface-100"
            title="새로고침"
          >
            <Icon name="refresh" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 경로 브레드크럼 */}
      <div className="flex items-center gap-1 text-[12.5px] text-ink-600">
        <button
          type="button"
          onClick={() => goTo("")}
          className="rounded px-1.5 py-0.5 font-medium hover:bg-surface-100 hover:text-ink-900"
        >
          루트
        </button>
        {crumbs.map((seg, i) => {
          const target = crumbs.slice(0, i + 1).join("/");
          return (
            <span key={target} className="flex items-center gap-1">
              <Icon name="chevronR" className="h-3.5 w-3.5 text-ink-300" />
              <button
                type="button"
                onClick={() => goTo(target)}
                className="rounded px-1.5 py-0.5 hover:bg-surface-100 hover:text-ink-900"
              >
                {seg}
              </button>
            </span>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* 파일 목록 */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-surface-200">
          <div className="flex items-center justify-between gap-2 border-b border-surface-200 px-4 py-2.5">
            <span className="shrink-0 text-[12px] font-semibold text-ink-700">
              파일 {entries.length > 0 && <span className="text-ink-400">· {entries.length}</span>}
            </span>
            <div className="flex items-center gap-1.5">
              {canWrite && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setCreating((v) => !v);
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-ink-600 ring-1 ring-inset ring-surface-300 hover:bg-surface-100"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" /> 새 폴더
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-ink-600 ring-1 ring-inset ring-surface-300 hover:bg-surface-100 disabled:opacity-50"
                  >
                    <Icon name="upload" className="h-3.5 w-3.5" /> {busy ? "처리 중…" : "업로드"}
                  </button>
                  <input ref={fileInputRef} type="file" multiple hidden onChange={onPickFiles} />
                </>
              )}
              {path && (
                <button
                  type="button"
                  onClick={() => goTo(parentPath(path))}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[11.5px] text-ink-500 hover:bg-surface-100 hover:text-ink-800"
                >
                  <Icon name="arrowUp" className="h-3.5 w-3.5" /> 상위
                </button>
              )}
            </div>
          </div>

          {creating && canWrite && (
            <div className="flex items-center gap-2 border-b border-surface-200 bg-surface-50 px-4 py-2">
              <Icon name="layers" className="h-4 w-4 shrink-0 text-brand-500" />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitFolder();
                  if (e.key === "Escape") setCreating(false);
                }}
                placeholder={`새 폴더 이름${path ? ` (${path} 안)` : ""}`}
                className="h-7 min-w-0 flex-1 rounded-md bg-white px-2 text-[12.5px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-brand-400"
              />
              <button
                type="button"
                disabled={busy || !newName.trim()}
                onClick={submitFolder}
                className="h-7 shrink-0 rounded-md bg-brand-600 px-2.5 text-[11.5px] font-medium text-white disabled:opacity-50"
              >
                생성
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="h-7 shrink-0 rounded-md px-2 text-[11.5px] text-ink-500 hover:bg-surface-100"
              >
                취소
              </button>
            </div>
          )}

          {actionError && (
            <div className="flex items-start gap-2 border-b border-surface-200 bg-red-50 px-4 py-2 text-[11.5px] text-red-700">
              <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-[12.5px] text-ink-400">불러오는 중…</div>
            ) : error ? (
              <div className="m-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[12px] text-red-700 ring-1 ring-red-100">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-6 text-center text-[12.5px] text-ink-400">폴더가 비어 있습니다.</div>
            ) : (
              <ul className="divide-y divide-surface-100">
                {entries.map((entry) => {
                  const isDir = entry.type === "dir";
                  const isSelected = entry.path === selected;
                  return (
                    <li key={entry.path}>
                      <button
                        type="button"
                        onClick={() => (isDir ? goTo(entry.path) : openFile(entry))}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                          isSelected ? "bg-brand-50" : "hover:bg-surface-50"
                        }`}
                      >
                        <Icon
                          name={isDir ? "layers" : "file"}
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isDir ? "text-brand-500" : "text-ink-400"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink-800">
                            {entry.name}
                          </span>
                          {!isDir && (
                            <span className="text-[11px] text-ink-400">
                              {formatBytes(entry.size)}
                              {entry.ext && ` · ${entry.ext.replace(".", "").toUpperCase()}`}
                            </span>
                          )}
                        </span>
                        {isDir ? (
                          <Icon name="chevronR" className="h-4 w-4 shrink-0 text-ink-300" />
                        ) : entry.generatable ? (
                          <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            생성 가능
                          </span>
                        ) : (
                          <span className="shrink-0 rounded bg-surface-100 px-1.5 py-0.5 text-[9.5px] font-medium text-ink-400">
                            미지원
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-white ring-1 ring-surface-200">
          {!selected ? (
            <div className="grid flex-1 place-items-center p-6 text-center text-[12.5px] text-ink-400">
              <div>
                <Icon name="file" className="mx-auto h-8 w-8 text-ink-200" />
                <p className="mt-2">파일을 선택하면 내용을 미리볼 수 있습니다.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-surface-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-800">
                    {preview?.name ?? selected}
                  </span>
                  {preview?.generatable && (
                    <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      생성 가능
                    </span>
                  )}
                </div>
                {preview && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-400">
                    <span>{preview.ext.replace(".", "").toUpperCase() || "FILE"}</span>
                    <span>·</span>
                    <span>{formatBytes(preview.size)}</span>
                    {preview.truncated && <span className="text-amber-600">· 일부만 표시</span>}
                  </div>
                )}
              </div>

              <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4">
                {previewLoading ? (
                  <div className="text-center text-[12.5px] text-ink-400">불러오는 중…</div>
                ) : previewError ? (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[12px] text-red-700 ring-1 ring-red-100">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                ) : preview && !preview.previewable ? (
                  <div className="flex items-start gap-2 rounded-lg bg-surface-50 p-3 text-[12px] text-ink-500 ring-1 ring-surface-200">
                    <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>텍스트가 아닌 파일이라 미리보기를 지원하지 않습니다. 문항 생성 참고자료로는 사용할 수 있습니다.</span>
                  </div>
                ) : preview ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-700">
                    {preview.content}
                  </pre>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
