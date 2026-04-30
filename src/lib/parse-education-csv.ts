// src/lib/parse-education-csv.ts

import { parseCsvTextToRows } from "@/lib/parse-csv-text-to-rows";
import type { Education } from "@/types/education";

export function parseEducationCsv(csv_text: string): Education[] {
  const rows = parseCsvTextToRows(csv_text);

  // テーブル形式（横持ち）
  return rows.map((row) => {
    return {
      id: row["id"] ?? "",
      status: row["status"] ?? "",
      school_name: row["school_name"] ?? "",
      faculty: row["faculty"] ?? "",
      department: row["department"] ?? "",
      period_start: row["period_start"] ?? "",
      period_end: row["period_end"] ?? "",
      category: row["category"] ?? "",
      summary: row["summary"] ?? "",
      print_summary: row["print_summary"] ?? "",
      sort: row["sort"] ?? "",
    };
  });
}
