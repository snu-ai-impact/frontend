"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { ModelBadge, QualityBadge, StatCard } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/icons/Icon";
import { useQuestionData } from "@/components/providers/QuestionDataProvider";

function DashboardContent() {
  const { questions } = useQuestionData();
  const recent = questions.slice(0, 5);
  const pending = questions.filter((q) => q.qualityStatus === "pending").length;

  return (
    <div className="space-y-5 px-7 py-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="주관식 문항" value={questions.length} tone="brand" icon="bank" />
        <StatCard label="검토 필요" value={pending} delta="+3" tone="warning" icon="alert" />
        <StatCard label="승인 완료" value={questions.filter((q) => q.qualityStatus === "approved").length} tone="success" icon="target" />
        <StatCard label="활성 시험" value="6" delta="+1" tone="neutral" icon="clipboard" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2" title="모델별 생성량" subtitle="최근 14일">
          <div className="flex h-48 items-end gap-2.5 pt-2">
            {[12, 18, 9, 22, 15, 28, 19, 24, 30, 17, 26, 33, 21, 29].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-col gap-0.5">
                  <div className="rounded-t bg-violet-500" style={{ height: `${v * 3}px` }} />
                  <div className="rounded-b bg-emerald-500" style={{ height: `${Math.floor(v * 0.6)}px` }} />
                </div>
                <div className="font-mono text-[9.5px] text-ink-500">{i + 12}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="빠른 작업">
          <div className="flex flex-col gap-2">
            <Link href="/prompt-lab">
              <Button variant="brand" className="w-full" icon={<Icon name="sparkles" className="h-4 w-4" />}>
                프롬프트랩
              </Button>
            </Link>
            <Link href="/question-bank">
              <Button variant="secondary" className="w-full" icon={<Icon name="bank" className="h-4 w-4" />}>
                문제은행
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card
        title="최근 생성된 문항"
        right={
          <Link href="/question-bank">
            <Button variant="ghost" size="sm" icon={<Icon name="chevronR" className="h-3.5 w-3.5" />}>
              전체 보기
            </Button>
          </Link>
        }
        padding="p-0"
      >
        <ul className="-my-2 divide-y divide-surface-200">
          {recent.map((q) => (
            <li key={q.id} className="flex items-center gap-4 px-5 py-3">
              <ModelBadge model={q.model} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink-900">
                {q.title}
              </span>
              <QualityBadge value={q.qualityStatus} />
              <span className="w-32 text-right font-mono text-[11.5px] text-ink-500">
                {new Date(q.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppLayout>
      <PageShell
        title="대시보드"
        subtitle="이번 주 평가 문항 생성·검토 현황을 한눈에 확인합니다."
        crumbs={["Workspace", "대시보드"]}
        right={
          <Link href="/prompt-lab">
            <Button variant="brand" icon={<Icon name="sparkles" className="h-4 w-4" />}>
              새 문항 생성
            </Button>
          </Link>
        }
      >
        <DashboardContent />
      </PageShell>
    </AppLayout>
  );
}
