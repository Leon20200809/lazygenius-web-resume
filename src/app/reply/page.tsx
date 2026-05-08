
// src/app/reply/page.tsx

import { ReplyForm } from "@/features/reply/components/reply-form";

export default function ReplyPage() {

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* ヘッダー */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Selection Reply
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            選考結果連絡フォーム
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            書類選考の結果、面談日程のご相談、お見送りのご連絡を簡単に作成できます。
            入力内容をもとに、Leon.C 宛の連絡文面を生成します。
          </p>
        </header>

        {/* フォームカード */}
        <ReplyForm recipientName="Leon.C" recipientEmail="info@lazygenius.dev" />

      </div>
    </main>
  );
}
