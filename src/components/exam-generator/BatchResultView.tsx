"use client";

import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  batchMarkdownFilename,
  batchToMarkdown,
  downloadMarkdown,
} from "@/lib/exam-batch-markdown";
import type { BatchRun } from "@/lib/exam-batch-types";
import { BatchItemCard } from "./BatchItemCard";
import { describeSource, DIFFICULTY_TONE } from "./constants";

function SourcePanel({ run }: { run: BatchRun }) {
  const desc = describeSource(run.params?.source_files);
  if (!desc) {
    const fallback = run.params?.curriculum_id || run.params?.course_name;
    if (!fallback) return null;
    return (
      <div className="rounded-lg bg-surface-50 px-3 py-2 text-[12px] text-ink-600 ring-1 ring-surface-200">
        <Icon name="file" className="mr-1 inline h-3 w-3" />
        투입 자료: {fallback}
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-surface-50 p-3 ring-1 ring-surface-200">
      <div className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
        <Icon name="file" className="h-3.5 w-3.5" />
        투입 자료 · {desc.names.length}개 md
      </div>
      {desc.folder && (
        <div className="mt-1 break-all font-mono text-[11px] text-ink-600">{desc.folder}/</div>
      )}
      <ul className="mt-1 space-y-0.5">
        {desc.names.map((n, i) => (
          <li key={i} className="flex items-center gap-1.5 text-[12px] text-ink-700">
            <span className="text-ink-300">└</span>
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckBadge({ ok, label }: { ok?: boolean; label: string }) {
  const on = ok === true;
  return (
    <Badge tone={on ? "success" : "danger"}>
      <Icon name={on ? "check" : "x"} className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function BatchResultView({ run }: { run: BatchRun }) {
  if (run.status === "error") {
    return (
      <Card className="ring-rose-200">
        <div className="flex gap-3">
          <Icon name="alert" className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <Badge tone="danger">생성 에러</Badge>
            <p className="mt-2 whitespace-pre-wrap text-[12.5px] text-ink-700">
              {run.fail_reason || "사유 미기록"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const result = run.result;
  const plan = result?.batchPlan;
  const items = result?.items ?? [];
  const check = result?.batchCheck;

  return (
    <div className="space-y-4">
      {/* 요약 헤더 */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-surface-200">
        <Badge tone="brand">{run.exam_level}</Badge>
        <Badge tone="violet">{run.domain}</Badge>
        <Badge tone={run.ok_count === run.item_count ? "success" : "warning"}>
          문항 {run.ok_count}/{run.item_count}
        </Badge>
        <span className="font-mono text-[11px] text-ink-400">{run.gen_config}</span>
        <div className="ml-auto flex items-center gap-3">
          {run.ok_count > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="download" className="h-3.5 w-3.5" />}
              onClick={() => downloadMarkdown(batchMarkdownFilename(run), batchToMarkdown(run))}
            >
              MD 다운로드
            </Button>
          )}
          <span className="flex gap-3 font-mono text-[10.5px] text-ink-400">
            <span>{run.model}</span>
            <span>temp {run.temperature}</span>
            <span>tokens {run.token_count ?? "-"}</span>
          </span>
        </div>
      </div>

      {/* 투입 자료 — 폴더 경로 + md 파일 목록 */}
      <SourcePanel run={run} />

      {run.status === "failed" && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800 ring-1 ring-amber-200">
          {run.fail_reason || "일부 문항 생성에 실패했습니다."}
        </div>
      )}

      {/* 배치 배정표 */}
      {plan?.assignment && plan.assignment.length > 0 && (
        <Card title="배치 배정표 (batchPlan)" padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-surface-200 text-left text-ink-500">
                  <th className="px-3 py-2 font-medium">문항</th>
                  <th className="px-3 py-2 font-medium">교수 포인트</th>
                  <th className="px-3 py-2 font-medium">난이도</th>
                  <th className="px-3 py-2 font-medium">레버</th>
                  <th className="px-3 py-2 font-medium">시나리오 무대</th>
                </tr>
              </thead>
              <tbody>
                {plan.assignment.map((a) => (
                  <tr key={a.itemId} className="border-b border-surface-100 align-top last:border-0">
                    <td className="px-3 py-2 font-mono text-ink-700">{a.itemId}</td>
                    <td className="px-3 py-2 text-ink-600">{a.topicId}</td>
                    <td className="px-3 py-2">
                      <Badge tone={DIFFICULTY_TONE[a.difficulty ?? ""] ?? "neutral"}>{a.difficulty}</Badge>
                    </td>
                    <td className="px-3 py-2 text-ink-500">
                      {a.levers
                        ? `${a.levers.cognitive ?? "-"} · 매력오답 ${a.levers.attractiveDistractors ?? "-"} · 개념 ${a.levers.conceptCount ?? "-"}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-ink-600">{a.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(plan.gradeFitNote || plan.shortfallNote) && (
            <div className="space-y-1 border-t border-surface-100 px-3 py-2 text-[11.5px] text-ink-600">
              {plan.gradeFitNote && (
                <p>
                  <span className="font-medium text-amber-700">등급 적합 노트 </span>
                  {plan.gradeFitNote}
                </p>
              )}
              {plan.shortfallNote && (
                <p>
                  <span className="font-medium text-amber-700">부족 사유 </span>
                  {plan.shortfallNote}
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 문항 목록 */}
      <div className="space-y-3">
        {items.map((it, i) => (
          <BatchItemCard key={it.itemId || i} item={it} index={i + 1} />
        ))}
      </div>

      {/* 배치 자가검증 */}
      {check && (
        <Card title="배치 자가검증 (batchCheck)" padding="p-4">
          <div className="flex flex-wrap gap-1.5">
            <CheckBadge ok={check.topicDiversity} label="소재 다양성" />
            <CheckBadge ok={check.noCrossItemLeakage} label="상호 독립" />
            <CheckBadge ok={check.noMisconceptionReuse} label="오개념 비중복" />
            {check.answerPositionSpread && (
              <Badge tone="neutral">정답 분산(설계 기준) {check.answerPositionSpread}</Badge>
            )}
          </div>
          {check.notes && <p className="mt-2 text-[12px] text-ink-600">{check.notes}</p>}
        </Card>
      )}
    </div>
  );
}
