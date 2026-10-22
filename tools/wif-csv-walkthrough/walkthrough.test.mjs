import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { walkthrough, verifyValues } from './walkthrough.mjs';
import { mockValues } from './fixture.mjs';
import { configFrom, EXPECTED, safeMessage } from '../wif-poc/poc.mjs';
const now = 1800000000000;
const config = configFrom({ WIF_GCP_PROJECT_NUMBER: '123456789012', WIF_GCP_PROJECT_ID: 'dummy-test-project', WIF_TEST_SERVICE_ACCOUNT_EMAIL: 'resume-wif-test-reader@dummy-test-project.iam.gserviceaccount.com' });
const jwt = (aud = EXPECTED.sourceAudience, sub = EXPECTED.subject) => `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({iss:EXPECTED.issuer,aud,sub,exp:now/1000+3600})).toString('base64url')}.dummy_signature`;
function mock(values = mockValues(), failure = -1, status = 403) {
  const calls = [];
  const replies = [{token:jwt(config.audience)},{access_token:'dummy_sts',token_type:'Bearer'},{accessToken:'dummy_sa'},{values}];
  return { calls, fetchImpl:async (url, options) => {
    const index = calls.length; calls.push({url,options});
    if(index === failure) return {ok:false,status,json:()=>{throw Error('SECRET_BODY');}};
    return {ok:true,json:async()=>replies[index]};
  }};
}
const live = options => walkthrough({live:true,config,token:jwt(),now,confirmBindingCleanup:true,log:()=>{},...options});
test('default mock: no credentials/no network; all six stages and no cell values', async()=>{
  const logs=[];
  assert.equal(await walkthrough({fetchImpl:()=>{throw Error('NETWORK_FORBIDDEN');},log:x=>logs.push(x)}),'PASS WIF_CSV_WALKTHROUGH');
  assert.equal(logs.filter(x=>x.startsWith('STEP')).length,6);
  assert.ok(logs.includes('CELL G9 PASS ROUND_TRIP'));
  assert.ok(logs.every(x=>!x.includes('大阪')&&!x.includes('dummy_')));
});
test('mocked live: exact four readonly/limited endpoints and formatted row request', async()=>{
  const m=mock(); assert.equal(await live(m),'PASS WIF_CSV_WALKTHROUGH');
  assert.equal(m.calls.length,4);
  const url=new URL(m.calls[3].url);
  assert.equal(url.origin,'https://sheets.googleapis.com');
  assert.equal(decodeURIComponent(url.pathname),`/v4/spreadsheets/${EXPECTED.sheet}/values/WIF_TEST!D2:G10`);
  assert.equal(url.searchParams.get('valueRenderOption'),'FORMATTED_VALUE');
  assert.equal(url.searchParams.get('majorDimension'),'ROWS');
  for(const c of m.calls) {assert.equal(c.options.redirect,'error');assert.ok(c.options.signal);}
});
for(const [r,c] of [[1,0],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1]]) test(`changed dummy cell ${r}:${c} stops before CSV`,async()=>{
  const values=mockValues();values[r][c]='UNEXPECTED_PRIVATE_VALUE'; const logs=[];
  await assert.rejects(live({...mock(values),log:x=>logs.push(x)}),e=>/STEP3:MISMATCH_[DEFG]\d+/.test(safeMessage(e))&&!safeMessage(e).includes('PRIVATE'));
  assert.ok(!logs.some(x=>x.startsWith('STEP4')));
});
for(const [label,change] of [
  ['missing row',v=>v.pop()],['extra row',v=>v.push(['unknown'])],['width',v=>v[1].push('unknown')],
  ['number',v=>v[1][0]=1],['null',v=>v[2][1]=null],['missing interior',v=>delete v[3][1]],['missing nonblank tail',v=>v[4].pop()],
]) test(`${label}: fail closed`,()=>{const v=mockValues();change(v);assert.throws(()=>verifyValues(v),/STEP3:/);});
test('only expected trailing blank may be explicit or omitted',()=>{const a=mockValues(); const b=mockValues();b[7].push('');assert.deepEqual(verifyValues(a),verifyValues(b));});
for(const status of [400,401,403,429,500]) test(`Sheets HTTP ${status}: fixed safe failure`,async()=>{
  await assert.rejects(live(mock(undefined,3,status)),e=>/^SHEETS:HTTP_/.test(safeMessage(e))&&!safeMessage(e).includes('SECRET'));
});
for(const field of ['subject','SA','sheet','audience']) test(`production ${field}: no network`,async()=>{
  const m=mock();const opts={...m};
  if(field==='subject') opts.token=jwt(EXPECTED.sourceAudience,EXPECTED.subject.replace('development','production'));
  else opts.config={...config,...(field==='SA'?{email:'resume-sheet-reader@dummy-test-project.iam.gserviceaccount.com'}:field==='sheet'?{sheet:'production'}:{audience:'production'})};
  await assert.rejects(live(opts));assert.equal(m.calls.length,0);
});
test('unknown exception redacted',()=>assert.equal(safeMessage(Error('PRIVATE_VALUE')),'LOCAL:UNEXPECTED_ERROR'));
test('CLI default is offline even with inherited unwanted credentials; invalid flags are safe',()=>{
  const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[cli],{encoding:'utf8',env:{...process.env,VERCEL_OIDC_TOKEN:'PRIVATE_INHERITED_TOKEN'}});
  assert.equal(result.status,0);assert.match(result.stdout,/PASS WIF_CSV_WALKTHROUGH/);assert.ok(!result.stdout.includes('PRIVATE'));
  const invalid=spawnSync(process.execPath,[cli,'--run'],{encoding:'utf8'});
  assert.equal(invalid.status,1);assert.match(invalid.stderr,/FAIL LOCAL:INVALID_ARGUMENTS/);
});
