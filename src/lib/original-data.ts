import type { QuestionOriginalData } from "./types";

export function formatOriginalData(data: QuestionOriginalData | null | undefined): string {
  if (!data) return "{}";
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
