"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StatuNesne } from "@/lib/domain";

interface Birim {
  id: string;
  ad: string;
  firmaAd: string;
}

export default function TalepForm({
  birimler,
  yeniDurum,
}: {
  birimler: Birim[];
  yeniDurum: StatuNesne | null;
}) {
  const router = useRouter();
  const firmalar = Array.from(new Set(birimler.map((b) => b.firmaAd)));

  const [firma, setFirma] = useState(firmalar[0] ?? "");
  const [isBirimiId, setIsBirimiId] = useState("");
  const [talepSahibi, setTalepSahibi] = useState("");
  const [adayTuru, setAdayTuru] = useState("");
  const [adet, setAdet] = useState("");
  const [notlar, setNotlar] = useState("");
  const [guncelNot, setGuncelNot] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adessoSuresi, setAdessoSuresi] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const seciliFirmaBirimleri = birimler.filter((b) => b.firmaAd === firma);

  function firmaDegis(f: string) {
    setFirma(f);
    if (firmalar.includes(f)) {
      const ilk = birimler.find((b) => b.firmaAd === f);
      setIsBirimiId(ilk?.id ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/talepler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talepSahibi,
          adayTuru,
          adet,
          notlar,
          guncelNot,
          durumId: yeniDurum?.id || null,
          deadline: deadline || null,
          adessoSuresi: adessoSuresi || null,
          isBirimiId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Talep oluşturulamadı.");
        return;
      }
      router.push(`/dashboard/talepler/${data.talep.id}`);
      router.refresh();
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const labelClass =
    "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Firma</label>
          <select
            value={firma}
            onChange={(e) => firmaDegis(e.target.value)}
            className={inputClass}
          >
            {firmalar.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>İş Birimi</label>
          <select
            value={isBirimiId}
            onChange={(e) => setIsBirimiId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Seçiniz</option>
            {seciliFirmaBirimleri.map((b) => (
              <option key={b.id} value={b.id}>
                {b.ad}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Talep Sahibi</label>
          <input
            required
            value={talepSahibi}
            onChange={(e) => setTalepSahibi(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Aday Türü (Rol)</label>
          <input
            required
            value={adayTuru}
            onChange={(e) => setAdayTuru(e.target.value)}
            className={inputClass}
            placeholder="Örn. Test Uzmanı"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Adet (1-100)</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={adet}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setAdet("");
                return;
              }
              if (/^\d+$/.test(v)) {
                const n = Number(v);
                if (n >= 1 && n <= 100) setAdet(v);
              }
            }}
            className={inputClass}
            placeholder="1-100"
          />
        </div>
        <div>
          <label className={labelClass}>Müşteri Talep Son Geçerlilik Tarihi</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>adesso Süresi (Hedef Tarih)</label>
          <input
            type="date"
            value={adessoSuresi}
            onChange={(e) => setAdessoSuresi(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        Durum:{" "}
        <span className="inline-flex rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {yeniDurum?.ad || "—"}
        </span>{" "}
        (yeni talepler bu statüyle açılır)
      </div>

      <div>
        <label className={labelClass}>Notlar</label>
        <textarea
          rows={3}
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Güncel Not</label>
        <textarea
          rows={2}
          value={guncelNot}
          onChange={(e) => setGuncelNot(e.target.value)}
          className={inputClass}
        />
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
        {loading ? "Oluşturuluyor..." : "Talebi Oluştur"}
      </button>
    </form>
  );
}
