// send-recruiter-reply-mail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 採用担当者からの返信メールを送信する
 * 
 * @param {string} recruiter_message - 送信するメール本文
 * @throws {Error} 環境変数 (MAIL_FROM, MAIL_TO) が設定されていない場合にスロー
 * @returns {Promise<void>}
 */
export async function sendRecruiterReplyMail(recruiter_message: string) {
  const mail_from = process.env.MAIL_FROM;
  const mail_to = process.env.MAIL_TO;

  if (!mail_from) {
    throw new Error("MAIL_FROM is not set");
  }

  if (!mail_to) {
    throw new Error("MAIL_TO is not set");
  }

  await resend.emails.send({
    from: mail_from,
    to: mail_to,
    subject: "Webレジュメから返信が届きました",
    text: recruiter_message,
  });
}