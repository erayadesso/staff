"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { talepStatuAmblem } from "@/lib/domain";

export default function TalepDurumu({
  talepId,
  mevcutDurum,
  guncelNot,
  talepDurumlari,
}: {
  talepId: string;
  mevcutDurum: string;
  guncelNot: string | null;
  talepDurumlari: string[];
}) {
  const router = useRouter();
  const [durum, setDurum] = useState(mevcutDurum);
  const [not, setNot] = useState(guncelNot ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/talepler/${talepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durumAdi: durum, guncelNot: not }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Talep Durumu
      </h3>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Durum
          </label>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {talepDurumlari.map((d) => (
              <option key={d} value={d}>
                {talepStatuAmblem(d)} {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Güncel Not
          </label>
          <textarea
            rows={3}
            value={not}
            onChange={(e) => setNot(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
