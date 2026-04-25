// parse-csv-text-to-rows.ts → CSV文字列を行データに変換
import { parse } from "csv-parse/sync";

export function parseCsvTextToRows(csv_text: string): Record<string, string>[] {
  return parse(csv_text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ",",
  });
}

// ---------------------------------------------
// 【役割】
// CSV文字列を「行データ（オブジェクト配列）」に変換する共通処理
//
// 【使用ライブラリ】
// csv-parse（正式名称：csv-parse）
// → Node.js向けのCSVパースライブラリ
// → カンマ区切りの文字列をJavaScriptで扱いやすい形に変換する
//
// 【なぜ使う？】
// ・自前でsplitすると「カンマ入り文章」「改行」などで壊れる
// ・実務ではライブラリを使うのが基本
//
// 【入力】
// "key,value,label\nname,Leon.C,氏名"
//
// 【出力】
// [
//   { key: "name", value: "Leon.C", label: "氏名" }
// ]
//
// 【オプション説明】
// columns: true
// → 1行目をヘッダーとして扱い、オブジェクト形式にする
//
// skip_empty_lines: true
// → 空行を無視する
//
// trim: true
// → 前後の空白を削除する
//
// delimiter: ","
// → 区切り文字（CSVならカンマ、TSVなら "\t"）
//
// 【注意】
// ・Google Sheetsの出力形式によって delimiter が変わることがある
// ・CSVは「フォーマットが命」、ここがズレると全部壊れる
// ---------------------------------------------