# Staged Production WIF 検品計画（実行承認待ち）

この文書は準備手順です。**Stagedを含むデプロイ、環境変数/IAM/共有設定の変更、mainマージ、promoteはまだ実行しません。** ローカル・PreviewのWIF停止条件は維持します。学習用PR #6はマージしません。

## 1. 作戦と根拠

`work/issue-1-production-wif`（Draft PR #7）の承認済みコミットを、司令官が別承認後に `vercel --prod --skip-domain` でデプロイします。Production Branchはmain、ドメイン自動割当設定はEnabledのままです。`--skip-domain` はそのデプロイだけ自動割当を上書きします。固有URLで検品し、合格した**同じDeployment ID**のpromoteはさらに別承認です。新しいcommitで再デプロイしたら別の検品対象です。

公式仕様上はProduction環境を使うため、Functions実行時のProduction OIDCを使う構成と整合します。ただしPR #7での `x-vercel-oidc-token` 実受領、custom audience交換、Google認証、4シート読取は未実測です。`Ready` やGitHubの緑表示だけで認証合格としません。ビルド時tokenやローカルCLI tokenで代用しません。

Standard ProtectionはProductionの固有デプロイURLを保護する仕様ですが、設定例外・共有リンク・bypassの実態確認が必須です。現在のProductionドメインは保護対象が異なります。**固有URLの匿名拒否を先に確認してからアプリへログイン**します。

## 2. 誰が何を確認・設定するか

| 担当 | 読み取り確認／承認後の作業 | 今はしないこと |
| --- | --- | --- |
| LR | docs・mockテスト・専用ブランチPR更新、コードと公式仕様の照合 | 本番認証・正本読取・実デプロイ |
| 司令官：Vercel GUI | 正しいteam/project、Production Branch/main、OIDC有効化、Standard Protection、例外/bypass、既存Production環境変数の必要な名前を確認 | グローバルProduction環境変数の上書き、ドメイン変更 |
| 司令官：Google GUI | Production pool `vercel-web-resume` のprovider ID/project number、issuer/allowed audience/subject mapping・production完全一致条件、SAへの限定subject bindingと権限借用、正本SheetのSA閲覧権限、4 GID/titleを確認 | Devへの正本共有・IAM緩和・鍵発行・公開停止 |
| 司令官：承認後CLI | 対象ソース・link確認、当該デプロイだけのruntime override、固有URLを取得 | main merge/promote（それぞれ別承認） |

GoogleのDefault Audienceと、Vercelから交換するcustom audienceが実providerの完全なリソースURLに一致することを確認します。`RESUME_WIF_PROVIDER_ID` はproviderの短いIDでありpool名やURLではありません。`RESUME_WIF_PROJECT_NUMBER` は数値project numberです。現在のコードはProduction SAのローカル名 `resume-sheet-reader` とpool名を限定しています。GUIで不一致・未設置を見つけたら設定を直さずSTOPし、必要変更を別途承認します。

設定名とコードの処理順は [production-wif.md](production-wif.md) を参照してください。設定値・認証レスポンスをSlack/Gitへ貼りません。

## 3. 実行前チェック：ソースと秘密ファイル

司令官がGit Bashで一手ずつ確認します。以下のGit操作はデプロイしません。変更がある作業ツリーを勝手にreset/stashせず停止します。

```sh
git status --short
git branch --show-current
git fetch origin
git rev-parse HEAD
git rev-parse origin/work/issue-1-production-wif
git diff --name-status origin/main...HEAD
```

- ブランチが `work/issue-1-production-wif`、HEADがレビュー済みremote SHA、作業ツリーがcleanであること。mainが進んでいたら影響を再レビュー。未承認差分・競合・他人の変更はSTOP。
- `git ls-files` で追跡ファイル名を確認。`.env.local`、`.env.wif.local`、他の実値env、秘密鍵、private資料、個人データ、生成済みHTML/PDF、ログ等が含まれないこと。内容を画面共有・ログへ出さないローカルのsecret scanで確認し、結果はPASS/FAILと対象種別だけ記録。検知したらデプロイしない。
- `git check-ignore .env.local .env.wif.local` はGitの確認にすぎません。**Git clean／Git ignoreだけではCLIアップロード除外の証明になりません。** Vercel既定は `.env.local` / `.env.*.local` を除外しますが、任意ファイル名まで保証しません。`.vercelignore` はCLIアップロード用の別設定です。
- 今回は設定ファイルを追加変更する代わりに、**承認済みコミットだけを新しい空ディレクトリへexport**する方式を採用します。既存checkoutの丸ごとコピーはしません。例（パスは未使用の専用ディレクトリに置換）：

```sh
set -o pipefail
if mkdir ../resume-staged-source &&
   git archive HEAD | tar -x -C ../resume-staged-source; then
  printf 'SOURCE_EXPORT_PASS\n'
else
  printf 'SOURCE_EXPORT_STOP\n'
fi
```

`SOURCE_EXPORT_PASS` の場合だけ次へ進みます。既存ディレクトリ・archive/tar失敗・部分出力ならSTOPし、そのディレクトリをデプロイしません。削除してやり直す場合も対象を司令官が確認します。

export先に元の `.env*`、`.vercel`、`.next`、`node_modules`、private資料、PoC出力等をコピーしません。追跡済み秘密ファイルはarchiveにも入るため先の検査が前提です。export内のファイル名も再検査します。例示ファイルも実値混入がないこと。別ディレクトリの安全な設定入力をexportへ移動しません。

exportには `.git` がないため、Vercelが正しいGit SHAを自動記録するとは限りません。元ブランチ名・フルSHA・承認日時と、後で作るDeployment ID/固有URLを司令官の非公開メモに対応付けます。値の記録不要です。

**ここから先は司令官による実行承認後だけ。** export先で `vercel --version` / `vercel whoami` を確認し、`vercel link` では既存の正しいteam/projectを選択します。新規projectは作りません。`.vercel/project.json` のproject/org対応をGUIと照合します（全文公開不要）。`env pull` は不要で、案内されても秘密ファイルを取り込みません。team/projectが違う・不明ならSTOP。

## 4. 当該デプロイだけの設定

| 方法 | 影響 | 方針 |
| --- | --- | --- |
| CLI `--env` | 作るデプロイのruntime環境変数 | この検品のoverrideに採用 |
| CLI `--build-env` | 作るデプロイのbuild環境変数 | runtimeの代用にしない。今回は追加不要 |
| Project SettingsのProduction環境変数変更 | 既存deploymentへ遡及しないが、次のmain自動デプロイ等に波及 | 今回は変更しない |
| `NEXT_PUBLIC_*` / URL query / 公開診断API | クライアント公開に繋がる | 使用しない |

既存の `LOGIN_COOKIE_SECRET`、`ACCESS_PASSWORD`、メール関連等は正しいprojectの既存Production設定を継承し、CLIで持ち出し・上書きしません。必要な既存設定がない場合はSTOPです。

当該デプロイへ `RESUME_SHEETS_SOURCE` と5個の `RESUME_WIF_*`（計6名）、4種の `GOOGLE_SHEET_*_TITLE` をruntime overrideとして指定します。`GOOGLE_SHEETS_BASE_ID` と4種の `GOOGLE_SHEET_*_GID` は既存Production設定が正本と一致するなら継承し、不一致なら承認した当該デプロイoverrideだけを使います。`WIF_CONFIG` という単一envはありません。`VERCEL` / `VERCEL_ENV` / `NODE_ENV` / `VERCEL_OIDC_TOKEN` は手入力しません。

秘密値をコマンド履歴・画面へ残さないため `--env NAME=実値` の直書き、`set -x`、`env` の全件表示、CLI debugを避けます。現行CLIソースには `--env NAME`（値省略）で呼出元process環境から読む処理があります。ただし**司令官のCLI 53.2.0での同仕様は未確認**なので、承認前に当該バージョンのソース/ヘルプを確認します。値未設定ならSTOP。秘密のないダミーでも仕様確認のために実デプロイはしません。`--env-file` はこの手順では使いません。

必要値は司令官がexportの外で安全にprocess環境へ用意し、値を出さず必要名の存在だけを検査します。実行コマンドは承認時に全設定名を含む形へ確定します。基本形だけは次です（**まだ実行禁止**）：

```text
vercel --prod --skip-domain --env RESUME_SHEETS_SOURCE [承認した他のruntime環境変数名]
```

`RESUME_SHEETS_SOURCE` の値はwifであることを司令官が確認します。CLI flagの実装確認、安全なprocess環境への注入方法、必要値のGUI照合が終わるまでは実行可能な手順が揃ったとは扱いません。現在の公開deploymentを変えなくても、stagedは本物のProduction資格情報とデータにアクセスできることを理解して承認します。

## 5. 段階別検品（値を記録しない）

各行をPASS/FAIL/未実施で記録します。LRは正本を取得せず、司令官の認証済みブラウザ内だけで確認します。

| 順 | 検査 | 合格条件／停止条件 |
| --- | --- | --- |
| 0 | 実行承認とDeployment同定 | branch/SHA → Deployment ID/固有URLを対応付け。EnvironmentがProduction、Readyを確認。現行Productionドメインの割当先が変わっていない。PreviewならSTOP |
| 1 | Vercel保護 | Vercel未ログインのプライベートブラウザで固有URLへのアクセスがVercel認証を要求。共有リンク/bypass token/保護例外なし。匿名でアプリ到達ならSTOPし実データ検品しない |
| 2 | アプリ認証 | Vercel認証後、アプリ未ログインで `/resume` / `/print/resume` がログイン要求。既存ログインを通過後だけ表示。Cookie値は転記しない |
| 3 | OIDC→WIF→4シート | Production identity、Google STS、Production SA、4枚metadata/valuesが成功。401/403/期限/audience/mapping/ヘッダー分類エラーならSTOP。診断API・tokenログを足さない |
| 4 | CSV→ResumeData | profile/education/career/certificationの件数・列構造・値の一致判定。先頭0、日付、改行、引用符、空欄、並び、画像URLを含む。CSV/APIの取得時刻の間はデータ編集を止める |
| 5 | 画面・印刷 | `/resume` の欠落/順序/折返し、写真表示、`/print/resume` のA4レイアウト・改ページ・文字切れを司令官が確認。PDF/スクリーンショットを外部へ送らない |
| 6 | 漏えい・キャッシュ | 対象DeploymentのRuntime Logsにtoken/セル/本文/個人データを新規出力しないこと。実値ログのexport・転記禁止。未認証/期限切れCookie・別ブラウザで再度非表示。静的成果物/共有キャッシュに個人データが残らないこと |
| 7 | 結論 | すべての必須項目が合格して初めてpromote承認を依頼。不明/未実施をPASSにしない |

既存ログインは通知メールを送ります。stagedでも実送信され得るため司令官が事前に了承し、回数を絞ります。無断でメール設定や認証を変えず、返信フォームの送信試験は今回行いません。

**正確なResumeData同値性比較は現在未実装・未実施です。** ローカルProduction tokenを持ち出して比較することはできません。まず両版の画面/印刷を司令官が私的に比較しますが、これはオブジェクト完全同値の代用ではありません。完全同値が必要な受入条件は保留し、Production内の認証済み一時比較処理（値/差分/ハッシュを出さず固定分類・件数/列一致だけ、診断APIなし）等の安全な設計を別レビューしてから進めます。この文書更新だけでその処理を追加していません。

## 6. 昇格・撤退・公開停止は別の決裁

- 失敗したstagedはpromoteせず、公開ドメインは現行deploymentのまま。再試行に新deploymentが必要なら再承認・再検品します。IAMを緩めず、public-csvへ自動fallbackしません。stagedの削除/保護変更も司令官判断です。
- 合格後の**同一deploymentのpromote**は別承認。公式仕様上再buildは不要ですが、実行前にdeployment ID・設定・検品結果を再照合。新commitや再buildは同一成果物ではありません。
- promoteとmain mergeは別操作です。検品commitがmainへ未反映のまま次のmain自動デプロイが走れば旧コード/旧設定へ戻るリスクがあります。恒久Production設定の移行、main統合、自動デプロイの順序を司令官が別途承認するまでは「移行完了」としません。
- **恒久Production設定・main統合・次の自動デプロイでもWIFを再現できる運用が承認・確認済みであることを公開停止の必須条件**にします。そのうえで正式ProductionでWIF4枚・Web/印刷を再確認後だけ、司令官がGoogle Sheetsのリンク共有と「ウェブに公開」を別承認で停止。匿名旧CSV/公開URLが取得不能、認証アプリは正常、原本/コピー/写真/外部文書の残る公開経路を確認します。
- 公開停止後は旧CSV版へ戻すだけでは復旧しません。無断再公開はせず、認証版修復または停止表示を司令官が判断します。

## 7. 根拠と現在の未確認事項

- [CLI deploy](https://vercel.com/docs/cli/deploy)：`--prod`、`--skip-domain`、runtime `--env` / build `--build-env`。
- [CLIからのデプロイ](https://vercel.com/docs/cli/deploying-from-cli)、[promote](https://vercel.com/docs/deployments/promoting-a-deployment)：stagedから同一成果物の昇格。
- [Deployment Protection](https://vercel.com/docs/deployment-protection)、[Standard Protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)：固有URLとProductionドメインの保護範囲。
- [Build features](https://vercel.com/docs/builds/build-features)、[.vercelignore](https://vercel.com/docs/deployments/vercel-ignore)：既定除外とCLIアップロード制御。
- [OIDC reference](https://vercel.com/docs/oidc/reference)：Functions実行時headerとidentity。
- [CLI deploy実装](https://github.com/vercel/vercel/blob/main/packages/cli/src/commands/deploy/index.ts)、[parse-env](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/parse-env.ts)：値省略envの現行実装。mainのソースは53.2.0固定版の実測ではありません。

GUI情報は司令官の確認報告です。LRがVercel/IAM設定を変更・実認証した証拠ではありません。未確認：CLI固定版の値省略env、実provider対応、保護例外、Production OIDC/header/交換、4枚取得・厳密同値性、メール副作用、画面/画像/A4、実React cache分離、公開停止後の匿名拒否。すべて承認後の検品対象です。
