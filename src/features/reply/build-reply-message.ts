// src/features/reply/build-reply-message.ts

import type { ReplyFormValues } from "./types";

export function buildReplyMessage(values: ReplyFormValues): string {
  if (values.selection_result === "passed") {
    return `${values.recipient_name}  様

${values.company}
${values.person} です。

書類選考の結果、ぜひ一度面談の機会を設けたくご連絡いたしました。

【面談候補日】
${values.interview_dates}

${values.passed_note}

ご都合のよい日程がございましたら、ご返信いただけますと幸いです。
何卒よろしくお願いいたします。

【返信用メールアドレス】
${values.email}`;
  }

  if (values.selection_result === "rejected") {
    return `${values.recipient_name}  様

${values.company}
${values.person} です。

このたびはご応募いただき、誠にありがとうございました。
選考の結果、今回はお見送りとさせていただくこととなりました。

【お見送り理由】
${values.rejection_reason}

【課題点・改善するとよい点】
${values.improvement_points}

貴重なお時間をいただき、ありがとうございました。
今後のご活躍をお祈り申し上げます。

【返信用メールアドレス】
${values.email}`;
  }

  return "";
}
