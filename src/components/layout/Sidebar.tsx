"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/Icon";

const NAV = [
  { href: "/", label: "대시보드", icon: "dashboard" as const },
  { href: "/prompt-lab", label: "프롬프트랩", icon: "sparkles" as const, badge: "AI" },
  { href: "/file-sources", label: "자료실", icon: "file" as const },
  { href: "/question-bank", label: "문제은행", icon: "bank" as const },
  { href: "#", label: "시험관리", icon: "clipboard" as const, disabled: true },
  { href: "#", label: "시험결과", icon: "chart" as const, disabled: true },
  { href: "#", label: "프롬프트 관리", icon: "bookmark" as const, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[244px] shrink-0 flex-col bg-ink-900 text-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 shadow-pop">
          <Icon name="layers" className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-tight">EvalForge</div>
          <div className="font-mono text-[10.5px] text-white/50">SNUAIIMPACT · MVP</div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
          Workspace
        </div>
        {NAV.map((item) => {
          const on =
            !item.disabled &&
            (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex h-9 w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-[13px] text-white/50"
                title="준비 중"
              >
                <Icon name={item.icon} className="h-[18px] w-[18px] text-white/40" />
                <span className="flex-1 font-medium">{item.label}</span>
                <span className="text-[9.5px] text-white/40">Soon</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] transition ${
                on
                  ? "bg-white/8 text-white"
                  : "text-white/70 hover:bg-white/4 hover:text-white"
              }`}
            >
              <span className={on ? "text-brand-500" : "text-white/55"}>
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-brand-600/30 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-brand-200 ring-1 ring-brand-600/40">
                  {item.badge}
                </span>
              )}
              {on && <span className="h-5 w-1 rounded-full bg-brand-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <form action="/logout" method="post" className="mb-2">
          <button
            type="submit"
            className="flex h-9 w-full items-center justify-center rounded-lg text-[12.5px] font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            로그아웃
          </button>
        </form>
        <div className="rounded-xl bg-white/4 p-3.5 ring-1 ring-white/5">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>이번 달 토큰</span>
            <span className="font-mono text-white/80">62%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-linear-to-r from-brand-500 to-brand-700" />
          </div>
        </div>
      </div>
    </aside>
  );
}
