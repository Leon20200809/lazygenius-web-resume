// parse-certification.ts
import { parseCsvTextToRows } from "@/lib/parse-csv-text-to-rows";
import type { Certification } from "@/types/certification";

export function parseCertificationCsv(csv_text: string): Certification[] {
  const rows = parseCsvTextToRows(csv_text);

  // テーブル形式（横持ち）
  return rows.map((row) => ({
    name: row["name"] ?? "",
    acquired_date: row["acquired_date"] ?? "",
    note: row["note"] ?? "",
    sort: row["sort"] ?? "",
  }));
}
