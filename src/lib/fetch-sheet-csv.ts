import "server-only";
import type { SheetKey } from "./production-wif-core";
import { fetchProductionSheetCsv } from "./production-sheet-csv";

/**
 * 取得は認証付きProduction WIFだけ。失敗時も公開URLへ戻さない。
 * CSVは既存パーサーへ渡す中間形式として維持する。
 */
export async function fetchSheetCsv(sheetName: SheetKey): Promise<string> {
  return fetchProductionSheetCsv(sheetName);
}
