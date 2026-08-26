"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/Badge";
import type { BatchItem } from "@/lib/exam-batch-types";
import { DIFFICULTY_TONE } from "./constants";

function KeyVal({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="shrink-0 font-medium text-ink-500">{label}</span>
      <span className="text-ink-800">{value}</span>
    </div>
  );
}

// selfCheck v4 불리언 항목
const SELF_CHECK_LABELS: { key: "leversMatchAssignment" | "answerNotLongest" | "noCueWords" | "keyVocabSpread"; label: string }[] = [
  { key: "leversMatchAssignment", label: "레버 배정 일치" },
  { key: "answerNotLongest", label: "정답 최장 아님" },
  { key: "noCueWords", label: "단서어 없음" },
  { key: "keyVocabSpread", label: "핵심어 분산" },
];

// distractorMap 유형 → 뱃지 톤 (모델이 유형 문자열 앞에 ⓐⓑⓒ 기호를 붙이므로 부분 매칭)
function distractorTone(type?: string): "danger" | "warning" | "violet" | "lightblue" | "neutral" {
  if (!type) return "neutral";
  if (type.includes("단계누락")) return "danger";
  if (type.includes("원칙오적용")) return "warning";
  if (type.includes("흔한오해")) return "violet";
  if (type.includes("차선행동")) return "lightblue";
  return "neutral";
}

function leversText(l?: { cognitive?: string; attractiveDistractors?: number; conceptCount?: number }): string | undefined {
  if (!l) return undefined;
  return `인지 ${l.cognitive ?? "-"} · 매력오답 ${l.attractiveDistractors ?? "-"} · 개념 ${l.conceptCount ?? "-"}`;
}

/** 배치의 문항 1개를 시험지 카드로 렌더. index = 배치 내 순번(1-base 표기). */
export function BatchItemCard({ item, index }: { item: BatchItem; index: number }) {
  const [open, setOpen] = useState(false);

  if (item.status === "failed") {
    return (
      <div className="rounded-xl bg-white p-4 shadow-card ring-1 ring-amber-200">
        <div className="flex items-center gap-2">
          <Badge tone="warning">
            <Icon name="alert" className="h-3 w-3" /> 생성 실패
          </Badge>
          <span className="font-mono text-[11px] text-ink-500">{item.itemId}</span>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-700">{item.failReason || "사유 미기록"}</p>
      </div>
    );
  }

  const q = item.item ?? {};
  const answerIndex = q.answerIndex ?? -1;
  const choices = q.choices ?? [];
  const bp = item.design?.boundaryPlan;
  const difficulty = bp?.difficulty || item.meta?.difficulty || "";
  // distractorMap 은 오답만 대상 — 모델이 정답 행을 포함하는 경우가 있어 정답 인덱스는 제외
  const distractors = (item.distractorMap ?? []).filter((d) => d.choiceIndex !== answerIndex);
  const wrongs = item.explanation?.wrongExplanations ?? [];

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-surface-200">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 px-4 py-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-600 text-[12px] font-bold text-white">
          {index}
        </span>
        <span className="font-mono text-[11px] text-ink-500">{item.itemId}</span>
        {difficulty && <Badge tone={DIFFICULTY_TONE[difficulty] ?? "neutral"}>난이도 {difficulty}</Badge>}
        {item.meta?.domain && <Badge tone="violet">{item.meta.domain}</Badge>}
        {bp?.targetPValue && (
          <Badge tone="neutral">목표 p {bp.targetPValue}</Badge>
        )}
        {bp?.levers && (
          <span className="text-[11px] text-ink-400">
            {bp.levers.cognitive ?? "-"} · 매력오답 {bp.levers.attractiveDistractors ?? "-"} · 개념 {bp.levers.conceptCount ?? "-"}
          </span>
        )}
      </div>

      {/* 문항 본문 */}
      <div className="px-4 py-3">
        {q.scenario && (
          <p className="whitespace-pre-wrap rounded-lg bg-surface-50 p-3 text-[12.5px] leading-6 text-ink-800 ring-1 ring-surface-200">
            {q.scenario}
          </p>
        )}
        <p className="mt-3 text-[13.5px] font-semibold leading-6 text-ink-900">{q.question}</p>
        <ol className="mt-3 space-y-2">
          {choices.map((choice, i) => {
            const correct = i === answerIndex;
            return (
              <li
                key={i}
                className={`flex gap-2.5 rounded-lg px-3 py-2 text-[12.5px] leading-6 ring-1 ${
                  correct
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : "bg-white text-ink-800 ring-surface-200"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    correct ? "bg-emerald-600 text-white" : "bg-surface-100 text-ink-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="whitespace-pre-wrap">{choice}</span>
                {correct && <Icon name="check" className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
              </li>
            );
          })}
        </ol>

        {/* 정답 해설 (항상 표시) */}
        {item.explanation?.answerExplanation && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-[12px] leading-6 text-emerald-900 ring-1 ring-emerald-200">
            <span className="font-semibold">정답 </span>
            {item.explanation.answerExplanation}
          </div>
        )}

        {/* 상세 토글 (설계·오답지도·오답해설·자가검증) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-700 hover:underline"
        >
          <Icon name={open ? "chevron" : "chevronR"} className="h-3.5 w-3.5" />
          {open ? "상세 접기" : "설계·오답·자가검증 보기"}
        </button>

        {open && (
          <div className="mt-3 space-y-3 border-t border-surface-100 pt-3">
            {/* 설계 */}
            <div className="space-y-1">
              <KeyVal label="증거 명제" value={item.design?.evidenceClaim} />
              <KeyVal label="근거 인용" value={item.design?.source?.quote} />
              <KeyVal label="출처 위치" value={item.design?.source?.location} />
              {item.design?.source?.quote2 && (
                <KeyVal label="결합 인용2" value={item.design.source.quote2} />
              )}
              <KeyVal label="레버(실측)" value={leversText(item.selfCheck?.leversRealized) ?? leversText(bp?.levers)} />
              <KeyVal label="결정 기준" value={bp?.decisionCriterion} />
              <KeyVal label="대조 노트" value={bp?.deltaNote} />
              <KeyVal label="배합 이탈" value={bp?.deviationNote} />
            </div>

            {/* 경합 정보(surplusInfoMap) */}
            {(bp?.surplusInfoMap?.length ?? 0) > 0 && (
              <div className="rounded-lg bg-amber-50 p-2.5 ring-1 ring-amber-200">
                <div className="text-[11px] font-medium text-amber-800">경합 정보 (심은 함정)</div>
                <ul className="mt-1 space-y-0.5">
                  {bp?.surplusInfoMap?.map((s, i) => (
                    <li key={i} className="text-[11.5px] text-amber-900">
                      {s.info}
                      {typeof s.pairedChoice === "number" && (
                        <span className="ml-1 font-mono text-amber-700">→ {s.pairedChoice + 1}번 유인</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 오답 지도 (v4: 유형·derivation·매력 근거) */}
            {distractors.length > 0 && (
              <div className="overflow-x-auto rounded-lg ring-1 ring-surface-200">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50 text-left text-ink-500">
                      <th className="px-2.5 py-1.5 font-medium">선지</th>
                      <th className="px-2.5 py-1.5 font-medium">유형</th>
                      <th className="px-2.5 py-1.5 font-medium">만든 방법 · 끌리는 이유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distractors.map((d, i) => (
                      <tr key={i} className="border-b border-surface-100 align-top last:border-0">
                        <td className="px-2.5 py-1.5 font-mono text-ink-700">{(d.choiceIndex ?? 0) + 1}번</td>
                        <td className="px-2.5 py-1.5">
                          {d.type && <Badge tone={distractorTone(d.type)}>{d.type}</Badge>}
                        </td>
                        <td className="px-2.5 py-1.5 text-ink-800">
                          {d.derivation}
                          {d.attractRationale && (
                            <div className="mt-0.5 text-ink-500">끌림: {d.attractRationale}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 오답 해설 */}
            {wrongs.length > 0 && (
              <ul className="space-y-1">
                {wrongs.map((w, i) => (
                  <li key={i} className="text-[12px] leading-6 text-ink-700">
                    <span className="font-mono text-ink-500">{(w.choiceIndex ?? 0) + 1}번 </span>
                    {w.text}
                  </li>
                ))}
              </ul>
            )}

            {/* 자가검증 v4 */}
            {item.selfCheck && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {SELF_CHECK_LABELS.map(({ key, label }) => {
                    const on = item.selfCheck?.[key] === true;
                    return (
                      <Badge key={key} tone={on ? "success" : "danger"}>
                        <Icon name={on ? "check" : "x"} className="h-3 w-3" />
                        {label}
                      </Badge>
                    );
                  })}
                </div>
                {item.selfCheck.simulatedSolve && (
                  <p className="text-[11px] text-ink-500">
                    <span className="font-medium">미달자 시뮬 </span>
                    {item.selfCheck.simulatedSolve}
                  </p>
                )}
                {item.selfCheck.bestnessDefensible && (
                  <p className="text-[11px] text-ink-500">
                    <span className="font-medium">최선성 방어 </span>
                    {item.selfCheck.bestnessDefensible}
                  </p>
                )}
                {item.selfCheck.difficultyShift && (
                  <p className="text-[11px] text-ink-500">
                    <span className="font-medium">난이도 이동 </span>
                    {item.selfCheck.difficultyShift}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
