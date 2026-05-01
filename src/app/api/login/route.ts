// route.ts
// POSTされた password を受け取る ⇒ .env.local の ACCESS_PASSWORD と比較
// 一致したら lg_access_granted Cookie を発行 ⇒ 成功JSONを返す

// NextRequest: ブラウザから届いた「リクエスト（お願い）」の中身をラップしたオブジェクト
// NextResponse: サーバーからブラウザへ返す「レスポンス（返事）」を制御するためのクラス

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "lg_access_granted";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "パスワードが違います" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "ログイン成功",
  });

  response.cookies.set(COOKIE_NAME, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 秒×分×時間×日数
    maxAge: 60 * 60 * 2 * 1,
  });

  return response;
}
