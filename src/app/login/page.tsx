"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SubmitEvent } from "react";

export default function Page() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!password) {
      setMessage("パスワードを入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message ?? "ログインできませんでした。");
        return;
      }
      router.push("/");
    } catch {
      setMessage("通信できませんでした。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      className="grid min-h-dvh px-5 py-6 lg:grid-cols-[.8fr_1.2fr]"
    >
      <section className="hidden flex-col justify-between rounded-[1.8rem] bg-surface-strong p-12 text-on-strong lg:flex">
        <p className="font-mono text-xs uppercase tracking-[.16em] text-on-strong-muted">
          Private access / Leon.C
        </p>
        <blockquote className="max-w-md text-4xl font-semibold leading-tight tracking-[-.045em]">
          必要な情報へ、
          <br />
          <span className="text-accent-bright">迷わず進める</span>入口。
        </blockquote>
        <p className="text-sm text-on-strong-muted">Hiring team access</p>
      </section>
      <section className="flex items-center justify-center px-2 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="interactive mb-16 inline-block text-sm font-semibold"
          >
            ← 戻る
          </Link>
          <p className="eyebrow mb-4">Authentication</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tighter sm:text-5xl">
            採用・選考関係者向けページ
          </h1>
          <p className="mt-5 max-w-[44ch] leading-7 text-muted">
            認証後、任せられる仕事と実績、履歴書・職務経歴書、選考結果連絡フォームを確認できます。
          </p>
          <form onSubmit={handleSubmit} className="mt-12">
            <label htmlFor="password" className="text-sm font-semibold">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="パスワードを入力"
              className="mt-3 w-full border-x-0 border-t-0 border-b border-border bg-transparent px-0 py-4 text-lg outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
              required
            />
            <div aria-live="polite" className="min-h-12 pt-3">
              {message && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="interactive w-full cursor-pointer rounded-m bg-surface-strong px-5 py-4 font-semibold text-white shadow-m hover:bg-accent disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "確認しています…" : "認証して入る"}
            </button>
          </form>
          <p className="mt-10 font-mono text-[10px] tracking-widest text-muted">
            LAZYGENIUSDEV · SECURE ACCESS
          </p>
        </div>
      </section>
    </main>
  );
}
