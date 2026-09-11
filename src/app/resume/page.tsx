import { buildResumeData } from "@/lib/build-resume-data";
import Link from "next/link";

const SectionTitle = ({ number, children }: { number: string; children: React.ReactNode }) => (
  <div className="mb-7 flex items-baseline gap-4 border-b border-(--color-border) pb-3"><span className="font-mono text-xs text-(--color-accent)">{number}</span><h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{children}</h2></div>
);

export default async function ResumePage() {
  const resume = await buildResumeData();
  const facts = [["希望職種", resume.profile.wanted_job], ["最寄駅", resume.profile.nearest_station], ["通勤時間", resume.profile.commuting_time], ["メール", resume.profile.email]];
  return (
    <main id="main-content" className="min-h-dvh px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-14 flex items-center justify-between"><Link href="/" className="interactive text-sm font-semibold">← ホーム</Link><a href="/print/resume" target="_blank" className="interactive border-b border-current pb-1 text-sm font-semibold text-(--color-accent)">印刷用を開く ↗</a></nav>
        <header className="grid gap-10 border-b border-(--color-text) pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><p className="eyebrow mb-5">Web profile / Leon.C</p><h1 className="text-balance text-[clamp(3.6rem,10vw,7.5rem)] font-semibold leading-[.82] tracking-[-.075em]">{resume.profile.name}</h1>{resume.profile.furigana && <p className="mt-4 font-mono text-xs tracking-[.18em] text-(--color-muted)">{resume.profile.furigana}</p>}</div>
          <div className="border-l-2 border-(--color-accent) pl-6"><p className="text-xl font-semibold tracking-tight">{resume.profile.title}</p><p className="mt-4 max-w-[55ch] text-pretty leading-7 text-(--color-muted)">{resume.profile.tagline}</p></div>
        </header>
        <div className="grid gap-14 py-14 lg:grid-cols-[.34fr_.66fr] lg:gap-20">
          <aside className="space-y-12 lg:sticky lg:top-10 lg:self-start">
            <section><p className="eyebrow mb-5">At a glance</p><dl className="divide-y divide-(--color-border) border-y border-(--color-border)">{facts.map(([label, value]) => <div key={label} className="py-4"><dt className="mb-1 text-xs text-(--color-muted)">{label}</dt><dd className="break-words text-sm font-semibold">{value}</dd></div>)}</dl></section>
            <section><p className="eyebrow mb-5">Links</p><div className="space-y-3">{[["GitHub", resume.profile.github_url], ["Portfolio", resume.profile.portfolio_url]].map(([label, href]) => href && <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="interactive flex items-center justify-between border-b border-(--color-border) pb-3 text-sm font-semibold hover:text-(--color-accent)"><span>{label}</span><span>↗</span></a>)}</div></section>
          </aside>
          <div className="space-y-20">
            <section><SectionTitle number="01">自己紹介</SectionTitle><p className="max-w-[65ch] whitespace-pre-wrap text-pretty text-base leading-8 text-(--color-muted) sm:text-lg">{resume.profile.summary}</p></section>
            <section><SectionTitle number="02">学び方・考え方</SectionTitle><p className="max-w-[65ch] text-pretty leading-8 text-(--color-muted)">コードを書くこと自体ではなく、仕組みを理解しながら作ることを重視しています。実装中の違和感や疑問を放置せず、「なぜそうなるのか」を確認しながら改善を重ねます。</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{["処理や構造を抽象化して整理する", "違和感の原因を確認する", "仕組みから理解して判断する", "学びを次の実装へ再利用する"].map((item, index) => <li key={item} className="flex gap-3 border-t border-(--color-border) pt-3 text-sm font-medium"><span className="font-mono text-(--color-accent)">0{index + 1}</span>{item}</li>)}</ul></section>
            <section><SectionTitle number="03">職歴</SectionTitle><div>{resume.career.map((career) => <article key={career.id} className="grid gap-3 border-b border-(--color-border) py-8 first:pt-0 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-(--color-muted)">{career.period_start}<br />— {career.period_end}</p><div><div className="flex flex-wrap items-baseline gap-x-3"><h3 className="text-xl font-semibold tracking-tight">{career.company}</h3><span className="text-xs text-(--color-muted)">{career.employment_type}</span></div><p className="mt-2 font-semibold text-(--color-accent)">{career.role}</p>{career.summary && <p className="mt-4 max-w-[62ch] whitespace-pre-wrap text-sm leading-7 text-(--color-muted)">{career.summary}</p>}{career.achievements && <div className="mt-5 border-l border-(--color-accent) pl-4"><p className="text-xs font-semibold">実績</p><p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-(--color-muted)">{career.achievements}</p></div>}{career.tech_stack && <p className="mt-5 font-mono text-xs text-(--color-muted)">{career.tech_stack}</p>}</div></article>)}</div></section>
            <section><SectionTitle number="04">学歴</SectionTitle><div>{resume.education.map((education) => <article key={education.id} className="grid gap-3 border-b border-(--color-border) py-5 first:pt-0 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-(--color-muted)">{education.period_start}<br />— {education.period_end}</p><div><h3 className="font-semibold">{education.school_name}</h3><p className="mt-1 text-sm text-(--color-muted)">{education.faculty}{education.department && ` / ${education.department}`}</p>{education.summary && <p className="mt-3 text-sm leading-7 text-(--color-muted)">{education.summary}</p>}</div></article>)}</div></section>
            <section><SectionTitle number="05">資格</SectionTitle><div className="divide-y divide-(--color-border)">{resume.certification.map((certification) => <article key={`${certification.name}-${certification.acquired_date}`} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]"><p className="font-mono text-xs tabular-nums text-(--color-muted)">{certification.acquired_date}</p><div><h3 className="font-semibold">{certification.name}</h3>{certification.note && <p className="mt-1 text-sm text-(--color-muted)">{certification.note}</p>}</div></article>)}</div></section>
          </div>
        </div>
      </div>
    </main>
  );
}
