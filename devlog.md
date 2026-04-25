# 2026-04-22 開発ログ

## 今日やったこと

* `lg-web-resume` を作成
* `src/app` 構成へ移行
* `tsconfig.json` の `@/*` を `./src/*` に変更
* `careers` シートをCSVで取得
* CSV文字列 → `Career[]` 変換処理を作成
* `console.table()` と `JSON.stringify()` で確認
* `/resume`
* `/print/resume`
* `/print/career`
* `/login`
* `/`
  のURL構成を作成
* A4印刷ページを作成
* `window.print()` 用の Client Component を切り出し
* 印刷ボタンを実装
* GitHub リポジトリ作成
* git 初期ブランチを `master` → `main` に変更
* GitHubへ push

## コツ・学び

* Next.js App Router は「URL = フォルダ」
* `page.tsx` = そのURLの本体
* `layout.tsx` = 共通ガワ
* `use client` を書かなければ基本サーバー側
* `window` 系は Client Component 必須
* データ取得 → 整形 → 表示 の責務分離が重要
* `console.table()` はターミナル確認用
* `JSON.stringify(data, null, 2)` はブラウザ確認用
* Tailwind が効かない時は、まず dev サーバー再起動
* 構成変更後の404やimport不具合も、まず再起動を疑う
* 印刷機能は HTML を整え、最後はブラウザ印刷に任せる
* 自分たちの責任範囲は「A4できれいに崩れないPDFを作る」こと

データフロー
[Google Sheets]
        ↓
 fetchSheetCsv()
        ↓
[CSV文字列]
        ↓
 parseCsvTextToRows()
        ↓
[rows配列]
        ↓
 parseProfileCsv()
        ↓
[profileオブジェクト]
        ↓
 page.tsx
        ↓
[画面表示]

① 入力（CSV）
② 中間（rows）
③ 出力（profile）

この3点ログだけでデバッグできるようになる。