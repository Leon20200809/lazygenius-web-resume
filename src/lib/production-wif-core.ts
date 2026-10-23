import { sheetValuesToCsv } from "@/lib/sheet-values-to-csv";

export const SHEET_KEYS = ["profile", "education", "career", "certification"] as const;
export type SheetKey = typeof SHEET_KEYS[number];
export type WifConfig = {
  team: string; project: string; projectNumber: string; provider: string;
  serviceAccount: string; spreadsheetId: string;
  sheets: Record<SheetKey, { gid: number; title: string }>;
};
type Json = Record<string, unknown>;
const READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const REQUIRED: Record<SheetKey, string[]> = {
  profile: ["key", "value"],
  education: ["id", "status", "school_name", "faculty", "department", "period_start", "period_end", "category", "summary", "print_summary", "sort"],
  career: ["id", "status", "company", "period_start", "period_end", "employment_type", "role", "industry", "team_size", "summary", "challenge", "result", "achievements", "tech_stack", "print_summary", "sort"],
  certification: ["name", "acquired_date", "note", "sort"],
};
export function sourceMode(value: string | undefined): "public-csv" | "wif" {
  if (value === undefined || value === "public-csv") return "public-csv";
  if (value === "wif") return "wif";
  throw new Error("SHEETS_SOURCE_INVALID");
}
/** 設定はサーバー環境だけから読む。Development SA/poolの転用や任意URLは受け付けない。 */
export function readWifConfig(env: Record<string, string | undefined>): WifConfig {
  const required = (name: string) => { const value = env[name]; if (!value || value !== value.trim()) throw new Error("WIF_CONFIG_INVALID"); return value; };
  const config: WifConfig = {
    team: required("RESUME_WIF_VERCEL_TEAM"), project: required("RESUME_WIF_VERCEL_PROJECT"),
    projectNumber: required("RESUME_WIF_PROJECT_NUMBER"), provider: required("RESUME_WIF_PROVIDER_ID"),
    serviceAccount: required("RESUME_WIF_SERVICE_ACCOUNT"), spreadsheetId: required("GOOGLE_SHEETS_BASE_ID"),
    sheets: Object.fromEntries(SHEET_KEYS.map(key => {
      const gid = required(`GOOGLE_SHEET_${key.toUpperCase()}_GID`);
      if (!/^\d+$/.test(gid) || !Number.isSafeInteger(Number(gid))) throw new Error("WIF_CONFIG_INVALID");
      return [key, { gid: Number(gid), title: required(`GOOGLE_SHEET_${key.toUpperCase()}_TITLE`) }];
    })) as WifConfig["sheets"],
  };
  if (config.team !== "leon20200809s-projects" || config.project !== "lazygenius-web-resume" ||
      !/^\d+$/.test(config.projectNumber) || !/^[a-z][a-z0-9-]{3,31}$/.test(config.provider) ||
      /dev|test/i.test(config.provider) ||
      !/^resume-sheet-reader@[a-z][a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(config.serviceAccount) ||
      !/^[\w-]+$/.test(config.spreadsheetId) ||
      new Set(SHEET_KEYS.map(key => config.sheets[key].gid)).size !== 4 ||
      new Set(SHEET_KEYS.map(key => config.sheets[key].title)).size !== 4) throw new Error("WIF_CONFIG_INVALID");
  return config;
}
export function providerAudience(config: WifConfig): string {
  return `https://iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/vercel-web-resume/providers/${config.provider}`;
}
/** ローカルでJWTを読むのは取り違え検出のみ。署名の信頼検証はVercel交換/GCP STSに任せる。 */
export function validateProductionToken(token: string, config: WifConfig, audience: string, now = Date.now()): void {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts.every(Boolean) || token.length > 30000) throw 0;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (claims.iss !== `https://oidc.vercel.com/${config.team}` || claims.aud !== audience ||
        claims.sub !== `owner:${config.team}:project:${config.project}:environment:production` ||
        claims.environment !== "production" || claims.project !== config.project || claims.owner !== config.team ||
        !Number.isFinite(claims.exp) || claims.exp <= now / 1000 + 60 ||
        !Number.isFinite(claims.iat) || claims.iat > now / 1000 + 30 ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now / 1000))) throw 0;
  } catch { throw new Error("WIF_IDENTITY_INVALID"); }
}
/** 通信は固定先・短いタイムアウト・リダイレクト禁止。上流本文や例外を外へ漏らさない。 */
async function jsonRequest(fetcher: typeof fetch, url: string, init: RequestInit, stage: string): Promise<Json> {
  try {
    const response = await fetcher(url, { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${stage}_HTTP_${response.status === 401 ? "401" : response.status === 403 ? "403" : "ERROR"}`);
    const json: unknown = await response.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) throw 0;
    return json as Json;
  } catch (error) {
    if (error instanceof Error && new RegExp(`^${stage}_HTTP_(401|403|ERROR)$`).test(error.message)) throw error;
    throw new Error(`${stage}_FAILED`);
  }
}
/** 入力は実行時Production OIDCのみ。短期SA tokenを返すが、呼出元も保存・ログ出力しない。 */
export async function authenticateProduction(token: string, config: WifConfig, fetcher: typeof fetch = fetch): Promise<string> {
  validateProductionToken(token, config, `https://vercel.com/${config.team}`);
  const audience = providerAudience(config);
  const exchanged = await jsonRequest(fetcher, "https://oidc.vercel.com/~token", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, aud: audience }),
  }, "WIF_EXCHANGE");
  if (typeof exchanged.token !== "string") throw new Error("WIF_EXCHANGE_FAILED");
  validateProductionToken(exchanged.token, config, audience);
  const sts = await jsonRequest(fetcher, "https://sts.googleapis.com/v1/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ audience: audience.replace("https:", ""), grant_type: "urn:ietf:params:oauth:grant-type:token-exchange", requested_token_type: "urn:ietf:params:oauth:token-type:access_token", subject_token_type: "urn:ietf:params:oauth:token-type:jwt", subject_token: exchanged.token, scope: "https://www.googleapis.com/auth/cloud-platform" }),
  }, "WIF_STS");
  if (typeof sts.access_token !== "string" || !sts.access_token || sts.token_type !== "Bearer") throw new Error("WIF_STS_FAILED");
  const sa = await jsonRequest(fetcher, `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccount)}:generateAccessToken`, {
    method: "POST", headers: { Authorization: `Bearer ${sts.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ scope: [READ_SCOPE], lifetime: "600s" }),
  }, "WIF_SA");
  if (typeof sa.accessToken !== "string" || !sa.accessToken || typeof sa.expireTime !== "string" || !(Date.parse(sa.expireTime) > Date.now() + 60000)) throw new Error("WIF_SA_FAILED");
  return sa.accessToken;
}
/** GIDとタイトルを実metadataで照合してから、明示した4シートだけを文字列CSVにする。 */
export async function fetchPrivateSheetCsv(key: SheetKey, config: WifConfig, accessToken: string, fetcher: typeof fetch = fetch): Promise<string> {
  if (!SHEET_KEYS.includes(key)) throw new Error("SHEETS_TARGET_INVALID");
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const metadata = await jsonRequest(fetcher, `${base}?fields=sheets(properties(sheetId,title,gridProperties))`, { headers }, "SHEETS_METADATA");
  if (!Array.isArray(metadata.sheets)) throw new Error("SHEETS_MAPPING_INVALID");
  const target = config.sheets[key];
  const match = metadata.sheets.filter((sheet: { properties?: Json }) => sheet?.properties?.sheetId === target.gid);
  const props = match[0]?.properties;
  if (match.length !== 1 || props?.title !== target.title) throw new Error("SHEETS_MAPPING_INVALID");
  const grid = props.gridProperties as Json | undefined;
  const rows = grid?.rowCount; const columns = grid?.columnCount;
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || (rows as number) < 1 || (rows as number) > 10000 || (columns as number) < 1 || (columns as number) > 100) throw new Error("SHEETS_SIZE_INVALID");
  // 全グリッドを上限内で取得。固定A1範囲の切り捨てで末尾データが消えるのを防ぐ。
  let column = ""; for (let n = columns as number; n > 0; n = Math.floor((n - 1) / 26)) column = String.fromCharCode(65 + (n - 1) % 26) + column;
  const range = `'${target.title.replaceAll("'", "''")}'!A1:${column}${rows}`;
  const values = await jsonRequest(fetcher, `${base}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`, { headers }, "SHEETS_VALUES");
  if (values.majorDimension !== "ROWS" || !Array.isArray(values.values) || !Array.isArray(values.values[0])) throw new Error("SHEETS_VALUES_INVALID");
  const header = values.values[0];
  if (REQUIRED[key].some(name => !header.includes(name))) throw new Error("SHEETS_HEADER_INVALID");
  try { return sheetValuesToCsv(values.values); } catch { throw new Error("SHEETS_VALUES_INVALID"); }
}
