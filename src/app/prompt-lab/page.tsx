import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { PromptLabView } from "@/components/prompt-lab/PromptLabView";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { fetchDefaultSystemPrompt } from "@/lib/api";

export default async function PromptLabPage() {
  let initialSystemPrompt = "";
  let initialPromptLoadError: string | null = null;
  try {
    initialSystemPrompt = await fetchDefaultSystemPrompt("subjective");
  } catch (e) {
    initialPromptLoadError =
      e instanceof Error ? e.message : "시스템 프롬프트 로드 실패";
  }

  return (
    <AppLayout>
      <PageShell
        scroll={false}
        title="프롬프트랩"
        subtitle="프롬프트와 교안 PDF를 조합해 GLAT 형식 평가 문항을 생성합니다."
        crumbs={["Workspace", "프롬프트랩"]}
        right={
          <Link href="/question-bank">
            <Button variant="secondary" icon={<Icon name="history" className="h-4 w-4" />}>
              생성 이력
            </Button>
          </Link>
        }
      >
        <PromptLabView
          initialSystemPrompt={initialSystemPrompt}
          initialPromptLoadError={initialPromptLoadError}
        />
      </PageShell>
    </AppLayout>
  );
}
