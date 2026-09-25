"use client";

import { useState } from "react";

export default function ExcelIndirButton() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/export/talepler");
      if (!res.ok) return;
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition") ?? "";
      const match = header.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "outsource-rapor.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {downloading ? "Hazırlanıyor..." : "⭳ Excel Olarak İndir"}
    </button>
  );
}
