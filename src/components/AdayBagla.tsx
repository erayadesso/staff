"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TalepSecenek {
  id: string;
  requestNo: number;
  companyName: string;
  candidateType: string;
}

export default function AdayBagla({
  candidateId,
  requests,
}: {
  candidateId: string;
  requests: TalepSecenek[];
}) {
  const router = useRouter();
  const [requestId, setRequestId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleBagla() {
    if (!requestId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/bind`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
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
        value={requestId}
        onChange={(e) => setRequestId(e.target.value)}
        className="max-w-[260px] rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <option value="">Talep seç...</option>
        {requests.map((r) => (
          <option key={r.id} value={r.id}>
            #{r.requestNo} · {r.companyName} · {r.candidateType}
          </option>
        ))}
      </select>
      <button
        onClick={handleBagla}
        disabled={saving || !requestId}
        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "..." : "Bağla"}
      </button>
    </div>
  );
}
