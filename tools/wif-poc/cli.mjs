import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {configFrom,checkToken,EXPECTED,runPoc,safeMessage,SafeError} from './poc.mjs';
// Deliberately no process.env merge, --env-file, SDK, CLI subprocess, or token refresh.
// Ignore all unrelated variables returned by vercel env pull.
try {
  const args = process.argv.slice(2);
  if (!(args.length === 0 || (args.length === 2 && args[0] === '--run' && args[1] === '--confirm-binding-cleanup'))) throw new SafeError('LOCAL','INVALID_ARGUMENTS');
  const config = configFrom(parseEnv(readFileSync(new URL('./.env.config.local',import.meta.url),'utf8')));
  const {VERCEL_OIDC_TOKEN: token} = parseEnv(readFileSync(new URL('../../.env.wif.local',import.meta.url),'utf8'));
  checkToken(token,EXPECTED.sourceAudience,'SOURCE');
  if (args.length === 0) console.log('PREFLIGHT PASS (claims only; no signature verification, no network)');
  else console.log(await runPoc({config,token,confirmBindingCleanup:true}));
} catch(error) {
  console.error(safeMessage(error));
  process.exitCode = 1;
}
