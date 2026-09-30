"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adayStatuRenkSelect, type StatuNesne } from "@/lib/domain";

export default function AdayForm({
  talepId,
  surecDurumlari,
}: {
  talepId: string;
  surecDurumlari: StatuNesne[];
}) {
  const router = useRouter();
  const [adayAdi, setAdayAdi] = useState("");
  const [domain, setDomain] = useState("");
  const [source, setSource] = useState("");
  const [surecDurumId, setSurecDurumId] = useState("");
  const [adayCost, setAdayCost] = useState("");
  const [currency, setCurrency] = useState("₺");
  const [talepDetaylari, setTalepDetaylari] = useState("");
  const [iseBaslamaTarihi, setIseBaslamaTarihi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const value = adayCost.trim();
      const fullCost = value ? `${currency}${value}` : null;
      const res = await fetch("/api/adaylar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talepId,
          adayAdi,
          domain,
          source,
          surecDurumId,
          adayCost: fullCost,
          talepDetaylari,
          iseBaslamaTarihi: iseBaslamaTarihi || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Aday eklenemedi.");
        return;
      }
      setAdayAdi("");
      setDomain("");
      setSource("");
      setSurecDurumId("");
      setAdayCost("");
      setCurrency("₺");
      setTalepDetaylari("");
      setIseBaslamaTarihi("");
      router.refresh();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function formatPriceInput(value: string): string {
    const nums = value.replace(/[^0-9.,]/g, "");
    const parts = nums.split(/[,.]/);
    if (parts.length > 2) return nums.slice(0, -1);
    const intPart = parts[0];
    const decPart = parts[1] ? parts[1].slice(0, 2) : "";
    return intPart + (decPart ? "." + decPart : "");
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const labelClass = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

  const seciliSurec = surecDurumlari.find((d) => d.id === surecDurumId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Aday Adı *</label>
          <input
            required
            value={adayAdi}
            onChange={(e) => setAdayAdi(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Domain</label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={inputClass}
            placeholder="Java, BA, Mobile..."
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputClass}
            placeholder="adessi / adesso / outsource-"
          />
        </div>
        <div>
          <label className={labelClass}>Süreç Durumu</label>
          <select
            value={surecDurumId}
            onChange={(e) => setSurecDurumId(e.target.value)}
            className={`${inputClass} ${seciliSurec ? adayStatuRenkSelect(seciliSurec) : ""}`}
          >
            <option value="">Seçiniz</option>
            {surecDurumlari.map((d) => (
              <option key={d.id} value={d.id ?? ""}>
                {d.ad}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>İşe Başlama</label>
          <input
            type="date"
            value={iseBaslamaTarihi}
            onChange={(e) => setIseBaslamaTarihi(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Ücret Beklentisi</label>
          <div className="flex rounded-lg border border-zinc-300 bg-white overflow-hidden focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <input
              type="text"
              inputMode="decimal"
              value={adayCost}
              onChange={(e) => setAdayCost(formatPriceInput(e.target.value))}
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-100"
              placeholder="0.00"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-2 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <option value="₺">₺</option>
              <option value="€">€</option>
              <option value="$">$</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Talep Detayları</label>
          <input
            value={talepDetaylari}
            onChange={(e) => setTalepDetaylari(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

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
        {loading ? "Ekleniyor..." : "Aday Ekle"}
      </button>
    </form>
  );
}
