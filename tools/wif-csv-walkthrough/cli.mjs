import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { configFrom, safeMessage, SafeError } from '../wif-poc/poc.mjs';
import { walkthrough } from './walkthrough.mjs';

try {
  const args = process.argv.slice(2);
  const live = args.length === 2 && args[0] === '--run' && args[1] === '--confirm-binding-cleanup';
  if (args.length !== 0 && !live) throw new SafeError('LOCAL', 'INVALID_ARGUMENTS');
  // デフォルトは資格ファイルすら読まない。実通信は司令官のWindows上でのみ明示実行する。
  let config, token;
  if (live) {
    config = configFrom(parseEnv(readFileSync(new URL('../wif-poc/.env.config.local', import.meta.url), 'utf8')));
    ({ VERCEL_OIDC_TOKEN: token } = parseEnv(readFileSync(new URL('../../.env.wif.local', import.meta.url), 'utf8')));
  }
  console.log(await walkthrough({ live, config, token, confirmBindingCleanup: live }));
} catch (error) {
  // 生例外・HTTP本文・値・JWTは一切表示しない。想定外も固定コードで停止する。
  console.error(`FAIL ${safeMessage(error)}`);
  process.exitCode = 1;
}
