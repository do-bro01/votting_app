import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { LogoutButton } from "@/components/logout-button";
import { isOperator } from "@/lib/operator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "투표 앱",
  description: "질문을 올리고 선택지 하나를 골라 투표하는 간단한 투표 앱",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const operator = await isOperator();

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              투표 앱
            </Link>
            {operator ? (
              <nav className="flex items-center gap-4">
                <Link href="/new" className="text-sm underline underline-offset-4">
                  투표 만들기
                </Link>
                <LogoutButton />
              </nav>
            ) : (
              <Link href="/login" className="text-sm underline underline-offset-4">
                운영자 로그인
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-black/10 py-4 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          김도형
        </footer>
      </body>
    </html>
  );
}
