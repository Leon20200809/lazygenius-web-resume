### プロジェクト初期構築

- `lg-web-resume` を作成
- `src/app` 構成へ移行
- `tsconfig.json` の `@/*` を `./src/*` に変更
- GitHubリポジトリを作成
- git初期ブランチを `master` から `main` に変更
- GitHubへpush

### ページ構成の作成

以下のURL構成を作成しました。

- `/`
- `/login`
- `/resume`
- `/print/resume`
- `/print/career`

Next.js App Routerでは、基本的に「フォルダ構成 = URL構成」になるため、ページごとに責務を分けて整理しました。

### Google Sheets / CSV連携

- `careers` シートをCSV形式で取得
- CSV文字列を `Career[]` に変換する処理を作成
- `console.table()` でターミナル確認
- `JSON.stringify(data, null, 2)` でブラウザ上の構造確認

### 印刷ページの作成

- A4印刷用ページを作成
- `window.print()` 用のClient Componentを切り出し
- 印刷ボタンを実装

印刷処理そのものはブラウザに任せ、アプリ側では「A4で崩れにくいHTML構造を作る」ことを重視しました。

---

## コツ・学び

### Next.js App Router

- Next.js App Routerは「URL = フォルダ」
- `page.tsx` はそのURLの本体
- `layout.tsx` は共通のガワ
- `use client` を書かなければ、基本的にサーバー側で処理される
- `window` や `document` などブラウザ専用の処理はClient Componentが必要

### データ処理

- データ取得、整形、表示は分けて考える
- `console.table()` はターミナルで配列データを確認しやすい
- `JSON.stringify(data, null, 2)` はブラウザ上でオブジェクト構造を確認しやすい
- 入力、中間、出力の3点をログで確認できるとデバッグしやすい

### Tailwind / 開発サーバー

- Tailwindが効かない時は、まず開発サーバーの再起動を疑う
- 構成変更後の404やimport不具合も、まず再起動を試す
- Next.jsではファイル構成や設定を変えた後、devサーバーが古い状態を見ていることがある

### 印刷機能

- 印刷機能は、HTMLとCSSで印刷しやすい構造を作る
- 最後のPDF化や印刷処理はブラウザに任せる
- 自分たちの責任範囲は「A4で崩れにくいレイアウトを作る」こと

---

## データフロー

```txt
Google Sheets
↓
fetchSheetCsv()
↓
CSV文字列
↓
parseCsvTextToRows()
↓
rows配列
↓
parseProfileCsv()
↓
profileオブジェクト
↓
page.tsx
↓
画面表示
```

---

## デバッグの見方

データ処理では、以下の3段階を意識すると原因を切り分けやすいです。

```txt
① 入力：CSV文字列
② 中間：rows配列
③ 出力：profileオブジェクト
```

この3点をログで確認できれば、どこでデータが崩れているか判断しやすくなります。

---

## 今日の重要ポイント

今日の中心は、Next.jsでGoogle SheetsのCSVデータを取得し、アプリ内で扱える形に変換して表示する流れを作ったことです。

単に画面を作るだけではなく、

- データ取得
- CSVパース
- 型に沿ったデータ整形
- ページ表示
- A4印刷対応

まで一連の流れとして確認できました。

これにより、Webレジュメアプリの基礎となるデータ表示・印刷導線ができました。

---

## 次に活かすこと

- データ取得処理とパース処理は分離する
- 表示ページと印刷ページは分けて考える
- ブラウザ依存の処理はClient Componentに切り出す
- ログは「入力・中間・出力」の3点で見る
- まず動かし、その後で責務を整理する
