"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/TopHeader";
import { FileSourcesView } from "@/components/file-sources/FileSourcesView";

export default function FileSourcesPage() {
  return (
    <AppLayout>
      <PageShell
        title="자료실"
        subtitle="문항 생성에 사용할 참고자료 파일을 탐색·확인합니다. 현재 로컬 폴더 · 추후 S3/드라이브 연결 예정."
        crumbs={["Workspace", "자료실"]}
        scroll={false}
      >
        <FileSourcesView />
      </PageShell>
    </AppLayout>
  );
}
