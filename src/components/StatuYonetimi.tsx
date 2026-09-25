"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Statu {
  id: string;
  ad: string;
}

export default function StatuYonetimi({
  tip,
  baslik,
  statuler,
}: {
  tip: "talep" | "surec";
  baslik: string;
  statuler: Statu[];
}) {
  const router = useRouter();
  const [yeniAd, setYeniAd] = useState("");
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [duzenlemeAdi, setDuzenlemeAdi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniAd.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/statuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip, ad: yeniAd }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Eklenemedi.");
        return;
      }
      setYeniAd("");
      router.refresh();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function guncelle(id: string, ad: string) {
    setError(null);
    const res = await fetch("/api/statuler", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip, id, ad }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Güncellenemedi.");
      return;
    }
    setDuzenlenen(null);
    router.refresh();
  }

  async function sil(id: string, ad: string) {
    if (!confirm(`"${ad}" statüsü silinsin mi?`)) return;
    setError(null);
    const res = await fetch("/api/statuler", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip, id }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Silinemedi.");
      return;
    }
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {baslik} ({statuler.length})
      </h3>

      <ul className="mb-4 space-y-1">
        {statuler.map((s) =>
          duzenlenen === s.id ? (
            <li key={s.id} className="flex items-center gap-2 rounded-lg bg-zinc-50 p-1 dark:bg-zinc-900">
              <input
                value={duzenlemeAdi}
                onChange={(e) => setDuzenlemeAdi(e.target.value)}
                className={inputClass}
                autoFocus
              />
              <button
                onClick={() => guncelle(s.id, duzenlemeAdi)}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Kaydet
              </button>
              <button
                onClick={() => setDuzenlenen(null)}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500"
              >
                Vazgeç
              </button>
            </li>
          ) : (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="text-zinc-800 dark:text-zinc-200">{s.ad}</span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setDuzenlenen(s.id);
                    setDuzenlemeAdi(s.ad);
                  }}
                  className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => sil(s.id, s.ad)}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  Sil
                </button>
              </div>
            </li>
          )
        )}
      </ul>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={ekle} className="flex gap-2">
        <input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          placeholder="Yeni statü adı"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Ekle
        </button>
      </form>
    </section>
  );
}
