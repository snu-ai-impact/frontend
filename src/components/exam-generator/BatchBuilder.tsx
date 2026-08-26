"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Input, Textarea } from "@/components/ui/Card";
import {
  FileSourcePicker,
  type PickedSelection,
} from "@/components/prompt-lab/authoring/FileSourcePicker";
import { createBatchRun, previewBatch } from "@/lib/exam-batch-api";
import type { BatchParams, BatchRun } from "@/lib/exam-batch-types";
import { BatchResultView } from "./BatchResultView";
import {
  DIFFICULTIES,
  DOMAIN_LABELS,
  DOMAINS,
  EXAM_LEVELS,
  MODEL_OPTIONS,
} from "./constants";

const sel =
  "h-9 w-full rounded-md bg-white px-2 text-[12.5px] ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

const DEFAULT_PARAMS: BatchParams = {
  exam_level: "초급",
  domain: "P",
  difficulty_mix: { 하: 1, 중: 2, 상: 1 },
  avoid_list: "",
  curriculum_id: "",
  course_name: "",
  source_files: [],
  fewshot_enabled: true,
  curriculum_material: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-ink-500">{label}</span>
      {children}
    </label>
  );
}

export function BatchBuilder() {
  const [params, setParams] = useState<BatchParams>(DEFAULT_PARAMS);
  const [model, setModel] = useState(MODEL_OPTIONS[0].key);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | null>(16000);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [run, setRun] = useState<BatchRun | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const total =
    (params.difficulty_mix.하 || 0) +
    (params.difficulty_mix.중 || 0) +
    (params.difficulty_mix.상 || 0);
  const canRun = params.curriculum_material.trim().length > 0 && total >= 1;

  const set = (patch: Partial<BatchParams>) => setParams((p) => ({ ...p, ...patch }));
  const setMix = (k: "하" | "중" | "상", v: number) =>
    setParams((p) => ({ ...p, difficulty_mix: { ...p.difficulty_mix, [k]: Math.max(0, v) } }));

  const handlePick = (selection: PickedSelection) => {
    const first = selection.files[0];
    const stem = first ? first.name.replace(/\.[^./]+$/, "") : "";
    const count = selection.files.length;
    const label =
      count === 1
        ? first.name
        : `${count}개 파일 (${selection.files.slice(0, 3).map((f) => f.name).join(", ")}${count > 3 ? " 외" : ""})`;
    set({
      curriculum_material: selection.content,
      curriculum_id: params.curriculum_id.trim() ? params.curriculum_id : stem,
      // 투입 파일 전체(경로 포함) 저장 → 히스토리에서 폴더 구조 + md 파일명 표시
      source_files: selection.files.map((f) => ({ name: f.name, path: f.path })),
    });
    setSourceLabel(label);
    setPickerOpen(false);
  };

  const body = () => ({ params, model, temperature, max_tokens: maxTokens });

  const doRun = async () => {
    setRunning(true);
    setError(null);
    setPreviewText(null);
    try {
      const r = await createBatchRun(body());
      setRun(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setRunning(false);
    }
  };

  const doPreview = async () => {
    setError(null);
    try {
      const p = await previewBatch(body());
      setPreviewText(p.resolved_prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "미리보기 실패");
    }
  };

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      {/* 좌: 파라미터 */}
      <div className="scrollbar-thin w-[380px] shrink-0 min-h-0 overflow-y-auto border-r border-surface-200 bg-surface-50 p-4">
        <Card title="출제 파라미터" padding="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="시험 등급">
              <select className={sel} value={params.exam_level} onChange={(e) => set({ exam_level: e.target.value })}>
                {EXAM_LEVELS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="영역">
              <select className={sel} value={params.domain} onChange={(e) => set({ domain: e.target.value })}>
                {DOMAINS.map((v) => (
                  <option key={v} value={v}>{DOMAIN_LABELS[v]}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-[11.5px] font-medium text-ink-500">
              난이도 배합 <span className="text-ink-400">(총 {total}문항)</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <div key={d} className="flex items-center gap-1.5">
                  <span className="w-4 text-[12px] font-semibold text-ink-600">{d}</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-9 text-[12.5px]"
                    value={params.difficulty_mix[d]}
                    onChange={(e) => setMix(d, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Field label="회피 소재 (기출·중복 방지)">
              <Input
                className="h-9 text-[12.5px]"
                placeholder="없음 또는 목록"
                value={params.avoid_list}
                onChange={(e) => set({ avoid_list: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        {/* 교안 자료 */}
        <Card title="교안 자료" padding="p-4" className="mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="file" className="h-3.5 w-3.5" />}
              onClick={() => setPickerOpen(true)}
            >
              자료실에서 선택
            </Button>
            {sourceLabel && <Badge tone="brand">{sourceLabel}</Badge>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-[12px]"
              placeholder="교안 ID"
              value={params.curriculum_id}
              onChange={(e) => set({ curriculum_id: e.target.value })}
            />
            <Input
              className="h-8 text-[12px]"
              placeholder="강좌명"
              value={params.course_name}
              onChange={(e) => set({ course_name: e.target.value })}
            />
          </div>
          <Textarea
            rows={6}
            className="mt-2 text-[11.5px]"
            placeholder="교안 본문 (자료실에서 선택하거나 직접 붙여넣기)"
            value={params.curriculum_material}
            onChange={(e) => set({ curriculum_material: e.target.value })}
          />
          <p className="mt-1 text-[10.5px] text-ink-400">
            {params.curriculum_material.length.toLocaleString()}자
          </p>
        </Card>

        {/* 모델 설정 */}
        <Card title="모델 설정" padding="p-4" className="mt-3">
          <Field label="모델">
            <select className={sel} value={model} onChange={(e) => setModel(e.target.value)}>
              {MODEL_OPTIONS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="temperature">
              <Input
                type="number"
                step={0.1}
                min={0}
                max={1}
                className="h-9 text-[12.5px]"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </Field>
            <Field label="max_tokens">
              <Input
                type="number"
                min={0}
                className="h-9 text-[12.5px]"
                value={maxTokens ?? ""}
                onChange={(e) => setMaxTokens(e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
          </div>
          <p className="mt-2 text-[10.5px] text-ink-400">
            배치는 1회 호출로 전 문항을 생성합니다. 문항 수가 많으면 max_tokens를 넉넉히 두세요.
          </p>

          {/* few-shot 예시 주입 (작업2 A/B) */}
          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg bg-surface-50 p-2.5 ring-1 ring-surface-200">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={params.fewshot_enabled}
              onChange={(e) => set({ fewshot_enabled: e.target.checked })}
            />
            <span className="text-[11.5px] text-ink-600">
              <span className="font-semibold text-ink-800">영역 예시 주입(few-shot)</span> —{" "}
              {params.fewshot_enabled ? "켜짐 (F-{영역}-v1)" : "꺼짐 (F0)"}. 선택 영역의 우수 예시
              2개를 참조 기준으로 프롬프트에 주입합니다(소재 원천 아님). A/B 실험 시 껐다 켜세요.
            </span>
          </label>
        </Card>

        <div className="mt-3 flex gap-2">
          <Button variant="ghost" size="sm" onClick={doPreview} className="flex-1">
            프롬프트 미리보기
          </Button>
          <Button
            variant="brand"
            size="sm"
            icon={<Icon name="sparkles" className="h-3.5 w-3.5" />}
            onClick={doRun}
            disabled={!canRun || running}
            className="flex-1"
          >
            {running ? "생성 중…" : `${total}문항 생성`}
          </Button>
        </div>
        {!canRun && (
          <p className="mt-2 text-[11px] text-amber-700">교안 자료와 난이도 배합(≥1)을 채우세요.</p>
        )}
        {error && <p className="mt-2 text-[11.5px] text-rose-600">{error}</p>}
      </div>

      {/* 우: 결과 */}
      <div className="scrollbar-thin min-w-0 flex-1 min-h-0 overflow-y-auto p-4">
        {running ? (
          <div className="grid min-h-[300px] place-items-center">
            <div className="text-center">
              <div className="spin mx-auto h-8 w-8 rounded-full border-2 border-brand-100 border-t-brand-600" />
              <p className="mt-3 text-[12.5px] text-ink-500">배치 생성 중… (1회 호출로 {total}문항)</p>
            </div>
          </div>
        ) : previewText ? (
          <Card title="조립된 프롬프트 (미리보기)" padding="p-0">
            <pre className="scrollbar-thin max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 text-[11px] leading-5 text-ink-700">
              {previewText}
            </pre>
          </Card>
        ) : run ? (
          <BatchResultView run={run} />
        ) : (
          <div className="grid min-h-[300px] place-items-center text-center">
            <div className="max-w-sm">
              <Icon name="addList" className="mx-auto h-8 w-8 text-ink-300" />
              <p className="mt-2 text-[12.5px] text-ink-500">
                한 영역에서 여러 문항을 1회 호출로 생성합니다. 파라미터·교안·모델을 정하고 생성하세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {pickerOpen && <FileSourcePicker onPick={handlePick} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
