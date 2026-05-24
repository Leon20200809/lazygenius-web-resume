// src/app/api/login/route.ts
/**
 * ログインAPIルート
 *
 * 目的：
 * POSTされた password を .env の ACCESS_PASSWORD と比較し、
 * 一致した場合のみ、署名付きログイントークンを Cookie に保存する。
 *
 * 方針：
 * Cookie の値を "true" のような固定値にせず、
 * LOGIN_COOKIE_SECRET を使ってサーバーだけが作れる署名付きトークンにする。
 */

import { NextRequest, NextResponse } from "next/server";

import { getLoginRequestInfo } from "@/lib/get-login-request-info";
import { sendLoginSuccessMail } from "@/lib/send-login-success-mail";

const COOKIE_NAME = "lg_access_granted";
const LOGIN_SESSION_MAX_AGE = 60 * 60 * 2; // 2時間
const TOKEN_PURPOSE = "resume_access";

/**
 * 文字列を Base64URL 形式に変換する
 *
 * 通常の Base64 は Cookie や URL で扱いにくい記号が含まれるため、
 * URL セーフな形式に変換する。
 */
function encodeBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * HMAC-SHA256 で署名を作成する
 *
 * LOGIN_COOKIE_SECRET を知らない人は、同じ署名を作れない。
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

  return Buffer.from(signature)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * ログイン用の署名付きトークンを作成する
 *
 * token = payload.signature
 */
async function createLoginToken(): Promise<string> {
  const login_cookie_secret = process.env.LOGIN_COOKIE_SECRET;

  if (!login_cookie_secret) {
    throw new Error("LOGIN_COOKIE_SECRET が設定されていません");
  }

  const issued_at = Math.floor(Date.now() / 1000);
  const expires_at = issued_at + LOGIN_SESSION_MAX_AGE;

  const payload = encodeBase64Url(
    JSON.stringify({
      purpose: TOKEN_PURPOSE,
      iat: issued_at,
      exp: expires_at
    })
  );

  const signature = await createSignature(payload, login_cookie_secret);

  return `${payload}.${signature}`;
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!process.env.ACCESS_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "ACCESS_PASSWORD が設定されていません" },
      { status: 500 }
    );
  }

  if (password !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "パスワードが違います" },
      { status: 401 }
    );
  }

  const login_info = getLoginRequestInfo(request);

  try {
    await sendLoginSuccessMail(login_info);
  } catch (error) {
    console.error("ログイン成功通知メールの送信に失敗しました:", error);
  }

  const login_token = await createLoginToken();

  const response = NextResponse.json({
    success: true,
    message: "ログイン成功"
  });

  response.cookies.set(COOKIE_NAME, login_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOGIN_SESSION_MAX_AGE
  });

  return response;
}
