"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { ExamGeneratorView } from "@/components/exam-generator/ExamGeneratorView";

export default function ExamGeneratorPage() {
  return (
    <AppLayout>
      <PageShell
        title="시험 문항 생성"
        subtitle="한 영역에서 1회 호출로 여러 문항을 배치 생성하고 결과를 확인합니다."
        crumbs={["Workspace", "시험 문항 생성"]}
        scroll={false}
      >
        <ExamGeneratorView />
      </PageShell>
    </AppLayout>
  );
}
