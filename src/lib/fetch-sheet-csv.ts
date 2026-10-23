import "server-only";
import { sourceMode } from "./production-wif-core";
import { fetchProductionSheetCsv } from "./production-sheet-csv";

// fetch-sheet-csv.ts → 指定したシートのCSVを取るだけ
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_BASE_ID;

const SHEETS = {
  profile: process.env.GOOGLE_SHEET_PROFILE_GID,
  education: process.env.GOOGLE_SHEET_EDUCATION_GID,
  career: process.env.GOOGLE_SHEET_CAREER_GID,
  certification: process.env.GOOGLE_SHEET_CERTIFICATION_GID
} as const;

/**
 * 指定されたシートのデータをCSV形式で取得する
 * 
 * @param {keyof typeof SHEETS} sheetName - 取得対象のシート名（SHEETSオブジェクトのキー）
 * @returns {Promise<string>} 取得したCSV文字列
 * @throws {Error} ネットワークエラーやURLが無効で取得に失敗した場合
 * 
 * @example
 * const csv = await fetchSheetCsv("profile");
 */
export async function fetchSheetCsv(
  sheetName: keyof typeof SHEETS
): Promise<string> {
  // 明示したWIFが失敗した場合は停止。公開CSVへ自動で戻さない。
  if (sourceMode(process.env.RESUME_SHEETS_SOURCE) === "wif") {
    return fetchProductionSheetCsv(sheetName);
  }
  const gid = SHEETS[sheetName];
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("CSV取得失敗");
  }

  return await res.text();
}
