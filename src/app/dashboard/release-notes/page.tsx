"use client";

import { useState } from "react";

export default function ReleaseNotesPage() {
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/release-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, title, notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Hata oluştu.");
        return;
      }

      setSuccess("Release note oluşturuldu ✓");
      setVersion("");
      setTitle("");
      setNotes("");
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Release Notes Oluştur
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Yeni versiyon için kullanıcıya gösterilecek notları ekleyin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <label htmlFor="version" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Versiyon
          </label>
          <input
            id="version"
            type="text"
            required
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="Örn: 1.5.0"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Başlık
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Yeni Özellikler ve Düzeltmeler"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notlar (her satır bir madde)
          </label>
          <textarea
            id="notes"
            required
            rows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`- Dashboard'da yetkinlik merkezi bazlı trend grafiği eklendi\n- Talep detayında domain bilgisi gösteriliyor\n- Firma bazında doluluk tablosu yenilendi\n- Başarıyla kapanan taleplerde uyarılar gizleniyor`}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Her satıra bir madde ekleyin. Boş satırlar ayracı olarak kullanılır.
          </p>
        </div>

        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Oluşturuluyor..." : "Release Notes Yayımla"}
        </button>
      </form>
    </div>
  );
}
