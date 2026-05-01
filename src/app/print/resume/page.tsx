// src/app/print/resume/page.tsx
import { buildResumeData } from "@/lib/build-resume-data";

import { PrintButton } from "@/components/print/print-button";


export default async function PrintResumePage() {
  const resume = await buildResumeData();

  return (
    <>
      <div>
        <PrintButton />
      </div>

      <main className="mx-auto w-full max-w-[210mm] bg-white p-8 text-black">
        <section className="mb-8">
          <h1 className="mb-6 text-center text-3xl font-bold">履歴書</h1>

          <div>
            <p className="text-sm">氏名</p>
            <p className="border-b border-black py-2 text-xl font-semibold">
              {resume.profile.name}
            </p>
          </div>
        </section>
      </main>

      
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(resume.education, null, 2)}
      </pre>

      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(resume.career, null, 2)}
      </pre>

      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(resume.certification, null, 2)}
      </pre>
    </>
  );
}
