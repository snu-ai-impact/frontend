import type { QualityStatus } from "./types";

export const QUALITY_MAP: Record<
  QualityStatus,
  { label: string; chip: string; dot: string }
> = {
  pending: {
    label: "검토 필요",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "승인",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "반려",
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};
