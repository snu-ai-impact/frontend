"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createConfig,
  createRun,
  duplicateConfig,
  previewAssembly,
  retryRun,
  updateConfig,
  updateReview,
} from "@/lib/authoring-api";
import type { AssemblyConfig, Block, GenParams, GenerationRun, PreviewResult } from "@/lib/authoring-types";
import { AssemblyConfigEditor } from "./AssemblyConfigEditor";
import { ParamForm, type ModelSettings } from "./ParamForm";
import { PreviewPanel } from "./PreviewPanel";
import { RunResultView } from "./RunResultView";

const DEFAULT_PARAMS: GenParams = {
  exam_level: "초급",
  target_boundary: "BM/BH(70)",
  cognitive_demand: "적용",
  domain: "E",
  target_p: 60,
  avoid_list: "",
  curriculum_id: "",
  topic_id: "",
  topic_name: "",
  curriculum_material: "",
};

const DEFAULT_SETTINGS: ModelSettings = {
  model: "gemini-3.5-flash",
  temperature: 1.0,
  maxTokens: null,
};

export function ExperimentBuilder({
  blocks,
  configs,
  onConfigsChange,
  onOpenRun,
}: {
  blocks: Block[];
  configs: AssemblyConfig[];
  onConfigsChange: (next: AssemblyConfig[]) => void;
  onOpenRun?: (run: GenerationRun) => void;
}) {
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useState<GenParams>(DEFAULT_PARAMS);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState<"idle" | "preview" | "run" | "retry">("idle");
  const [run, setRun] = useState<GenerationRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback((config: AssemblyConfig) => {
    setSelectedConfigId(config.id);
    setName(config.name);
    setMapping({ ...config.mapping });
    setDirty(false);
    setPreview(null);
  }, []);

  // 최초: baseline(첫 조합) 로드
  useEffect(() => {
    if (!selectedConfigId && configs.length > 0) loadConfig(configs[0]);
  }, [configs, selectedConfigId, loadConfig]);

  const handleSelectConfig = (id: string) => {
    const c = configs.find((x) => x.id === id);
    if (c) loadConfig(c);
  };

  const ensureSaved = useCallback(async (): Promise<string> => {
    if (!selectedConfigId) {
      const created = await createConfig({ name: name || "새 조합", mapping });
      onConfigsChange([created, ...configs]);
      setSelectedConfigId(created.id);
      setDirty(false);
      return created.id;
    }
    if (dirty) {
      const updated = await updateConfig(selectedConfigId, { name, mapping });
      onConfigsChange(configs.map((c) => (c.id === updated.id ? updated : c)));
      setDirty(false);
    }
    return selectedConfigId;
  }, [selectedConfigId, dirty, name, mapping, configs, onConfigsChange]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await ensureSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "조합 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await createConfig({ name: name || "새 조합", mapping });
      onConfigsChange([created, ...configs]);
      loadConfig(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조합 생성 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedConfigId) return;
    setSaving(true);
    try {
      const dup = await duplicateConfig(selectedConfigId);
      onConfigsChange([dup, ...configs]);
      loadConfig(dup);
    } catch (e) {
      setError(e instanceof Error ? e.message : "복제 실패");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setBusy("preview");
    setError(null);
    try {
      const cid = await ensureSaved();
      setPreview(await previewAssembly(cid, params));
    } catch (e) {
      setError(e instanceof Error ? e.message : "미리보기 실패");
    } finally {
      setBusy("idle");
    }
  };

  const handleRun = async () => {
    if (!params.curriculum_material.trim()) {
      setError("교안 자료(curriculum_material)는 필수입니다.");
      return;
    }
    setBusy("run");
    setError(null);
    setRun(null);
    try {
      const cid = await ensureSaved();
      const [pv, r] = await Promise.all([
        previewAssembly(cid, params),
        createRun({
          config_id: cid,
          params,
          model: settings.model,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
      ]);
      setPreview(pv);
      setRun(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setBusy("idle");
    }
  };

  const handleRetry = async () => {
    if (!run) return;
    setBusy("retry");
    try {
      setRun(await retryRun(run.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "재시도 실패");
    } finally {
      setBusy("idle");
    }
  };

  const handleReview = async (reviewStatus: string, note: string) => {
    if (!run) return;
    const updated = await updateReview(run.id, { review_status: reviewStatus, review_note: note || null });
    setRun(updated);
  };

  const canRun = params.curriculum_material.trim().length > 0 && !!blocks.length;

  return (
    <div className="flex w-full min-h-0 flex-1 overflow-hidden">
      <div className="scrollbar-thin w-[48%] min-h-0 overflow-y-auto border-r border-surface-200 p-5 flex flex-col gap-4">
        <AssemblyConfigEditor
          blocks={blocks}
          configs={configs}
          selectedConfigId={selectedConfigId}
          name={name}
          mapping={mapping}
          dirty={dirty}
          onSelectConfig={handleSelectConfig}
          onNameChange={(n) => {
            setName(n);
            setDirty(true);
          }}
          onMappingChange={(m) => {
            setMapping(m);
            setDirty(true);
          }}
          onSave={handleSave}
          onSaveAsNew={handleSaveAsNew}
          onDuplicate={handleDuplicate}
          saving={saving}
        />
        <ParamForm
          params={params}
          onParamsChange={setParams}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>

      <div className="scrollbar-thin w-[52%] min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name="file" className="h-4 w-4" />}
            onClick={handlePreview}
            disabled={busy !== "idle"}
          >
            {busy === "preview" ? "조립 중…" : "미리보기"}
          </Button>
          <Button
            variant="brand"
            size="md"
            icon={<Icon name="sparkles" className="h-4 w-4" />}
            onClick={handleRun}
            disabled={busy !== "idle" || !canRun}
            title={!canRun ? "교안 발췌를 입력하세요" : undefined}
          >
            {busy === "run" ? "생성 중…" : "생성 실행"}
          </Button>
          {run && onOpenRun && (
            <Button variant="ghost" size="md" onClick={() => onOpenRun(run)}>
              히스토리에서 보기
            </Button>
          )}
        </div>

        {error && (
          <Card className="ring-rose-200" padding="p-3">
            <p className="text-[12.5px] text-rose-700">{error}</p>
          </Card>
        )}

        {preview && <PreviewPanel preview={preview} />}

        {busy === "run" && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="spin h-8 w-8 rounded-full border-2 border-brand-100 border-t-brand-600" />
              <div className="text-[13px] font-medium text-ink-800">
                Gemini 구조화 호출 → 파싱 → 셔플…
              </div>
            </div>
          </Card>
        )}

        {run && (
          <RunResultView
            run={run}
            onReview={handleReview}
            onRetry={handleRetry}
            retrying={busy === "retry"}
          />
        )}

        {!preview && !run && busy === "idle" && (
          <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-10 ring-1 ring-dashed ring-surface-300">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                <Icon name="flask" className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-[15px] font-semibold text-ink-900">조합 × 파라미터로 문항 생성</h3>
              <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
                「미리보기」로 조립 프롬프트를 확인하고 「생성 실행」으로 문항을 만드세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
