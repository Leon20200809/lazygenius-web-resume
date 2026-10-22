# WIF → Sheets → CSV：6段階で読む学習用CLI

**学習用。mainへマージしない。** PRのbaseは `work/issue-1-local-wif-poc`。新ブランチにPR #5の未接続アダプター4ファイルを取り込むが、既存アプリの取得・認証・表示・印刷には接続しない。既存PoCブランチ自体も変更しない。

WIF（Workload Identity Federation＝外部ID連携）、OIDC（OpenID Connect＝IDトークンの仕組み）、SA（Service Account＝サービスアカウント）、STS（Security Token Service＝資格交換）、CSV（Comma-Separated Values＝カンマ区切り）は、下の流れの役割名。APIはサービス間の呼出し口、CLIは端末から実行するプログラム。

## まずシートとコードを並べる

対象は非公開ダミーシート `1amBK2qOd3IUjY5x1ZXN2osQFfp8Wsd3MBc6rvTMQlyQ`、**`WIF_TEST!D2:G10`だけ**。D1は表題で範囲外。A1:B6は触らず、B2の旧 `WIF_READ_OK` 確認は従来CLIのまま。2026-10-22にこの範囲をFORMATTED_VALUEで読取確認した固定配列が `fixture.mjs`。実データをここに貼らない。

| 行 | D: id | E: text | F: note | G: case |
|---|---|---|---|---|
| 2 | id | text | note | case |
| 3 | 001 | 大阪市のWeb制作 | 漢字・ひらがな・カタカナ | 日本語 |
| 4 | 002 | 「仕方ない」を見直す | 全角かぎ括弧と句読点。 | 全角記号 |
| 5 | 003 | 株式会社サンプル, 大阪支店 | 半角カンマを含む | カンマ |
| 6 | 004 | 彼は"確認OK"と言った | 半角ダブルクォートを含む | 引用符 |
| 7 | 005 | 一行目〈セル内改行〉二行目 | セル内改行を保持 | 改行 |
| 8 | 006 | 001-0007 | 先頭ゼロを保持 | 先頭ゼロ |
| 9 | 007 | テスト完了 | 最終列を空欄にする | 〈空欄〉 |
| 10 | 008 | ＡＢＣ１２３とabc123 | 全角・半角の混在 | 全半角 |

期待形式は文字列。特にD3:D10とE8は先頭ゼロを維持する文字列、E7は実改行、G9は空セル。現在のセルのnumberFormat設定そのものは未検証で、変更もしない。読取時は `majorDimension=ROWS` / `valueRenderOption=FORMATTED_VALUE`。APIは末尾空欄G9を省略するので、その位置だけ空文字として補完して照合する。表示値は確認できたが、全シート・全形式がstringになるという保証ではない。

## 読む順番（目的・入力・出力はコードにも記載）

1. `cli.mjs` → `walkthrough.mjs` STEP1 → `../wif-poc/poc.mjs` の `authenticateDevelopment`。既存3交換を順に読む：Vercel用audience → Dev provider標準audience → Google STS → Dev SA。資格はメモリー内だけ。
2. STEP2 → `readWalkthroughValues`：固定範囲の `values.get`、未検証の二次元配列を得る。
3. STEP3 → `verifyValues` と `fixture.mjs`：9行×4列、型・全セルの一致を確認。不一致は**CSV変換前**に停止。
4. STEP4 → `src/lib/sheet-values-to-csv.ts`：引用が必要なカンマ・改行・ダブルクォートをCSVへ。
5. STEP5 → `src/lib/parse-csv-text-to-rows.ts`：既存パーサーでキー付き8行へ戻す。
6. STEP6：各キーの値が元の固定表と完全一致するか比較する。

認証の方式・検証・順序は変えず、旧 `runPoc` と新CLIで同じ関数を使う。B2用CLIは依然としてB2だけを読む。

## Windows Git Bash（リポジトリのルート）

Node.js 22.18以上（司令官の22.23.4対応）または24系。依存は既存 `npm ci` のみ、追加依存なし。

```sh
# 最初はこれだけ：資格ファイルを読まず、通信せず、固定ダミーで6段階確認
node tools/wif-csv-walkthrough/cli.mjs

# オフライン回帰テスト（既存53・既存38・新30）
node --test tools/wif-poc/poc.test.mjs
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs
node --test tools/wif-csv-walkthrough/walkthrough.test.mjs

# 実通信前：既存ファイルの値は表示せず、ignore対象だけ確認
# 2つともパスが表示されること。git status に秘密ファイルが出たら停止。
git check-ignore .env.wif.local tools/wif-poc/.env.config.local
git status --short

# 司令官だけがWindowsで実行。LR側では実通信しない。
node tools/wif-csv-walkthrough/cli.mjs --run --confirm-binding-cleanup
```

`.env.wif.local` の `VERCEL_OIDC_TOKEN`、`tools/wif-poc/.env.config.local` の `WIF_GCP_PROJECT_NUMBER` / `WIF_GCP_PROJECT_ID` / `WIF_TEST_SERVICE_ACCOUNT_EMAIL` は既存PoCと同じDev専用ファイル。内容を共有しない。`.env.local` は読まない/上書きしない。期限切れ時のVercel CLI更新は司令官の別作業。継承環境変数・SDK・自動更新は使わない。

正常時の要点（間に `CELL D3 PASS STRING_EXACT` / `CELL E7 PASS ROUND_TRIP` 等が出るが値は出さない）：

```text
STEP1 PASS MOCK_NO_AUTH           # 実通信時はDEV_AUTH
STEP2 PASS MOCK_NO_NETWORK        # 実通信時はFIXED_RANGE_READ
STEP3 PASS EXPECTED_VALUES
STEP4 PASS CSV_ADAPTER
STEP5 PASS EXISTING_PARSER
STEP6 PASS ROUND_TRIP
PASS WIF_CSV_WALKTHROUGH
```

## 失敗したら

- `FAIL LOCAL:INVALID_ARGUMENTS`：引数違い。`--run`単独は実行しない。
- `FAIL LOCAL:UNEXPECTED_ERROR`：ファイル不足など。ローカルで存在確認、内容や生例外を貼らない。
- `SOURCE:TOKEN_EXPIRED_OR_NEAR_EXPIRY`：期限更新。`*_AUDIENCE_MISMATCH` / `DEV_SUBJECT_ONLY`：Dev連携の前提を確認。Production設定を緩めない。
- `VERCEL_EXCHANGE` / `STS` / `IMPERSONATE` / `SHEETS` の `HTTP_401`：該当段階の認証、`HTTP_403`：信頼/借用/共有の権限、`HTTP_400_CHECK_AUDIENCE_OR_TRUST`：audience等を確認（コードだけでは原因断定不可）。429は制限、NETWORK系は通信/timeout/redirect。自動再試行なし。
- `STEP3:MISMATCH_E7` 等：該当セルの位置・表記・改行を本人がシートと固定表で比較。取得値をログ出力せず停止する。`TYPE_*` / `ROW_COUNT` / `ROW_SHAPE_*` も変換前停止。
- STEP4/5失敗は変換・解析、STEP6失敗は往復不一致。生CSV/行データ/HTTP本文は一切出さない。

固定pool `vercel-web-resume-dev` / provider `vercel-development` / SA名 `resume-wif-test-reader` / Development完全一致subjectを既存ガードで維持。任意URL・範囲指定や公開CSVフォールバックはなし。トークン署名はローカルdecodeでは検証せずGoogle STSが検証する。

**検証の区別：** オフラインは固定fixture・模擬通信。実通信PASSは司令官の実機で別確認が必要。現在のAPI省略形は読取確認済みだが、表示形式・ロケール変更時は再確認する。本番認証・本番4シート・画面・印刷は未検証、このPRの対象外。
