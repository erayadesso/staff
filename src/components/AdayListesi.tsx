"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adayStatuRenkSelect } from "@/lib/domain";

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

interface AdayListesiProps {
  adaylar: Aday[];
  surecDurumlari: string[];
  talepId: string;
}

export default function AdayListesi({
  adaylar,
  surecDurumlari,
  talepId,
}: AdayListesiProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<Record<string, { name: string; surecDurum: string; source: string; currency: string; cost: string; iseBas: string; domain: string; talepDetaylari: string }>>({});

  const [newForm, setNewForm] = useState({
    name: "",
    surecDurum: "",
    source: "",
    currency: "₺",
    cost: "",
    iseBas: "",
    domain: "",
    talepDetaylari: "",
  });

  function openEdit(aday: Aday) {
    const { amount, currency } = extractCost(aday.adayCost || "");
    setFormData((prev) => ({
      ...prev,
      [aday.id]: {
        name: aday.adayAdi,
        surecDurum: aday.surecDurumAdi || "",
        source: aday.source || "",
        currency,
        cost: amount,
        iseBas: aday.iseBaslamaTarihi
          ? new Date(aday.iseBaslamaTarihi).toISOString().split("T")[0]
          : "",
        domain: aday.domain || "",
        talepDetaylari: aday.talepDetaylari || "",
      },
    }));
    setEditId(aday.id);
    setShowAdd(false);
  }

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

  async function handleStatusChange(id: string, yeniDurum: string) {
    setSavingStatus(id);
    try {
      await fetch(`/api/adaylar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surecDurumAdi: yeniDurum }),
      });
      router.refresh();
    } catch {
      // hata
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleSave(id: string) {
    if (!formData[id]) return;
    setSaving(true);
    try {
      const d = formData[id];
      const fullCost = d.cost.trim() ? `${d.currency}${d.cost.trim()}` : null;
      await fetch(`/api/adaylar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adayAdi: d.name,
          surecDurumAdi: d.surecDurum,
          source: d.source,
          adayCost: fullCost,
          iseBaslamaTarihi: d.iseBas || null,
          domain: d.domain || null,
          talepDetaylari: d.talepDetaylari || null,
        }),
      });
      setEditId(null);
      router.refresh();
    } catch {
      // hata
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    setSavingNew(true);
    setError(null);
    try {
      const fullCost = newForm.cost.trim() ? `${newForm.currency}${newForm.cost.trim()}` : null;
      const res = await fetch("/api/adaylar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talepId,
          adayAdi: newForm.name,
          domain: newForm.domain || null,
          talepDetaylari: newForm.talepDetaylari || null,
          source: newForm.source || null,
          surecDurumAdi: newForm.surecDurum || null,
          adayCost: fullCost,
          iseBaslamaTarihi: newForm.iseBas || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Aday eklenemedi.");
        return;
      }
      setNewForm({ name: "", surecDurum: "", source: "", currency: "₺", cost: "", iseBas: "", domain: "", talepDetaylari: "" });
      setShowAdd(false);
      router.refresh();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setSavingNew(false);
    }
  }

  async function handleDelete(aday: Aday) {
    if (!confirm(`${aday.adayAdi} adayı silinsin mi?`)) return;
    await fetch(`/api/adaylar/${aday.id}`, { method: "DELETE" });
    router.refresh();
  }

  function updateField(id: string, field: keyof (typeof formData)[string], value: string) {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  const inputClass = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const selectClass = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const costInputClass = "flex rounded-lg border border-zinc-300 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const costInputInner = "flex-1 px-3 py-2 text-sm outline-none bg-transparent text-zinc-900 dark:text-zinc-100";
  const costCurrencySelect = "px-2 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700";

  return (
    <div className="space-y-4">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {adaylar.map((aday) => (
          <div
            key={aday.id}
            className={`space-y-3 py-4 transition ${
              editId === aday.id
                ? "bg-amber-50/50 dark:bg-amber-950/10 rounded-lg -mx-2 px-2"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900/20"
            }`}
          >
            {/* Satır içeriği */}
            {editId !== aday.id && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {aday.adayAdi}
                    </p>
                    {aday.domain && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {aday.domain}
                      </span>
                    )}
                    {aday.source && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {aday.source}
                      </span>
                    )}
                    {aday.adayCost && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {aday.adayCost}
                      </span>
                    )}
                    {aday.iseBaslamaTarihi && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        İşe Başlama: {fmtDate(aday.iseBaslamaTarihi)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <select
                    value={aday.surecDurumAdi || ""}
                    onChange={(e) => handleStatusChange(aday.id, e.target.value)}
                    disabled={savingStatus === aday.id}
                    className={`max-w-[200px] rounded-lg border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 ${adayStatuRenkSelect(
                      aday.surecDurumAdi
                    )}`}
                  >
                    <option value="">—</option>
                    {surecDurumlari.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => openEdit(aday)}
                    className="rounded px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(aday)}
                    className="rounded px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}

            {/* Edit formu */}
            {editId === aday.id && formData[aday.id] && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20 sm:ml-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Ad Soyad
                    </label>
                    <input
                      value={formData[aday.id].name}
                      onChange={(e) => updateField(aday.id, "name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Süreç Durumu
                    </label>
                    <select
                      value={formData[aday.id].surecDurum}
                      onChange={(e) => updateField(aday.id, "surecDurum", e.target.value)}
                      className={selectClass}
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
                      Domain
                    </label>
                    <input
                      value={formData[aday.id].domain}
                      onChange={(e) => updateField(aday.id, "domain", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Source
                    </label>
                    <input
                      value={formData[aday.id].source}
                      onChange={(e) => updateField(aday.id, "source", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Ücret Beklentisi
                    </label>
                    <div className={costInputClass}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData[aday.id].cost}
                        onChange={(e) =>
                          updateField(aday.id, "cost", formatPriceInput(e.target.value))
                        }
                        className={costInputInner}
                        placeholder="0.00"
                      />
                      <select
                        value={formData[aday.id].currency}
                        onChange={(e) => updateField(aday.id, "currency", e.target.value)}
                        className={costCurrencySelect}
                      >
                        <option value="₺">₺</option>
                        <option value="€">€</option>
                        <option value="$">$</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      İşe Başlama Tarihi
                    </label>
                    <input
                      type="date"
                      value={formData[aday.id].iseBas}
                      onChange={(e) => updateField(aday.id, "iseBas", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Talep Detayları
                  </label>
                  <textarea
                    value={formData[aday.id].talepDetaylari}
                    onChange={(e) => updateField(aday.id, "talepDetaylari", e.target.value)}
                    rows={2}
                    className={inputClass + " resize-y"}
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-lg bg-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handleSave(aday.id)}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adaylar.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Henüz aday eklenmemiş.
          </p>
        )}
      </div>

      {/* Yeni Aday Ekle butonu / formu */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-6 py-4 text-sm font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
        >
          <span className="text-lg">＋</span> Yeni Aday Ekle
        </button>
      )}

      {showAdd && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Aday Adı *
              </label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Süreç Durumu
              </label>
              <select
                value={newForm.surecDurum}
                onChange={(e) => setNewForm((p) => ({ ...p, surecDurum: e.target.value }))}
                className={selectClass}
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
                Domain
              </label>
              <input
                value={newForm.domain}
                onChange={(e) => setNewForm((p) => ({ ...p, domain: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Source
              </label>
              <input
                value={newForm.source}
                onChange={(e) => setNewForm((p) => ({ ...p, source: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Ücret Beklentisi
              </label>
              <div className={costInputClass}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newForm.cost}
                  onChange={(e) => setNewForm((p) => ({ ...p, cost: formatPriceInput(e.target.value) }))}
                  className={costInputInner}
                  placeholder="0.00"
                />
                <select
                  value={newForm.currency}
                  onChange={(e) => setNewForm((p) => ({ ...p, currency: e.target.value }))}
                  className={costCurrencySelect}
                >
                  <option value="₺">₺</option>
                  <option value="€">€</option>
                  <option value="$">$</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                İşe Başlama Tarihi
              </label>
              <input
                type="date"
                value={newForm.iseBas}
                onChange={(e) => setNewForm((p) => ({ ...p, iseBas: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Talep Detayları
            </label>
            <textarea
              value={newForm.talepDetaylari}
              onChange={(e) => setNewForm((p) => ({ ...p, talepDetaylari: e.target.value }))}
              rows={2}
              className={inputClass + " resize-y"}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex items-end justify-end gap-2">
            <button
              onClick={() => { setShowAdd(false); setError(null); }}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              İptal
            </button>
            <button
              onClick={handleAdd}
              disabled={savingNew}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {savingNew ? "Ekleniyor..." : "Aday Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
