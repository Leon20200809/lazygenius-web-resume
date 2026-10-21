export const EXPECTED = Object.freeze({
  issuer: 'https://oidc.vercel.com/leon20200809s-projects',
  sourceAudience: 'https://vercel.com/leon20200809s-projects',
  subject: 'owner:leon20200809s-projects:project:lazygenius-web-resume:environment:development',
  sheet: '1amBK2qOd3IUjY5x1ZXN2osQFfp8Wsd3MBc6rvTMQlyQ',
  range: 'WIF_TEST!B2', value: 'WIF_READ_OK',
  scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
});
export class SafeError extends Error {
  constructor(stage, code) { super(`${stage}:${code}`); this.stage = stage; this.code = code; }
}
const fail = (stage, code) => { throw new SafeError(stage, code); };
export function safeMessage(error) {
  return error instanceof SafeError ? error.message : 'LOCAL:UNEXPECTED_ERROR';
}
export function configFrom(env) {
  const number = env.WIF_GCP_PROJECT_NUMBER;
  const project = env.WIF_GCP_PROJECT_ID;
  const email = env.WIF_TEST_SERVICE_ACCOUNT_EMAIL;
  if (!/^[1-9][0-9]{5,19}$/.test(number ?? '')) fail('CONFIG','PROJECT_NUMBER');
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project ?? '')) fail('CONFIG','PROJECT_ID');
  if (email !== `resume-wif-test-reader@${project}.iam.gserviceaccount.com`) fail('CONFIG','DEV_SA_ONLY');
  const resource = `iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/vercel-web-resume-dev/providers/vercel-development`;
  return Object.freeze({ number, project, email, audience: `https://${resource}`, stsAudience: `//${resource}`, sheet: EXPECTED.sheet, range: EXPECTED.range });
}
// Claims checks are safety guards, NOT signature verification. Google STS verifies trust.
export function checkToken(token, audience, stage, now = Date.now()) {
  let claims;
  try {
    if (typeof token !== 'string' || token.length > 32768 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw Error();
    claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch { fail(stage,'MALFORMED_TOKEN'); }
  if (claims?.iss !== EXPECTED.issuer) fail(stage,'ISSUER_MISMATCH');
  if (claims.sub !== EXPECTED.subject) fail(stage,'DEV_SUBJECT_ONLY');
  if (claims.environment !== undefined && claims.environment !== 'development') fail(stage,'DEV_ENVIRONMENT_ONLY');
  if (claims.aud !== audience) fail(stage,'AUDIENCE_MISMATCH');
  if (!Number.isSafeInteger(claims.exp) || claims.exp <= Math.floor(now / 1000) + 60) fail(stage,'TOKEN_EXPIRED_OR_NEAR_EXPIRY');
  if (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > Math.floor(now / 1000))) fail(stage,'TOKEN_NOT_YET_VALID');
}
function validateConfig(config) {
  const canonical = configFrom({WIF_GCP_PROJECT_NUMBER: config?.number, WIF_GCP_PROJECT_ID: config?.project, WIF_TEST_SERVICE_ACCOUNT_EMAIL: config?.email});
  for (const key of ['audience','stsAudience','sheet','range']) if (config[key] !== canonical[key]) fail('CONFIG','TARGET_NOT_ALLOWED');
}
export async function runPoc({config, token, confirmBindingCleanup = false, fetchImpl = globalThis.fetch, now = Date.now()}) {
  validateConfig(config);
  if (confirmBindingCleanup !== true) fail('LOCAL','BINDING_CLEANUP_UNCONFIRMED');
  checkToken(token, EXPECTED.sourceAudience, 'SOURCE', now);
  async function request(stage, url, options) {
    let response;
    try { response = await fetchImpl(url, {...options, redirect:'error', signal:AbortSignal.timeout(15000)}); }
    catch { fail(stage,'NETWORK_OR_REDIRECT_OR_TIMEOUT'); }
    if (!response.ok) {
      const code = response.status === 401 ? 'HTTP_401' : response.status === 403 ? 'HTTP_403' : response.status === 400 ? 'HTTP_400_CHECK_AUDIENCE_OR_TRUST' : response.status === 429 ? 'HTTP_429' : 'HTTP_ERROR';
      fail(stage,code); // Never inspect or print remote error bodies/statusText.
    }
    try { return await response.json(); } catch { fail(stage,'INVALID_JSON'); }
  }
  const json = body => ({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const exchanged = await request('VERCEL_EXCHANGE','https://oidc.vercel.com/~token',json({token,aud:config.audience}));
  checkToken(exchanged?.token,config.audience,'EXCHANGED',now);
  const sts = await request('STS','https://sts.googleapis.com/v1/token',json({
    grant_type:'urn:ietf:params:oauth:grant-type:token-exchange', audience:config.stsAudience,
    requested_token_type:'urn:ietf:params:oauth:token-type:access_token',
    subject_token_type:'urn:ietf:params:oauth:token-type:jwt',subject_token:exchanged.token,
    scope:'https://www.googleapis.com/auth/cloud-platform',
  }));
  if (typeof sts?.access_token !== 'string' || !sts.access_token || typeof sts.token_type !== 'string' || sts.token_type.toLowerCase() !== 'bearer') fail('STS','INVALID_TOKEN_RESPONSE');
  const impersonation = json({scope:[EXPECTED.scope],lifetime:'600s'});
  impersonation.headers.Authorization = `Bearer ${sts.access_token}`;
  const sa = await request('IMPERSONATE',`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.email)}:generateAccessToken`,impersonation);
  if (typeof sa?.accessToken !== 'string' || !sa.accessToken) fail('IMPERSONATE','INVALID_TOKEN_RESPONSE');
  const result = await request('SHEETS',`https://sheets.googleapis.com/v4/spreadsheets/${EXPECTED.sheet}/values/${encodeURIComponent(EXPECTED.range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`,{headers:{Authorization:`Bearer ${sa.accessToken}`}});
  if (!Array.isArray(result?.values) || result.values.length !== 1 || !Array.isArray(result.values[0]) || result.values[0].length !== 1 || result.values[0][0] !== EXPECTED.value) fail('SHEETS','VALUE_MISMATCH');
  return 'PASS WIF_READ_OK';
}
