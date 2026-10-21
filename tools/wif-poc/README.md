# Local WIF: Development / dummy sheet only

レビュー用案。最新main `c49f08328f13e455dacf6f0623cf360d358186b2` を読み取り確認して作成。
このディレクトリをリポジトリの `tools/wif-poc/` として配置する想定。既存Next.jsソース・root package/lock・本番取得処理を変更しない。remote push/PR/merge/deployはしない。

## 依存と設計

Node.js 22.16以上（検証環境24.19.0）の標準 `fetch` / `util.parseEnv` / `node:test` のみ。npmインストール不要、追加runtime/dev依存ゼロ。
Vercel SDKの自動CLI refreshを避け、公式ソースのcustom-audience exchangeとGoogle公式REST APIを小さな直列処理で呼ぶ。SDK仕様変更を追従する保守は必要。

1. 明示ファイルの設定とJWTのiss/aud/sub/exp/nbfを検査（署名検証ではない）。
2. `https://oidc.vercel.com/~token` に元tokenとcustom audを送信。
3. 交換されたJWTを再検査。Google STSで外部JWTを交換（ここでGoogleが署名・信頼条件を検証）。
4. Dev専用SAを600秒、Sheets readonlyスコープで権限借用。
5. 固定ダミーシート `WIF_TEST!B2` だけ取得、形・文字列が完全一致した場合のみ `PASS WIF_READ_OK`。

custom JWT audは `https://iam.googleapis.com/projects/<number>/locations/global/workloadIdentityPools/vercel-web-resume-dev/providers/vercel-development`。
STSのaudienceは同じ資源の `//iam.googleapis.com/...`。これらは別の値。
STSの中間scopeはcloud-platform（IAMCredentials呼出用）。最終SA tokenのscopeはspreadsheets.readonlyのみ。scope自体がB2だけに制限するわけではない。SAの共有対象をダミーシートだけに保つ。

## 司令官の操作（Git Bash、リポジトリroot）

今回の次承認までは **1～3のオフライン確認のみ**。このzipがローカル配置済みとする。

1. `node --version`（22.16以上を確認）、次に `node --test tools/wif-poc/poc.test.mjs`。
2. `test -e tools/wif-poc/.env.config.local || cp tools/wif-poc/.env.example tools/wif-poc/.env.config.local`（既存ファイルがある場合は上書きしない）。ローカルエディタで下記3値を入力。秘密値をSlackに貼らない。
3. `git check-ignore .env.wif.local tools/wif-poc/.env.config.local` で両方がignore対象であること、`git ls-files -- .env.wif.local tools/wif-poc/.env.config.local` が空であることを確認。その後 `node tools/wif-poc/cli.mjs`。preflightは通信せずclaimsのみ確認する。出力は非秘密分類のみ。
4. 次の実行承認後のみ `node tools/wif-poc/cli.mjs --run --confirm-binding-cleanup`。
   誤登録IAM binding削除は司令官GUI確認報告済み。この明示フラグは確認内容を認識して実行する安全柵で、IAMの自動検証ではない。

CLI引数にtokenを渡さない。`--env-file`も不要。rootの既存 `.env.local` を読み書きしない。

### ローカル設定（環境変数名のみ）

- root `.env.wif.local`：`VERCEL_OIDC_TOKEN` （既存Vercel CLI取得済み。PoCは他のキーを使用しない）
- `tools/wif-poc/.env.config.local`：`WIF_GCP_PROJECT_NUMBER`、`WIF_GCP_PROJECT_ID`、`WIF_TEST_SERVICE_ACCOUNT_EMAIL`

SA emailは `resume-wif-test-reader@<上記project-id>.iam.gserviceaccount.com` と完全一致が必要。
project number/idの同一プロジェクト対応はGoogle Cloud GUIで確認する（このPoCはResource Managerを呼ばない）。Dev pool/provider名、issuer/sub、シートID/rangeは固定で環境変数では上書き不可。

ファイルはプロセス環境とマージせず明示パスから読むため、継承されたproduction token等が優先される問題を避ける。
Token更新は司令官の別作業：Vercelのリンク先とdevelopmentを確認して `vercel env pull .env.wif.local --environment=development`。これは既存の同名ファイルを更新しDevelopmentの他の環境変数も含み得る。`.env.local`やPoC設定は上書きしない。PoCは自動更新・CLI起動・ファイル保存をしない。

## エラー分類と切り分け

- `SOURCE:TOKEN_EXPIRED_OR_NEAR_EXPIRY`：元tokenが期限切れ/残り60秒以下。PC時計を確認し司令官がCLI更新。
- `SOURCE:AUDIENCE_MISMATCH` / `DEV_SUBJECT_ONLY`：想定のDevelopment tokenではない。設定を緩めず停止。
- `EXCHANGED:AUDIENCE_MISMATCH`：custom audience交換後のaud不一致。STSには進まない。
- `VERCEL_EXCHANGE:HTTP_401/HTTP_403`：元token/チーム/交換権限などを確認。
- `STS:HTTP_400_CHECK_AUDIENCE_OR_TRUST`：audience、project number、provider、issuer、mapping、subject条件、時刻等を確認。400だけで原因は断定しない。
- `IMPERSONATE:HTTP_403`：Dev SAの正しいsubjectへのworkloadIdentityUser binding、IAMCredentials API、有効なSAを確認。権限を自動追加しない。
- `SHEETS:HTTP_403`：テストシートへの閲覧者共有、Sheets API、scopeを確認。
- 各段階 `HTTP_401`：当該tokenの期限/有効性などを確認。`HTTP_429` は制限。自動リトライなし。
- `NETWORK_OR_REDIRECT_OR_TIMEOUT`：ネットワーク/15秒timeout/redirect拒否。tokenを別hostに転送しない。
- `SHEETS:VALUE_MISMATCH`：空セル/別値/余分な行列等。取得した値を出力しない。
- `LOCAL:UNEXPECTED_ERROR`：設定ファイル未作成/Node版/読取権限等をまず確認。エラー全文や環境ファイルをSlackへ貼らない。

成功/失敗のステージ分類のみを共有する。token、認証レスポンス全文、個人情報、秘密鍵は出力・保存しない。HTTP本文/statusTextや例外原文も表示しない。

## 検証と未検証

- `node --check tools/wif-poc/poc.mjs` / `node --check tools/wif-poc/cli.mjs`
- `node --test tools/wif-poc/poc.test.mjs`：ダミーJWT・mock HTTPのみ。テストは本物のネットワークを使わない。
- 実Vercel交換、Google STS、SA権限借用、非公開Sheets読取、ローカルWindows実機は **未検証**。
- 署名はローカルで検証していない。preflight成功≠認証成功。GUI報告≠実認証成功。
- Productionにはアクセスも変更もしない。誤ってproduction sub/SA/別sheetを渡すモックは通信前に拒否。
- このコード内の許可リストは事故防止で、改変可能なローカルコードがGoogle IAMの代わりにはならない。

## 公式根拠

- Vercel Google Cloud OIDC: https://vercel.com/docs/oidc/gcp
- Vercel audience exchange公式実装: https://github.com/vercel/vercel/blob/main/packages/oidc/src/exchange-vercel-oidc-token.ts
- Google STS: https://cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token
- SA impersonation: https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken
- Sheets values.get: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get

Google/Vercel/Drive設定変更・秘密鍵発行・デプロイ・Issue更新・実認証は今回未実施。実行後も本番移行は別承認。
