"use client";

// login/page.tsx
// パスワードを /api/login にPOSTし、成功したらトップページへ移動する

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";

export default function Page() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  /**
   * ログインフォームの送信イベントを処理する
   *
   * @param {SubmitEvent<HTMLFormElement>} e - フォーム送信イベント
   * @description
   * 1. 標準のページ遷移を防止
   * 2. 入力されたパスワードをAPIにPOST送信
   * 3. 認証成功時はトップページへリダイレクト、失敗時はエラーメッセージを表示
   */
  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    if (!password) {
      setMessage("パスワードを入力してください");
      return;
    }

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "ログインに失敗しました");
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] p-8 rounded-xl shadow-lg border border-[var(--color-muted)]/20">
        {/* 1. ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-3 text-[var(--color-accent)] tracking-tight">
            採用担当者様専用ページ
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            履歴書・職務経歴書、および選考連絡用フォームを
            <br className="hidden sm:block" />
            公開しております。
          </p>
        </header>

        {/* 2. フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
              >
                Password
              </label>
              {/* メッセージをラベルの横に配置 */}
              {message && (
                <span
                  role="alert"
                  className="text-xs text-red-500 animate-pulse"
                >
                  ※{message}
                </span>
              )}
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="パスワードを入力してください"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--color-muted)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all placeholder:text-[var(--color-muted)]/50"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[var(--color-accent)] text-[var(--color-bg)] font-extrabold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer"
          >
            認証して入室する
          </button>
        </form>

        {/* 3. フッター */}
        <footer className="mt-8 pt-6 border-t border-[var(--color-muted)]/10 text-center">
          <p className="text-[10px] text-[var(--color-muted)] tracking-widest">
            © 2026 LazyGeniusDev. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
