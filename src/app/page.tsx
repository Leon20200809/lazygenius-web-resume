// app/page.tsx
// 役割: 採用担当者向けトップページ
// - 履歴書PDF導線
// - 職務経歴書PDF導線
// - Web版プロフィール導線

const CAREER_SHEET_PDF_PATH = "/docs/career-sheet.pdf";

export default async function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        {/* 肩書き */}
        <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-[var(--color-accent)] uppercase">
          Web Resume
        </p>

        {/* タイトル */}
        <h1 className="mb-4 text-[length:var(--fs-2xl)] font-bold tracking-tight">
          Leon.C
        </h1>

        {/* キャッチ */}
        <p className="mb-3 text-[length:var(--fs-lg)] font-semibold">
          ご覧いただきありがとうございます。
        </p>

        <p className="mb-3 text-[length:var(--fs-lg)] font-semibold">
          小規模Webアプリを1人で設計・実装・運用可能
        </p>

        <p className="mb-10 max-w-2xl text-[length:var(--fs-base)] leading-relaxed text-[var(--color-muted)]">
          PHP / WordPress / Laravel / Next.js を軸に、
          <br />
          認証・フォーム・API連携・印刷対応まで含めて構築できます。
        </p>

        {/* 導線 */}
        <div className="grid w-full gap-4">
          <a
            href="/resume"
            className="rounded-[var(--radius-l)] bg-[var(--color-accent)] px-6 py-4 font-bold text-slate-950 shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-accent-hover)] hover:brightness-110 active:scale-[0.98]"
          >
            Web版プロフィールを見る
          </a>

          <a
            href="/print/resume"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-l)] bg-[var(--color-surface)] px-6 py-4 font-bold text-[var(--color-text)] shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-bg-alt)] active:scale-[0.98]"
          >
            履歴書PDFを開く
          </a>

          <a
            href={CAREER_SHEET_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-l)] border border-[var(--color-border)] px-6 py-4 font-bold text-[var(--color-text)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-surface)] active:scale-[0.98]"
          >
            職務経歴書PDFを開く
          </a>
        </div>

        {/* 技術スタック */}
        <p className="mt-10 text-sm text-[var(--color-muted)]">
          使用技術：Next.js / TypeScript / Google Sheets CSV / PHP / WordPress / Laravel
        </p>

        {/* このサイトでわかること */}
        <p className="mt-10 text-sm text-left text-[var(--color-muted)]">
          ■このサイトでわかること
          ・Google Sheetsをデータ管理元にしたWeb履歴書<br />
          ・Next.js / TypeScriptによる画面構築 <br />
          ・履歴書 / 職務経歴書のA4印刷対応<br />
          ・小規模アプリを1人で設計・実装できること
        </p>

        {/* 外部導線 */}
        <div className="mt-6">
          <a
            href="https://lazygenius.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 transition hover:text-[var(--color-accent-hover)]"
          >
            設計思想・制作実績を見る（個人サイト）を見る
          </a>
        </div>
      </section>
    </main>
  );
}
