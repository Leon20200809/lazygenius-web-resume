import Link from "next/link";

import { buildResumeData } from "@/lib/build-resume-data";

const evidence = [
  {
    title: "相談内容を、動くサービスと公開手順までつなぐ",
    summary:
      "クイズアプリでは画面、API、データベースを分担させ、テストを通過した場合だけ本番へ反映する流れまで構築しています。",
    links: [
      ["Frontend", "https://github.com/Leon20200809/lazygenius-quiz-front"],
      ["Laravel API", "https://github.com/Leon20200809/lazygenius-quiz-api"],
    ],
  },
  {
    title: "現在の運用を保ちながら、直しやすい構造へ移す",
    summary:
      "既存のWordPressテーマとして扱える状態を保ち、CSS・JavaScriptの管理を段階的に整理。新しい仕組みは必要な画面だけに限定しています。",
    links: [
      ["Evidence", "https://github.com/Leon20200809/lazygenius-v5"],
    ],
  },
  {
    title: "時間のかかる情報収集を、再実行可能な仕組みに変える",
    summary:
      "求人情報の取得・解析・重複排除・保存・定期実行を分離して実装。Webサイト確認も自動化し、結果を再確認できるデータとレポートに残しています。",
    links: [
      ["Job Hunter", "https://github.com/Leon20200809/lg-job-hunter"],
      ["Website Inspector", "https://github.com/Leon20200809/lg-website-inspector"],
    ],
  },
  {
    title: "問題箇所を切り分け、次の人が再現できる形にする",
    summary:
      "Webサーバー、アプリ、データベース、ネットワークを分けて構築し、確認コマンドとトラブル時の判断順をREADMEと個別手順に整理しています。",
    links: [
      ["Docker web environment", "https://github.com/Leon20200809/docker-web-starter-kit"],
    ],
  },
  {
    title: "実装した仕組みを、利用者が使える環境まで届ける",
    summary:
      "軽量なLPとフォームAPIはCloudflareへ公開し、Google Apps ScriptはローカルのTypeScriptからclaspで反映。用途に合わせて公開先とデプロイ方法を選んでいます。",
    links: [
      ["Cloudflare Worker", "https://github.com/Leon20200809/lg-astro-cloudflare-lp"],
      ["GAS / clasp", "https://github.com/Leon20200809/copy-paste-destructor-gas"],
    ],
  },
];

const benefits = [
  ["01", "相談から、実際に使える状態までつなぐ", "要件を整理し、画面・API・データ・テストを実装。用途に合う環境へ公開・反映するところまで進めます。"],
  ["02", "いまある資産を無駄にしない", "既存の運用方法を確認し、必要な部分から変更に強い構造へ移します。"],
  ["03", "情報収集を繰り返し使える仕事に変える", "公開Web情報の取得・解析・保存を分け、定期実行や再確認ができる流れに整えます。"],
  ["04", "次の担当者が追える状態にする", "README、構成図、確認コマンド、障害時の切り分け順を残します。"],
];

const workflow = [
  ["Understand", "目的、制約、既存構成を確認し、変更してよい境界を決めます。"],
  ["Separate", "表示、データ、API、インフラの責務を小さく分けます。"],
  ["Verify", "ログ、Network、テスト結果から原因を切り分け、推測と事実を分けます。"],
  ["Deliver", "Vercel、Cloudflare、Xserverなどから用途に合う方法を選び、利用者がアクセスできる状態まで反映します。"],
  ["Document", "実行手順と判断材料を残し、同じ確認を再現できる状態にします。"],
];

const technology = [
  ["Application", "PHP / Laravel / WordPress"],
  ["Frontend", "TypeScript / JavaScript / React / Next.js"],
  ["Data", "MySQL / Google Sheets / CSV / REST API"],
  ["Delivery", "GitHub Actions / Cloudflare Workers / Vercel / Xserver / clasp"],
  ["Environment", "Docker Compose / Nginx / Linux / WSL2"],
  ["Quality", "PHPUnit / Playwright / ESLint / TypeScript"],
];

function SectionTitle({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-baseline gap-4 border-b border-border pb-3">
      <span className="font-mono text-xs text-accent">{number}</span>
      <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{children}</h2>
    </div>
  );
}

export default async function ResumePage() {
  const resume = await buildResumeData();
  const facts = [
    ["希望職種", resume.profile.wanted_job],
    ["最寄駅", resume.profile.nearest_station],
    ["通勤時間", resume.profile.commuting_time],
    ["メール", resume.profile.email],
  ];

  return (
    <main id="main-content" className="min-h-dvh px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-14 flex items-center justify-between">
          <Link href="/" className="interactive text-sm font-semibold">← ホーム</Link>
          <a href="/print/resume" target="_blank" rel="noopener noreferrer" className="interactive border-b border-current pb-1 text-sm font-semibold text-accent">印刷用を開く ↗</a>
        </nav>

        <header className="grid gap-10 border-b border-foreground pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="eyebrow mb-5">Web developer / Leon.C</p>
            <h1 className="max-w-[12ch] text-balance text-[clamp(3rem,8vw,6.6rem)] font-semibold leading-[.88] tracking-[-.07em]">要件から公開まで、仕事を前へ進める。</h1>
          </div>
          <div className="border-l-2 border-accent pl-6">
            <p className="text-xl font-semibold tracking-tight">Web制作・保守改善・自動化</p>
            <p className="mt-4 max-w-[55ch] text-pretty leading-7 text-muted">Webサイトや業務ツールを、要件整理から実装・検証・公開までつなぎます。既存資産を活かす改善と、情報収集・定型作業の自動化に取り組んでいます。</p>
          </div>
        </header>

        <div className="grid gap-14 py-14 lg:grid-cols-[.34fr_.66fr] lg:gap-20">
          <aside className="space-y-12 lg:sticky lg:top-10 lg:self-start">
            <section>
              <p className="eyebrow mb-4">Profile</p>
              <h2 className="text-4xl font-semibold tracking-tighter">{resume.profile.name}</h2>
              {resume.profile.furigana && <p className="mt-2 font-mono text-xs tracking-[.16em] text-muted">{resume.profile.furigana}</p>}
              <p className="mt-5 text-sm font-semibold text-accent">{resume.profile.title}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{resume.profile.tagline}</p>
            </section>

            <section>
              <p className="eyebrow mb-5">At a glance</p>
              <dl className="divide-y divide-border border-y border-border">
                {facts.map(([label, value]) => <div key={label} className="py-4"><dt className="mb-1 text-xs text-muted">{label}</dt><dd className="wrap-break-word text-sm font-semibold">{value}</dd></div>)}
              </dl>
            </section>

            <section>
              <p className="eyebrow mb-5">Links</p>
              <div className="space-y-3">
                {[["GitHub", resume.profile.github_url], ["Portfolio", resume.profile.portfolio_url]].map(([label, href]) => href && <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="interactive flex items-center justify-between border-b border-border pb-3 text-sm font-semibold hover:text-accent"><span>{label}</span><span>↗</span></a>)}
              </div>
            </section>
          </aside>

          <div className="space-y-20">
            <section aria-labelledby="capabilities-heading">
              <SectionTitle number="01"><span id="capabilities-heading">何ができる人か</span></SectionTitle>
              <p className="max-w-[62ch] text-pretty text-xl font-medium leading-9 sm:text-2xl">Webサイト・業務ツールの要件を整理し、既存構成を確認したうえで、実装・テスト・利用者が使える環境への公開まで進めます。</p>
              <p className="mt-5 max-w-[65ch] leading-8 text-muted">特に、情報収集に時間がかかる業務や繰り返し作業を、取得・解析・保存に分けて再実行できる仕組みへ整えることに取り組んでいます。</p>
            </section>

            <section aria-labelledby="benefits-heading">
              <SectionTitle number="02"><span id="benefits-heading">任せるメリット</span></SectionTitle>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {benefits.map(([number, title, description]) => <article key={number} className="border-t border-border py-5"><p className="font-mono text-xs text-accent">{number}</p><h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-7 text-muted">{description}</p></article>)}
              </div>
            </section>

            <section aria-labelledby="evidence-heading">
              <SectionTitle number="03"><span id="evidence-heading">実績とEvidence</span></SectionTitle>
              <p className="mb-8 max-w-[62ch] text-sm leading-7 text-muted">直前の主張を確認できる公開実装です。詳しい設計、コード、検証手順は各リポジトリで確認できます。</p>
              <div>
                {evidence.map((item, index) => <article key={item.title} className="grid gap-3 border-b border-border py-7 first:pt-0 sm:grid-cols-[3rem_1fr]"><span className="font-mono text-xs text-muted">0{index + 1}</span><div><h3 className="text-xl font-semibold tracking-tight">{item.title}</h3><p className="mt-3 max-w-[60ch] text-sm leading-7 text-muted">{item.summary}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{item.links.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="interactive border-b border-current pb-0.5 font-mono text-xs font-semibold text-accent">{label} ↗</a>)}</div></div></article>)}
              </div>
            </section>

            <section aria-labelledby="workflow-heading">
              <SectionTitle number="04"><span id="workflow-heading">仕事の進め方</span></SectionTitle>
              <div className="space-y-5">
                {workflow.map(([label, description], index) => <article key={label} className="grid gap-2 sm:grid-cols-[8rem_1fr]"><p className="font-mono text-xs text-accent">0{index + 1} / {label}</p><p className="text-sm leading-7 text-muted">{description}</p></article>)}
              </div>
              {resume.profile.summary && <div className="mt-8 border-l border-accent pl-5"><p className="mb-2 text-xs font-semibold">Profile note</p><p className="max-w-[62ch] whitespace-pre-wrap text-sm leading-7 text-muted">{resume.profile.summary}</p></div>}
            </section>

            <section aria-labelledby="technology-heading">
              <SectionTitle number="05"><span id="technology-heading">技術領域</span></SectionTitle>
              <dl className="divide-y divide-border border-y border-border">
                {technology.map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]"><dt className="font-mono text-xs text-muted">{label}</dt><dd className="text-sm font-semibold">{value}</dd></div>)}
              </dl>
              <p className="mt-4 text-xs leading-6 text-muted">実際の組み合わせ方と担当範囲は、上記のEvidenceから確認できます。</p>
            </section>

            <section aria-labelledby="history-heading">
              <SectionTitle number="06"><span id="history-heading">経歴・資格</span></SectionTitle>
              <div className="space-y-14">
                <div><h3 className="mb-6 text-lg font-semibold">職歴</h3>{resume.career.map((career) => <article key={career.id} className="grid gap-3 border-b border-border py-7 first:pt-0 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-muted">{career.period_start}<br />— {career.period_end}</p><div><div className="flex flex-wrap items-baseline gap-x-3"><h4 className="text-lg font-semibold">{career.company}</h4><span className="text-xs text-muted">{career.employment_type}</span></div><p className="mt-2 font-semibold text-accent">{career.role}</p>{career.summary && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{career.summary}</p>}{career.achievements && <div className="mt-5 border-l border-accent pl-4"><p className="text-xs font-semibold">実績</p><p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-muted">{career.achievements}</p></div>}{career.tech_stack && <p className="mt-5 font-mono text-xs text-muted">{career.tech_stack}</p>}</div></article>)}</div>
                <div><h3 className="mb-6 text-lg font-semibold">学歴</h3>{resume.education.map((education) => <article key={education.id} className="grid gap-3 border-b border-border py-5 first:pt-0 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-muted">{education.period_start}<br />— {education.period_end}</p><div><h4 className="font-semibold">{education.school_name}</h4><p className="mt-1 text-sm text-muted">{education.faculty}{education.department && ` / ${education.department}`}</p>{education.summary && <p className="mt-3 text-sm leading-7 text-muted">{education.summary}</p>}</div></article>)}</div>
                <div><h3 className="mb-6 text-lg font-semibold">資格</h3><div className="divide-y divide-border">{resume.certification.map((certification) => <article key={`${certification.name}-${certification.acquired_date}`} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-muted">{certification.acquired_date}</p><div><h4 className="font-semibold">{certification.name}</h4>{certification.note && <p className="mt-1 text-sm text-muted">{certification.note}</p>}</div></article>)}</div></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
