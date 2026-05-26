import type { GeneratedAssessmentPreview } from "./types";

export const SCENARIO_SECTION_HEADER = "2. Scenario & Evidence (문제 상황)";
export const QUESTION_SECTION_HEADER = "3. Question (평가 문항)";

/** AI가 줄바꿈 없이 이어 붙인 본문을 읽기 쉽게 분리 */
export function normalizeSectionText(text: string): string {
  if (!text?.trim()) return "";
  let t = text.trim();

  const replacements: [RegExp, string][] = [
    [/([가-힣)\]])(Role:)/gi, "$1\n\n$2"],
    [/(문제\s*상황)(Role:)/gi, "$1\n\n$2"],
    [/(Role:)(Situation:)/gi, "$1\n\n$2"],
    [/(Situation:)(Evidence\s*Material:)/gi, "$1\n\n$2"],
    [/(Evidence\s*Material:)(\[자료)/gi, "$1\n\n$2"],
    [/(Evidence\s*Material:)(\|)/gi, "$1\n\n$2"],
    [/(평가\s*문항)(교안)/gi, "$1\n\n$2"],
    [/(평가\s*문항)(\[)/gi, "$1\n\n$2"],
    [/(\))(\[Diagnosis\])/gi, "$1\n\n$2"],
    [/(\])(\[Refine\])/gi, "$1\n\n$2"],
    [/(\])(\[Refinement\])/gi, "$1\n\n$2"],
    [/(합니다\.)(\[Diagnosis\])/gi, "$1\n\n$2"],
    [/(합니다\.)(\[Refine\])/gi, "$1\n\n$2"],
    [/(\.)(Role:)/g, "$1\n\n$2"],
    [/(\.)(Situation:)/g, "$1\n\n$2"],
  ];

  for (const [pattern, replacement] of replacements) {
    t = t.replace(pattern, replacement);
  }

  return t.replace(/\n{3,}/g, "\n\n").trim();
}

export function formatCombinedQuestion(
  scenarioEvidence: string,
  questionPart: string,
): string {
  const scenario = normalizeSectionText(scenarioEvidence);
  const question = normalizeSectionText(questionPart);
  const parts: string[] = [];

  if (scenario) {
    parts.push(SCENARIO_SECTION_HEADER, "", scenario);
  }
  if (question) {
    parts.push("", QUESTION_SECTION_HEADER, "", question);
  }

  return parts.join("\n").trim();
}

export function getDisplayQuestion(
  question: string,
  scenarioEvidence?: string | null,
): string {
  const q = question?.trim() ?? "";
  if (/2\.\s*Scenario\s*&\s*Evidence/i.test(q)) {
    return normalizeSectionText(q);
  }
  if (scenarioEvidence?.trim()) {
    return formatCombinedQuestion(scenarioEvidence, q);
  }
  return normalizeSectionText(q);
}

export function getDisplayQuestionFromPreview(preview: GeneratedAssessmentPreview): string {
  if (preview.scenarioEvidence) {
    return formatCombinedQuestion(preview.scenarioEvidence, preview.question);
  }
  return preview.question;
}

/** 목록 요약용 — [Diagnosis] 또는 Question 섹션 첫 문장 */
export function questionTitleFromBody(body: string): string {
  const normalized = normalizeSectionText(body);
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  const diagnosis = lines.find((l) => l.startsWith("[Diagnosis]"));
  if (diagnosis) return diagnosis;

  const afterQuestionHeader = normalized.split(/3\.\s*Question[^\n]*\n/i);
  if (afterQuestionHeader.length > 1) {
    const qLines = afterQuestionHeader[1].split("\n").map((l) => l.trim()).filter(Boolean);
    const meaty = qLines.find(
      (l) =>
        (l.startsWith("[Diagnosis]") ||
          l.startsWith("[Refine") ||
          (!l.startsWith("[") && !l.startsWith(">") && !l.startsWith("("))) &&
        l.length > 14 &&
        !/^4\./.test(l),
    );
    if (meaty) return meaty;
  }

  const meaty = lines.find(
    (l) =>
      !l.startsWith("[") &&
      !l.startsWith(">") &&
      !l.startsWith("(") &&
      !l.startsWith("Role:") &&
      !l.startsWith("Situation:") &&
      !l.startsWith("Evidence") &&
      !/^2\./.test(l) &&
      !/^3\./.test(l) &&
      l.length > 14,
  );
  return meaty || lines[0] || "";
}
