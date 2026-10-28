import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';

// すべて架空データ。実token・実Sheet・ネットワークは一切使用しない。
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const env = {
  VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production',
  LOGIN_COOKIE_SECRET: 'offline-dummy-cookie-secret',
  RESUME_WIF_VERCEL_TEAM: 'leon20200809s-projects', RESUME_WIF_VERCEL_PROJECT: 'lazygenius-web-resume',
  RESUME_WIF_PROJECT_NUMBER: '123456789', RESUME_WIF_PROVIDER_ID: 'vercel-production',
  RESUME_WIF_SERVICE_ACCOUNT: 'resume-sheet-reader@dummy-project.iam.gserviceaccount.com', GOOGLE_SHEETS_BASE_ID: 'DUMMY_SHEET_ONLY',
};
const keys = ['profile', 'education', 'career', 'certification'];
keys.forEach((key, index) => { env[`GOOGLE_SHEET_${key.toUpperCase()}_GID`] = String(index); env[`GOOGLE_SHEET_${key.toUpperCase()}_TITLE`] = key; });
Object.assign(process.env, env);
const { fetchSheetCsv } = await import('../src/lib/fetch-sheet-csv.ts');
const { buildResumeData } = await import('../src/lib/build-resume-data.ts');
const { sheetValuesToCsv } = await import('../src/lib/sheet-values-to-csv.ts');
function jwt(audience = 'https://vercel.com/leon20200809s-projects', overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://oidc.vercel.com/leon20200809s-projects', aud: audience,
    sub: 'owner:leon20200809s-projects:project:lazygenius-web-resume:environment:production',
    owner: 'leon20200809s-projects', project: 'lazygenius-web-resume', environment: 'production', iat: now, exp: now + 3600, ...overrides };
  return `offline.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.not-a-real-signature`;
}
function cookie() {
  const payload = Buffer.from(JSON.stringify({ purpose: 'resume_access', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  return `${payload}.${createHmac('sha256', env.LOGIN_COOKIE_SECRET).update(payload).digest('base64url')}`;
}
let calls;
beforeEach(() => {
  Object.assign(process.env, env);
  delete process.env.RESUME_SHEETS_SOURCE;
  globalThis.__resumeRuntime = { cookie: cookie(), token: jwt(), connections: 0 };
  calls = [];
  globalThis.fetch = async (...args) => { calls.push(args); throw new Error('OFFLINE_UNEXPECTED_FETCH'); };
});
after(() => {
  globalThis.fetch = originalFetch;
  for (const name of Object.keys(process.env)) if (!(name in originalEnv)) delete process.env[name];
  Object.assign(process.env, originalEnv);
  delete globalThis.__resumeRuntime;
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const fixture = {
  profile: [['key', 'value'], ['name', 'Dummy'], ['photo_url', 'https://example.invalid/dummy.png']],
  education: [['id', 'status', 'school_name', 'faculty', 'department', 'period_start', 'period_end', 'category', 'summary', 'print_summary', 'sort'], ['001', '', 'Dummy School', '', '', '2020/04', '2024/03', '', 'line1\nline2', '', '01']],
  career: [['id', 'status', 'company', 'period_start', 'period_end', 'employment_type', 'role', 'industry', 'team_size', 'summary', 'challenge', 'result', 'achievements', 'tech_stack', 'print_summary', 'sort'], ['002', '', 'Dummy Company', '2024/04', '', '', '', '', '03', 'comma,quote"', '', '', '', '', '', '02']],
  certification: [['name', 'acquired_date', 'note', 'sort'], ['Dummy Certificate', '2024/01', '', '01']],
};
function mockFlow(failStage) {
  globalThis.fetch = async (url, init) => {
    calls.push([url, init]);
    assert.ok(!String(url).includes('docs.google.com'), 'public CSV request is forbidden');
    assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error');
    if (String(url).includes('oidc.vercel.com/~token')) return json({ token: jwt(JSON.parse(init.body).aud) });
    if (String(url).includes('sts.googleapis.com')) return failStage === 'sts' ? json({ secret: 'DO_NOT_ECHO' }, 403) : json({ access_token: 'DUMMY_STS', token_type: 'Bearer' });
    if (String(url).includes('iamcredentials.googleapis.com')) return json({ accessToken: 'DUMMY_SA', expireTime: new Date(Date.now() + 600000).toISOString() });
    if (String(url).includes('/values/')) {
      const range = decodeURIComponent(String(url).split('/values/')[1].split('?')[0]);
      const key = keys.find(key => range.startsWith(`'${key}'!`));
      assert.ok(key); return json({ majorDimension: 'ROWS', values: fixture[key] });
    }
    if (String(url).startsWith('https://sheets.googleapis.com/')) return json({ sheets: keys.map((key, index) => ({ properties: { sheetId: index, title: key, gridProperties: { rowCount: 100, columnCount: 26 } } })) });
    throw new Error('OFFLINE_UNEXPECTED_URL');
  };
}
// 旧環境変数が残る既存Deploymentとの移行順を守りつつ、どの値でも旧経路を復活させない。
for (const source of [undefined, '', 'public-csv', 'wif', 'typo']) test(`retired source setting cannot select a legacy path: ${source ?? 'unset'}`, async () => {
  if (source !== undefined) process.env.RESUME_SHEETS_SOURCE = source;
  mockFlow();
  for (const key of keys) assert.equal(await fetchSheetCsv(key), sheetValuesToCsv(fixture[key]));
  assert.equal(globalThis.__resumeRuntime.connections, 4);
  assert.equal(calls.length, 20); // cache stubなので各シートで認証3段＋metadata＋values。
  assert.ok(calls.every(([url]) => !String(url).includes('docs.google.com')));
});
test('application source contains no public export URL or source selector', () => {
  const root = new URL('../src/', import.meta.url);
  for (const name of readdirSync(root, { recursive: true })) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const source = readFileSync(new URL(name, root), 'utf8');
    assert.doesNotMatch(source, /export\?format=csv|RESUME_SHEETS_SOURCE|sourceMode|public-csv/, name);
  }
});
for (const value of [undefined, 'invalid']) test(`unauthenticated WIF stops before fetch: ${value ?? 'missing'}`, async () => {
  globalThis.__resumeRuntime.cookie = value; await assert.rejects(fetchSheetCsv('profile'), { message: 'RESUME_AUTH_REQUIRED' }); assert.equal(calls.length, 0);
});
for (const [field, value] of [['VERCEL', '0'], ['VERCEL_ENV', 'development'], ['VERCEL_ENV', 'preview'], ['NODE_ENV', 'development']]) test(`runtime gate: ${field}/${value}`, async () => {
  process.env[field] = value; await assert.rejects(fetchSheetCsv('profile'), { message: 'WIF_PRODUCTION_RUNTIME_REQUIRED' }); assert.equal(calls.length, 0);
});
test('missing request token never uses env token or token file', async () => {
  globalThis.__resumeRuntime.token = null; process.env.VERCEL_OIDC_TOKEN = jwt(); process.env.VERCEL_OIDC_TOKEN_FILE = '/this-file-must-never-be-read';
  await assert.rejects(fetchSheetCsv('profile'), { message: 'WIF_RUNTIME_TOKEN_REQUIRED' }); assert.equal(calls.length, 0);
  delete process.env.VERCEL_OIDC_TOKEN; delete process.env.VERCEL_OIDC_TOKEN_FILE;
});
test('Development identity cannot reach exchange', async () => {
  globalThis.__resumeRuntime.token = jwt(undefined, { environment: 'development' });
  await assert.rejects(fetchSheetCsv('profile'), { message: 'WIF_IDENTITY_INVALID' }); assert.equal(calls.length, 0);
});
test('successful mocked production pipeline returns existing string contract', async () => {
  mockFlow(); assert.equal(await fetchSheetCsv('profile'), sheetValuesToCsv(fixture.profile));
  assert.equal(calls.length, 5); assert.ok(calls.every(([url]) => !String(url).includes('docs.google.com')));
});
test('Google rejection after locally plausible claims never falls back to public CSV', async () => {
  mockFlow('sts'); await assert.rejects(fetchSheetCsv('profile'), { message: 'WIF_STS_HTTP_403' });
  assert.equal(calls.length, 2); assert.ok(calls.every(([url]) => !String(url).includes('docs.google.com')));
});
test('four dummy sheets preserve the existing parser and ResumeData contract', async () => {
  mockFlow();
  const authenticated = await buildResumeData();
  // 比較用のCSVはローカルfixtureから作る。旧公開取得コードをテストのために残さない。
  const { parseProfileCsv } = await import('../src/lib/parse-profile-csv.ts');
  const { parseEducationCsv } = await import('../src/lib/parse-education-csv.ts');
  const { parseCareerCsv } = await import('../src/lib/parse-career-csv.ts');
  const { parseCertificationCsv } = await import('../src/lib/parse-certification.ts');
  const expected = {
    profile: parseProfileCsv(sheetValuesToCsv(fixture.profile)),
    education: parseEducationCsv(sheetValuesToCsv(fixture.education)),
    career: parseCareerCsv(sheetValuesToCsv(fixture.career)),
    certification: parseCertificationCsv(sheetValuesToCsv(fixture.certification)),
  };
  assert.deepEqual(authenticated, expected);
  assert.equal(globalThis.__resumeRuntime.connections, 4);
  const valueCalls = calls.filter(([url]) => String(url).includes('/values/'));
  assert.equal(valueCalls.length, 4);
  for (const key of keys) assert.ok(valueCalls.some(([url]) => decodeURIComponent(url).includes(`'${key}'!`)));
  assert.equal(authenticated.education[0].id, '001');
  assert.equal(authenticated.career[0].team_size, '03');
  assert.equal(authenticated.education[0].summary, 'line1\nline2');
});
for (const key of keys) test(`missing WIF configuration fails closed: ${key}`, async () => {
  delete process.env[`GOOGLE_SHEET_${key.toUpperCase()}_TITLE`];
  await assert.rejects(fetchSheetCsv(key), { message: 'WIF_CONFIG_INVALID' });
  assert.equal(calls.length, 0);
});
test('WIF failure emits neither upstream private response nor logs', async () => {
  const logs = [];
  const originals = { log: console.log, warn: console.warn, error: console.error };
  try {
    for (const name of Object.keys(originals)) console[name] = (...args) => logs.push(args);
    mockFlow('sts');
    await assert.rejects(buildResumeData(), { message: 'WIF_STS_HTTP_403' });
    assert.deepEqual(logs, []);
    assert.ok(calls.every(([url]) => !String(url).includes('docs.google.com')));
  } finally {
    Object.assign(console, originals);
  }
});
