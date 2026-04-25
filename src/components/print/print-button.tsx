// print-button.tsx

"use client";

export function PrintButton() {
  const handle_click = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handle_click}
      className="cursor-pointer fixed right-4 top-4 z-50 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow print:hidden hover:bg-zinc-700 transition-colors"
    >
      PDF保存 / 印刷
    </button>
  );
}
