// src/app/print/resume/page.tsx
import { fetchSheetCsv } from "@/lib/fetch-sheet-csv";
import { parseProfileCsv } from "@/lib/parse-profile-csv";
import { PrintButton } from "@/components/print/print-button";

const profile_csv = await fetchSheetCsv("profile");
const profile = parseProfileCsv(profile_csv);

export default function PrintResumePage() {
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
              {profile.name}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
