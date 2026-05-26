"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listMultipleQuestionsApi, listSubjectiveQuestionsApi } from "@/lib/api";
import { multipleToQuestion, subjectiveToQuestion } from "@/lib/subjective-from-api";
import type { SQuestion } from "@/lib/types";

interface QuestionDataContextValue {
  questions: SQuestion[];
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<SQuestion>) => void;
}

const QuestionDataContext = createContext<QuestionDataContextValue | null>(null);

export function QuestionDataProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<SQuestion[]>([]);

  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      const [subjective, multiple] = await Promise.allSettled([
        listSubjectiveQuestionsApi({ limit: 1000 }),
        listMultipleQuestionsApi({ limit: 1000 }),
      ]);
      if (active) {
        const items = [
          ...(subjective.status === "fulfilled"
            ? subjective.value.items.map(subjectiveToQuestion)
            : []),
          ...(multiple.status === "fulfilled"
            ? multiple.value.items.map(multipleToQuestion)
            : []),
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setQuestions(items);
      }
    }

    void loadQuestions();
    return () => {
      active = false;
    };
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuestion = useCallback((id: string, patch: Partial<SQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  }, []);

  const value = useMemo(
    () => ({ questions, removeQuestion, updateQuestion }),
    [questions, removeQuestion, updateQuestion],
  );

  return (
    <QuestionDataContext.Provider value={value}>
      {children}
    </QuestionDataContext.Provider>
  );
}

export function useQuestionData(): QuestionDataContextValue {
  const ctx = useContext(QuestionDataContext);
  if (!ctx) {
    throw new Error("useQuestionData must be used within QuestionDataProvider");
  }
  return ctx;
}
