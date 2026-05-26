"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { QuestionBankView } from "@/components/question-bank/QuestionBankView";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";

export default function QuestionBankPage() {
  return (
    <AppLayout>
      <PageShell
        title="문제은행"
        subtitle="생성된 주관식·객관식 문제를 검색·필터·검토하고 시험에 편성합니다."
        crumbs={["Workspace", "문제은행"]}
        scroll={false}
        right={
          <Link href="/prompt-lab">
            <Button variant="brand" icon={<Icon name="plus" className="h-4 w-4" />}>
              새 문제 생성
            </Button>
          </Link>
        }
      >
        <QuestionBankView />
      </PageShell>
    </AppLayout>
  );
}
