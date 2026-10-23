import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// このローダーはオフライン試験専用。本番のモジュール解決や認証は変更しない。
const modules = {
  'server-only': 'export {};',
  react: 'export const cache = fn => fn;',
  'next/headers': `export async function cookies() { return { get: name => globalThis.__resumeRuntime.cookie && name === 'lg_access_granted' ? { value: globalThis.__resumeRuntime.cookie } : undefined }; }
    export async function headers() { return { get: name => name === 'x-vercel-oidc-token' ? globalThis.__resumeRuntime.token : null }; }`,
  'next/server': 'export async function connection() { globalThis.__resumeRuntime.connections++; }',
};
registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(modules, specifier)) return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    if (specifier.startsWith('@/')) return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier.startsWith('./') && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
