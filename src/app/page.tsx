// page.tsx トップページ
import { fetchCareersCsv } from "@/lib/fetch-careers-csv";
import { parseCareersCsv } from "@/lib/parse-careers-csv";

export default async function Home() {
  const csv_text = await fetchCareersCsv();

  const careers = parseCareersCsv(csv_text);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold underline text-red-500">
        careers CSV 取得テスト
      </h1>

      <pre>{JSON.stringify(careers.slice(0, 3), null, 2)}</pre>

      <div className="space-y-4">
        {careers.map((career) => (
          <section
            key={career.id}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow"
          >
            <h2 className="mb-2 text-2xl font-bold text-cyan-300">
              {career.company}
            </h2>

            <p className="mb-2 text-lg text-zinc-200">{career.role}</p>

            <p className="text-sm text-zinc-400">
              {career.period_start} ～ {career.period_end}
            </p>
          </section>
        ))}
      </div>

      {/* 印刷ページリンク */}
      <div className="my-8 flex justify-center">
        <a
          href="/print/resume"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-white"
        >
          履歴書を印刷
        </a>
      </div>
      

      <p className="mt-8 text-sm text-zinc-500">LazyGenius Resume Platform</p>
    </main>
  );
}
