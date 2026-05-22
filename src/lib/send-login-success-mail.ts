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

  const logged_at_jst = new Date(login_info.logged_at).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const mail_body = `
Webレジュメにログインがありました。

日時:
${logged_at_jst}

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
Asia/Tokyo
`.trim();

  await resend.emails.send({
    from: mail_from,
    to: mail_to,
    subject: "Webレジュメにログインがありました",
    text: mail_body
  });
}
