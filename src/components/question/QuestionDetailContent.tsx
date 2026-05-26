"use client";

import { Icon } from "@/components/icons/Icon";
import { Card } from "@/components/ui/Card";
import { multipleReferenceFileUrl, subjectiveReferenceFileUrl } from "@/lib/api";
import { getDisplayQuestionFromPreview } from "@/lib/format-question-body";
import type { GeneratedAssessmentPreview, QuestionOriginalData, QuestionType, SQuestion } from "@/lib/types";
import { OriginalDataPanel, RubricDetailSections } from "./QuestionExtras";

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-50 text-brand-700">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <h4 className="text-[13.5px] font-semibold tracking-tight text-ink-900">{title}</h4>
    </div>
  );
}

function formatSize(bytes: number | undefined): string | null {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function QuestionDetailContent({
  preview,
  originalData,
  files,
  questionId,
  questionType = "subjective",
  variant = "default",
}: {
  preview: GeneratedAssessmentPreview;
  originalData: QuestionOriginalData | null;
  files?: SQuestion["files"];
  questionId?: string | null;
  questionType?: QuestionType;
  variant?: "default" | "contained";
}) {
  const body = (
    <>
      <RubricDetailSections
        itemMetadata={preview.itemMetadata}
        questionBody={getDisplayQuestionFromPreview(preview)}
        choices={preview.choices}
        correctChoiceNo={preview.correctChoiceNo}
        bestPractice={preview.bestPractice}
        curriculumReference={preview.curriculumReference}
        scoringCriteria={preview.scoringCriteria}
        distractorAnalysis={preview.distractorAnalysis}
        boxed={variant === "contained"}
      />

      {files && files.length > 0 && (
        <Card>
          <SectionHeader icon="file" title="참조 자료" />
          <ul className="space-y-2">
            {files.map((file, index) => {
              const size = formatSize(file.sizeBytes);
              const href =
                questionId && (file.s3Key || file.s3Url)
                  ? questionType === "multiple"
                    ? multipleReferenceFileUrl(questionId, index)
                    : subjectiveReferenceFileUrl(questionId, index)
                  : null;
              return (
                <li
                  key={`${file.name}-${index}`}
                  className="flex h-10 items-center gap-3 rounded-lg px-3 ring-1 ring-surface-200"
                >
                  <Icon name="file" className="h-4 w-4 shrink-0 text-ink-500" />
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-[12.5px] text-brand-700 hover:underline"
                    >
                      {file.name}
                    </a>
                  ) : (
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] text-ink-700"
                      title="S3 업로드 정보가 없는 기존 참조자료입니다."
                    >
                      {file.name}
                    </span>
                  )}
                  {size && <span className="shrink-0 text-[11px] text-ink-500">{size}</span>}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );

  return (
    <>
      {body}

      <OriginalDataPanel originalData={originalData} />
    </>
  );
}
