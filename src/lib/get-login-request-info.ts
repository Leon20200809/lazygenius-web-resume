// src/lib/get-login-request-info.ts

/**
 * ログイン成功時のリクエスト情報を取得・整形するユーティリティ。
 */

import type { NextRequest } from "next/server";

export type LoginRequestInfo = {
  logged_at: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
};

/**
 * User-Agentからデバイス種別を推定する。
 *
 * @param user_agent - ブラウザから送られてくるUser-Agent文字列
 * @returns desktop / mobile / tablet / unknown のいずれか
 */
function detectDeviceType(user_agent: string) {
  const ua = user_agent.toLowerCase();

  if (ua === "unknown") {
    return "unknown";
  }

  if (ua.includes("ipad") || ua.includes("tablet")) {
    return "tablet";
  }

  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("android")
  ) {
    return "mobile";
  }

  return "desktop";
}

/**
 * ログイン成功時のリクエスト情報を取得する。
 *
 * @param request - Next.jsのAPIルートに届いたリクエスト
 * @returns IPアドレス・User-Agent・地域情報などのログ用データ
 */
export function getLoginRequestInfo(request: NextRequest): LoginRequestInfo {
  const forwarded_for = request.headers.get("x-forwarded-for");
  const ip_address = forwarded_for?.split(",")[0]?.trim() || "unknown";
  const user_agent = request.headers.get("user-agent") || "unknown";

  return {
    logged_at: new Date().toISOString(),
    ip_address,
    user_agent,
    device_type: detectDeviceType(user_agent),
    country: request.headers.get("x-vercel-ip-country") || "unknown",
    region: request.headers.get("x-vercel-ip-country-region") || "unknown",
    city: request.headers.get("x-vercel-ip-city") || "unknown",
    timezone: request.headers.get("x-vercel-ip-timezone") || "unknown"
  };
}
