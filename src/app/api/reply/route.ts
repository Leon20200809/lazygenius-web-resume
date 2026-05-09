// src/app/api/reply/route.ts
/**
 * 採用担当者が入力した返信本文を受け取り、バリデーション後にメール送信するAPIルート
 *
 * ブラウザ側の返信フォームから POST /api/reply を受け取り、
 * recruiter_message を検査した上で、Resend経由でLeon.C宛に送信する。
 */

import { sendRecruiterReplyMail } from "@/lib/send-recruiter-reply-mail";

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

  try {
    await sendRecruiterReplyMail(recruiter_message);
  } catch (error) {
    console.error("メール送信に失敗しました:", error);

    return Response.json(
      {
        message: "メール送信に失敗しました",
      },
      {
        status: 500,
      },
    );
  }

  console.log("メール送信に成功しました");

  return Response.json({
    message: "返信内容を受け取りました",
    data: {
      recruiter_message: recruiter_message,
    },
  });
}
