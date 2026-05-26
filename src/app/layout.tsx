import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvalForge · AI 시험문제 생성",
  description: "AI 시험문항 생성 · 프롬프트랩 · 문제은행",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex h-full flex-col overflow-hidden font-sans">{children}</body>
    </html>
  );
}
