// build-resume-data.ts → どのシートを取り、どう統合するか決める
// Google Sheets の各CSVを取得し、画面で使いやすい ResumeData に統合する
import { fetchSheetCsv } from "@/lib/fetch-sheet-csv";

import { parseProfileCsv } from "@/lib/parse-profile-csv";
import { parseEducationCsv } from "@/lib/parse-education-csv";

import { ResumeData } from "@/types/resume";

export async function buildResumeData(): Promise<ResumeData> {
    // Promise.all: 複数の処理を同時並行でやれ
  const [profile_csv, education_csv] = await Promise.all([
    fetchSheetCsv("profile"),
    fetchSheetCsv("education"),
  ]);

  const profile = parseProfileCsv(profile_csv);
  const education = parseEducationCsv(education_csv);

  return{
    profile,
    education,
  }
}
