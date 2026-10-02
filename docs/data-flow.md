# Resume データフロー

Google Sheets のデータが、Next.js の履歴書画面へ届くまでを **実際のファイル名・関数名・型名と対応させて** 図式化します。

このドキュメントでは、単なる依存関係ではなく、

```text
どこからデータが来る
→ どの関数で何に変わる
→ どの型になる
→ どの画面で使われる
```

を追えることを目的にしています。

---

## 1. 全体像

```mermaid
flowchart TD
    GS["Google Sheets<br/>profile / education / career / certification"]

    BRD["buildResumeData()<br/>src/lib/build-resume-data.ts"]

    FP["fetchSheetCsv('profile')"]
    FE["fetchSheetCsv('education')"]
    FC["fetchSheetCsv('career')"]
    FQ["fetchSheetCsv('certification')"]

    CP["profile_csv: string"]
    CE["education_csv: string"]
    CC["career_csv: string"]
    CQ["certification_csv: string"]

    PP["parseProfileCsv(profile_csv)<br/>src/lib/parse-profile-csv.ts"]
    PE["parseEducationCsv(education_csv)<br/>src/lib/parse-education-csv.ts"]
    PC["parseCareerCsv(career_csv)<br/>src/lib/parse-career-csv.ts"]
    PQ["parseCertificationCsv(certification_csv)<br/>src/lib/parse-certification.ts"]

    TP["Profile"]
    TE["Education[]"]
    TC["Career[]"]
    TQ["Certification[]"]

    RD["ResumeData<br/>src/types/resume.ts"]

    WEB["/resume<br/>src/app/resume/page.tsx"]
    PRINT["/print/resume<br/>src/app/print/resume/page.tsx"]

    GS --> BRD

    BRD -->|"Promise.all()"| FP
    BRD -->|"Promise.all()"| FE
    BRD -->|"Promise.all()"| FC
    BRD -->|"Promise.all()"| FQ

    FP --> CP
    FE --> CE
    FC --> CC
    FQ --> CQ

    CP --> PP
    CE --> PE
    CC --> PC
    CQ --> PQ

    PP --> TP
    PE --> TE
    PC --> TC
    PQ --> TQ

    TP --> RD
    TE --> RD
    TC --> RD
    TQ --> RD

    RD --> WEB
    RD --> PRINT
```

### コード上の中心

`buildResumeData()` が司令塔です。

実コードでは4つのCSV取得を `Promise.all()` で同時に開始します。

```ts
const [
  profile_csv,
  education_csv,
  career_csv,
  certification_csv,
] = await Promise.all([
  fetchSheetCsv("profile"),
  fetchSheetCsv("education"),
  fetchSheetCsv("career"),
  fetchSheetCsv("certification"),
]);
```

取得後、それぞれ専用パーサーへ渡します。

```ts
const profile = parseProfileCsv(profile_csv);
const education = parseEducationCsv(education_csv);
const career = parseCareerCsv(career_csv);
const certification = parseCertificationCsv(certification_csv);
```

最後に `ResumeData` として統合します。

```ts
return {
  profile,
  education,
  career,
  certification,
};
```

---

## 2. Google Sheets → CSV文字列

対象ファイル:

```text
src/lib/fetch-sheet-csv.ts
```

```mermaid
flowchart TD
    A["fetchSheetCsv(sheetName)"]
    B["SHEETS[sheetName]"]
    C["gid を取得"]
    D["GOOGLE_SHEETS_BASE_ID"]
    E["Google Sheets export URL を組み立てる"]
    F["fetch(url, { cache: 'no-store' })"]
    G{"res.ok ?"}
    H["res.text()"]
    I["Promise&lt;string&gt;<br/>CSV文字列"]
    X["throw new Error('CSV取得失敗')"]

    A --> B
    B --> C
    D --> E
    C --> E
    E --> F
    F --> G
    G -->|"Yes"| H
    H --> I
    G -->|"No"| X
```

### 使用する環境変数

```text
GOOGLE_SHEETS_BASE_ID
GOOGLE_SHEET_PROFILE_GID
GOOGLE_SHEET_EDUCATION_GID
GOOGLE_SHEET_CAREER_GID
GOOGLE_SHEET_CERTIFICATION_GID
```

`sheetName` は次の4種類だけを受け取れます。

```ts
"profile"
"education"
"career"
"certification"
```

これは `keyof typeof SHEETS` によって TypeScript 側で制限されています。

---

## 3. CSV文字列 → 共通の行データ

対象ファイル:

```text
src/lib/parse-csv-text-to-rows.ts
```

```mermaid
flowchart LR
    A["csv_text: string"]
    B["parse()<br/>csv-parse/sync"]
    C["columns: true"]
    D["skip_empty_lines: true"]
    E["trim: true"]
    F["delimiter: ','"]
    G["Record&lt;string, string&gt;[]"]

    A --> B
    C --> B
    D --> B
    E --> B
    F --> B
    B --> G
```

実コード:

```ts
export function parseCsvTextToRows(
  csv_text: string
): Record<string, string>[] {
  return parse(csv_text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ",",
  });
}
```

### ここで何が変わるか

入力:

```csv
id,name
1,Leon
2,Tanaka
```

出力イメージ:

```ts
[
  { id: "1", name: "Leon" },
  { id: "2", name: "Tanaka" },
]
```

この時点ではまだ `Career` や `Education` ではありません。

型としては単純な、

```ts
Record<string, string>[]
```

です。

---

## 4. 共通行データ → 履歴書用の型

4種類すべての専用パーサーが、まず `parseCsvTextToRows()` を呼びます。

```mermaid
flowchart TD
    CSV["CSV文字列"]

    PCTR["parseCsvTextToRows()"]
    ROWS["Record&lt;string, string&gt;[]"]

    PROFILE["parseProfileCsv()"]
    EDUCATION["parseEducationCsv()"]
    CAREER["parseCareerCsv()"]
    CERT["parseCertificationCsv()"]

    PT["Profile"]
    ET["Education[]"]
    CT["Career[]"]
    QT["Certification[]"]

    CSV --> PCTR
    PCTR --> ROWS

    ROWS --> PROFILE
    ROWS --> EDUCATION
    ROWS --> CAREER
    ROWS --> CERT

    PROFILE --> PT
    EDUCATION --> ET
    CAREER --> CT
    CERT --> QT
```

実際には各CSVごとに `parseCsvTextToRows()` が1回ずつ実行されます。

---

## 5. Profileだけ変換方法が違う

対象ファイル:

```text
src/lib/parse-profile-csv.ts
src/types/profile.ts
```

Profileシートは **縦持ちの key-value 形式**です。

イメージ:

```csv
key,value
name,Leon.C
title,Web Developer
email,example@example.com
```

処理:

```mermaid
flowchart TD
    A["profile_csv: string"]
    B["parseCsvTextToRows()"]
    C["rows: Record&lt;string,string&gt;[]"]
    D["empty_profile をコピー"]
    E["rows.forEach(row)"]
    F["key = row['key']"]
    G["value = row['value']"]
    H{"key in profile ?"}
    I["profile[key] = value"]
    J["Profile を返す"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H -->|"Yes"| I
    I --> E
    H -->|"No"| E
    E -->|"全行終了"| J
```

`empty_profile` は `src/types/profile.ts` にあり、すべての項目を空文字で持った `Profile` の初期値です。

主な項目:

```text
name
furigana
title
tagline
summary
email
phone
nearest_station
github_url
portfolio_url
wanted_job
commuting_time
...
```

---

## 6. Education / Career / Certification は横持ち

この3種類はCSVの1行が、そのまま1件のデータになります。

### Education

対象:

```text
src/lib/parse-education-csv.ts
src/types/education.ts
```

```mermaid
flowchart LR
    A["education_csv"]
    B["parseCsvTextToRows()"]
    C["rows.map()"]
    D["id / status / school_name<br/>faculty / department<br/>period_start / period_end<br/>category / summary<br/>print_summary / sort"]
    E["Education[]"]

    A --> B --> C --> D --> E
```

### Career

対象:

```text
src/lib/parse-career-csv.ts
src/types/career.ts
```

```mermaid
flowchart LR
    A["career_csv"]
    B["parseCsvTextToRows()"]
    C["rows.map()"]
    D["id / status / company<br/>period_start / period_end<br/>employment_type / role / industry<br/>team_size / summary<br/>challenge / result / achievements<br/>tech_stack / print_summary / sort"]
    E["Career[]"]

    A --> B --> C --> D --> E
```

### Certification

対象:

```text
src/lib/parse-certification.ts
src/types/certification.ts
```

```mermaid
flowchart LR
    A["certification_csv"]
    B["parseCsvTextToRows()"]
    C["rows.map()"]
    D["name / acquired_date<br/>note / sort"]
    E["Certification[]"]

    A --> B --> C --> D --> E
```

---

## 7. 最終的な ResumeData

対象ファイル:

```text
src/types/resume.ts
```

```ts
export interface ResumeData {
  profile: Profile;
  education: Education[];
  career: Career[];
  certification: Certification[];
}
```

図にすると:

```mermaid
flowchart TD
    RD["ResumeData"]

    P["profile: Profile"]
    E["education: Education[]"]
    C["career: Career[]"]
    Q["certification: Certification[]"]

    RD --> P
    RD --> E
    RD --> C
    RD --> Q
```

ここまで来ると、画面側はCSVを意識する必要がありません。

画面は、

```ts
resume.profile.name
resume.education
resume.career
resume.certification
```

のように、TypeScriptのデータとして利用できます。

---

## 8. 画面側

### Webレジュメ

対象:

```text
src/app/resume/page.tsx
```

冒頭で、

```ts
const resume = await buildResumeData();
```

を実行します。

その後、

```text
resume.profile
resume.education
resume.career
resume.certification
```

を JSX へ渡して表示します。

### 印刷用レジュメ

対象:

```text
src/app/print/resume/page.tsx
```

こちらも同じく、

```ts
const resume = await buildResumeData();
```

を実行します。

つまり **Web表示と印刷表示は同じデータ取得・変換処理を共有**しています。

```mermaid
flowchart LR
    A["buildResumeData()"]
    B["ResumeData"]
    C["/resume"]
    D["/print/resume"]

    A --> B
    B --> C
    B --> D
```

---

## 9. ファイルと責務の対応表

| ファイル | 主な関数 / 型 | 責務 |
|---|---|---|
| `src/lib/build-resume-data.ts` | `buildResumeData()` | 全体の司令塔。取得・解析・統合 |
| `src/lib/fetch-sheet-csv.ts` | `fetchSheetCsv()` | Google SheetsからCSV取得 |
| `src/lib/parse-csv-text-to-rows.ts` | `parseCsvTextToRows()` | CSV文字列を共通の行オブジェクトへ変換 |
| `src/lib/parse-profile-csv.ts` | `parseProfileCsv()` | key-value形式を `Profile` へ変換 |
| `src/lib/parse-education-csv.ts` | `parseEducationCsv()` | 行データを `Education[]` へ変換 |
| `src/lib/parse-career-csv.ts` | `parseCareerCsv()` | 行データを `Career[]` へ変換 |
| `src/lib/parse-certification.ts` | `parseCertificationCsv()` | 行データを `Certification[]` へ変換 |
| `src/types/profile.ts` | `Profile`, `empty_profile` | Profileの型と初期値 |
| `src/types/education.ts` | `Education` | 学歴データの型 |
| `src/types/career.ts` | `Career` | 職歴データの型 |
| `src/types/certification.ts` | `Certification` | 資格データの型 |
| `src/types/resume.ts` | `ResumeData` | 4種類のデータを束ねる型 |
| `src/app/resume/page.tsx` | `ResumePage()` | Webレジュメ表示 |
| `src/app/print/resume/page.tsx` | `PrintResumePage()` | 印刷用レジュメ表示 |

---

## 10. 不具合が出たときの切り分け順

「履歴書の表示がおかしい」ときは、画面から逆向きに追います。

```mermaid
flowchart TD
    A["画面表示がおかしい"]
    B["page.tsx<br/>resume.xxx の使い方を確認"]
    C["buildResumeData()<br/>4データが正しく統合されているか"]
    D["parse*Csv()<br/>目的の型へ正しく変換されているか"]
    E["parseCsvTextToRows()<br/>CSVが行オブジェクトになっているか"]
    F["fetchSheetCsv()<br/>CSV文字列を取得できているか"]
    G["Google Sheets / GID / 環境変数<br/>元データが正しいか"]

    A --> B --> C --> D --> E --> F --> G
```

### 覚えるべき一本線

```text
Google Sheets
↓
fetchSheetCsv()
↓
CSV文字列
↓
parseCsvTextToRows()
↓
Record<string, string>[]
↓
parse*Csv()
↓
Profile / Education[] / Career[] / Certification[]
↓
buildResumeData()
↓
ResumeData
↓
page.tsx
```

この一本線が理解できれば、細かいコードを暗記していなくてもデータの流れを追えます。
