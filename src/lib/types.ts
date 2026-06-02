export type Provider = "gemini";

export type QuestionType = "subjective" | "multiple";
export type QuestionStatus = "draft" | "review" | "published" | "archived";
export type QualityStatus = "pending" | "approved" | "rejected";
export type Difficulty = "상" | "중" | "하";

/** AI 생성 직후 스냅샷 (구조화 aiResponse, provider, model) */
export type QuestionOriginalData = Record<string, unknown>;

export interface GeneratedAssessmentPreview {
  title: string;
  itemMetadata: {
    referenceSource: string;
    glatCompetency: string;
    targetAudience: string;
    category?: string;
    difficulty?: Difficulty;
  };
  scenarioEvidence: string;
  question: string;
  choices?: string[];
  correctChoiceNo?: number;
  bestPractice?: string;
  curriculumReference: string;
  scoringCriteria?: string;
  distractorAnalysis: string;
}

export interface SQuestion {
  id: string;
  /** API/DB 주관식 문항 UUID (있을 때만 품질 PATCH) */
  backendId?: string | null;
  questionType: QuestionType;
  promptId: string;
  /** 생성 시 사용된 시스템 프롬프트 전문 (prompts.reference.system_prompt) */
  promptText: string | null;
  model: string;
  files: {
    name: string;
    type: string;
    sizeBytes?: number;
    s3Url?: string;
    s3Key?: string;
  }[] | null;
  createdAt: string;
  status: QuestionStatus;
  qualityStatus: QualityStatus;
  title: string;
  question: string;
  bestPractice: string;
  curriculumReference: string | null;
  scoringCriteria: string | null;
  distractorAnalysis: string | null;
  difficulty: Difficulty | null;
  tokenCount: number | null;
  metadata: GeneratedAssessmentPreview;
  category: string;
  targetAudience: string;
  competency: string;
  comment: string;
  originalData: QuestionOriginalData | null;
}

export type ReferenceFileItem = {
  file: File;
  name: string;
  type: string;
  size: number;
};

export interface PromptLabFormState {
  provider: Provider;
  questionType: QuestionType;
  systemPrompt: string;
  referenceFiles: ReferenceFileItem[];
}
