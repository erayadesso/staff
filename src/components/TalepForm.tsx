"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StatuNesne } from "@/lib/domain";

interface Department {
  id: string;
  name: string;
  companyName: string;
}

export default function TalepForm({
  departments,
  yeniDurum,
}: {
  departments: Department[];
  yeniDurum: StatuNesne | null;
}) {
  const router = useRouter();
  const firmalar = Array.from(new Set(departments.map((d) => d.companyName)));

  const [firma, setFirma] = useState(firmalar[0] ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [requestOwner, setRequestOwner] = useState("");
  const [candidateType, setCandidateType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [adessoDuration, setAdessoDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const seciliFirmaDepartmanlari = departments.filter((d) => d.companyName === firma);

  function firmaDegis(f: string) {
    setFirma(f);
    if (firmalar.includes(f)) {
      const ilk = departments.find((d) => d.companyName === f);
      setDepartmentId(ilk?.id ?? "");
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
          requestOwner,
          candidateType,
          quantity,
          notes,
          currentNote,
          statusId: yeniDurum?.id || null,
          deadline: deadline || null,
          adessoDuration: adessoDuration || null,
          departmentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Talep oluşturulamadı.");
        return;
      }
      router.push(`/dashboard/talepler/${data.request.id}`);
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
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Seçiniz</option>
            {seciliFirmaDepartmanlari.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
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
            value={requestOwner}
            onChange={(e) => setRequestOwner(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Aday Türü (Rol)</label>
          <input
            required
            value={candidateType}
            onChange={(e) => setCandidateType(e.target.value)}
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
            value={quantity}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setQuantity("");
                return;
              }
              if (/^\d+$/.test(v)) {
                const n = Number(v);
                if (n >= 1 && n <= 100) setQuantity(v);
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
            value={adessoDuration}
            onChange={(e) => setAdessoDuration(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        Durum:{" "}
        <span className="inline-flex rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {yeniDurum?.name || "—"}
        </span>{" "}
        (yeni talepler bu statüyle açılır)
      </div>

      <div>
        <label className={labelClass}>Notlar</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Güncel Not</label>
        <textarea
          rows={2}
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
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
