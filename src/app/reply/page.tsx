import { ReplyForm } from "@/features/reply/components/reply-form";
import Link from "next/link";

export default function ReplyPage() {
  return (
    <main id="main-content" className="min-h-dvh px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-14"><Link href="/" className="interactive text-sm font-semibold">← ホーム</Link></nav>
        <header className="grid gap-8 border-b border-(--color-text) pb-12 lg:grid-cols-[.65fr_.35fr] lg:items-end">
          <div><p className="eyebrow mb-4">Selection reply</p><h1 className="text-balance text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[.92] tracking-[-.065em]">選考結果の<br /><span className="text-(--color-accent)">ご連絡</span></h1></div>
          <p className="max-w-[48ch] text-pretty leading-7 text-(--color-muted)">会社情報と選考結果を入力すると、Leon.C宛ての連絡文を作成します。送信前に内容を確認できます。</p>
        </header>
        <ReplyForm recipientName="Leon.C" recipientEmail="info@lazygenius.dev" />
      </div>
    </main>
  );
}
