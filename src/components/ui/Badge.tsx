import type { QualityStatus } from "@/lib/types";
import { QUALITY_MAP } from "@/lib/design-maps";
import { Icon } from "@/components/icons/Icon";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "violet" | "lightblue";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-100 text-ink-700 ring-surface-300",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  lightblue: "bg-cyan-50 text-cyan-700 ring-cyan-300",
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", icon, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function QualityBadge({ value }: { value: QualityStatus }) {
  const m = QUALITY_MAP[value];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${m.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function ModelBadge({ model }: { model: string }) {
  const label = model.includes("gemini") ? "Gemini" : model.slice(0, 12);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset text-violet-700 bg-violet-50 ring-violet-200">
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "neutral" | "brand" | "success" | "warning";
  icon: React.ComponentProps<typeof Icon>["name"];
}) {
  const iconBg =
    tone === "brand"
      ? "bg-brand-50 text-brand-700"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "warning"
          ? "bg-amber-50 text-amber-700"
          : "bg-surface-100 text-ink-700";

  return (
    <div className="rounded-xl bg-white p-4 shadow-card ring-1 ring-surface-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[11.5px] uppercase tracking-wider text-ink-500">
            {label}
          </div>
          <div className="mt-1.5 text-[22px] font-bold tracking-tight text-ink-900">{value}</div>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${iconBg}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      {delta && (
        <div
          className={`mt-2 inline-flex items-center gap-1 font-mono text-[11.5px] ${
            delta.startsWith("+") ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          <Icon name={delta.startsWith("+") ? "arrowUp" : "arrowDown"} className="h-3 w-3" />
          {delta} 지난 주
        </div>
      )}
    </div>
  );
}
