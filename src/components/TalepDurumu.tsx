"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { talepStatuAmblem, type StatuNesne } from "@/lib/domain";

export default function TalepDurumu({
  requestId,
  statusId,
  currentNote,
  requestStatuses,
}: {
  requestId: string;
  statusId: string | null;
  currentNote: string | null;
  requestStatuses: StatuNesne[];
}) {
  const router = useRouter();
  const [durum, setDurum] = useState(statusId ?? "");
  const [not, setNot] = useState(currentNote ?? "");
  const [saving, setSaving] = useState(false);
  const prevStatus = useRef(durum);

  async function save() {
    if (saving) return;
    if (!durum) return;

    setSaving(true);
    prevStatus.current = durum;

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: durum, currentNote: not }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDurum(prevStatus.current);
        setNot(currentNote ?? "");
        toast.error(data.error ?? "Durum güncellenemedi.");
        return;
      }

      toast.success("Durum güncellendi.");
      router.refresh();
    } catch {
      setDurum(prevStatus.current);
      setNot(currentNote ?? "");
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
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
            disabled={saving}
            className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${saving ? "opacity-50 cursor-wait" : ""}`}
          >
            {requestStatuses.map((d) => (
              <option key={d.id} value={d.id ?? ""}>
                {talepStatuAmblem(d)} {d.name}
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
            disabled={saving}
            className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${saving ? "opacity-50 cursor-wait" : ""}`}
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "Güncelleniyor..." : "Durumu Güncelle"}
        </button>
      </div>
    </div>
  );
}
