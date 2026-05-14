// src/app/resume/page.tsx
// WEB版プロフィール
import { buildResumeData } from "@/lib/build-resume-data";

export default async function ResumePage() {
  const resume = await buildResumeData();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* ヘッダー */}
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Web Profile
          </p>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold md:text-5xl">
              {resume.profile.name}
            </h1>

            {resume.profile.furigana && (
              <p className="text-sm text-[var(--color-muted)]">
                {resume.profile.furigana}
              </p>
            )}

            <p className="text-lg font-semibold text-[var(--color-accent)]">
              {resume.profile.title}
            </p>

            <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
              {resume.profile.tagline}
            </p>
          </div>
        </header>

        {/* 基本情報 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">基本情報</h2>

          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[var(--color-muted)]">希望職種</dt>
              <dd className="font-semibold">{resume.profile.wanted_job}</dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">最寄駅</dt>
              <dd className="font-semibold">
                {resume.profile.nearest_station}
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">通勤時間</dt>
              <dd className="font-semibold">{resume.profile.commuting_time}</dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">メール</dt>
              <dd className="font-semibold">{resume.profile.email}</dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">GitHub</dt>
              <dd>
                <a
                  href={resume.profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--color-accent)] hover:underline"
                >
                  {resume.profile.github_url}
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">ポートフォリオ</dt>
              <dd>
                <a
                  href={resume.profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--color-accent)] hover:underline"
                >
                  {resume.profile.portfolio_url}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        {/* 自己紹介 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">自己紹介</h2>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            {resume.profile.summary}
          </p>
        </section>

        {/* 学び方・考え方 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">学び方・考え方</h2>

          <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            私は、単にコードを書くのではなく、仕組みを理解しながら作ることを重視しています。
            実装中に生まれる違和感や疑問を放置せず、「なぜそうなるのか」を確認しながら改善を重ねています。
          </p>

          <ul className="space-y-2 text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            <li>・処理や構造を抽象化して整理すること</li>
            <li>・実装中の違和感に気づき、原因を確認すること</li>
            <li>・「なぜ？」を止めず、仕組みから理解すること</li>
            <li>・作りながら理解し、次の実装に応用すること</li>
          </ul>
        </section>

        {/* 学歴 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">学歴</h2>

          <div className="space-y-4">
            {resume.education.map((education) => (
              <article
                key={education.id}
                className="border-b border-[var(--color-border)] pb-4 last:border-b-0 last:pb-0"
              >
                <p className="text-sm text-[var(--color-muted)]">
                  {education.period_start} 〜 {education.period_end}
                </p>

                <h3 className="mt-1 font-bold">{education.school_name}</h3>

                <p className="text-sm text-[var(--color-muted)]">
                  {education.faculty}
                  {education.department && ` / ${education.department}`}
                </p>

                {education.summary && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                    {education.summary}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 職歴 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">職歴</h2>

          <div className="space-y-6">
            {resume.career.map((career) => (
              <article
                key={career.id}
                className="border-b border-[var(--color-border)] pb-6 last:border-b-0 last:pb-0"
              >
                <p className="text-sm text-[var(--color-muted)]">
                  {career.period_start} 〜 {career.period_end}
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold">{career.company}</h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {career.employment_type}
                  </p>
                </div>

                <p className="mt-1 font-semibold text-[var(--color-accent)]">
                  {career.role}
                </p>

                <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--color-muted)]">業界</dt>
                    <dd>{career.industry}</dd>
                  </div>

                  <div>
                    <dt className="text-[var(--color-muted)]">チーム規模</dt>
                    <dd>{career.team_size}</dd>
                  </div>
                </dl>

                {career.summary && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted)]">
                    {career.summary}
                  </p>
                )}

                {career.achievements && (
                  <div className="mt-3">
                    <h4 className="text-sm font-bold">実績</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted)]">
                      {career.achievements}
                    </p>
                  </div>
                )}

                {career.tech_stack && (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    技術：{career.tech_stack}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 資格 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">資格</h2>

          <div className="space-y-3">
            {resume.certification.map((certification) => (
              <article
                key={`${certification.name}-${certification.acquired_date}`}
                className="border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-sm text-[var(--color-muted)]">
                  {certification.acquired_date}
                </p>

                <h3 className="font-bold">{certification.name}</h3>

                {certification.note && (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {certification.note}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
