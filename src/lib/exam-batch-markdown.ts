// 배치 문항 세트 → 마크다운 문자열 + 브라우저 다운로드

import { describeSource } from "@/components/exam-generator/constants";
import type { BatchItem, BatchRun } from "./exam-batch-types";

function leversLine(l?: { cognitive?: string; attractiveDistractors?: number; conceptCount?: number }): string {
  if (!l) return "-";
  return `인지 ${l.cognitive ?? "-"} · 매력오답 ${l.attractiveDistractors ?? "-"} · 개념 ${l.conceptCount ?? "-"}`;
}

function itemToMarkdown(item: BatchItem, index: number): string {
  if (item.status === "failed") {
    return `## 문항 ${index} — 생성 실패\n\n> ${item.failReason || "사유 미기록"}\n`;
  }
  const q = item.item ?? {};
  const answerIndex = q.answerIndex ?? -1;
  const choices = q.choices ?? [];
  const bp = item.design?.boundaryPlan;
  const difficulty = bp?.difficulty || item.meta?.difficulty || "-";
  const lines: string[] = [];

  lines.push(`## 문항 ${index} · 난이도 ${difficulty}`);
  lines.push("");
  if (q.scenario) lines.push(q.scenario, "");
  lines.push(`**${q.question ?? ""}**`, "");
  choices.forEach((c, i) => {
    const mark = i === answerIndex ? " ✅" : "";
    lines.push(`${i + 1}. ${c}${mark}`);
  });
  lines.push("");
  lines.push(`**정답:** ${answerIndex >= 0 ? answerIndex + 1 : "-"}번`);
  if (item.explanation?.answerExplanation) {
    lines.push("", `**해설:** ${item.explanation.answerExplanation}`);
  }
  const wrongs = item.explanation?.wrongExplanations ?? [];
  if (wrongs.length) {
    lines.push("");
    wrongs.forEach((w) => lines.push(`- ${(w.choiceIndex ?? 0) + 1}번: ${w.text}`));
  }

  // 설계 메모 (출제자용)
  lines.push("", "<details><summary>설계 메모</summary>", "");
  lines.push(`- 레버: ${leversLine(item.selfCheck?.leversRealized ?? bp?.levers)}`);
  if (bp?.targetPValue) lines.push(`- 목표 정답률: ${bp.targetPValue}`);
  if (bp?.decisionCriterion) lines.push(`- 결정 기준: ${bp.decisionCriterion}`);
  if (item.design?.evidenceClaim) lines.push(`- 증거 명제: ${item.design.evidenceClaim}`);
  if (item.design?.source?.quote) lines.push(`- 근거 인용: "${item.design.source.quote}"`);
  const distractors = (item.distractorMap ?? []).filter((d) => d.choiceIndex !== answerIndex);
  if (distractors.length) {
    lines.push("- 오답 지도:");
    distractors.forEach((d) => {
      const rat = d.attractRationale ? ` — ${d.attractRationale}` : "";
      lines.push(`  - ${(d.choiceIndex ?? 0) + 1}번 [${d.type ?? "-"}] ${d.derivation ?? ""}${rat}`);
    });
  }
  if (item.selfCheck?.simulatedSolve) lines.push(`- 미달자 시뮬: ${item.selfCheck.simulatedSolve}`);
  if (item.selfCheck?.difficultyShift) lines.push(`- 난이도 이동: ${item.selfCheck.difficultyShift}`);
  lines.push("", "</details>");

  return lines.join("\n");
}

export function batchToMarkdown(run: BatchRun): string {
  const result = run.result;
  const items = result?.items ?? [];
  const desc = describeSource(run.params?.source_files);
  const created = new Date(run.created_at).toLocaleString("ko-KR");

  const head: string[] = [];
  head.push(`# 시험 문항 세트 — ${run.domain ?? ""} ${run.exam_level ?? ""} (${run.ok_count}문항)`);
  head.push("");
  head.push(`- 생성 조합(genConfig): \`${run.gen_config}\``);
  head.push(`- 모델: ${run.model} · temperature ${run.temperature}`);
  head.push(`- 생성 일시: ${created}`);
  if (desc) {
    head.push(`- 투입 자료: ${desc.folder ? desc.folder + "/ " : ""}${desc.names.join(", ")}`);
  } else if (run.params?.curriculum_id) {
    head.push(`- 투입 자료: ${run.params.curriculum_id}`);
  }
  const spread = result?.batchCheck?.answerPositionSpread;
  if (spread) head.push(`- 정답 분산(설계 기준): ${spread}`);
  head.push("");
  head.push("---");

  const body = items.map((it, i) => itemToMarkdown(it, i + 1)).join("\n\n---\n\n");
  return `${head.join("\n")}\n\n${body}\n`;
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function batchMarkdownFilename(run: BatchRun): string {
  const date = new Date(run.created_at).toISOString().slice(0, 10);
  const safe = run.gen_config.replace(/[^\w.-]+/g, "_");
  return `문항세트_${safe}_${date}.md`;
}
