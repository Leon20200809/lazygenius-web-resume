// build-resume-data.ts → どのシートを取り、どう統合するか決める
// Google Sheets の各CSVを取得し、画面で使いやすい ResumeData に統合する
import { fetchSheetCsv } from "@/lib/fetch-sheet-csv";

import { parseProfileCsv } from "@/lib/parse-profile-csv";
import { parseEducationCsv } from "@/lib/parse-education-csv";
import { parseCareerCsv } from "@/lib/parse-career-csv";
import { parseCertificationCsv } from "@/lib/parse-certification";

import { ResumeData } from "@/types/resume";

/**
 * スプレッドシートから履歴書に必要な全データを取得・解析し、統合したデータを返す
 * 
 * @description
 * Promise.all を使用して、プロフィール、学歴、職歴、資格の各CSVデータを並列でフェッチします。
 * ネットワーク遅延を最小限に抑え、高速に ResumeData オブジェクトを構築します。
 * 
 * @returns {Promise<ResumeData>} 解析済みの履歴書データオブジェクト
 * @throws {Error} フェッチまたはパース処理に失敗した場合
 */
export async function buildResumeData(): Promise<ResumeData> {
    // Promise.all: 複数の処理を同時並行でやれ
  const [profile_csv, education_csv, career_csv, certification_csv, ] = await Promise.all([
    fetchSheetCsv("profile"),
    fetchSheetCsv("education"),
    fetchSheetCsv("career"),
    fetchSheetCsv("certification"),
  ]);

  const profile = parseProfileCsv(profile_csv);
  const education = parseEducationCsv(education_csv);
  const career = parseCareerCsv(career_csv);
  const certification = parseCertificationCsv(certification_csv);

  return{
    profile,
    education,
    career,
    certification,
  }
}
