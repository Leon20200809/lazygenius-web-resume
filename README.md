# LazyGenius Web Resume

就職活動で使う経歴情報を、Web表示・A4印刷・選考結果の返信まで一つの導線にまとめたWebレジュメです。

履歴書データはGoogle Sheetsで管理し、アプリは公開CSVを取得して表示します。閲覧にはパスワード認証が必要で、採用担当者はログイン後にWebプロフィール、印刷用履歴書、職務経歴書、選考結果連絡フォームを利用できます。

## 現在の構成

- トップ：Webプロフィール、印刷用履歴書、職務経歴書、選考結果連絡への入口
- ログイン：採用担当者向けのパスワード認証
- Webプロフィール：プロフィール、職歴、学歴、資格をレスポンシブ表示
- 印刷用履歴書：A4印刷・PDF保存向けレイアウト
- 選考結果連絡：通過・見送りの文面生成、内容確認、Resend送信、メールソフト起動

UIはモバイルファーストで構成し、画面幅に応じて1カラムと分割レイアウトを切り替えます。`100dvh`、可変タイポグラフィ、キーボードフォーカス、スキップリンク、`prefers-reduced-motion`にも対応しています。

## 使用技術

| 領域 | 技術 |
| --- | --- |
| フレームワーク | Next.js 16.3.3（App Router / Server Components / Route Handlers / Proxy） |
| UI | React 19.2.4 |
| 言語 | TypeScript 5 |
| スタイル | Tailwind CSS v4 / CSSカスタムプロパティ |
| CSV解析 | csv-parse 6.2.1 |
| データ管理 | Google Sheets |
| メール送信 | Resend 6.12.3 |

正確な依存バージョンは[`package.json`](./package.json)を参照してください。

## データフロー

プロフィール、学歴、職歴、資格は、それぞれGoogle Sheetsのシートとして管理します。

```txt
Google Sheets
  ↓ 公開CSVを並列取得（fetchSheetCsv / cache: no-store）
CSVテキスト
  ↓ parseCsvTextToRows
行データ（Record<string, string>[]）
  ↓ 用途別のparse関数
TypeScript型（Profile / Education / Career / Certification）
  ↓ buildResumeDataでResumeDataへ統合
Next.js Server Component
  ↓
Webプロフィール / 印刷用履歴書
```

主な責務は次のように分離しています。

| 場所 | 役割 |
| --- | --- |
| `src/lib/fetch-sheet-csv.ts` | Google SheetsからCSVを取得 |
| `src/lib/parse-*.ts` | CSVを用途別のデータ構造へ変換 |
| `src/types/` | 履歴書データの型定義 |
| `src/lib/build-resume-data.ts` | 4シートを並列取得し`ResumeData`へ統合 |
| `src/app/resume/page.tsx` | WebプロフィールをServer Componentで描画 |
| `src/app/print/resume/page.tsx` | 印刷用履歴書をServer Componentで描画 |

## ログイン認証

`POST /api/login`で入力されたパスワードを`ACCESS_PASSWORD`と比較します。認証に成功すると、以下の情報を含むペイロードへ`LOGIN_COOKIE_SECRET`を使ってHMAC-SHA256署名を付け、`lg_access_granted` Cookieとして保存します。

- 用途：`resume_access`
- 発行時刻
- 有効期限（2時間）

Cookieは`httpOnly`、`sameSite=lax`、全パス対象で、本番環境では`secure`になります。`src/proxy.ts`はCookieの存在だけでなく、署名・用途・有効期限を検証し、無効な場合は`/login`へ戻します。

ログイン画面、ログインAPI、Next.js内部ファイル、favicon以外のアプリルートが保護対象です。

## メール送信

Resendは2種類の通知に使用しています。

### 選考結果の返信

```txt
採用担当者がフォームを入力
  ↓
ブラウザで返信文面を生成・確認
  ↓ POST /api/reply
Route Handlerで本文の型・空文字・文字数を検証
  ↓
ResendでLeon.C宛てに送信
  ↓
成功・失敗を画面へ表示
```

Webフォームを使わず、生成した文面をコピーするか、メールソフトを起動して送る代替導線もあります。送信中のボタン無効化と送信完了後の再送信防止を実装しています。

### ログイン成功通知

ログイン成功時に、日時、IPアドレス、User-Agent、推定デバイス、Vercelの地域ヘッダーを通知メールとして送ります。通知送信に失敗した場合はサーバーログへ記録し、ログイン処理自体は継続します。

## ディレクトリ構成

```txt
src/
├─ app/
│  ├─ api/
│  │  ├─ login/route.ts       # ログインと署名付きCookie発行
│  │  └─ reply/route.ts       # 返信本文の検証とメール送信
│  ├─ login/page.tsx          # ログイン画面
│  ├─ resume/page.tsx         # Webプロフィール
│  ├─ print/resume/page.tsx   # A4印刷用履歴書
│  ├─ reply/page.tsx          # 選考結果連絡画面
│  ├─ globals.css             # Tailwind CSSとデザイントークン
│  └─ page.tsx                # トップ
├─ components/                # 共通UI
├─ features/reply/            # 返信フォームと文面生成
├─ lib/                       # CSV取得・解析・統合・メール送信
├─ types/                     # 履歴書データ型
└─ proxy.ts                   # 署名付きCookieの検証
```

## 環境変数

`.env.example`をコピーして`.env.local`を作成し、実値を設定します。

```bash
cp .env.example .env.local
```

| 変数 | 用途 |
| --- | --- |
| `ACCESS_PASSWORD` | ログイン画面で照合するパスワード |
| `LOGIN_COOKIE_SECRET` | ログインCookieのHMAC-SHA256署名鍵 |
| `GOOGLE_DOCUMENT_URL` | トップから開く職務経歴書のURL |
| `GOOGLE_SHEETS_BASE_ID` | 履歴書データを置くスプレッドシートID |
| `GOOGLE_SHEET_PROFILE_GID` | プロフィールシートのGID |
| `GOOGLE_SHEET_EDUCATION_GID` | 学歴シートのGID |
| `GOOGLE_SHEET_CAREER_GID` | 職歴シートのGID |
| `GOOGLE_SHEET_CERTIFICATION_GID` | 資格シートのGID |
| `RESEND_API_KEY` | Resend APIキー |
| `MAIL_FROM` | Resendで使用する送信元 |
| `MAIL_TO` | 返信・ログイン通知の送信先 |

`LOGIN_COOKIE_SECRET`には、`ACCESS_PASSWORD`とは別の十分に長いランダム値を設定してください。秘密値をGitへコミットしないでください。`NODE_ENV`はNext.jsが管理するため、`.env.example`には含めていません。

## 開発

```bash
npm install
npm run dev
```

開発サーバーは通常`http://localhost:3000`で起動します。

```bash
npm run lint
npm run build
npm run start
```

## 開発履歴

- Google SheetsとCSVによるコンテンツ管理を実装
- Web表示用とA4印刷用の履歴書を分離
- 選考結果の文面生成、Resend送信、メールソフト送信を実装
- HMAC-SHA256署名付きCookieによるログイン認証とログイン通知を実装
- Taste / redesign skillを用いてUIをリニューアルし、機能を維持したままタイポグラフィ、配色、導線、レスポンシブ表示、アクセシビリティを改善

## 現在の制約と改善候補

- `src/app/print/career/page.tsx`はプレースホルダーで、職務経歴書は`GOOGLE_DOCUMENT_URL`の外部文書を使用しています
- 自動テストは未導入のため、現状はESLintと本番ビルドで静的検証します
- 返信フォームの補助コンポーネントは今後、実際の責務分割に合わせて整理できます

DB化やAPI化は現在の要件では行わず、必要性が生じた場合に検討します。

## 開発方針

- 最小で動かし、必要に応じて強くする
- データ取得・変換・表示の責務を分ける
- Google Sheetsを編集画面として活用し、コードと文章データを分離する
- 採用担当者と応募者の双方が迷わない導線を作る
- 秘密情報は環境変数で管理する
