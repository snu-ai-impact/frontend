"use client";

import { useRef } from "react";

export function LoginForm({ message }: { message: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action="/api/login"
      method="post"
      onKeyDown={handleKeyDown}
      className="rounded-lg border border-surface-200 bg-white p-6 shadow-card"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-[12.5px] font-medium text-ink-700">아이디</span>
          <input
            name="id"
            autoComplete="username"
            className="mt-1.5 h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-[14px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            required
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-medium text-ink-700">비밀번호</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5 h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-[14px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            required
          />
        </label>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700 ring-1 ring-rose-100">
          {message}
        </p>
      )}

      <button
        type="submit"
        className="mt-5 h-10 w-full rounded-lg bg-brand-600 px-4 text-[13.5px] font-semibold text-white shadow-card transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        로그인
      </button>
    </form>
  );
}
