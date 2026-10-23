# LazyGenius Web Resume

就職活動で使う経歴情報を、Web表示・A4印刷・選考結果の返信まで一つの導線にまとめたWebレジュメです。

履歴書データは非公開のGoogle Sheetsで管理し、本番ではNext.jsのサーバーがProduction WIF（Workload Identity Federation：外部の実行環境の身元をGoogleへ連携する認証方式）とGoogle Sheets APIで取得します。閲覧にはパスワード認証が必要で、採用担当者はログイン後にWebプロフィール、印刷用履歴書、職務経歴書、選考結果連絡フォームを利用できます。

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
| フレームワーク | Next.js 16（App Router / Server Components / Route Handlers / Proxy） |
| UI | React 19.2.4 |
| 言語 | TypeScript 5 |
| スタイル | Tailwind CSS v4 / CSSカスタムプロパティ |
| CSV解析 | csv-parse（既存パーサーを継続使用） |
| データ管理 | Google Sheets |
| メール送信 | Resend 6.12.3 |

正確な依存バージョンは[`package.json`](./package.json)を参照してください。

## データフロー

プロフィール、学歴、職歴、資格は、それぞれGoogle Sheetsのシートとして管理します。

```txt
ログイン済みリクエスト（署名付きCookieをサーバーで再検証）
  ↓ Vercel Productionの実行時OIDC → audience交換 → Google STS
Production専用サービスアカウントの短期・読み取り専用トークン
  ↓ Google Sheets API（4シートのGID・タイトル・必須ヘッダーを検査）
非公開Google Sheetsのvalues（二次元配列、FORMATTED_VALUE）
  ↓ sheetValuesToCsv
CSVテキスト（fetchSheetCsv(): Promise<string>の契約を維持）
  ↓ parseCsvTextToRows → 既存4種類の用途別パーサー
Profile / Education / Career / Certification
  ↓ buildResumeDataでResumeDataへ統合
Next.js Server Component → Webプロフィール / A4印刷用履歴書
```

本番は `RESUME_SHEETS_SOURCE=wif`。WIFに失敗しても公開CSVへ自動フォールバックしません。旧公開CSV経路はコードに切替用として残っています（未指定または `public-csv`）。正本非公開化後の旧経路は復旧手段ではなく、無断で再公開しません。配列の直接変換やCSVライブラリの廃止は、今後の第2・3段階です。

主な責務は次のように分離しています。

| 場所 | 役割 |
| --- | --- |
| `src/lib/fetch-sheet-csv.ts` | サーバー設定で取得経路を選び、CSV文字列の契約を維持 |
| `src/lib/production-sheet-csv.ts` | server-only入口、動的実行・Cookie再検証・Production制限 |
| `src/lib/production-wif-core.ts` | OIDC照合・短期認証・Sheets API取得・GID/title/ヘッダー検査 |
| `src/lib/sheet-values-to-csv.ts` | valuesを適切にエスケープしたCSVへ変換 |
| `src/lib/parse-*.ts` | CSVを用途別のデータ構造へ変換 |
| `src/types/` | 履歴書データの型定義 |
| `src/lib/build-resume-data.ts` | 4シートを並列取得し`ResumeData`へ統合 |
| `src/app/resume/page.tsx` | WebプロフィールをServer Componentで描画 |
| `src/app/print/resume/page.tsx` | 印刷用履歴書をServer Componentで描画 |

## 元データも保護するための変更

以前はサイトにログイン認証があっても、元データの公開CSV URLを直接開く経路までは保護できませんでした。そこで、正本を非公開にし、ProductionのサーバーだけがWIFで取得する構成へ移行しました。長期サービスアカウントJSON鍵は発行・保存せず、短期トークンを使用します。

アプリの閲覧認証と、Googleに対するデータ取得認証は別の責務です。WIF入口は実行時の署名付きCookieを再検証し、ローカル・PreviewやDevelopment資格情報をProductionへ転用しません。通信は `no-store` で、WIF経路は上流本文やセル値ではなく固定エラーコードで失敗します。これは全経路の秘密情報非漏洩を証明した、という意味ではありません。

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
├─ lib/                       # WIF/Sheets取得・CSV変換/解析・統合・メール送信
├─ types/                     # 履歴書データ型
└─ proxy.ts                   # 署名付きCookieの検証
```

## 環境変数

`.env.example`は変数名と空欄だけのテンプレートです。実値はGit・README・Slack・ログへ載せません。本番はVercelのProduction設定、ローカルは非追跡の設定で分離します。下記の変数はサーバー側で読み、秘密を `NEXT_PUBLIC_*` に置きません。`GOOGLE_DOCUMENT_URL`等の表示用リンクは画面へ渡るため、そのリンク先の公開範囲は別途監査が必要です。

ローカル用ファイルを作る場合：

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
| `RESUME_SHEETS_SOURCE` | 本番は `wif`。旧経路は `public-csv` または変数自体を未指定。空文字は無効 |
| `RESUME_WIF_VERCEL_TEAM` | Production OIDCのチーム照合 |
| `RESUME_WIF_VERCEL_PROJECT` | Production OIDCのプロジェクト照合 |
| `RESUME_WIF_PROJECT_NUMBER` | Google Cloudプロジェクト番号 |
| `RESUME_WIF_PROVIDER_ID` | Production WIF providerの短いID |
| `RESUME_WIF_SERVICE_ACCOUNT` | Production専用SAの識別子 |
| `GOOGLE_SHEET_PROFILE_TITLE` | プロフィールのGIDと照合するタブ名 |
| `GOOGLE_SHEET_EDUCATION_TITLE` | 学歴のGIDと照合するタブ名 |
| `GOOGLE_SHEET_CAREER_TITLE` | 職歴のGIDと照合するタブ名 |
| `GOOGLE_SHEET_CERTIFICATION_TITLE` | 資格のGIDと照合するタブ名 |
| `RESEND_API_KEY` | Resend APIキー |
| `MAIL_FROM` | Resendで使用する送信元 |
| `MAIL_TO` | 返信・ログイン通知の送信先 |

`LOGIN_COOKIE_SECRET`には、`ACCESS_PASSWORD`とは別の十分に長いランダム値を設定してください。秘密値をGitへコミットしないでください。`NODE_ENV`はNext.jsが管理するため、`.env.example`には含めていません。

Production用の追加10項目（取得元1、WIF5、タイトル4）は、既存設定を保持して登録済みです（司令官報告）。`VERCEL` / `VERCEL_ENV` / `NODE_ENV`はプラットフォーム側の値であり、手入力で偽装しません。OIDCはリクエストの `x-vercel-oidc-token` から取得し、本番用トークンを環境変数へ保存しません。

このアプリの `npm run dev` でProduction WIFを動かす経路はありません。DevダミーWIFの学習用CLI/PoCは別の検証成果物であり、本番コードへ取り込んでいません。`.env.wif.local`やDevelopment SAを本番に流用しません。テンプレートの `RESUME_SHEETS_SOURCE=` は空欄のまま実行できないため、ローカルの旧経路を明示する場合は `public-csv` と設定します。ただし非公開正本の取得はできません。まずは実データ不要のオフラインテストを使用してください。

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

## 検証・本番運用（2026-10-23時点）

以下の実機結果は司令官による報告です。LRのダミー/mock検証と区別し、本番データや秘密値は転載していません。

| 項目 | 確認した範囲 |
| --- | --- |
| Git統合 | main `46cb79e`（実装 `8ffd2be`、検品手順 `2abbca9`） |
| Staged Production | `vercel --prod --skip-domain` を使用。未ログインの固有URL・チーム別URLでVercel Authentication要求を確認 |
| 本番WIF | `wif`・fallbackなしでログイン後の履歴書を表示。`GET /resume`・`GET /print/resume` は200、Webレイアウト・A4印刷プレビューを目視確認 |
| 正本非公開化 | 一般アクセス「制限付き」、本番SAは閲覧者。「ウェブに公開」は「公開されていません」。非公開化後も本番表示を再確認 |
| 匿名の旧経路 | 確認した1つの旧公開CSV URLはシークレットブラウザでGoogleログインを要求。全4 URLを検査した意味ではない |
| オフライン検証 | 169件のダミー/mockテストPASS（LR報告）。DevダミーWIFの実通信6STEP PASSは別の学習検証（司令官報告） |

運用手順の整理（初回作業の厳密な時刻順を再現した図ではありません）：

```txt
mainへ統合したソース → Staged Production → 保護・実データ表示・印刷の検品
  → main由来のProductionデプロイ Ready
  → 人間によるPromote/公開判断 → 正本非公開化 → 認証表示と匿名旧CSV拒否を再確認
```

今回の公開切替は、Vercel画面で新mainデプロイへ青色Production表示が移動したことと公開先の正常表示に基づく記録です。CLI alias等によるDeployment IDの厳密な割当照合は未実施で、初回Stagedと公開先が同じDeployment IDとは断定しません。今後も対象commitとDeployment IDを対応付け、新しいデプロイは改めて検品します。

Production Branch（Branch Tracking）は `main`。これは追跡するブランチの設定です。別設定の `Auto-assign Custom Production Domains` は現在 **Disabled** で、自動ビルドと人間の公開判断を分離しています。Disabledを継続する運用判断は別途行います。ブランチ追跡、デプロイ作成、ドメイン割当、promoteは同じ操作ではありません。

### Issue #1の残件

- 全4旧CSV URLの個別匿名拒否試験（確認済みは1 URL）
- 旧方式とWIF方式の `ResumeData` のプログラム完全同値比較（目視検品とは別）
- 写真・外部職務経歴書・旧ファイル等、個別の公開経路監査
- 全シークレット非漏洩の完全証明は未実施。エラー・ログ・キャッシュ等の確認範囲を区別する
- 公開ドメインとDeployment IDの厳密照合、およびAuto-assign Disabledの継続方針

正本のファイル名は整理し、古いマスターはゴミ箱へ移動しました（完全削除ではありません）。ファイル名変更はタブ名・ID変更とは別です。これらをもって全公開経路の監査完了やIssue完了とはしません。非公開化後の比較のために正本を再公開せず、安全な検証方法を別途判断します。

## 開発履歴

- Google Sheetsと公開CSVによるコンテンツ管理を実装（初期構成）
- 2026-10-23：Production WIF・Sheets APIへ移行し、既存CSV変換/パーサーを維持したまま正本を非公開化
- Web表示用とA4印刷用の履歴書を分離
- 選考結果の文面生成、Resend送信、メールソフト送信を実装
- HMAC-SHA256署名付きCookieによるログイン認証とログイン通知を実装
- Taste / redesign skillを用いてUIをリニューアルし、機能を維持したままタイポグラフィ、配色、導線、レスポンシブ表示、アクセシビリティを改善

## 現在の制約と改善候補

- `src/app/print/career/page.tsx`はプレースホルダーで、職務経歴書は`GOOGLE_DOCUMENT_URL`の外部文書を使用しています
- Production WIF/CSV変換の自動テストと実機結果は上記を参照。残る同値性・公開経路監査は [取得境界と検証](docs/production-wif.md) に記録しています
- 返信フォームの補助コンポーネントは今後、実際の責務分割に合わせて整理できます

DB化やAPI化は現在の要件では行わず、必要性が生じた場合に検討します。

## 開発方針

- 最小で動かし、必要に応じて強くする
- データ取得・変換・表示の責務を分ける
- Google Sheetsを編集画面として活用し、コードと文章データを分離する
- 採用担当者と応募者の双方が迷わない導線を作る
- 秘密情報は環境変数で管理する

## 詳細ドキュメント

- [Production WIFの取得境界・環境変数・オフライン検証](docs/production-wif.md)
- [Staged Productionの実施結果と事前計画・停止条件](docs/staged-production-wif.md)
- [アダプター単体テストの範囲](tests/README.md)

詳細文書は当時の事前計画と現在の結果を分けています。今後のmainマージ・実デプロイ・promote・IAM/共有設定変更は、その都度司令官が判断します。
