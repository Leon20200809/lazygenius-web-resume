// src/app/print/resume/page.tsx
import { buildResumeData } from "@/lib/build-resume-data";
import { PrintButton } from "@/components/print/print-button";

export default async function PrintResumePage() {
  const resume = await buildResumeData();

  return (
    <>
      {/* 画面上だけ表示する印刷ボタン */}
      <div className="mx-auto max-w-[210mm] p-4 print:hidden">
        <PrintButton />
      </div>

      <main className="mx-auto w-full max-w-[210mm] bg-white p-3 text-black print:p-0">
        {/* A4用紙本体 */}
        <article className="mx-auto min-h-[297mm] border border-black p-3 text-[13px] leading-snug print:border-0">
          {/* ヘッダー */}
          <header className="mb-4 border-b-2 border-black pb-2">
            <h1 className="text-center text-2xl font-bold tracking-[0.2em]">
              履歴書
            </h1>
          </header>

          {/* 基本情報 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              基本情報
            </h2>

            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-bold">フリガナ</p>
                  <p className="border-b border-black py-0.5">
                    {resume.profile.furigana}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold">氏名</p>
                  <p className="border-b border-black py-0.5 text-lg font-semibold">
                    {resume.profile.name}
                  </p>
                </div>
              </div>

              <div className="flex h-[128px] items-center justify-center border border-black text-[11px] text-gray-500">
                写真
              </div>
            </div>
          </section>

          {/* 連絡先 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              連絡先
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div>
                <p className="text-[11px] font-bold">メール</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.email}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">電話番号</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.phone}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">最寄駅</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.nearest_station}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">通勤時間</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.commuting_time}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-[11px] font-bold">住所</p>
                <p className="border-b border-black py-0.5">
                  〒{resume.profile.postal_code} {resume.profile.address}
                </p>
              </div>
            </div>
          </section>

          {/* 自己紹介 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              自己紹介
            </h2>

            <p className="whitespace-pre-wrap text-[13px] leading-snug">
              {resume.profile.summary}
            </p>
          </section>

          {/* 学歴 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              学歴
            </h2>

            <div className="space-y-2">
              {resume.education.map((education) => (
                <div
                  key={education.id}
                  className="grid grid-cols-[96px_1fr] gap-3 border-b border-gray-300 pb-1 text-[13px]"
                >
                  <div>
                    <p>{education.period_start}</p>
                    <p>〜 {education.period_end}</p>
                  </div>

                  <div>
                    <p className="font-semibold">{education.school_name}</p>

                    {(education.faculty || education.department) && (
                      <p>
                        {education.faculty}
                        {education.department && ` / ${education.department}`}
                      </p>
                    )}

                    {education.print_summary && (
                      <p className="mt-0.5 text-[12px] leading-snug">
                        {education.print_summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 職歴 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              職歴
            </h2>

            <div className="space-y-2">
              {resume.career.map((career) => (
                <div
                  key={career.id}
                  className="grid grid-cols-[96px_1fr] gap-3 border-b border-gray-300 pb-1 text-[13px]"
                >
                  <div>
                    <p>{career.period_start}</p>
                    <p>〜 {career.period_end}</p>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="font-semibold">{career.company}</p>
                      <p className="text-[11px]">{career.employment_type}</p>
                    </div>

                    <p>{career.role}</p>

                    {career.print_summary && (
                      <p className="mt-0.5 text-[12px] leading-snug">
                        {career.print_summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 資格 */}
          <section className="mb-4">
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              資格
            </h2>

            <div className="space-y-1.5">
              {resume.certification.map((certification) => (
                <div
                  key={`${certification.name}-${certification.acquired_date}`}
                  className="grid grid-cols-[96px_1fr] gap-3 border-b border-gray-300 pb-1 text-[13px]"
                >
                  <p>{certification.acquired_date}</p>

                  <div>
                    <p className="font-semibold">{certification.name}</p>

                    {certification.note && (
                      <p className="mt-0.5 text-[12px] leading-snug">
                        {certification.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 補足情報 */}
          <section>
            <h2 className="mb-2 border-l-4 border-black pl-2 text-base font-bold">
              補足
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div>
                <p className="text-[11px] font-bold">扶養家族</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.dependents}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">配偶者</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.spouse}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">配偶者の扶養義務</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.spouse_support}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold">希望職種</p>
                <p className="border-b border-black py-0.5">
                  {resume.profile.wanted_job}
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}