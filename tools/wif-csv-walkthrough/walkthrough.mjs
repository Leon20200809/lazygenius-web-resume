import { sheetValuesToCsv } from '../../src/lib/sheet-values-to-csv.ts';
import { parseCsvTextToRows } from '../../src/lib/parse-csv-text-to-rows.ts';
import { authenticateDevelopment, readWalkthroughValues, SafeError } from '../wif-poc/poc.mjs';
import { EXPECTED_VALUES, mockValues } from './fixture.mjs';

const stop = (step, code) => { throw new SafeError(step, code); };
const cell = (row, col) => `${'DEFG'[col]}${row + 2}`;

// 目的: 未知の値をCSV/パーサーに渡す前に止める。入力: 未信頼のvalues。出力: 検証済みの9×4配列。
export function verifyValues(values, log = () => {}) {
  if (!Array.isArray(values) || values.length !== 9) stop('STEP3', 'ROW_COUNT');
  return EXPECTED_VALUES.map((expected, r) => {
    const row = values[r];
    if (!Array.isArray(row) || row.length > 4) stop('STEP3', `ROW_SHAPE_${r + 2}`);
    return expected.map((value, c) => {
      // 末尾空欄の省略だけ補完する。内部の欠落・非文字列・異なる値は許可しない。
      const actual = c >= row.length ? '' : row[c];
      if (typeof actual !== 'string') stop('STEP3', `TYPE_${cell(r, c)}`);
      if (actual !== value) stop('STEP3', `MISMATCH_${cell(r, c)}`);
      log(`CELL ${cell(r, c)} PASS STRING_EXACT`);
      return actual;
    });
  });
}

export async function walkthrough({ live = false, config, token, confirmBindingCleanup = false,
  fetchImpl = globalThis.fetch, now = Date.now(), log = console.log } = {}) {
  // STEP1 目的: Dev専用サービスアカウントの短期資格を得る。
  // 入力: ユーザーPCだけのOIDCトークン・Dev設定。出力: メモリー内の短期アクセストークン（ログ禁止）。
  let accessToken;
  if (live) accessToken = await authenticateDevelopment({ config, token, confirmBindingCleanup, fetchImpl, now });
  log(`STEP1 PASS ${live ? 'DEV_AUTH' : 'MOCK_NO_AUTH'}`);

  // STEP2 目的: 固定ダミー範囲だけ読む。入力: 短期資格。出力: 未信頼の二次元配列。
  const values = live ? await readWalkthroughValues(accessToken, fetchImpl) : mockValues();
  log(`STEP2 PASS ${live ? 'FIXED_RANGE_READ' : 'MOCK_NO_NETWORK'}`);

  // STEP3 目的: 行列・型・全セルの期待値を先に照合。失敗すればSTEP4以降へ進まない。
  const verified = verifyValues(values, log);
  log('STEP3 PASS EXPECTED_VALUES');

  // STEP4 目的: 既存CSV契約を維持。入力: 検証済み配列。出力: カンマ/引用符/改行を正しく引用したCSV文字列。
  let csv;
  try { csv = sheetValuesToCsv(verified); } catch { stop('STEP4', 'CSV_CONVERSION'); }
  log('STEP4 PASS CSV_ADAPTER');

  // STEP5 目的: 既存パーサーをそのまま利用。入力: CSV。出力: id/text/note/caseをキーとする8件の行。
  let rows;
  try { rows = parseCsvTextToRows(csv); } catch { stop('STEP5', 'CSV_PARSE'); }
  log('STEP5 PASS EXISTING_PARSER');

  // STEP6 目的: 往復変換で文字・位置が変わらないことを検査。出力: 値を含まないセル別PASS/固定FAIL。
  if (rows.length !== 8) stop('STEP6', 'ROW_COUNT');
  for (let r = 1; r < EXPECTED_VALUES.length; r++) {
    for (let c = 0; c < 4; c++) {
      if (rows[r - 1][EXPECTED_VALUES[0][c]] !== EXPECTED_VALUES[r][c]) stop('STEP6', `MISMATCH_${cell(r, c)}`);
      log(`CELL ${cell(r, c)} PASS ROUND_TRIP`);
    }
  }
  log('STEP6 PASS ROUND_TRIP');
  return 'PASS WIF_CSV_WALKTHROUGH';
}
