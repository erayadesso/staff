"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TalepSecenek {
  id: string;
  talepNo: number;
  firmaAd: string;
  adayTuru: string;
}

export default function AdayBagla({
  adayId,
  talepler,
}: {
  adayId: string;
  talepler: TalepSecenek[];
}) {
  const router = useRouter();
  const [talepId, setTalepId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleBagla() {
    if (!talepId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/adaylar/${adayId}/bagla`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talepId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={talepId}
        onChange={(e) => setTalepId(e.target.value)}
        className="max-w-[260px] rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <option value="">Talep seç...</option>
        {talepler.map((t) => (
          <option key={t.id} value={t.id}>
            #{t.talepNo} · {t.firmaAd} · {t.adayTuru}
          </option>
        ))}
      </select>
      <button
        onClick={handleBagla}
        disabled={saving || !talepId}
        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "..." : "Bağla"}
      </button>
    </div>
  );
}
