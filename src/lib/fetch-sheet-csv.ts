// fetch-sheet-csv.ts → 指定したシートのCSVを取るだけ
const SPREADSHEET_ID = "1hZGl7nRKstVKCmEJQh3EJf-_D24BJQSNiO_DdGktoz0";

const SHEETS = {
  profile: "1849835023",
  education: "1886713664",
} as const;

export async function fetchSheetCsv(sheetName: keyof typeof SHEETS): Promise<string> {

  const gid = SHEETS[sheetName];
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("CSV取得失敗");
  }

  return await res.text();
}