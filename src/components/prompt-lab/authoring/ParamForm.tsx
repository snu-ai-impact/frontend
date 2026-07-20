"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Card, Input, Textarea } from "@/components/ui/Card";
import { FileSourcePicker, type PickedFile } from "./FileSourcePicker";
import {
  COGNITIVE_BY_BOUNDARY_INDEX,
  COGNITIVE_DEMANDS,
  DEFAULT_CRITERION_WEIGHTS,
  DOMAIN_LABELS,
  DOMAINS,
  EXAM_LEVELS,
  INDUSTRIES,
  TARGET_BOUNDARIES,
  TARGET_P_BAND,
  TASK_TYPES,
  boundaryCut,
  boundaryTooltip,
  defaultTargetP,
} from "@/lib/authoring-constants";
import type { ExamLevel } from "@/lib/authoring-constants";
import type { GenParams, PromptType } from "@/lib/authoring-types";

export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number | null;
}

const MODEL_OPTIONS = [{ key: "gemini-3.5-flash", label: "Gemini 3.5 Flash" }];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-ink-600">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "h-9 w-full rounded-lg bg-white px-2.5 text-[12.5px] text-ink-900 ring-1 ring-inset ring-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

export function ParamForm({
  promptType = "mcq",
  params,
  onParamsChange,
  settings,
  onSettingsChange,
}: {
  promptType?: PromptType;
  params: GenParams;
  onParamsChange: (p: GenParams) => void;
  settings: ModelSettings;
  onSettingsChange: (s: ModelSettings) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const isSubjective = promptType === "subjective";
  const boundaries = TARGET_BOUNDARIES[(params.exam_level as ExamLevel) ?? "초급"] ?? [];

  const handlePick = (file: PickedFile) => {
    const stem = file.name.replace(/\.[^./]+$/, "");
    onParamsChange({
      ...params,
      curriculum_material: file.content,
      // 교안 ID 가 비어 있으면 파일명으로 자동 채움 (출처 추적)
      curriculum_id: params.curriculum_id.trim() ? params.curriculum_id : stem,
    });
    setSourceLabel(file.name);
    setPickerOpen(false);
  };

  const handleExamLevel = (exam_level: string) => {
    if (isSubjective) {
      // 주관식은 exam_level 이 과제 복잡도·루브릭 상한만 결정 (경계 없음)
      onParamsChange({ ...params, exam_level });
      return;
    }
    const opts = TARGET_BOUNDARIES[exam_level as ExamLevel] ?? [];
    const target_boundary = opts[0] ?? "";
    // exam_level 변경 → boundary 옵션 갱신 + cognitive·목표정답률 기본값 재세팅 (B1 밴드는 백엔드 런타임 결정)
    onParamsChange({
      ...params,
      exam_level,
      target_boundary,
      cognitive_demand: COGNITIVE_BY_BOUNDARY_INDEX[0],
      target_p: defaultTargetP(target_boundary),
    });
  };

  const handleBoundary = (target_boundary: string) => {
    const idx = boundaries.indexOf(target_boundary);
    const cognitive_demand =
      idx >= 0 ? COGNITIVE_BY_BOUNDARY_INDEX[idx] ?? params.cognitive_demand : params.cognitive_demand;
    onParamsChange({
      ...params,
      target_boundary,
      cognitive_demand,
      target_p: defaultTargetP(target_boundary),
    });
  };

  const set = (patch: Partial<GenParams>) => onParamsChange({ ...params, ...patch });

  return (
    <Card
      title="파라미터 폼"
      subtitle={isSubjective ? "주관식 호출별 입력" : "객관식 호출별 입력 (§4)"}
      padding="p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="시험 (exam_level)">
          <select
            className={selectCls}
            value={params.exam_level}
            onChange={(e) => handleExamLevel(e.target.value)}
          >
            {EXAM_LEVELS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        {isSubjective ? (
          <Field label="과제 유형 (task_type)">
            <select
              className={selectCls}
              value={params.task_type}
              onChange={(e) => set({ task_type: e.target.value })}
            >
              {TASK_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="타겟 경계 (target_boundary)">
            <select
              className={selectCls}
              value={params.target_boundary}
              onChange={(e) => handleBoundary(e.target.value)}
              title={params.target_boundary ? boundaryTooltip(params.target_boundary) : undefined}
            >
              {boundaries.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {!isSubjective && params.target_boundary && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
          <Icon name="info" className="h-3 w-3" />
          {boundaryTooltip(params.target_boundary)}
        </p>
      )}

      {/* 유형별 변별 파라미터 */}
      {isSubjective ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="무대 산업 (industry)">
            <select
              className={selectCls}
              value={params.industry}
              onChange={(e) => set({ industry: e.target.value })}
            >
              {INDUSTRIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="문항 배점 (item_points)">
            <Input
              type="number"
              min="1"
              value={params.item_points}
              onChange={(e) => set({ item_points: Number(e.target.value) })}
            />
          </Field>

          <div className="col-span-2">
            <Field label="기준 가중치 (criterion_weights)">
              <Input
                value={params.criterion_weights}
                onChange={(e) => set({ criterion_weights: e.target.value })}
                placeholder={DEFAULT_CRITERION_WEIGHTS}
              />
              <span className="mt-0.5 block text-[10.5px] text-ink-400">
                맥락·출력·가드레일·워크플로 가중치 (합 = 배점)
              </span>
            </Field>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="인지 요구 (cognitive_demand)">
            <select
              className={selectCls}
              value={params.cognitive_demand}
              onChange={(e) => set({ cognitive_demand: e.target.value })}
            >
              {COGNITIVE_DEMANDS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="영역 (domain)">
            <select
              className={selectCls}
              value={params.domain}
              onChange={(e) => set({ domain: e.target.value })}
            >
              {DOMAINS.map((v) => (
                <option key={v} value={v}>
                  {DOMAIN_LABELS[v]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="목표 정답률 % (난이도)">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="5"
                max="98"
                value={params.target_p}
                onChange={(e) => set({ target_p: Number(e.target.value) })}
              />
              <span className="text-[12px] text-ink-500">%</span>
            </div>
            {(() => {
              const cut = boundaryCut(params.target_boundary);
              const band = cut ? TARGET_P_BAND[cut] : null;
              return band ? (
                <span className="mt-0.5 block text-[10.5px] text-ink-400">
                  경계 권장 p {band} · 낮출수록 어려움
                </span>
              ) : null;
            })()}
          </Field>
        </div>
      )}

      {/* 공용 출처 필드 */}
      <div className="mt-3">
        <Field label="교안 ID (curriculum_id)">
          <Input
            value={params.curriculum_id}
            onChange={(e) => set({ curriculum_id: e.target.value })}
            placeholder="예: MERITZ-BASIC-01"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="회피 소재 (avoid_list · 줄 단위, 비면 '없음')">
          <Textarea
            rows={2}
            value={params.avoid_list}
            onChange={(e) => set({ avoid_list: e.target.value })}
            className="text-[12.5px]"
            placeholder="기출·중복 방지 소재를 줄 단위로"
          />
        </Field>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11.5px] font-medium text-ink-600">교안 자료 (curriculum_material · 필수)</span>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="bank" className="h-3.5 w-3.5" />}
            onClick={() => setPickerOpen(true)}
          >
            자료실에서 자료 선택
          </Button>
        </div>
        {sourceLabel && (
          <p className="mb-1 flex items-center gap-1 text-[11px] text-ink-500">
            <Icon name="file" className="h-3 w-3" />
            불러온 자료: {sourceLabel}
            <button
              type="button"
              className="ml-1 text-ink-400 hover:text-ink-700"
              onClick={() => setSourceLabel(null)}
              title="출처 표시 지우기"
            >
              <Icon name="x" className="h-3 w-3" />
            </button>
          </p>
        )}
        <Textarea
          rows={6}
          value={params.curriculum_material}
          onChange={(e) => {
            set({ curriculum_material: e.target.value });
            if (sourceLabel) setSourceLabel(null);
          }}
          className="text-[12.5px]"
          placeholder="자료실에서 교안 자료 하나를 불러오세요 (직접 붙여넣기도 가능)"
        />
        {!params.curriculum_material.trim() && (
          <p className="mt-1 text-[11px] text-rose-600">교안 자료가 비어 있으면 실행할 수 없습니다.</p>
        )}
      </div>

      {pickerOpen && <FileSourcePicker onPick={handlePick} onClose={() => setPickerOpen(false)} />}

      <div className="mt-4 border-t border-surface-200 pt-3">
        <div className="mb-2 text-[11.5px] font-semibold text-ink-600">모델 설정</div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="모델">
            <select
              className={selectCls}
              value={settings.model}
              onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="temperature">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={settings.temperature}
              onChange={(e) =>
                onSettingsChange({ ...settings, temperature: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="max_tokens">
            <Input
              type="number"
              min="1"
              value={settings.maxTokens ?? ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  maxTokens: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="기본값"
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}
