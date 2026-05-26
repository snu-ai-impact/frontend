"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Card } from "@/components/ui/Card";
import type { ReferenceFileItem } from "@/lib/types";

const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const ACCEPT_EXT = [".pdf", ".txt"] as const;
const ACCEPT_MIME = new Set([
  "application/pdf",
  "application/json",
  "text/plain",
  "text/markdown",
]);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "FILE";
}

function isAllowed(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (ACCEPT_EXT.some((e) => e === ext)) return true;
  return ACCEPT_MIME.has(file.type);
}

interface ReferenceMaterialsInputProps {
  files: ReferenceFileItem[];
  onChange: (files: ReferenceFileItem[]) => void;
}

export function ReferenceMaterialsInput({ files, onChange }: ReferenceMaterialsInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (!list.length) return;

      const next = [...files];
      const errors: string[] = [];
      let totalBytes = next.reduce((sum, item) => sum + item.size, 0);

      for (const file of list) {
        if (!isAllowed(file)) {
          errors.push(`"${file.name}": PDF · JSON · TXT · MD만 업로드할 수 있습니다.`);
          continue;
        }
        if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
        if (totalBytes + file.size > MAX_TOTAL_BYTES) {
          errors.push("참고자료 총합은 최대 200MB까지 업로드할 수 있습니다.");
          continue;
        }
        totalBytes += file.size;
        next.push({
          file,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        });
      }

      setError(errors.length ? errors[0] : null);
      if (next.length !== files.length) onChange(next);
    },
    [files, onChange],
  );

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <Card
      title="참고자료"
      subtitle="업로드한 자료는 API 호출 시 첨부됩니다."
      padding="p-0"
    >
      <div className="px-5 py-5">
        <div
          role="button"
          tabIndex={0}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget === e.target) setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 transition ${
            dragOver
              ? "border-brand-400 bg-brand-50/50"
              : "border-surface-300 bg-surface-50/40 hover:border-surface-400 hover:bg-surface-50"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-white text-ink-500 ring-1 ring-surface-200">
            <Icon name="upload" className="h-5 w-5" />
          </span>
          <p className="text-center text-[13px] text-ink-700">
            참고자료를 드래그하거나{" "}
            <label
              htmlFor={inputId}
              className="font-medium text-brand-600 hover:text-brand-700"
              onClick={(e) => e.stopPropagation()}
            >
              파일 선택
            </label>
          </p>
          <p className="mt-1.5 text-[11.5px] text-ink-500">PDF · TXT · 총합 최대 200MB</p>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_EXT.join(",")}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {error && <p className="mt-2 text-[12px] text-rose-600">{error}</p>}

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}`}
                className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-surface-200"
              >
                <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                  {fileExtension(file.name)}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-900">
                  {file.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-ink-500">
                  {formatSize(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={`${file.name} 제거`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-500 transition hover:bg-surface-100 hover:text-ink-800"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
