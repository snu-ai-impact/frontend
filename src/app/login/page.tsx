import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getLoginCredentials, isAuthConfigured } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { secret } = getLoginCredentials();
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(secret && cookieStore.get(AUTH_COOKIE_NAME)?.value === secret);

  if (isLoggedIn) {
    redirect("/");
  }

  const error = params?.error;
  const message =
    error === "invalid"
      ? "아이디 또는 비밀번호가 올바르지 않습니다."
      : error === "config" || !isAuthConfigured()
        ? "로그인 환경변수가 설정되지 않았습니다."
        : "";

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-50 px-5 py-10">
      <section className="w-full max-w-[390px]">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-linear-to-br from-brand-500 to-brand-700 shadow-pop">
            <span className="text-[15px] font-bold text-white">EF</span>
          </div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">EvalForge</h1>
            <p className="mt-0.5 text-[12.5px] text-ink-500">SNUAIIMPACT 관리자 로그인</p>
          </div>
        </div>

        <LoginForm message={message} />
      </section>
    </main>
  );
}
