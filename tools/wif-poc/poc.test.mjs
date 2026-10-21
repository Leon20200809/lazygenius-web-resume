import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {configFrom,EXPECTED,runPoc,safeMessage} from './poc.mjs';
const now = 1800000000000;
const env = {WIF_GCP_PROJECT_NUMBER:'123456789012',WIF_GCP_PROJECT_ID:'dummy-test-project',WIF_TEST_SERVICE_ACCOUNT_EMAIL:'resume-wif-test-reader@dummy-test-project.iam.gserviceaccount.com'};
const config = configFrom(env);
const jwt = (overrides={},aud=EXPECTED.sourceAudience,time=now) => `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({iss:EXPECTED.issuer,sub:EXPECTED.subject,aud,exp:Math.floor(time/1000)+3600,...overrides})).toString('base64url')}.dummy_signature`;
const defaults = () => [{token:jwt({},config.audience)},{access_token:'dummy_sts',token_type:'Bearer'},{accessToken:'dummy_sa'},{values:[[EXPECTED.value]]}];
function mock(responses=defaults()) {
  const calls=[];
  return {calls,fetchImpl:async (url,options)=>{calls.push({url,options}); const entry=responses[calls.length-1]; if(entry instanceof Error) throw entry; return entry?.status ? {ok:false,status:entry.status,json:()=>{throw Error('DO_NOT_READ_SECRET_BODY');}} : {ok:true,json:async()=>entry};}};
}
const run = options => runPoc({config,token:jwt(),confirmBindingCleanup:true,now,...options});
test('exact success, four endpoints, two distinct audiences, readonly final scope, no redirect',async()=>{
  const m=mock(); assert.equal(await run(m),'PASS WIF_READ_OK'); assert.equal(m.calls.length,4);
  assert.equal(m.calls[0].url,'https://oidc.vercel.com/~token');
  assert.equal(JSON.parse(m.calls[0].options.body).aud,config.audience);
  assert.equal(JSON.parse(m.calls[1].options.body).audience,config.stsAudience);
  assert.deepEqual(JSON.parse(m.calls[2].options.body).scope,[EXPECTED.scope]);
  assert.equal(JSON.parse(m.calls[2].options.body).lifetime,'600s');
  assert.ok(m.calls[3].url.includes(EXPECTED.sheet)); assert.ok(m.calls[3].url.includes('WIF_TEST!B2'));
  for(const c of m.calls) {assert.equal(c.options.redirect,'error'); assert.ok(c.options.signal);}
});
for(const [name,overrides,code] of [
  ['production environment claim',{environment:'production'},'DEV_ENVIRONMENT_ONLY'],
  ['production subject',{sub:EXPECTED.subject.replace('development','production')},'DEV_SUBJECT_ONLY'],
  ['wrong audience',{aud:'https://wrong.invalid'},'AUDIENCE_MISMATCH'],
  ['wrong issuer',{iss:'https://wrong.invalid'},'ISSUER_MISMATCH'],
  ['expired token',{exp:now/1000-1},'TOKEN_EXPIRED_OR_NEAR_EXPIRY'],
  ['near expiry',{exp:now/1000+60},'TOKEN_EXPIRED_OR_NEAR_EXPIRY'],
  ['future nbf',{nbf:now/1000+1},'TOKEN_NOT_YET_VALID'],
]) test(`${name}: zero network`,async()=>{const m=mock();await assert.rejects(run({...m,token:jwt(overrides)}),new RegExp(code));assert.equal(m.calls.length,0);});
test('malformed token: zero network',async()=>{const m=mock();await assert.rejects(run({...m,token:'invalid'}),/MALFORMED_TOKEN/);assert.equal(m.calls.length,0);});
test('binding confirmation required: zero network',async()=>{const m=mock();await assert.rejects(run({...m,confirmBindingCleanup:false}),/BINDING_CLEANUP_UNCONFIRMED/);assert.equal(m.calls.length,0);});
for(const [key,value] of [['email','resume-sheet-reader@dummy-test-project.iam.gserviceaccount.com'],['sheet','production-sheet'],['range','A1:Z999'],['audience',config.audience.replace('-dev','')],['stsAudience',config.stsAudience.replace('vercel-development','production')]]) test(`target guard ${key}: zero network`,async()=>{const m=mock();await assert.rejects(run({...m,config:{...config,[key]:value}}),/CONFIG:/);assert.equal(m.calls.length,0);});
test('project/email mismatch rejected',()=>assert.throws(()=>configFrom({...env,WIF_GCP_PROJECT_ID:'other-project'}),/DEV_SA_ONLY/));
for(const [overrides,code] of [[{environment:'production'},'DEV_ENVIRONMENT_ONLY'],[{sub:EXPECTED.subject.replace('development','production')},'DEV_SUBJECT_ONLY'],[{aud:EXPECTED.sourceAudience},'AUDIENCE_MISMATCH'],[{exp:now/1000},'TOKEN_EXPIRED_OR_NEAR_EXPIRY']]) test(`exchanged token ${code}: stops before STS`,async()=>{const m=mock([{token:jwt(overrides,config.audience)}]);await assert.rejects(run(m),new RegExp(code));assert.equal(m.calls.length,1);});
for(const stageIndex of [0,1,2,3]) for(const status of [400,401,403,429,500]) test(`stage ${stageIndex} HTTP ${status}: sanitized and stops`,async()=>{const responses=defaults();responses[stageIndex]={status};const m=mock(responses);await assert.rejects(run(m),e=>{assert.match(safeMessage(e),/HTTP_/);assert.ok(!safeMessage(e).includes('dummy'));return true;});assert.equal(m.calls.length,stageIndex+1);});
test('network exception with token is sanitized',async()=>{const m=mock([Error('secret_token_do_not_log')]);await assert.rejects(run(m),e=>safeMessage(e)==='VERCEL_EXCHANGE:NETWORK_OR_REDIRECT_OR_TIMEOUT');});
test('malformed JSON is sanitized',async()=>{await assert.rejects(run({fetchImpl:async()=>({ok:true,json:async()=>{throw Error('secret_response');}})}),e=>safeMessage(e)==='VERCEL_EXCHANGE:INVALID_JSON');});
for(const value of [undefined,[],[['WIF_READ_OK ']],[[EXPECTED.value,'other']],[[EXPECTED.value],['extra']]]) test('wrong Sheets shape/value never passes',async()=>{const r=defaults();r[3]={values:value};await assert.rejects(run(mock(r)),/VALUE_MISMATCH/);});
test('unknown exception never echoed',()=>assert.equal(safeMessage(Error('secret_token')),'LOCAL:UNEXPECTED_ERROR'));
test('CLI uses explicit token file, not inherited process.env; preflight offline; no credential printing',()=>{
  const temp=mkdtempSync(join(tmpdir(),'wif-dummy-'));
  try {
    const dir=join(temp,'tools','wif-poc');mkdirSync(dir,{recursive:true});
    for(const file of ['poc.mjs','cli.mjs']) copyFileSync(new URL(file,import.meta.url),join(dir,file));
    writeFileSync(join(dir,'.env.config.local'),Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n'));
    const localToken=jwt({},EXPECTED.sourceAudience,Date.now());
    writeFileSync(join(temp,'.env.wif.local'),`VERCEL_OIDC_TOKEN="${localToken}"\nUNRELATED_SECRET=do_not_print\n`);
    const result=spawnSync(process.execPath,[join(dir,'cli.mjs')],{encoding:'utf8',env:{...process.env,VERCEL_OIDC_TOKEN:'inherited_production_token',WIF_TEST_SERVICE_ACCOUNT_EMAIL:'production'}});
    assert.equal(result.status,0);assert.match(result.stdout,/PREFLIGHT PASS/);assert.equal(result.stderr,'');assert.ok(!result.stdout.includes(localToken));
    const invalid=spawnSync(process.execPath,[join(dir,'cli.mjs'),'--run'],{encoding:'utf8'});
    assert.equal(invalid.status,1);assert.match(invalid.stderr,/INVALID_ARGUMENTS/);
  } finally {rmSync(temp,{recursive:true,force:true});}
});
for(const [index,response,code] of [[0,{},'MALFORMED_TOKEN'],[1,{access_token:'dummy',token_type:17},'INVALID_TOKEN_RESPONSE'],[1,{},'INVALID_TOKEN_RESPONSE'],[2,{},'INVALID_TOKEN_RESPONSE']]) test(`invalid auth response stage ${index}: sanitized stop`,async()=>{const r=defaults();r[index]=response;const m=mock(r);await assert.rejects(run(m),new RegExp(code));assert.equal(m.calls.length,index+1);});
