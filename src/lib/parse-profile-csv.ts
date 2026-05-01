// src/lib/parse-profile-csv.ts → profile CSVをProfileに変換
import { parseCsvTextToRows } from "@/lib/parse-csv-text-to-rows";
import { Profile } from "@/types/profile";
import { empty_profile } from "@/types/profile";


// Key-Value形式（縦持ち）
export function parseProfileCsv(csv_text: string): Profile {
  const rows = parseCsvTextToRows(csv_text);
  // console.log("【parseProfileCsv rows】", rows.slice(0, 5));
  const profile = { ...empty_profile };

  rows.forEach((row) => {
    const key = row["key"] ?? "";
    const value = row["value"] ?? "";

    if (key in profile) {
      profile[key as keyof Profile] = value;
    }
  });

  return profile;
}