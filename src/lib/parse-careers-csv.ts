// parse-careers-csv.ts
import type { Career } from "@/types/career";

type CsvRow = Record<string, string>;

// 改行区切りで配列（jsはオブジェクト）1行目ヘッダーとして、2行目からデータ。
function parseCsvTextToRows(csv_text: string): CsvRow[] {
  const rows = csv_text.trim().split("\n");
  const raw_data = rows.map((row) => row.split(","));

  const [header_row, ...data_rows] = raw_data;

  if (!header_row) {
    return [];
  }

  const formatted_data = data_rows.map((row) => {
    const obj: CsvRow = {};

    header_row.forEach((header, index) => {
      obj[header.trim()] = row[index]?.trim() ?? "";
    });

    return obj;
  });

  return formatted_data;
}

export function parseCareersCsv(csv_text: string): Career[] {
  const rows = parseCsvTextToRows(csv_text);

  const careers = rows.map((row) => {
    return {
      id: row["id"] ?? "",
      status: row["status"] ?? "",
      company: row["company"] ?? "",
      period_start: row["period_start"] ?? "",
      period_end: row["period_end"] ?? "",
      employment_type: row["employment_type"] ?? "",
      role: row["role"] ?? "",
      industry: row["industry"] ?? "",
      team_size: row["team_size"] ?? "",
      summary: row["summary"] ?? "",
      challenge: row["challenge"] ?? "",
      result: row["result"] ?? "",
      achievements: row["achievements"] ?? "",
      tech_stack: row["tech_stack"] ?? "",
      print_summary: row["print_summary"] ?? "",
      sort: row["sort"] ?? "",
    };
  });

  return careers;
}
