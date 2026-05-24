// src/proxy.ts
/**
 * 未ログインなら /login に飛ばす門番
 *
 * 目的：
 * Cookie が存在するだけでは通さず、
 * サーバーだけが作れる署名付きログイントークンかどうかを検証する。
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "lg_access_granted";
const TOKEN_PURPOSE = "resume_access";

type LoginTokenPayload = {
  purpose: string;
  iat: number;
  exp: number;
};

/**
 * ログイン不要で通してよいパスか判定する
 *
 * ログイン画面・ログインAPI・Next.js内部ファイルなどは、
 * Cookie検証せずに通す。
 */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

/**
 * Base64URL 文字列を通常の文字列へ戻す
 *
 * route.ts 側で Base64URL 形式に変換した payload を、
 * 検証時に JSON 文字列へ戻すために使う。
 */
function decodeBase64Url(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded_base64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );

  return atob(padded_base64);
}

/**
 * ArrayBuffer を Base64URL 形式へ変換する
 *
 * crypto.subtle.sign() の結果を、
 * Cookie 内の署名文字列と比較できる形に変換する。
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * HMAC-SHA256 で署名を作成する
 *
 * route.ts 側で作成した署名と同じ手順で再計算し、
 * Cookie の署名が本物かどうかを確認する。
 */
async function createSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();

  const secret_key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    secret_key,
    encoder.encode(payload)
  );

  return arrayBufferToBase64Url(signature);
}

/**
 * 署名付きログイントークンが有効か判定する
 *
 * 検証内容：
 * - payload.signature の形になっているか
 * - 署名が正しいか
 * - payload を JSON として読めるか
 * - 用途がログイン用か
 * - 有効期限が切れていないか
 */
async function isValidLoginToken(token: string): Promise<boolean> {
  const login_cookie_secret = process.env.LOGIN_COOKIE_SECRET;

  if (!login_cookie_secret) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected_signature = await createSignature(
    payload,
    login_cookie_secret
  );

  if (signature !== expected_signature) {
    return false;
  }

  try {
    const decoded_payload = decodeBase64Url(payload);
    const parsed_payload = JSON.parse(decoded_payload) as LoginTokenPayload;

    if (parsed_payload.purpose !== TOKEN_PURPOSE) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);

    if (parsed_payload.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 無効なアクセスをログイン画面へ戻す
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const login_url = new URL("/login", request.url);

  return NextResponse.redirect(login_url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const access_cookie = request.cookies.get(COOKIE_NAME);

  if (!access_cookie) {
    return redirectToLogin(request);
  }

  const is_valid_token = await isValidLoginToken(access_cookie.value);

  if (!is_valid_token) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
