"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Aday {
  id: string;
  adayAdi: string;
  source: string | null;
  surecDurumAdi: string | null;
  domain: string | null;
  adayCost: string | null;
  iseBaslamaTarihi: Date | null;
  talepDetaylari: string | null;
  createdAt: Date;
}

function extractCost(value: string): { amount: string; currency: string } {
  const match = value.match(/^([€₺$])(.+)$/);
  if (match) return { amount: match[2], currency: match[1] };
  return { amount: value || "", currency: "₺" };
}

export default function AdayRow({
  aday,
  surecDurumlari,
}: {
  aday: Aday;
  surecDurumlari: string[];
}) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [adayAdi, setAdayAdi] = useState(aday.adayAdi);
  const [surecDurumAdi, setSurecDurumAdi] = useState(aday.surecDurumAdi ?? "");
  const [source, setSource] = useState(aday.source ?? "");
  const [currency, setCurrency] = useState("₺");
  const [rawCost, setRawCost] = useState("");
  const [iseBaslamaTarihi, setIseBaslamaTarihi] = useState(
    aday.iseBaslamaTarihi
      ? new Date(aday.iseBaslamaTarihi).toISOString().split("T")[0]
      : ""
  );
  const [saving, setSaving] = useState(false);

  const initialCost = aday.adayCost || "";
  const { amount: initialAmount, currency: initialCurrency } = extractCost(
    initialCost
  );
  const initialName = aday.adayAdi;

  function formatPriceInput(value: string): string {
    const nums = value.replace(/[^0-9.,]/g, "");
    const parts = nums.split(/[,.]/);
    if (parts.length > 2) return nums.slice(0, -1);
    const intPart = parts[0];
    const decPart = parts[1] ? parts[1].slice(0, 2) : "";
    return intPart + (decPart ? "." + decPart : "");
  }

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function openEdit() {
    setAdayAdi(aday.adayAdi);
    setSurecDurumAdi(aday.surecDurumAdi ?? "");
    setSource(aday.source ?? "");
    setCurrency(initialCurrency);
    setRawCost(initialAmount);
    setIseBaslamaTarihi(
      aday.iseBaslamaTarihi
        ? new Date(aday.iseBaslamaTarihi).toISOString().split("T")[0]
        : ""
    );
    setEditMode(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const fullCost = rawCost.trim() ? `${currency}${rawCost.trim()}` : null;
      await fetch(`/api/adaylar/${aday.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adayAdi,
          surecDurumAdi,
          source,
          adayCost: fullCost,
          iseBaslamaTarihi: iseBaslamaTarihi || null,
        }),
      });
      setEditMode(false);
      router.refresh();
    } catch {
      // hata
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setAdayAdi(initialName);
    setSurecDurumAdi(aday.surecDurumAdi ?? "");
    setSource(aday.source ?? "");
    setCurrency(initialCurrency);
    setRawCost(initialAmount);
    setIseBaslamaTarihi(
      aday.iseBaslamaTarihi
        ? new Date(aday.iseBaslamaTarihi).toISOString().split("T")[0]
        : ""
    );
    setEditMode(false);
  }

  async function handleDelete() {
    if (!confirm(`${aday.adayAdi} adayı silinsin mi?`)) return;
    await fetch(`/api/adaylar/${aday.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {aday.adayAdi}
          </p>
          {!editMode && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              { aday.domain && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800 dark:text-zinc-300">
                  {aday.domain}
                </span>
              )}
              {aday.source && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800 dark:text-zinc-300">
                  {aday.source}
                </span>
              )}
              {aday.surecDurumAdi && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {aday.surecDurumAdi}
                </span>
              )}
              {aday.adayCost && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {aday.adayCost}
                </span>
              )}
              {aday.iseBaslamaTarihi && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  İşe Başlama: {fmtDate(aday.iseBaslamaTarihi)}
                </span>
              )}
              <span className="text-zinc-400">
                Kayıt: {fmtDate(aday.createdAt)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <>
              <button
                onClick={openEdit}
                className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800"
                title="Düzenle"
              >
                Düzenle
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                title="Sil"
              >
                Sil
              </button>
            </>
          )}
          {editMode && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              >
                İptal
              </button>
            </>
          )}
        </div>
      </div>

      {editMode && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Ad Soyad
              </label>
              <input
                value={adayAdi}
                onChange={(e) => setAdayAdi(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Süreç Durumu
              </label>
              <select
                value={surecDurumAdi}
                onChange={(e) => setSurecDurumAdi(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Seçiniz</option>
                {surecDurumlari.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Source
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Ücret Beklentisi
              </label>
              <div className="flex rounded-lg border border-zinc-300 bg-white overflow-hidden focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rawCost}
                  onChange={(e) => setRawCost(formatPriceInput(e.target.value))}
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
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                İşe Başlama Tarihi
              </label>
              <input
                type="date"
                value={iseBaslamaTarihi}
                onChange={(e) => setIseBaslamaTarihi(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
