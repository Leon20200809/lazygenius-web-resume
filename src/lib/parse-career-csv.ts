// parse-career-csv.ts
import { parseCsvTextToRows } from "@/lib/parse-csv-text-to-rows";
import { Career } from "@/types/career";

export function parseCareerCsv(csv_text: string): Career[] {
  const rows = parseCsvTextToRows(csv_text);

  // テーブル形式（横持ち）
  return rows.map((row) => ({
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
  }));
}
