// src/app/api/reply/route.ts
/**
 * ブラウザ側のフォーム
  ↓ fetchでPOST /api/reply
  ↓ route.ts が受け取る JSONを読む
  ↓ 最低限チェック
  ↓ 今は console.log
  ↓ ブラウザへ「受け取ったぞ」と返す
 */

export async function POST(request: Request) {
  console.log("POSTリクエストを受け取りました");

  const data = await request.json();

  const recruiter_message = data.recruiter_message;

  if (typeof recruiter_message !== "string") {
    return Response.json(
      {
        message: "本文の形式が正しくありません",
      },
      {
        status: 400,
      },
    );
  }

  if (recruiter_message.trim() === "") {
    return Response.json(
      {
        message: "本文が空です",
      },
      {
        status: 400,
      },
    );
  }

  if (recruiter_message.length > 2000) {
    return Response.json(
      {
        message: "本文が長すぎます",
      },
      {
        status: 400,
      },
    );
  }

  console.log("受け取った本文:", recruiter_message);

  return Response.json({
    message: "返信内容を受け取りました",
    data: {
      recruiter_message: recruiter_message,
    },
  });
}