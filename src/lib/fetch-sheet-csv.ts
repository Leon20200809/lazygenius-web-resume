// fetch-sheet-csv.ts → 指定したシートのCSVを取るだけ
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_BASE_ID;

const SHEETS = {
  profile: process.env.GOOGLE_SHEET_PROFILE_GID,
  education: process.env.GOOGLE_SHEET_EDUCATION_GID,
  career: process.env.GOOGLE_SHEET_CAREER_GID,
  certification: process.env.GOOGLE_SHEET_CERTIFICATION_GID
} as const;

export async function fetchSheetCsv(
  sheetName: keyof typeof SHEETS
): Promise<string> {
  const gid = SHEETS[sheetName];
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("CSV取得失敗");
  }

  return await res.text();
}
