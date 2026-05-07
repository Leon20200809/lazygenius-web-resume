"use client";

// src/app/reply/page.tsx

import { useState } from "react";
import type { ReactNode } from "react";

import { buildReplyMessage } from "@/features/reply/build-reply-message";
import type { ReplyFormValues, SelectionResult } from "@/features/reply/types";

import { ReplyForm } from "@/features/reply/components/reply-form";

export default function ReplyPage() {
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

  let selection_fields: ReactNode = null;

  {
    /* 書類通過：面談候補日 + 補足 */
  }
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

  {
    /* お見送り：理由 + 課題点 */
  }
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

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* ヘッダー */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Selection Reply
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            選考結果連絡フォーム
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
            書類選考の結果、面談日程のご相談、お見送りのご連絡を簡単に作成できます。
            入力内容をもとに、Leon.C 宛の連絡文面を生成します。
          </p>
        </header>

        {/* フォームカード */}
        <ReplyForm recipientName="Leon.C"/>

        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <form className="space-y-6">
            {/* 会社名 */}
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-bold">
                会社名
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="例：株式会社〇〇"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </div>

            {/* 担当者名 */}
            <div className="space-y-2">
              <label htmlFor="person" className="text-sm font-bold">
                ご担当者名
              </label>
              <input
                id="person"
                name="person"
                type="text"
                placeholder="例：山田 太郎"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </div>

            {/* 返信用メールアドレス */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold">
                返信用メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="例：recruit@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </div>

            {/* 選考結果 */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold">選考結果</legend>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition hover:border-[var(--color-accent)]">
                  <input
                    type="radio"
                    name="selection_result"
                    value="passed"
                    checked={selection_result === "passed"}
                    onChange={() => setSelectionResult("passed")}
                  />
                  <span>書類通過・面談日程調整</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 transition hover:border-[var(--color-accent)]">
                  <input
                    type="radio"
                    name="selection_result"
                    value="rejected"
                    checked={selection_result === "rejected"}
                    onChange={() => setSelectionResult("rejected")}
                  />
                  <span>お見送り</span>
                </label>
              </div>

              {!selection_result && (
                <p className="text-xs text-[var(--color-muted)]">
                  選考結果を選択すると、必要な入力欄が表示されます。
                </p>
              )}
            </fieldset>

            {/* 書類通過 or お見送り */}
            {selection_fields}

            {/* エラーメッセージ */}
            {error_message && (
              <p role="alert" className="text-sm font-bold text-red-400">
                {error_message}
              </p>
            )}

            {/* 文面生成ボタン */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateMessage}
                className="w-full rounded-[var(--radius-l)] bg-[var(--color-accent)] px-6 py-4 font-bold text-slate-950 shadow-[var(--shadow-m)] transition duration-[var(--dur)] ease-[var(--ease)] hover:bg-[var(--color-accent-hover)] hover:brightness-110 active:scale-[0.98]"
              >
                文面を生成する
              </button>
            </div>
          </form>
        </section>

        {/* プレビュー枠 */}
        <section className="rounded-[var(--radius-l)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-m)]">
          <h2 className="mb-4 text-xl font-bold">生成文面プレビュー</h2>

          <div className="rounded-[var(--radius-m)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-relaxed text-[var(--color-muted)]">
            {preview_message ? (
              <pre className="whitespace-pre-wrap font-sans text-[var(--color-text)]">
                {preview_message}
              </pre>
            ) : (
              <p>入力内容をもとに、ここへ連絡文面を表示します。</p>
            )}
          </div>

          {/* コピーボタン */}
          {preview_message && (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="rounded-[var(--radius-m)] border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface)] active:scale-[0.98]"
              >
                文面をコピーする
              </button>

              {copy_message && (
                <p className="text-sm text-[var(--color-accent)]">
                  {copy_message}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );

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
      recipient_name: "profile.name",
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

  // 文面コピーボタン
  async function handleCopyMessage() {
    if (!preview_message) {
      setCopyMessage("コピーする文面がありません。");
      return;
    }

    await navigator.clipboard.writeText(preview_message);

    setCopyMessage("文面をコピーしました。");
  }
}
