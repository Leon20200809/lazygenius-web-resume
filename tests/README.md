# オフライン検証：WIF固定取得と既存CSV契約

## 公開CSV撤去版（2026-10-28）

```sh
npm ci
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs tests/production-wif.test.mjs
node --import ./tests/register-production-runtime-mocks.mjs --test tests/production-runtime.test.mjs
npm run lint
npx tsc --noEmit
RESEND_API_KEY=re_dummy_build_only npm run build
```

- `production-runtime.test.mjs`：全4シートが動的実行・Cookie・Production identity境界を通ること、廃止済み取得元変数が未設定/旧値/不正値でも公開経路を復活させないことを検証。アプリのソース走査でも旧export URL・切替を検出します。
- 認証不成立・Local/Preview・設定不足・Google拒否は停止。上流秘密の固定エラー化・無ログをダミーで検証します。全fetchはstubで、実通信・実メールは行いません。
- `buildResumeData` の結果を4つの既存パーサーのローカルfixture結果と比較。旧公開取得コードは比較用にも残しません。アダプター単体は手書きCSVとの比較も維持します。
- React cache・Next request APIはstubです。実リクエスト分離、実WIF、画面・印刷はこの試験の合格に含めません。Localで正本取得はできず、新Staged Productionの司令官検品が別途必要です。

## 既存アダプター単体の範囲

このファイルはPR #5で用意した純粋アダプターテストの範囲を説明します。2026-10-23の本番WIF移行・実機結果は [README](../README.md#検証本番運用2026-10-23時点) を参照してください。ここでの範囲外は「プロジェクト全体で未実施」を意味しません。Production経路と追加テスト・制約は [Production WIF設計](../docs/production-wif.md) を参照してください。

アダプター単体では認証・ネットワーク・実シートは使わず、固定ダミーデータだけを検証します。追加依存はありません。

```sh
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

テストランナーは Node.js 22.18 以降または 24 系（型除去と `registerHooks`）を使用します。アプリの module 設定を変えないため Node の `MODULE_TYPELESS_PACKAGE_JSON` 警告が出る場合があります。

## 境界と確認内容

- 現行のProduction取得側は `majorDimension=ROWS` / `valueRenderOption=FORMATTED_VALUE` を指定し、表示文字列の二次元配列を渡す契約です。非文字列のセルを暗黙変換せず固定エラーで停止します。実API応答の型・表示形式は接続段階で検証が必要です。
- 1行目をヘッダー幅として、短い行の末尾空欄を補います。幅超過、空/重複ヘッダー、不正な型はデータを含まないエラーで停止します。シート別の必須ヘッダー照合は現行のProduction取得境界で実施します。
- 日付、先頭ゼロ、画像URL、カンマ、引用符、CR/LF、空欄、短い行、入力非破壊性を検証します。
- 既存4パーサーを変更せず、手書きダミーCSVの結果と比較します。既存 `trim:true` に合わせ、引用が必要ないセルは引用しません。空白を含む実データと旧CSVの同値性は別途確認が必要です。
- 空行は幅に合わせた空セル行になります。単列の空行は既存 `skip_empty_lines:true` で無視されます。APIが末尾空行を省くことによる旧CSVとの差は、未完了の旧新完全同値比較で別途確認します。

## アダプター単体テストの範囲外

Production WIF/SA、トークン交換、4シート取得、GIDとシート名対応、`fetchSheetCsv` / `buildResumeData`、画面/印刷/画像の実機検品、一般公開停止は、この純粋アダプター単体テストでは検証しません。プロジェクトでは追加の認証/実行時mockテストと、司令官による本番表示・正本非公開化を実施済みです。画像等の個別公開経路監査や旧新データ完全同値比較は残っています。公開CSVへの自動フォールバックはありません。

公式根拠： [ValueRenderOption](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption)（シートのロケールと表示形式で整形）、[ValueRange](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)（末尾空行/空列の省略）。公式説明だけでは全てのセル型の文字列化を保証したと判断せず、取得境界で実API応答を検査し、不正な型は停止します。正常表示だけで全てのセルの完全同値を証明したとは扱いません。

ローカル検証では既存Resend初期化により環境変数なしのbuildは失敗します。実キーを取得せず、構文・型・静的生成の検証のみ `RESEND_API_KEY=re_dummy_build_only npm run build` で実施できます（メール送信の動作確認ではありません）。
