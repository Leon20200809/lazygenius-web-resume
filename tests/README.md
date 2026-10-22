# Sheets values → CSV：第1段階の最小単位

このファイルはPR #5の純粋アダプターテスト説明です。Production経路と追加テスト・制約は [Production WIF設計](../docs/production-wif.md) を参照してください。

アダプター単体では認証・ネットワーク・実シートは使わず、固定ダミーデータだけを検証します。追加依存はありません。

```sh
node --import ./tests/register-ts-alias.mjs --test tests/sheet-values-to-csv.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

テストランナーは Node.js 22.18 以降または 24 系（型除去と `registerHooks`）を使用します。アプリの module 設定を変えないため Node の `MODULE_TYPELESS_PACKAGE_JSON` 警告が出る場合があります。

## 境界と確認内容

- 将来の取得側は `majorDimension=ROWS` / `valueRenderOption=FORMATTED_VALUE` を指定し、表示文字列の二次元配列を渡す契約です。非文字列のセルを暗黙変換せず固定エラーで停止します。実API応答の型・表示形式は接続段階で検証が必要です。
- 1行目をヘッダー幅として、短い行の末尾空欄を補います。幅超過、空/重複ヘッダー、不正な型はデータを含まないエラーで停止します。シート別の必須ヘッダー照合は今後の取得境界で追加する項目です。
- 日付、先頭ゼロ、画像URL、カンマ、引用符、CR/LF、空欄、短い行、入力非破壊性を検証します。
- 既存4パーサーを変更せず、手書きダミーCSVの結果と比較します。既存 `trim:true` に合わせ、引用が必要ないセルは引用しません。空白を含む実データと旧CSVの同値性は別途確認が必要です。
- 空行は幅に合わせた空セル行になります。単列の空行は既存 `skip_empty_lines:true` で無視されます。APIが末尾空行を省くことによる旧CSVとの差は実接続前に確認します。

## アダプター単体テストの範囲外

Production WIF/SA、トークン交換、4シート取得、GIDとシート名対応、`fetchSheetCsv` / `buildResumeData` の変更、画面/印刷/画像の実機検品、一般公開停止は未実施です。認証版の本番正常動作を検証する前に公開設定を変えず、公開CSVへの自動フォールバックも追加しません。

公式根拠： [ValueRenderOption](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueRenderOption)（シートのロケールと表示形式で整形）、[ValueRange](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values)（末尾空行/空列の省略）。公式説明だけでは全てのセル型の文字列化を保証したと判断せず、実API応答との照合を接続前の受入条件にします。

ローカル検証では既存Resend初期化により環境変数なしのbuildは失敗します。実キーを取得せず、構文・型・静的生成の検証のみ `RESEND_API_KEY=re_dummy_build_only npm run build` で実施できます（メール送信の動作確認ではありません）。
