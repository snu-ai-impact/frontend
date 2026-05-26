import { Icon } from "@/components/icons/Icon";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: string[];
  right?: React.ReactNode;
}

export function TopHeader({ title, subtitle, right }: TopHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-7">
      <div>
        <h1 className="text-[18px] font-semibold leading-tight tracking-tight text-ink-900">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden lg:block">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          />
          <input
            placeholder="문제·프롬프트 검색…"
            className="h-9 w-72 rounded-lg bg-surface-100 pl-9 pr-16 text-[12.5px] ring-1 ring-inset ring-transparent focus:bg-white focus:outline-none focus:ring-surface-300"
          />
        </div>
        {right}
      </div>
    </header>
  );
}

export function PageShell({
  title,
  subtitle,
  crumbs,
  right,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  crumbs?: string[];
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <>
      <TopHeader title={title} subtitle={subtitle} crumbs={crumbs} right={right} />
      <div
        className={
          scroll
            ? "scrollbar-thin flex-1 overflow-y-auto"
            : "flex min-h-0 flex-1 flex-col overflow-hidden"
        }
      >
        {children}
      </div>
    </>
  );
}
