import type { SQuestion } from "./types";

export interface QuestionFilters {
  search: string;
  questionType: string;
  model: string;
  qualityStatus: string;
  dateFrom: string;
  dateTo: string;
}

export function filterQuestions(
  items: SQuestion[],
  filters: QuestionFilters,
): SQuestion[] {
  return items.filter((item) => {
    if (filters.questionType && item.questionType !== filters.questionType) return false;
    if (filters.model && item.model !== filters.model) return false;
    if (filters.qualityStatus && item.qualityStatus !== filters.qualityStatus)
      return false;

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (new Date(item.createdAt) < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(item.createdAt) > to) return false;
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const hay = [
        item.title,
        item.question,
        item.bestPractice,
        item.metadata.choices?.join(" ") ?? "",
        item.metadata.correctChoiceNo ? `${item.metadata.correctChoiceNo}번` : "",
        item.curriculumReference ?? "",
        item.metadata.itemMetadata.referenceSource,
        item.metadata.scenarioEvidence,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}
