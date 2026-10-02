# Resume データフロー

Google Sheets の履歴書データが、Next.js の `/resume` で表示されるまでの流れを示します。

```mermaid
flowchart TD
    A["Google Sheets<br/>profile / education / career / certification"]
    B["fetchSheetCsv()<br/>src/lib/fetch-sheet-csv.ts"]
    C["CSV文字列"]
    D["parseCsvTextToRows()<br/>csv-parse/sync"]
    E["Record&lt;string, string&gt;[]<br/>CSVの各行をオブジェクト化"]
    F["各データ用パーサー<br/>parseProfileCsv()<br/>parseEducationCsv()<br/>parseCareerCsv()<br/>parseCertificationCsv()"]
    G["型に沿ったデータ<br/>Profile / Education[] / Career[] / Certification[]"]
    H["buildResumeData()<br/>src/lib/build-resume-data.ts"]
    I["ResumeData<br/>4種類のデータを統合"]
    J["/resume<br/>src/app/resume/page.tsx"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
```

## 読み方

- **取得**: `fetchSheetCsv()` が Google Sheets を CSV 文字列として取得する。
- **共通解析**: `parseCsvTextToRows()` が CSV を `Record<string, string>[]` に変換する。
- **用途別変換**: 各 `parse*Csv()` が行データを履歴書用の型へ整える。
- **統合**: `buildResumeData()` が4種類のデータを `ResumeData` にまとめる。
- **表示**: `/resume` が `ResumeData` を使って画面を描画する。

## 司令塔

`buildResumeData()` がこの処理全体のオーケストレーターです。

内部では `Promise.all()` を使い、profile / education / career / certification の4シートを並列取得してから、それぞれを解析・統合します。
