import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { validResumeSession } from "../src/lib/resume-session.ts";
import { readWifConfig, providerAudience, validateProductionToken, authenticateProduction, fetchPrivateSheetCsv } from "../src/lib/production-wif-core.ts";
import { parseProfileCsv } from "../src/lib/parse-profile-csv.ts";
import { parseEducationCsv } from "../src/lib/parse-education-csv.ts";
import { parseCareerCsv } from "../src/lib/parse-career-csv.ts";
import { parseCertificationCsv } from "../src/lib/parse-certification.ts";
import { sheetValuesToCsv } from "../src/lib/sheet-values-to-csv.ts";

// 全値はダミー。実トークン・実通信・環境変数・個人データは使用しない。
const env = {
  RESUME_WIF_VERCEL_TEAM: "leon20200809s-projects", RESUME_WIF_VERCEL_PROJECT: "lazygenius-web-resume",
  RESUME_WIF_PROJECT_NUMBER: "123456789", RESUME_WIF_PROVIDER_ID: "vercel-production",
  RESUME_WIF_SERVICE_ACCOUNT: "resume-sheet-reader@dummy-project.iam.gserviceaccount.com",
  GOOGLE_SHEETS_BASE_ID: "DUMMY_PRIVATE_SHEET",
};
for (const [i, key] of ["profile", "education", "career", "certification"].entries()) {
  env[`GOOGLE_SHEET_${key.toUpperCase()}_GID`] = String(i);
  env[`GOOGLE_SHEET_${key.toUpperCase()}_TITLE`] = `DUMMY ${key}`;
}
const config = readWifConfig(env);
const now = 1900000000000;
const claims = (aud = `https://vercel.com/${config.team}`) => ({
  iss: `https://oidc.vercel.com/${config.team}`, aud,
  sub: `owner:${config.team}:project:${config.project}:environment:production`,
  owner: config.team, project: config.project, environment: "production", iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+600,
});
const jwt = (data) => `${Buffer.from('{"alg":"RS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(data)).toString("base64url")}.DUMMY_NOT_A_SIGNATURE`;
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
function queueMock(items) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.cache, "no-store"); assert.equal(init.redirect, "error"); assert.ok(init.signal instanceof AbortSignal);
    const next = items.shift();
    if (next instanceof Error) throw next;
    assert.ok(next, "unexpected network stage");
    return next;
  };
  return { fetcher, calls };
}
const authResponses = () => [response({ token: jwt(claims(providerAudience(config))) }), response({ access_token: "DUMMY_STS", token_type: "Bearer" }), response({ accessToken: "DUMMY_SA", expireTime: new Date(Date.now()+600000).toISOString() })];

test("production configuration maps four distinct GIDs and fixed production pool", () => {
  assert.equal(Object.keys(config.sheets).length, 4);
  assert.equal(providerAudience(config), "https://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-web-resume/providers/vercel-production");
});
for (const [key, value] of [
  ["RESUME_WIF_VERCEL_TEAM", "other"], ["RESUME_WIF_VERCEL_PROJECT", "other"], ["RESUME_WIF_PROJECT_NUMBER", "12/a"],
  ["RESUME_WIF_PROVIDER_ID", "vercel-development"], ["RESUME_WIF_PROVIDER_ID", "vercel-test"],
  ["RESUME_WIF_SERVICE_ACCOUNT", "resume-wif-test-reader@dummy-project.iam.gserviceaccount.com"],
  ["GOOGLE_SHEETS_BASE_ID", "bad/id"], ["GOOGLE_SHEET_PROFILE_GID", "-1"], ["GOOGLE_SHEET_PROFILE_GID", "9007199254740992"],
  ["GOOGLE_SHEET_PROFILE_GID", "1"], ["GOOGLE_SHEET_PROFILE_TITLE", "DUMMY education"], ["GOOGLE_SHEET_PROFILE_TITLE", " bad "],
]) test(`invalid configuration ${key} rejected`, () => assert.throws(() => readWifConfig({ ...env, [key]: value }), { message: "WIF_CONFIG_INVALID" }));
for (const key of Object.keys(env)) test(`missing configuration ${key} rejected`, () => assert.throws(() => readWifConfig({ ...env, [key]: undefined }), { message: "WIF_CONFIG_INVALID" }));

test("matching JWT claims are a precheck only, not a signature verification", () => {
  const data = { ...claims(), iat: now/1000, exp: now/1000+600 };
  assert.doesNotThrow(() => validateProductionToken(jwt(data), config, data.aud, now));
});
for (const [field, value] of [
  ["iss", "https://example.invalid"], ["aud", "https://example.invalid"], ["sub", "environment:development"],
  ["environment", "development"], ["project", "other"], ["owner", "other"], ["exp", now/1000+60],
  ["exp", "9999999999"], ["exp", null], ["iat", now/1000+31], ["iat", "0"], ["nbf", now/1000+1], ["nbf", "0"],
]) test(`claim ${field} mismatch rejected`, () => {
  const data = { ...claims(), iat: now/1000, exp: now/1000+600, [field]: value };
  assert.throws(() => validateProductionToken(jwt(data), config, `https://vercel.com/${config.team}`, now), { message: "WIF_IDENTITY_INVALID" });
});
for (const token of ["", "a.b", "a.b.c.d", "a.!.c", "a..c", "x".repeat(30001)]) test("malformed token fails with fixed code", () => assert.throws(() => validateProductionToken(token, config, "DUMMY", now), { message: "WIF_IDENTITY_INVALID" }));
test("identity rejection makes no exchange request", async () => {
  const mock = queueMock([]);
  await assert.rejects(authenticateProduction(jwt({ ...claims(), environment: "development" }), config, mock.fetcher), { message: "WIF_IDENTITY_INVALID" });
  assert.equal(mock.calls.length, 0);
});
test("three auth stages preserve audience forms and read-only impersonation", async () => {
  const mock = queueMock(authResponses());
  assert.equal(await authenticateProduction(jwt(claims()), config, mock.fetcher), "DUMMY_SA");
  assert.equal(mock.calls.length, 3);
  const exchange = JSON.parse(mock.calls[0].init.body); assert.equal(exchange.aud, providerAudience(config));
  const sts = mock.calls[1].init.body; assert.equal(sts.get("audience"), providerAudience(config).replace("https:", ""));
  assert.equal(sts.get("subject_token_type"), "urn:ietf:params:oauth:token-type:jwt");
  assert.deepEqual(JSON.parse(mock.calls[2].init.body), { scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"], lifetime: "600s" });
  assert.equal(mock.calls[2].init.headers.Authorization, "Bearer DUMMY_STS");
});
for (const [index, stage] of [[0, "WIF_EXCHANGE"], [1, "WIF_STS"], [2, "WIF_SA"]]) {
  for (const status of [401, 403, 500]) test(`${stage} HTTP ${status} classified without upstream body`, async () => {
    const list = authResponses(); list[index] = response({ secret: "DUMMY_UPSTREAM_PRIVATE" }, status);
    await assert.rejects(authenticateProduction(jwt(claims()), config, queueMock(list).fetcher), { message: `${stage}_HTTP_${status === 500 ? "ERROR" : status}` });
  });
  for (const bad of [null, [], {}, new Error("DUMMY_PRIVATE_ERROR")]) test(`${stage} malformed response/error safely rejected`, async () => {
    const list = authResponses(); list[index] = bad instanceof Error ? bad : response(bad);
    await assert.rejects(authenticateProduction(jwt(claims()), config, queueMock(list).fetcher), { message: `${stage}_FAILED` });
  });
}
test("syntactically matching forged token still fails when Google rejects it", async () => {
  const list = authResponses(); list[1] = response({ error_description: "DUMMY_SIGNATURE_INVALID" }, 403);
  const mock = queueMock(list);
  await assert.rejects(authenticateProduction(jwt(claims()), config, mock.fetcher), { message: "WIF_STS_HTTP_403" });
  assert.equal(mock.calls.length, 2);
});
test("exchanged token must retain production identity and custom audience", async () => {
  const mock = queueMock([response({ token: jwt(claims()) })]);
  await assert.rejects(authenticateProduction(jwt(claims()), config, mock.fetcher), { message: "WIF_IDENTITY_INVALID" });
  assert.equal(mock.calls.length, 1);
});
test("expired SA credential fails without returning credential", async () => {
  const list = authResponses(); list[2] = response({ accessToken: "DUMMY_PRIVATE", expireTime: new Date(0).toISOString() });
  await assert.rejects(authenticateProduction(jwt(claims()), config, queueMock(list).fetcher), { message: "WIF_SA_FAILED" });
});

const fixtureHeaders = {
  profile: ["key", "value"],
  education: ["id", "status", "school_name", "faculty", "department", "period_start", "period_end", "category", "summary", "print_summary", "sort"],
  career: ["id", "status", "company", "period_start", "period_end", "employment_type", "role", "industry", "team_size", "summary", "challenge", "result", "achievements", "tech_stack", "print_summary", "sort"],
  certification: ["name", "acquired_date", "note", "sort"],
};
const parsers = { profile: parseProfileCsv, education: parseEducationCsv, career: parseCareerCsv, certification: parseCertificationCsv };
const metadata = (key) => ({ sheets: [{ properties: { sheetId: config.sheets[key].gid, title: config.sheets[key].title, gridProperties: { rowCount: 10, columnCount: 20 } } }] });
const values = (key) => ({ majorDimension: "ROWS", values: [fixtureHeaders[key], key === "profile" ? ["name", "DUMMY"] : ["001", "DUMMY", '改行,"引用"\n二行目', "2020/01/02"]] });
for (const key of Object.keys(fixtureHeaders)) test(`${key} metadata→bounded A1→CSV→existing parser equivalence`, async () => {
  const data = values(key); const mock = queueMock([response(metadata(key)), response(data)]);
  const csv = await fetchPrivateSheetCsv(key, config, "DUMMY_SA", mock.fetcher);
  assert.deepEqual(parsers[key](csv), parsers[key](sheetValuesToCsv(data.values)));
  assert.ok(decodeURIComponent(mock.calls[1].url).includes(`'${config.sheets[key].title}'!A1:T10`));
  assert.ok(mock.calls[1].url.endsWith("majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE"));
  assert.equal(mock.calls[1].init.headers.Authorization, "Bearer DUMMY_SA");
});
test("unknown target rejected without any network request", async () => {
  const mock = queueMock([]); await assert.rejects(fetchPrivateSheetCsv("unexpected", config, "DUMMY", mock.fetcher), { message: "SHEETS_TARGET_INVALID" }); assert.equal(mock.calls.length, 0);
});
for (const mutate of [m => { m.sheets=[]; }, m => { m.sheets[0].properties.sheetId=123; }, m => { m.sheets[0].properties.title="OTHER"; }, m => { m.sheets.push(m.sheets[0]); }]) test("metadata identity mismatch stops before cell read", async () => {
  const m = metadata("profile"); mutate(m); const mock = queueMock([response(m)]);
  await assert.rejects(fetchPrivateSheetCsv("profile", config, "DUMMY", mock.fetcher), { message: "SHEETS_MAPPING_INVALID" }); assert.equal(mock.calls.length,1);
});
for (const [field,value] of [["rowCount",0],["rowCount",10001],["rowCount","10"],["columnCount",0],["columnCount",101],["columnCount",1.5]]) test("oversized or invalid grids fail closed", async () => {
  const m=metadata("profile"); m.sheets[0].properties.gridProperties[field]=value;
  await assert.rejects(fetchPrivateSheetCsv("profile",config,"DUMMY",queueMock([response(m)]).fetcher),{message:"SHEETS_SIZE_INVALID"});
});
for (const body of [{}, {majorDimension:"COLUMNS",values:[["key","value"]]}, {majorDimension:"ROWS",values:[]}, {majorDimension:"ROWS",values:[["key","value"],[123]]}, {majorDimension:"ROWS",values:[["key","value"],["a","b","c"]]}, {majorDimension:"ROWS",values:[["key","value","key"]]}]) test("invalid values fail without cell contents in error",async()=>{
  await assert.rejects(fetchPrivateSheetCsv("profile",config,"DUMMY",queueMock([response(metadata("profile")),response(body)]).fetcher),{message:"SHEETS_VALUES_INVALID"});
});
test("missing required header fails rather than silently yielding empty fields",async()=>{
  await assert.rejects(fetchPrivateSheetCsv("profile",config,"DUMMY",queueMock([response(metadata("profile")),response({majorDimension:"ROWS",values:[["key"]]})]).fetcher),{message:"SHEETS_HEADER_INVALID"});
});
test("quote in sheet title is escaped in bounded A1",async()=>{
  const c=structuredClone(config); c.sheets.profile.title="DUMMY ' PROFILE"; const m=metadata("profile");m.sheets[0].properties.title=c.sheets.profile.title;
  const mock=queueMock([response(m),response(values("profile"))]);await fetchPrivateSheetCsv("profile",c,"DUMMY",mock.fetcher);
  assert.ok(decodeURIComponent(mock.calls[1].url).includes("'DUMMY '' PROFILE'!A1:T10"));
});

const cookieSecret = "DUMMY_LOCAL_COOKIE_SECRET";
const signedCookie = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", cookieSecret).update(encoded).digest("base64url")}`;
};
test("valid existing signed session accepted at data boundary", () => {
  assert.equal(validResumeSession(signedCookie({ purpose: "resume_access", exp: now/1000+600 }), cookieSecret, now), true);
});
for (const payload of [{ purpose:"other", exp: now/1000+600 }, { purpose:"resume_access", exp: now/1000 }, { purpose:"resume_access", exp: now/1000-1 }, { purpose:"resume_access", exp:"9999999999" }, { purpose:"resume_access" }]) test("invalid signed cookie payload rejected",()=>{
  assert.equal(validResumeSession(signedCookie(payload),cookieSecret,now),false);
});
for (const token of [undefined,"","x.y","x.y.z",signedCookie({purpose:"resume_access",exp:now/1000+600})+"x"]) test("invalid cookie signature/shape rejected",()=>{
  assert.equal(validResumeSession(token,cookieSecret,now),false);
});
test("missing or wrong signing secret rejects otherwise valid cookie",()=>{
  const token=signedCookie({purpose:"resume_access",exp:now/1000+600});
  assert.equal(validResumeSession(token,undefined,now),false);assert.equal(validResumeSession(token,"WRONG_DUMMY",now),false);
});
for (const [index,stage] of [[0,"SHEETS_METADATA"],[1,"SHEETS_VALUES"]]) {
  for(const status of [401,403,500]) test(`${stage} HTTP ${status} returns only classification`,async()=>{
    const list=[response(metadata("profile")),response(values("profile"))];list[index]=response({private:"DUMMY_PRIVATE_CELL"},status);
    await assert.rejects(fetchPrivateSheetCsv("profile",config,"DUMMY",queueMock(list).fetcher),{message:`${stage}_HTTP_${status===500?"ERROR":status}`});
  });
  test(`${stage} thrown private details are sanitized`,async()=>{
    const list=[response(metadata("profile")),response(values("profile"))];list[index]=new Error("DUMMY_PRIVATE_TOKEN_AND_CELL");
    await assert.rejects(fetchPrivateSheetCsv("profile",config,"DUMMY",queueMock(list).fetcher),{message:`${stage}_FAILED`});
  });
}

