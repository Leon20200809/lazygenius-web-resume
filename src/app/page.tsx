// app/page.tsx
// 役割: 採用担当者向けトップページ
// - 履歴書PDF導線
// - 職務経歴書PDF導線
// - Web版プロフィール導線

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

        {/* <p className="mb-3 text-[length:var(--fs-lg)] font-semibold">
          フルスタック志向エンジニア
        </p> */}

        <p className="mb-10 max-w-2xl text-[length:var(--fs-base)] leading-relaxed text-[var(--color-muted)]">
          PHP / WordPress / Laravel / Next.js を軸に、
          実務で使える仕組みを設計・実装しています。
        </p>

        {/* 導線 */}
        <div className="grid w-full gap-4">
          <a
            href="/print/resume"
            target="_blank"
            className="rounded-[var(--radius-l)] bg-[var(--color-accent)] px-6 py-4 font-bold text-slate-950 shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-accent-hover)] hover:brightness-110 active:scale-[0.98]"
          >
            履歴書をダウンロード
          </a>

          <a
            href="/print/career"
            target="_blank"
            className="rounded-[var(--radius-l)] bg-[var(--color-surface)] px-6 py-4 font-bold text-[var(--color-text)] shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-bg-alt)] active:scale-[0.98]"
          >
            職務経歴書をダウンロード
          </a>

          <a
            href="/resume"
            className="rounded-[var(--radius-l)] border border-[var(--color-border)] px-6 py-4 font-bold text-[var(--color-text)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-surface)] active:scale-[0.98]"
          >
            Web版を見る
          </a>
        </div>

        {/* 技術スタック */}
        <p className="mt-10 text-sm text-[var(--color-muted)]">
          PHP / WordPress / Laravel / Next.js / TypeScript
        </p>

        {/* 外部導線 */}
        <div className="mt-6">
          <a
            href="https://lazygenius.dev"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 transition hover:text-[var(--color-accent-hover)]"
          >
            設計思想・制作実績を見る（個人サイト）を見る
          </a>
        </div>
      </section>
    </main>
  );
}
