import { createHmac, timingSafeEqual } from "node:crypto";

/** 既存ログインCookieの署名・用途・期限を取得直前にも検証する。値はエラーに載せない。 */
export function validResumeSession(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    const expected = createHmac("sha256", secret).update(parts[0]).digest("base64url");
    const actualBytes = Buffer.from(parts[1]); const expectedBytes = Buffer.from(expected);
    if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return payload.purpose === "resume_access" && Number.isFinite(payload.exp) && payload.exp > now / 1000;
  } catch { return false; }
}
