import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { AuthoringWorkbench } from "@/components/prompt-lab/authoring/AuthoringWorkbench";

export default function PromptLabPage() {
  return (
    <AppLayout>
      <PageShell
        scroll={false}
        title="프롬프트랩"
        subtitle="블록 조합 실험으로 금융권 AI 역량 인증시험 객관식 문항을 생성합니다."
        crumbs={["Workspace", "프롬프트랩"]}
      >
        <AuthoringWorkbench />
      </PageShell>
    </AppLayout>
  );
}
