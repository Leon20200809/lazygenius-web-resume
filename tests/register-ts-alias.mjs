import { registerHooks } from "node:module";

// テスト時だけ既存の @/ import を解決する。アプリや依存ライブラリは変更しない。
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
