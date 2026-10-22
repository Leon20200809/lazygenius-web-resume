import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { authenticateProduction, fetchPrivateSheetCsv, readWifConfig, type SheetKey } from "./production-wif-core";
import { validResumeSession } from "./resume-session";

/**
 * 司令塔：実行時→ログイン再検証→Production identity→短期SA→4シート→CSV。
 * cacheはReactの同一レンダー内だけ。token/個人データの永続・共有キャッシュは作らない。
 */
const productionContext = cache(async () => {
  await connection(); // ビルド時・静的プリレンダーでは認証もデータ取得も実行しない。
  const cookie = (await cookies()).get("lg_access_granted")?.value;
  if (!validResumeSession(cookie, process.env.LOGIN_COOKIE_SECRET)) throw new Error("RESUME_AUTH_REQUIRED");
  // ローカルのProduction identity取得は未確認。env tokenやCLI資格情報では迂回しない。
  if (process.env.VERCEL !== "1" || process.env.VERCEL_ENV !== "production" || process.env.NODE_ENV !== "production") {
    throw new Error("WIF_PRODUCTION_RUNTIME_REQUIRED");
  }
  const token = (await headers()).get("x-vercel-oidc-token");
  if (!token) throw new Error("WIF_RUNTIME_TOKEN_REQUIRED");
  const config = readWifConfig(process.env);
  const accessToken = await authenticateProduction(token, config);
  return { config, accessToken };
});

export async function fetchProductionSheetCsv(key: SheetKey): Promise<string> {
  const { config, accessToken } = await productionContext();
  return fetchPrivateSheetCsv(key, config, accessToken);
}
