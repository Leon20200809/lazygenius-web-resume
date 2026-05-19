/**
 * Webレジュメのログイン成功通知メールを送信する。
 */

import { Resend } from "resend";

import type { LoginRequestInfo } from "@/lib/get-login-request-info";

/**
 * Webレジュメのログイン成功通知メールを送信する。
 *
 * @param login_info - ログイン成功時のリクエスト情報
 * @throws 環境変数 MAIL_FROM / MAIL_TO が未設定の場合にエラー
 */
export async function sendLoginSuccessMail(login_info: LoginRequestInfo) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const mail_from = process.env.MAIL_FROM;
  const mail_to = process.env.MAIL_TO;

  if (!mail_from) {
    throw new Error("MAIL_FROM is not set");
  }

  if (!mail_to) {
    throw new Error("MAIL_TO is not set");
  }

  const mail_body = `
Webレジュメにログインがありました。

日時:
${login_info.logged_at}

IPアドレス:
${login_info.ip_address}

推定デバイス:
${login_info.device_type}

User-Agent:
${login_info.user_agent}

国:
${login_info.country}

地域:
${login_info.region}

都市:
${login_info.city}

タイムゾーン:
${login_info.timezone}
`.trim();

  await resend.emails.send({
    from: mail_from,
    to: mail_to,
    subject: "Webレジュメにログインがありました",
    text: mail_body
  });
}
