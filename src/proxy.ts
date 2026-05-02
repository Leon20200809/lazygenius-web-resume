// middleware.ts 未ログインなら /login に飛ばす門番
// Cookie があるか見る ⇒ なければ /login へ飛ばす ⇒ あれば通す

import { NextRequest, NextResponse } from "next/server";
// NextRequest: ブラウザから届いた「リクエスト（お願い）」の中身をラップしたオブジェクト
// request.nextUrl: アクセスしようとしているURL（パス名など）を簡単に取得
// request.cookies: ブラウザから送られてきたCookieを読み取ることができる
// NextResponse: サーバーからブラウザへ返す「レスポンス（返事）」を制御するためのクラス
// NextResponse.next(): 「問題なし！そのまま進んでOK」
// NextResponse.redirect(): 「そこはダメ。こっちのページ（/login）へ行って」とブラウザに指示

const COOKIE_NAME = "lg_access_granted";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ログインページ・ログインAPI・Next.js内部ファイルは通す
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const access_cookie = request.cookies.get(COOKIE_NAME);

  // Cookie がなければ /login に飛ばす
  if (!access_cookie) {
    const login_url = new URL("/login", request.url);
    return NextResponse.redirect(login_url);
  }

  // Cookie があれば通す
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};