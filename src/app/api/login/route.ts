import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getLoginCredentials, isAuthConfigured } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const inputId = String(formData.get("id") ?? "");
  const inputPassword = String(formData.get("password") ?? "");
  const { id, password, secret } = getLoginCredentials();

  if (!isAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  if (inputId !== id || inputPassword !== password) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(AUTH_COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
