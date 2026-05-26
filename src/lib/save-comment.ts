import { updateMultipleCommentApi, updateSubjectiveCommentApi } from "./api";
import type { SQuestion } from "./types";

export async function persistQuestionComment(
  question: Pick<SQuestion, "id" | "backendId" | "questionType">,
  comment: string,
  updateQuestion: (id: string, patch: Partial<SQuestion>) => void,
): Promise<void> {
  updateQuestion(question.id, { comment });
  if (question.backendId) {
    if (question.questionType === "multiple") {
      await updateMultipleCommentApi(question.backendId, comment);
    } else {
      await updateSubjectiveCommentApi(question.backendId, comment);
    }
  }
}
