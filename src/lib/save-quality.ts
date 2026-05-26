import { updateMultipleQualityApi, updateSubjectiveQualityApi } from "./api";
import type { QualityStatus, SQuestion } from "./types";

export async function persistQuestionQuality(
  question: Pick<SQuestion, "id" | "backendId" | "questionType">,
  qualityStatus: QualityStatus,
  updateQuestion: (id: string, patch: Partial<SQuestion>) => void,
): Promise<void> {
  updateQuestion(question.id, { qualityStatus });
  if (question.backendId) {
    if (question.questionType === "multiple") {
      await updateMultipleQualityApi(question.backendId, qualityStatus);
    } else {
      await updateSubjectiveQualityApi(question.backendId, qualityStatus);
    }
  }
}
