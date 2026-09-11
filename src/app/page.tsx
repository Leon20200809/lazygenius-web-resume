const CAREER_SHEET_PDF_PATH = process.env.GOOGLE_DOCUMENT_URL;

const links = [
  {
    href: "/resume",
    label: "まず、Webプロフィール",
    note: "任せられること・実績・仕事の進め方",
  },
  {
    href: "/print/resume",
    label: "履歴書 PDF",
    note: "印刷・保存用のA4レイアウト",
    external: true,
  },
  {
    href: CAREER_SHEET_PDF_PATH,
    label: "職務経歴書 PDF",
    note: "業務経験と担当領域",
    external: true,
  },
  {
    href: "/reply",
    label: "選考結果を連絡",
    note: "内容を確認して送信できるフォーム",
  },
];

export default async function Home() {
  return (
    <main id="main-content" className="min-h-dvh px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl overflow-hidden rounded-[1.8rem] border border-border bg-surface shadow-l lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between p-7 sm:p-12 lg:p-16">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">Leon.C / Web resume</p>
          </div>
          <div className="my-20 max-w-2xl lg:my-28">
            <p className="mb-5 text-sm font-semibold text-muted">
              Web制作・保守改善・業務自動化
            </p>
            <h1 className="text-balance text-[clamp(3.4rem,10vw,7.5rem)] font-semibold leading-[0.84] tracking-[-0.075em]">
              要件から公開まで、
              <br />
              <span className="text-accent">仕事を前へ。</span>
            </h1>
            <p className="mt-8 max-w-[58ch] text-pretty text-base leading-8 text-muted sm:text-lg">
              既存のWebサイトや業務フローを読み解き、実装・検証・公開まで対応します。情報収集や定型作業は、繰り返し使える仕組みに整えます。
            </p>
          </div>
          <a
            href="https://lazygenius.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="interactive w-fit border-b border-current pb-1 text-sm font-semibold hover:text-accent"
          >
            制作実績を見る ↗
          </a>
        </section>
        <aside className="flex flex-col bg-surface-strong p-5 text-on-strong sm:p-8 lg:p-10">
          <p className="mb-10 font-mono text-xs uppercase tracking-[0.16em] text-on-strong-muted">
            Start with the web profile
          </p>
          <nav aria-label="資料一覧" className="mt-auto space-y-3">
            {links.map((link, index) => {
              const disabled = !link.href;
              return (
                <a
                  key={link.label}
                  href={link.href || undefined}
                  target={link.external && !disabled ? "_blank" : undefined}
                  rel={
                    link.external && !disabled
                      ? "noopener noreferrer"
                      : undefined
                  }
                  aria-disabled={disabled}
                  className={`interactive group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-t border-white/15 px-1 py-5 ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-accent-bright"}`}
                >
                  <span className="font-mono text-xs text-on-strong-faint">
                    0{index + 1}
                  </span>
                  <span>
                    <strong className="block text-base font-semibold">
                      {link.label}
                    </strong>
                    <small className="mt-1 block text-on-strong-muted">
                      {link.note}
                    </small>
                  </span>
                  <span
                    aria-hidden
                    className="text-xl text-accent-bright transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              );
            })}
          </nav>
          <details className="mt-10 border-t border-white/15 pt-5 text-sm text-on-strong-muted">
            <summary className="cursor-pointer font-semibold text-on-strong">
              このサイトで確認できること
            </summary>
            <p className="mt-4 max-w-[42ch] leading-7">
              Webプロフィールで任せられる仕事と公開GitHubの根拠を確認し、必要に応じて履歴書・職務経歴書へ進めます。
            </p>
          </details>
        </aside>
      </div>
    </main>
  );
}
