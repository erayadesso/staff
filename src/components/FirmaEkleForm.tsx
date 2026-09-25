"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FirmaEkleForm() {
  const router = useRouter();
  const [firmaAd, setFirmaAd] = useState("");
  const [birimAd, setBirimAd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firmaAd.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/firmalar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmaAd, birimAd: birimAd || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Eklenemedi.");
        return;
      }
      setFirmaAd("");
      setBirimAd("");
      router.refresh();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Firma Adı *
        </label>
        <input
          required
          value={firmaAd}
          onChange={(e) => setFirmaAd(e.target.value)}
          className={inputClass}
          placeholder="Örn. KFT"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          İş Birimi (opsiyonel)
        </label>
        <input
          value={birimAd}
          onChange={(e) => setBirimAd(e.target.value)}
          className={inputClass}
          placeholder="Örn. KFT - Mobil Çözümler"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Ekleniyor..." : "Firma Ekle"}
      </button>
    </form>
  );
}
