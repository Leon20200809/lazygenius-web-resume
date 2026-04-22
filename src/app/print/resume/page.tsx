// src/app/print/resume/page.tsx

import { PrintButton } from "@/components/print/print-button";

type ResumeBasic = {
  furigana: string;
  name: string;
  birth_date: string;
  phone: string;
  address: string;
  email: string;
  self_pr: string;
  personal_request: string;
};

type ResumeRow = {
  date: string;
  text: string;
};

type ResumeData = {
  basic: ResumeBasic;
  education: ResumeRow[];
  careers: ResumeRow[];
  certifications: string[];
};

const resume_data: ResumeData = {
  basic: {
    furigana: "れおん しー",
    name: "Leon.C",
    birth_date: "1980-00-00",
    phone: "090-xxxx-xxxx",
    address: "大阪府〇〇市〇〇...",
    email: "example@example.com",
    self_pr:
      "WordPress・PHP・JavaScriptを軸に、実務で使えるWeb制作と業務改善に取り組んできました。構造設計と再利用性を重視し、保守しやすい実装を意識しています。",
    personal_request: "貴社規定に従います。",
  },
  education: [
    { date: "2000-04", text: "〇〇高等学校 入学" },
    { date: "2003-03", text: "〇〇高等学校 卒業" },
  ],
  careers: [
    { date: "2018-01", text: "株式会社盛備 入社" },
    { date: "2023-07", text: "株式会社盛備 退職" },
    { date: "2023-04", text: "合同会社ケアマインド 業務委託" },
  ],
  certifications: ["基本情報技術者試験", "普通自動車第一種運転免許"],
};

export default function PrintResumePage() {
  const { basic, education, careers, certifications } = resume_data;

  return (
    <>
      <div>
        <PrintButton />
      </div>

      <main className="mx-auto w-full max-w-[210mm] bg-white p-8 text-black">
        <section className="mb-8">
          <h1 className="mb-6 text-center text-3xl font-bold">履歴書</h1>

          <div className="grid grid-cols-[1fr_120px] gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm">ふりがな</p>
                <p className="border-b border-black py-2">{basic.furigana}</p>
              </div>

              <div>
                <p className="text-sm">氏名</p>
                <p className="border-b border-black py-2 text-xl font-semibold">
                  {basic.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">生年月日</p>
                  <p className="border-b border-black py-2">
                    {basic.birth_date}
                  </p>
                </div>

                <div>
                  <p className="text-sm">電話番号</p>
                  <p className="border-b border-black py-2">{basic.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm">住所</p>
                <p className="border-b border-black py-2">{basic.address}</p>
              </div>

              <div>
                <p className="text-sm">メールアドレス</p>
                <p className="border-b border-black py-2">{basic.email}</p>
              </div>
            </div>

            <div className="flex h-[160px] items-center justify-center border border-black text-sm">
              写真
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-black pb-2 text-xl font-bold">
            学歴
          </h2>

          <div className="space-y-2 text-sm">
            {education.map((row, index) => (
              <div
                key={`${row.date}-${index}`}
                className="grid grid-cols-[120px_1fr] gap-4"
              >
                <p>{row.date}</p>
                <p>{row.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-black pb-2 text-xl font-bold">
            職歴
          </h2>

          <div className="space-y-2 text-sm">
            {careers.map((row, index) => (
              <div
                key={`${row.date}-${index}`}
                className="grid grid-cols-[120px_1fr] gap-4"
              >
                <p>{row.date}</p>
                <p>{row.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-black pb-2 text-xl font-bold">
            保有資格
          </h2>

          <ul className="space-y-2 text-sm">
            {certifications.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 border-b border-black pb-2 text-xl font-bold">
            自己PR
          </h2>

          <div className="min-h-[120px] border border-black p-4 text-sm leading-7">
            {basic.self_pr}
          </div>
        </section>

        <section>
          <h2 className="mb-3 border-b border-black pb-2 text-xl font-bold">
            本人希望欄
          </h2>

          <div className="min-h-[80px] border border-black p-4 text-sm leading-7">
            {basic.personal_request}
          </div>
        </section>
      </main>
    </>
  );
}
