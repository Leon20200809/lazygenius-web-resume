"use client";

import { useState } from "react";
import { buildReplyMessage } from "@/features/reply/build-reply-message";
import type { ReplyFormValues, SelectionResult } from "@/features/reply/types";

type Props = { recipientName: string; recipientEmail: string };
const fieldClass = "mt-2 w-full rounded-(--radius-m) border border-(--color-border) bg-(--color-surface) px-4 py-3.5 outline-none transition-colors placeholder:text-(--color-muted)/55 focus:border-(--color-accent)";
const labelClass = "text-sm font-semibold";

export function ReplyForm({ recipientName, recipientEmail }: Props) {
  const [selectionResult, setSelectionResult] = useState<SelectionResult>("");
  const [company, setCompany] = useState("");
  const [person, setPerson] = useState("");
  const [email, setEmail] = useState("");
  const [interviewDates, setInterviewDates] = useState("");
  const [passedNote, setPassedNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [improvementPoints, setImprovementPoints] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function generateMessage() {
    setError(""); setNotice(""); setPreviewMessage(""); setIsSent(false);
    if (!company.trim()) return setError("会社名を入力してください。");
    if (!person.trim()) return setError("ご担当者名を入力してください。");
    if (!email.trim()) return setError("返信先メールアドレスを入力してください。");
    if (!selectionResult) return setError("選考結果を選択してください。");
    if (selectionResult === "passed" && !interviewDates.trim()) return setError("面談候補日を入力してください。");
    if (selectionResult === "rejected" && !rejectionReason.trim()) return setError("見送り理由を入力してください。");
    const values: ReplyFormValues = { recipient_name: recipientName, selection_result: selectionResult, company, person, email, interview_dates: interviewDates, passed_note: passedNote, rejection_reason: rejectionReason, improvement_points: improvementPoints };
    setPreviewMessage(buildReplyMessage(values));
  }

  async function copyMessage() {
    if (!previewMessage) return;
    await navigator.clipboard.writeText(previewMessage);
    setNotice("文面をコピーしました。");
  }

  function openMailClient() {
    if (!previewMessage) return setError("先に文面を作成してください。");
    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent("選考結果のご連絡")}&body=${encodeURIComponent(previewMessage)}`;
  }

  async function sendMessage() {
    if (!previewMessage || isSending || isSent) return;
    setIsSending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recruiter_message: previewMessage }) });
      const result = await response.json();
      if (!response.ok) return setError(result.message || "送信できませんでした。");
      setIsSent(true); setNotice("送信しました。ご連絡ありがとうございます。");
    } catch { setError("通信できませんでした。時間をおいて再度お試しください。"); }
    finally { setIsSending(false); }
  }

  return (
    <div className="grid gap-10 py-12 lg:grid-cols-[.38fr_.62fr] lg:gap-16">
      <aside className="lg:sticky lg:top-10 lg:self-start"><p className="eyebrow mb-5">送信までの流れ</p><ol className="space-y-5">{["会社情報と選考結果を入力", "作成された連絡文を確認", "この画面、またはメールソフトから送信"].map((item, index) => <li key={item} className="flex gap-4 border-t border-(--color-border) pt-4 text-sm leading-6"><span className="font-mono text-(--color-accent)">0{index + 1}</span><span>{item}</span></li>)}</ol></aside>
      <section aria-label="選考結果連絡フォーム" className="space-y-10">
        <fieldset><legend className="mb-5 text-xl font-semibold tracking-tight">会社・ご担当者情報</legend><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="company" className={labelClass}>会社名</label><input id="company" value={company} onChange={e => setCompany(e.target.value)} className={fieldClass} autoComplete="organization" /></div><div><label htmlFor="person" className={labelClass}>ご担当者名</label><input id="person" value={person} onChange={e => setPerson(e.target.value)} className={fieldClass} autoComplete="name" /></div><div className="sm:col-span-2"><label htmlFor="email" className={labelClass}>返信先メールアドレス</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={fieldClass} autoComplete="email" /></div></div></fieldset>
        <fieldset><legend className="mb-5 text-xl font-semibold tracking-tight">選考結果</legend><div className="grid gap-3 sm:grid-cols-2">{[["passed", "書類通過・面談日程調整"], ["rejected", "今回は見送り"]].map(([value, label]) => <label key={value} className={`interactive cursor-pointer rounded-(--radius-m) border p-4 ${selectionResult === value ? "border-(--color-accent) bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]" : "border-(--color-border) bg-(--color-surface)"}`}><input type="radio" name="selection_result" value={value} checked={selectionResult === value} onChange={() => setSelectionResult(value as SelectionResult)} className="mr-3 accent-(--color-accent)" />{label}</label>)}</div></fieldset>
        {selectionResult === "passed" && <fieldset className="space-y-5 border-l-2 border-(--color-accent) pl-5"><legend className="mb-5 text-xl font-semibold">面談について</legend><div><label htmlFor="interview_dates" className={labelClass}>面談候補日</label><textarea id="interview_dates" rows={4} value={interviewDates} onChange={e => setInterviewDates(e.target.value)} placeholder="例：9月18日（金）10:00〜12:00" className={fieldClass} /></div><div><label htmlFor="passed_note" className={labelClass}>補足メッセージ</label><textarea id="passed_note" rows={4} value={passedNote} onChange={e => setPassedNote(e.target.value)} className={fieldClass} /></div></fieldset>}
        {selectionResult === "rejected" && <fieldset className="space-y-5 border-l-2 border-(--color-accent) pl-5"><legend className="mb-5 text-xl font-semibold">フィードバック</legend><div><label htmlFor="rejection_reason" className={labelClass}>見送り理由 <span className="text-(--color-danger)">必須</span></label><textarea id="rejection_reason" rows={5} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className={fieldClass} /></div><div><label htmlFor="improvement_points" className={labelClass}>改善するとよい点</label><textarea id="improvement_points" rows={5} value={improvementPoints} onChange={e => setImprovementPoints(e.target.value)} className={fieldClass} /></div></fieldset>}
        <button type="button" onClick={generateMessage} className="interactive w-full cursor-pointer rounded-(--radius-m) bg-(--color-surface-strong) px-5 py-4 font-semibold text-white shadow-(--shadow-m) hover:bg-(--color-accent)">入力内容から連絡文を作成</button>
        <div aria-live="polite">{error && <p role="alert" className="border-l-2 border-(--color-danger) pl-4 text-sm font-medium text-(--color-danger)">{error}</p>}{notice && <p className="border-l-2 border-(--color-success) pl-4 text-sm font-medium text-(--color-success)">{notice}</p>}</div>
        {previewMessage && <section className="rounded-(--radius-l) bg-(--color-surface) p-5 shadow-(--shadow-m) sm:p-8"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">送信内容の確認</h2><button type="button" onClick={copyMessage} className="interactive text-sm font-semibold text-(--color-accent)">コピー</button></div><pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-(--color-muted)">{previewMessage}</pre><div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={sendMessage} disabled={isSending || isSent} className="interactive cursor-pointer rounded-(--radius-m) bg-(--color-accent) px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55">{isSent ? "送信済み" : isSending ? "送信中…" : "この内容で送信"}</button><button type="button" onClick={openMailClient} className="interactive cursor-pointer rounded-(--radius-m) border border-(--color-border) px-5 py-3.5 font-semibold hover:border-(--color-accent)">メールソフトで送る</button></div></section>}
      </section>
    </div>
  );
}
