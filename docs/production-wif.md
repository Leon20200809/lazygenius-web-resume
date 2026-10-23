# Issue #1 第1段階：Production WIF の取得境界と運用結果

## 2026-10-23の到達点（司令官の実機確認報告）

- main `46cb79e` に実装を統合し、Production正式設定へWIF用10項目を追加。既存設定を保持。
- Staged Productionで本番の認証経路を利用し、固有URL・チーム別URLは匿名でVercel Authenticationを要求。
- 本番のログイン後 `/resume`・`/print/resume` が200、実データ表示とWeb/A4印刷プレビュー正常を目視確認。`wif` に失敗した場合の公開CSV fallbackはない。
- 正本は一般アクセス「制限付き」、本番SAは閲覧者。「ウェブに公開」は「公開されていません」。非公開化後も本番表示を再確認。
- 確認した1つの旧CSV URLは匿名ブラウザでGoogleログインを要求。全4 URLや写真・外部文書まで確認した意味ではない。

これは司令官による実機確認の記録で、LRが本番データを取得した記録ではありません。ダミー/mockの169テストPASS、Dev学習用6STEPの実通信PASSとは根拠を分けます。現行フロー・運用の概要と残件は [README](../README.md#検証本番運用2026-10-23時点)、当時の事前計画と現在の差異は [Staged運用記録](staged-production-wif.md) を参照してください。

## 現行の取得境界と停止条件

既存の `fetchSheetCsv(): Promise<string>` → `buildResumeData()` → 4パーサー → 履歴書・印刷画面を維持し、取得方式だけをサーバー設定で選びます。第2・3段階のCSV削除・直接JSONパースは行いません。追加依存なし。

**ローカルNext.jsが正規のProduction identityを取得する公式手順は未確認です。本実装はローカル・PreviewでWIF取得を停止します。** `vercel env pull --environment=production` がProduction subjectを発行するとは判断していません。`.env.wif.local` のDevelopment tokenやCLI資格情報は読みません。Productionトークンの貼付・コピー、環境フラグ偽装、Dev SAへの正本共有、IAMの緩和、鍵発行で迂回しないでください。

実装準備時はダミー/mock検証のみでしたが、2026-10-23に司令官がStaged Production経由で実認証・画面/印刷を検品し、本番移行しました。Windows `npm run dev` によるProduction正本の画面/印刷検品は現在も未成立で、迂回しません。ローカルのダミーブラウザ/印刷ハーネスも未提供です。自動テストと実機検品の結果は別々に扱います。

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
Google poolと本番SAのローカル名、Vercel owner/projectは本案件専用に制限しています。初回移行では司令官がProduction provider/SA等をGUIで確認し、実表示も確認しました。今後の設定変更時も実provider ID、project number、SA email、GID/title対応を司令官が確認します。設定不足・対応不一致は停止します。Google側のProduction subject限定bindingは維持し、変更は別承認です。

## Windowsでも行える秘密情報不要のオフライン検証

対象ブランチとコミットを確認してから以下を実行します（Node.js 22.18以降または24系）。

```sh
npm ci
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs tests/production-wif.test.mjs
node --import ./tests/register-production-runtime-mocks.mjs --test tests/production-runtime.test.mjs
npm run lint
npx tsc --noEmit
```

上記は固定ダミー入力とmock通信のみ。実Google/Vercel/メールへ接続しません。期待結果は全PASSです。失敗時は実データを貼らず、固定テスト名・コードだけを報告して停止します。

`npm run build` は既存Resend初期化のためキー未設定だと失敗することがあります。実キーを使わず、このプロセスだけにダミー値を設定してビルドします。履歴書ルートが動的（ƒ）であることを確認します。ビルド成功は本番認証成功ではありません。

## GUI・実機検品の継続方針

初回の設定・デプロイ・正本非公開化は上記のとおり司令官が実施済みです。今後の変更は別承認とし、Productionのpool/provider/限定subject/SAと正本4シート対応をGUIで**読み取り確認**してから進めます。秘密値をLRへ渡す必要はありません。

ローカル認証が成立する新しい公式根拠がなければ、正本のローカル画面検品はSTOPです。代案は [Staged Production検品](staged-production-wif.md) です。公開ドメインを変更せず固有URLで検品し、デプロイとpromoteは別承認にします。勝手にPreviewへProduction信頼を広げません。

既存ログイン成功処理は通知メールを送ります。今回その挙動は変更していません。ダミーUI検品を別途実装する場合は、ログイン認証を残したままメール境界をテスト用stubへ置き換える必要があります。実キーを使った `npm run dev` のログインを「副作用なし」とは扱わないでください。開発サーバーを外部公開しません。

実データ比較は司令官の非公開な検品範囲だけで行い、固定コード・件数・列の一致/不一致のみ記録します。ローカルProduction取得は停止のため、旧CSV/WIF双方の `ResumeData` を比較する実通信手段はまだ未実装・未実施です。Stagedの画面比較を完全同値の証明にせず、安全な比較方法は別レビューします。個人データ全文・差分・画像URLをテスト出力、Git、Slack、外部テストサービスへ送らないでください。

受入項目：4シート同値性、職歴/学歴の並び、日付・先頭0・複数行・空欄・画像URL、ログイン後Web表示、A4印刷、エラー画面、匿名アクセス拒否。画像や文書URLが別途公開されている場合はSheetsの非公開化だけでは保護されないため、残る公開経路を別途点検します。

## 切替と撤退条件（再実施時にも維持）

以下は初回に設計した段階的な承認ゲートです。初回Stagedと最終公開先のDeployment IDが同一だったという実績の断定ではありません。今回の公開切替は新mainデプロイの青色Production表示と公開先表示で確認され、厳密なalias照合は残っています。正本は既に非公開化済みなので、現時点の撤退には下記の「公開停止後」を適用します。


1. mock合格・差分承認 → 別承認後にStaged Production固有URLで保護・WIF・画面を検品 → さらに別承認で同じdeploymentをpromote。main統合と恒久設定の移行も別決裁。
2. 認証付き4シート取得、ログイン後画面・印刷を確認。不一致/401/403/期限/metadata/ヘッダーエラーはSTOP。信頼条件は緩めない。
3. 合格後、司令官だけがリンク共有を制限付きへ、必要なら「ウェブに公開」も停止。
4. 匿名旧CSV/公開URLは取得不能、認証アプリは正常の双方を確認。

公開停止前の撤退は、司令官が既存の承認済みdeploymentまたは明示的な公開CSV設定へ戻す判断をします。公開停止後は無断再公開せず、認証経路を修復するか停止表示とします。実装は自動で旧方式へ戻りません。

## 根拠と未検証の区別

- [Vercel OIDC reference](https://vercel.com/docs/oidc/reference)：Functionsのtokenはリクエスト文脈にあり、module/build時の取得とは別。SDKはheader以外へfallbackするため、本実装は公式headerとnative fetchを使用してそれを排除。
- [Vercel audience交換実装](https://github.com/vercel/vercel/blob/main/packages/oidc/src/exchange-vercel-oidc-token.ts)：custom audience交換protocol。既存PoCから安全な通信処理のみ移植。
- [Vercel GCP](https://vercel.com/docs/oidc/gcp)、[Google WIF](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers)：STS/SA権限借用。
- [Sheets values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get)、[ValueRange](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)：表示形式・末尾空行/列省略。数値/真偽値が返る場合は暗黙変換せず停止するため、実シートの型確認が必要。
- 実施済み（司令官報告）：Production設定のGUI確認、WIFでの本番4シート取得を使う画面の正常表示、Web/A4プレビュー、正本非公開化後の表示、確認した1旧CSV URLの匿名拒否。
- 未完了：全4旧CSV URLの個別拒否、旧新 `ResumeData` のプログラム完全同値、写真・外部文書等の公開経路監査、全シークレット非漏洩の完全証明、公開先Deployment IDの厳密照合。個別セル境界・メール副作用・実React cache分離など、目視表示だけでは証明できない検証も区別します。
- 設定状況：Production Branch/mainとは別に、Auto-assign Custom Production DomainsはDisabled。継続方針は別判断。Issue #1は残件を含むため未完了です。
