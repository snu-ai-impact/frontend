"use client";

import { QuestionDataProvider } from "@/components/providers/QuestionDataProvider";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuestionDataProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-50">{children}</main>
      </div>
    </QuestionDataProvider>
  );
}
