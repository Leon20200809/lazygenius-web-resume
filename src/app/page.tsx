// app/page.tsx
// 役割: 採用担当者向けトップページ
// - 履歴書PDF導線
// - 職務経歴書PDF導線
// - Web版プロフィール導線

const CAREER_SHEET_PDF_PATH = "https://drive.google.com/file/d/1GqRGLEOU4UuYh7zE3WV5qh6HinyYPDBb/view?usp=sharing";

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
          仕組みで面倒を減らし、実務で使える形にするエンジニア
        </p> */}

        <p className="mb-10 max-w-2xl text-[length:var(--fs-base)] leading-relaxed text-[var(--color-muted)]">
          PHP / WordPress / Laravel / Next.js を軸に、
          小規模なWebサイト・Webアプリを構築しています。
        </p>

        {/* 導線 */}
        <div className="grid w-full gap-4">
          <a
            href="/resume"
            className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 font-bold text-[var(--color-text)] shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-bg-alt)] active:scale-[0.98]"
          >
            Web版プロフィールを見る
          </a>

          <a
            href="/print/resume"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 font-bold text-[var(--color-text)] shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-bg-alt)] active:scale-[0.98]"
          >
            履歴書PDFを開く
          </a>

          <a
            href={CAREER_SHEET_PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 font-bold text-[var(--color-text)] shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-bg-alt)] active:scale-[0.98]"
          >
            職務経歴書PDFを開く
          </a>

          <a
            href="/reply"
            className="inline-flex w-full items-center justify-center rounded-[var(--radius-l)] bg-[var(--color-accent)] px-6 py-4 text-center font-bold text-slate-950 shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-accent-hover)] hover:brightness-110 active:scale-[0.98]"
          >
            選考結果を連絡する
          </a>
        </div>

        {/* 外部導線 */}
        <div className="mt-10">
          <a
            href="https://lazygenius.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 transition hover:text-[var(--color-accent-hover)]"
          >
            設計思想・制作実績を見る（個人サイト）
          </a>
        </div>
      </section>
    </main>
  );
}
