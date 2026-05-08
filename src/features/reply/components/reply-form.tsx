// reply-form.tsx

"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { buildReplyMessage } from "@/features/reply/build-reply-message";
import type { ReplyFormValues, SelectionResult } from "@/features/reply/types";

type ReplyFormProps = {
  recipientName: string;
  recipientEmail: string;
};

export function ReplyForm({ recipientName, recipientEmail }: ReplyFormProps) {
  // 1. state
  const [selection_result, setSelectionResult] = useState<SelectionResult>("");

  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  const [interview_dates, setInterviewDates] = useState("");
  const [passed_note, setPassedNote] = useState("");
  const [rejection_reason, setRejectionReason] = useState("");
  const [improvement_points, setImprovementPoints] = useState("");

  const [preview_message, setPreviewMessage] = useState("");
  const [copy_message, setCopyMessage] = useState("");

  const [error_message, setErrorMessage] = useState("");

  // 2. 表示用の変数
  let selection_fields: ReactNode = null;

  // 3. 処理関数
  /**
   * 入力内容をもとに、Leon.C 宛の返信文面を生成する。
   *
   * 必須項目が不足している場合は文面を生成せず、
   * エラーメッセージを表示する。
   */
  function handleGenerateMessage() {
    setCopyMessage("");
    setErrorMessage("");
    setPreviewMessage("");

    if (!selection_result) {
      setErrorMessage("選考結果を選択してください。");
      return;
    }

    if (selection_result === "passed" && !interview_dates.trim()) {
      setErrorMessage("書類通過の場合は、面談候補日を入力してください。");
      return;
    }

    if (selection_result === "rejected" && !rejection_reason.trim()) {
      setErrorMessage("お見送りの場合は、お見送り理由を入力してください。");
      return;
    }

    const values: ReplyFormValues = {
      recipient_name: recipientName,
      selection_result,
      company,
      person,
      email,
      interview_dates,
      passed_note,
      rejection_reason,
      improvement_points,
    };

    const message = buildReplyMessage(values);

    setPreviewMessage(message);
  }

  /**
   * 文面コピーボタン処理
   * @returns
   */
  async function handleCopyMessage() {
    if (!preview_message) {
      setCopyMessage("コピーする文面がありません。");
      return;
    }

    await navigator.clipboard.writeText(preview_message);

    setCopyMessage("文面をコピーしました。");
  }

  /**
   * 生成済みの文面を使って、ユーザーのメールソフトを起動する。
   *
   * preview_message が空の場合はメールソフトを起動せず、
   * エラーメッセージを表示する。
   */
  const handleOpenMailClient = () => {
    if (!preview_message) {
      setErrorMessage("先に文面を生成してください。");
      return;
    }

    const subject = "選考結果のご連絡";
    const body = preview_message;

    const mailto_url = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    console.log("件名:", subject);
    console.log("本文:", body);
    console.log("mailto:", mailto_url);

    window.location.href = mailto_url;
  };

  /**
   * fetchでAPIエンドポイントへPOST送信 /api/reply
   */
  const handleApiSend = async () => {
    const reply_api_endpoint = "/api/reply";

    const response = await fetch(reply_api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recruiter_message: preview_message,
      }),
    });
    const result = await response.json();

    console.log(result);
  };

  // 4. 条件分岐でJSXを作る
  // 書類通過：面談候補日 + 補足
  if (selection_result === "passed") {
    selection_fields = (
      <div className="space-y-6 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <div className="space-y-2">
          <label htmlFor="interview_dates" className="text-sm font-bold">
            面談候補日
          </label>
          <textarea
            id="interview_dates"
            name="interview_dates"
            rows={4}
            placeholder={`例：○○月○○日（曜日）10:00〜12:00`}
            value={interview_dates}
            onChange={(e) => setInterviewDates(e.target.value)}
            className="w-full resize-y rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="passed_note" className="text-sm font-bold">
            補足メッセージ
          </label>
          <textarea
            id="passed_note"
            name="passed_note"
            rows={4}
            placeholder="面談形式、所要時間、事前準備などがあればご記入ください。"
            value={passed_note}
            onChange={(e) => setPassedNote(e.target.value)}
            className="w-full resize-y rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>
      </div>
    );
  }

  // お見送り：理由 + 課題点
  if (selection_result === "rejected") {
    selection_fields = (
      <div className="space-y-6 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <div className="space-y-2">
          <label htmlFor="rejection_reason" className="text-sm font-bold">
            お見送り理由
            <span className="ml-2 text-xs text-red-400">必須</span>
          </label>
          <textarea
            id="rejection_reason"
            name="rejection_reason"
            rows={5}
            placeholder="お見送りの理由をご記入ください。"
            value={rejection_reason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full resize-y rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="improvement_points" className="text-sm font-bold">
            課題点・改善するとよい点
          </label>
          <textarea
            id="improvement_points"
            name="improvement_points"
            rows={5}
            placeholder="今後改善するとよい点、足りなかった経験・スキルなどがあればご記入ください。"
            value={improvement_points}
            onChange={(e) => setImprovementPoints(e.target.value)}
            className="w-full resize-y rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>
      </div>
    );
  }

  // 5. 最後に画面へ表示するJSXを返す
  return (
    <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-bold">
            会社名
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="person" className="text-sm font-bold">
            担当者名
          </label>
          <input
            id="person"
            name="person"
            type="text"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold">
            返信用メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-bold">選考結果</p>
        <div className="grid gap-3 md:grid-cols-2">
          {/* ラジオボタン 書類通過・面談日調整 */}
          <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)]">
            <input
              type="radio"
              name="selection_result"
              value="passed"
              checked={selection_result === "passed"}
              onChange={() => setSelectionResult("passed")}
              className="cursor-pointer"
            />
            <span className="cursor-pointer">書類通過・面談日調整</span>
          </label>

          {/* ラジオボタン お見送り */}
          <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)]">
            <input
              type="radio"
              name="selection_result"
              value="rejected"
              checked={selection_result === "rejected"}
              onChange={() => setSelectionResult("rejected")}
              className="cursor-pointer"
            />
            <span className="cursor-pointer">お見送り</span>
          </label>
        </div>
      </div>

      <div className="mt-6">{selection_fields}</div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleGenerateMessage}
          className="w-full cursor-pointer rounded-[var(--radius-m)] bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--color-bg)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          文面を生成する
        </button>

        {error_message && (
          <p className="text-sm font-bold text-red-400">{error_message}</p>
        )}
      </div>

      {/* 生成文面表示 */}
      {preview_message && (
        <div className="mt-6 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-2 text-sm font-bold text-[var(--color-muted)]">
            生成された文面
          </p>

          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
            {preview_message}
          </pre>

          <button
            type="button"
            onClick={handleOpenMailClient}
            className="mt-6 w-full cursor-pointer rounded-[var(--radius-m)] bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--color-bg)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            メールソフトで送る
          </button>

          <button
            type="button"
            onClick={handleApiSend}
            className="mt-6 w-full cursor-pointer rounded-[var(--radius-m)] bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--color-bg)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            APIにデータを送る
          </button>
        </div>
      )}
    </section>
  );
}
