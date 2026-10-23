/**
 * FORMATTED_VALUE / ROWS の Sheets API 応答を既存CSVパーサーへ渡すための境界。
 * 日付・先頭ゼロは表示文字列のまま扱い、数値化やtrimはここでは行わない。
 * 不正な形は固定メッセージで停止し、セル値をエラーやログへ含めない。
 */
export function sheetValuesToCsv(values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("SHEET_VALUES_INVALID_HEADER");
  }
  const header: unknown = values[0];
  if (!Array.isArray(header) || header.length === 0 ||
      Array.from(header).some((cell) => typeof cell !== "string" || cell.trim() === "")) {
    throw new Error("SHEET_VALUES_INVALID_HEADER");
  }
  // 既存パーサーはヘッダーをキーにするため、重複による黙った上書きを防ぐ。
  const keys = header.map((cell: string) => cell.trim());
  if (new Set(keys).size !== keys.length) {
    throw new Error("SHEET_VALUES_INVALID_HEADER");
  }
  const width = header.length;
  return Array.from(values).map((row: unknown) => {
    if (!Array.isArray(row) || row.length > width ||
        Array.from(row).some((cell) => typeof cell !== "string")) {
      throw new Error("SHEET_VALUES_INVALID_ROW");
    }
    // APIが省略する末尾の空セルを補う。空行も列位置を保ち、勝手に削除しない。
    return Array.from({ length: width }, (_, index) => {
      const cell: string = row[index] ?? "";
      // 全セル引用はtrim:trueの挙動を変えるため、CSVで必要な場合だけ引用する。
      return /[,"\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
    }).join(",");
  }).join("\r\n");
}
