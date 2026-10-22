# Issue #1 第1段階：Production WIF の取得境界（検品待ち）

## 今回できること／止めていること

既存の `fetchSheetCsv(): Promise<string>` → `buildResumeData()` → 4パーサー → 履歴書・印刷画面を維持し、取得方式だけをサーバー設定で選びます。第2・3段階のCSV削除・直接JSONパースは行いません。追加依存なし。

**ローカルNext.jsが正規のProduction identityを取得する公式手順は未確認です。本実装はローカル・PreviewでWIF取得を停止します。** `vercel env pull --environment=production` がProduction subjectを発行するとは判断していません。`.env.wif.local` のDevelopment tokenやCLI資格情報は読みません。Productionトークンの貼付・コピー、環境フラグ偽装、Dev SAへの正本共有、IAMの緩和、鍵発行で迂回しないでください。

今回提供するのはProduction経路のコードと、ダミー・mockだけの検証です。Windows `npm run dev` による正本データの画面/印刷検品は未成立のままです。dummy UI検品または承認後のProduction検品は別途手順を確定します。テスト合格を実認証・本番表示合格とは扱いません。今回ダミーのブラウザ/印刷検品ハーネスも未提供で、オフラインの関数結合検証までです。

## 処理を追う順番

1. `fetch-sheet-csv.ts`：`RESUME_SHEETS_SOURCE` 未指定は従来の公開CSV、明示 `public-csv` も同じ。`wif` の場合だけ新入口へ。他の値は停止。
2. `production-sheet-csv.ts`：`connection()` で実行時に限定し、既存CookieのHMAC署名・用途・期限を再検証。Vercel Production以外は停止。
3. 同じリクエストの `x-vercel-oidc-token` を取得。環境変数・ファイル・CLI tokenへのfallbackなし。
4. `production-wif-core.ts`：issuer/audience/owner/project/production subject/期限を前後で照合。Vercel audience交換 → Google STSの署名・信頼検証 → Production専用SAの短期token（Sheets read-only、600秒）。JWTのdecodeだけでは認証成功になりません。
5. Sheets metadataで設定GIDとタイトルを照合。最大10,000行/100列までの全グリッドをA1 rangeにし、`ROWS` / `FORMATTED_VALUE` で指定シートのみ取得。上限超過は切り捨てず停止。
6. 必須ヘッダー・文字列型を検査 → PR #5由来 `sheetValuesToCsv` → 既存パーサー → 既存画面。失敗時は固定コードのみ。**公開CSVへの自動fallbackはありません。**

React `cache` は同一サーバーレンダー内の短期認証共有だけです。fetchは `no-store`、redirectは禁止、timeoutは15秒。token/セル/ResumeDataの永続キャッシュは作りません。server-only入口からだけ利用し、診断API・ブラウザquery切替は作りません。テストではReact cacheをstubにしており、実Reactリクエスト境界の共有挙動は未実測です。

取得直前のCookie検証は既存ログインが発行するHMAC形式と互換です。有限数の有効期限・正しい2区切りを要求するため、壊れたCookieの受入れは既存proxyより厳密ですが、通常のログイン発行・メール・レスポンス・proxyは変更していません。

## 設定名（値をGit・Slack・ログへ貼らない）

既存：
- `GOOGLE_SHEETS_BASE_ID`
- `GOOGLE_SHEET_PROFILE_GID`
- `GOOGLE_SHEET_EDUCATION_GID`
- `GOOGLE_SHEET_CAREER_GID`
- `GOOGLE_SHEET_CERTIFICATION_GID`
- `LOGIN_COOKIE_SECRET`
- `ACCESS_PASSWORD`

追加：
- `RESUME_SHEETS_SOURCE`
- `RESUME_WIF_VERCEL_TEAM`
- `RESUME_WIF_VERCEL_PROJECT`
- `RESUME_WIF_PROJECT_NUMBER`
- `RESUME_WIF_PROVIDER_ID`
- `RESUME_WIF_SERVICE_ACCOUNT`
- `GOOGLE_SHEET_PROFILE_TITLE`
- `GOOGLE_SHEET_EDUCATION_TITLE`
- `GOOGLE_SHEET_CAREER_TITLE`
- `GOOGLE_SHEET_CERTIFICATION_TITLE`

プラットフォームから読むだけ（手作業で偽装しない）：`VERCEL`、`VERCEL_ENV`、`NODE_ENV`。
Google poolと本番SAのローカル名、Vercel owner/projectは本案件専用に制限しています。実provider ID、project number、SA email、GID/title対応は司令官のGUI確認が必要です。設定不足・対応不一致は停止します。Google側のProduction subject限定bindingは維持し、変更は別承認です。

## 最初のWindows操作：秘密情報不要のオフライン検証

レビュー用ブランチを確認してから以下を実行します（Node.js 22.18以降または24系）。

```sh
npm ci
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs tests/production-wif.test.mjs
node --import ./tests/register-production-runtime-mocks.mjs --test tests/production-runtime.test.mjs
npm run lint
npx tsc --noEmit
```

上記は固定ダミー入力とmock通信のみ。実Google/Vercel/メールへ接続しません。期待結果は全PASSです。失敗時は実データを貼らず、固定テスト名・コードだけを報告して停止します。

`npm run build` は既存Resend初期化のためキー未設定だと失敗することがあります。実キーを使わず、このプロセスだけにダミー値を設定してビルドします。履歴書ルートが動的（ƒ）であることを確認します。ビルド成功は本番認証成功ではありません。

## GUI・実機検品は次の承認後

いま設定変更・デプロイ・共有停止は行いません。まず司令官がProductionのpool/provider/限定subject/SAと正本4シート対応をGUIで**読み取り確認**します。秘密値をLRへ渡す必要はありません。

ローカル認証が成立する新しい公式根拠がなければ、正本のローカル画面検品はSTOPです。代案はダミーUI/印刷テスト、または明示承認後のProduction反映・認証済みブラウザ検品です。勝手にPreviewへProduction信頼を広げません。

既存ログイン成功処理は通知メールを送ります。今回その挙動は変更していません。ダミーUI検品を別途実装する場合は、ログイン認証を残したままメール境界をテスト用stubへ置き換える必要があります。実キーを使った `npm run dev` のログインを「副作用なし」とは扱わないでください。開発サーバーを外部公開しません。

実データ比較は司令官の非公開ローカル内だけで旧CSV/WIF双方の `ResumeData` を比較し、固定コード・件数・列の一致/不一致のみ確認します。今回その実通信比較は未実施です。個人データ全文・差分・画像URLをテスト出力、Git、Slack、外部テストサービスへ送らないでください。

受入項目：4シート同値性、職歴/学歴の並び、日付・先頭0・複数行・空欄・画像URL、ログイン後Web表示、A4印刷、エラー画面、匿名アクセス拒否。画像や文書URLが別途公開されている場合はSheetsの非公開化だけでは保護されないため、残る公開経路を別途点検します。

## 切替と撤退条件

1. mock合格・差分承認 → 司令官承認によるProduction設定/反映。
2. 認証付き4シート取得、ログイン後画面・印刷を確認。不一致/401/403/期限/metadata/ヘッダーエラーはSTOP。信頼条件は緩めない。
3. 合格後、司令官だけがリンク共有を制限付きへ、必要なら「ウェブに公開」も停止。
4. 匿名旧CSV/公開URLは取得不能、認証アプリは正常の双方を確認。

公開停止前の撤退は、司令官が既存の承認済みdeploymentまたは明示的な公開CSV設定へ戻す判断をします。公開停止後は無断再公開せず、認証経路を修復するか停止表示とします。実装は自動で旧方式へ戻りません。

## 根拠と未検証の区別

- [Vercel OIDC reference](https://vercel.com/docs/oidc/reference)：Functionsのtokenはリクエスト文脈にあり、module/build時の取得とは別。SDKはheader以外へfallbackするため、本実装は公式headerとnative fetchを使用してそれを排除。
- [Vercel audience交換実装](https://github.com/vercel/vercel/blob/main/packages/oidc/src/exchange-vercel-oidc-token.ts)：custom audience交換protocol。既存PoCから安全な通信処理のみ移植。
- [Vercel GCP](https://vercel.com/docs/oidc/gcp)、[Google WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers)：STS/SA権限借用。
- [Sheets values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)、[ValueRange](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)：表示形式・末尾空行/列省略。数値/真偽値が返る場合は暗黙変換せず停止するため、実シートの型確認が必要。
- 未検証：Production token/Google設定/正本データ取得/同値性/ブラウザ・印刷/匿名旧URL拒否。Development PoC合格とは別です。
