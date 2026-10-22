import assert from "node:assert/strict";
import test from "node:test";
import { sheetValuesToCsv } from "../src/lib/sheet-values-to-csv.ts";
import { parseCsvTextToRows } from "../src/lib/parse-csv-text-to-rows.ts";
import { parseProfileCsv } from "../src/lib/parse-profile-csv.ts";
import { parseEducationCsv } from "../src/lib/parse-education-csv.ts";
import { parseCareerCsv } from "../src/lib/parse-career-csv.ts";
import { parseCertificationCsv } from "../src/lib/parse-certification.ts";

// 実シート・認証・ネットワークを使わず、固定ダミーCSVとの同値性を検証する。
const fixtures = [
  ["profile", parseProfileCsv,
    [["key", "value"], ["name", "DUMMY"], ["postal_code", "001-0000"],
      ["birth_date", "2000/01/02"], ["summary", '一行目,"引用"\n二行目'],
      ["photo_url", "https://example.invalid/dummy.png?x=1&y=2"], ["phone"]],
    'key,value\nname,DUMMY\npostal_code,001-0000\nbirth_date,2000/01/02\nsummary,"一行目,""引用""\n二行目"\nphoto_url,https://example.invalid/dummy.png?x=1&y=2\nphone,'],
  ["education", parseEducationCsv,
    [["id", "school_name", "period_start", "summary", "sort"],
      ["001", "DUMMY SCHOOL", "2020/04", "", "01"], ["002", " DUMMY "]],
    'id,school_name,period_start,summary,sort\n001,DUMMY SCHOOL,2020/04,,01\n002, DUMMY ,,,'],
  ["career", parseCareerCsv,
    [["id", "company", "summary", "print_summary"],
      ["001", "DUMMY, INC", '先頭\r\n"引用"', "短文"], []],
    'id,company,summary,print_summary\n001,"DUMMY, INC","先頭\r\n""引用""",短文\n,,,'],
  ["certification", parseCertificationCsv,
    [["name", "acquired_date", "note", "sort"],
      ["DUMMY CERT", "2024年01月", " 改行\nあり ", "001"], ["DUMMY"]],
    'name,acquired_date,note,sort\nDUMMY CERT,2024年01月," 改行\nあり ",001\nDUMMY,,,'],
];
for (const [name, parser, values, csv] of fixtures) {
  test(`${name}: existing parser matches dummy CSV contract`, () => {
    assert.deepEqual(parser(sheetValuesToCsv(values)), parser(csv));
  });
}
for (const value of ["001", "2000/01/02", "日本語", "a,b", 'a"b', "a\nb", "a\rb", "a\r\nb", "", "https://example.invalid/a?x=1&y=2"]) {
  test(`roundtrip cell ${JSON.stringify(value)}`, () => {
    assert.equal(parseCsvTextToRows(sheetValuesToCsv([["value"], [value]]))[0]?.value ?? "", value);
  });
}
test("unquoted trim and quoted whitespace retain existing semantics", () => {
  assert.deepEqual(parseCsvTextToRows(sheetValuesToCsv([["a", "b"], [" x ", " x,y "]])), [{ a: "x", b: " x,y " }]);
});
test("omitted trailing cells, internal blanks, and empty rows preserve positions", () => {
  assert.deepEqual(parseCsvTextToRows(sheetValuesToCsv([["a", "b", "c"], ["x", "", "z"], ["y"], []])),
    [{ a: "x", b: "", c: "z" }, { a: "y", b: "", c: "" }, { a: "", b: "", c: "" }]);
});
test("header only yields no data rows", () => {
  assert.deepEqual(parseCsvTextToRows(sheetValuesToCsv([["a", "b"]])), []);
});
for (const values of [undefined, null, [], [null], [[]], [[""]], [[" "]], [[1]], [["a", "a"]], [["a", " a "]]]) {
  test("invalid header fails without including source values", () => {
    assert.throws(() => sheetValuesToCsv(values), { message: "SHEET_VALUES_INVALID_HEADER" });
  });
}
for (const row of [null, {}, "DUMMY", ["a", "b"], [123], [true], [null], [undefined], [{}]]) {
  test("invalid data row fails without including source values", () => {
    assert.throws(() => sheetValuesToCsv([["a"], row]), { message: "SHEET_VALUES_INVALID_ROW" });
  });
}
test("input arrays are not mutated", () => {
  const values = Object.freeze([Object.freeze(["a", "b"]), Object.freeze(["001"])]);
  assert.equal(sheetValuesToCsv(values), "a,b\r\n001,");
});
test("sparse arrays fail rather than silently shifting cells", () => {
  const sparseRows = [["a"]];
  sparseRows.length = 2;
  assert.throws(() => sheetValuesToCsv(sparseRows), { message: "SHEET_VALUES_INVALID_ROW" });
  assert.throws(() => sheetValuesToCsv([new Array(2)]), { message: "SHEET_VALUES_INVALID_HEADER" });
  assert.throws(() => sheetValuesToCsv([["a", "b"], new Array(2)]), { message: "SHEET_VALUES_INVALID_ROW" });
});
