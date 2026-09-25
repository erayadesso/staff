"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface Talep {
  id: string;
  talepNo: number;
  talepSahibi: string;
  adayTuru: string;
  adet: string | null;
  durumAdi: string;
  firmaAd: string;
  birimAd: string;
  adaylar: { id: string; adayAdi: string; surecDurumAdi: string | null }[];
  adaySayisi: number;
  olusturulmaTarihi: Date;
  deadline: Date | null;
  yasi: number;
  deadlineGectiMi: boolean;
  basariylaKapandi: boolean;
}

export default function TalepFiltreliListesi({
  talepler,
}: {
  talepler: Talep[];
}) {
  const [firma, setFirma] = useState("");
  const [durum, setDurum] = useState("");
  const [arama, setArama] = useState("");
  const [gorunum, setGorunum] = useState<"kart" | "tablo">("kart");

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function fmtDateShort(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    });
  }

  const firmalar = useMemo(
    () => Array.from(new Set(talepler.map((t) => t.firmaAd))).sort(),
    [talepler]
  );
  const durumlar = useMemo(
    () => Array.from(new Set(talepler.map((t) => t.durumAdi))).sort(),
    [talepler]
  );

  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return talepler.filter((t) => {
      if (firma && t.firmaAd !== firma) return false;
      if (durum && t.durumAdi !== durum) return false;
      if (
        q &&
        !(
          t.adayTuru.toLowerCase().includes(q) ||
          t.talepSahibi.toLowerCase().includes(q) ||
          t.birimAd.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [talepler, firma, durum, arama]);

  const toplamAday = filtreli.reduce((s, t) => s + t.adaySayisi, 0);
  const aktifTalep = filtreli.filter((t) => !t.basariylaKapandi).length;

  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  function getDurumRenk(durumAdi: string, basariylaKapandi: boolean, deadlineGectiMi: boolean) {
    if (basariylaKapandi) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    if (deadlineGectiMi) return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
    return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }

  function getProgressBar(adaySayisi: number, adet: string | null) {
    const hedef = parseInt(adet || "0", 10);
    if (!hedef || hedef <= 0) return null;
    const pct = Math.min(Math.round((adaySayisi / hedef) * 100), 100);
    const renk = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500";
    return { pct, renk };
  }

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Toplam Talep</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{filtreli.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Aktif Talep</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{aktifTalep}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Toplam Aday</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{toplamAday}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Kapalı</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {filtreli.filter((t) => t.basariylaKapandi).length}
          </p>
        </div>
      </div>

      {/* Filtre Bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ara (rol, sahip, birim)..."
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
          <select
            value={firma}
            onChange={(e) => setFirma(e.target.value)}
            className={selectClass}
          >
            <option value="">Tüm Firmalar</option>
            {firmalar.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
            className={selectClass}
          >
            <option value="">Tüm Durumlar</option>
            {durumlar.map((d) => (
              <option key={d} value={d}>{d || "—"}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setGorunum("kart")}
              className={`px-3 py-2 text-xs font-medium transition ${
                gorunum === "kart"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Kart
            </button>
            <button
              onClick={() => setGorunum("tablo")}
              className={`px-3 py-2 text-xs font-medium border-l border-zinc-300 dark:border-zinc-700 transition ${
                gorunum === "tablo"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Tablo
            </button>
          </div>
        </div>
      </div>

      {/* Kart Görünümü */}
      {gorunum === "kart" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtreli.map((t) => {
            const prog = getProgressBar(t.adaySayisi, t.adet);
            return (
              <Link
                key={t.id}
                href={`/dashboard/talepler/${t.id}`}
                className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        #{t.talepNo}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${getDurumRenk(t.durumAdi, t.basariylaKapandi, t.deadlineGectiMi)}`}>
                        {t.durumAdi}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {t.adayTuru}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t.firmaAd} · {t.birimAd}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                    {t.yasi} gün
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{t.talepSahibi}</span>
                  {t.adet && <span>Hedef: {t.adet}</span>}
                  {t.deadline && (
                    <span className={t.deadlineGectiMi ? "text-red-600 dark:text-red-400" : ""}>
                      {fmtDateShort(t.deadline)}
                      {t.deadlineGectiMi && " ⚠"}
                    </span>
                  )}
                </div>

                {prog && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      <span>{t.adaySayisi}/{t.adet} aday</span>
                      <span>%{prog.pct}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${prog.renk}`}
                        style={{ width: `${prog.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {t.adaySayisi > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.adaylar.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex max-w-[120px] items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        title={`${a.adayAdi}${a.surecDurumAdi ? ` — ${a.surecDurumAdi}` : ""}`}
                      >
                        {a.adayAdi.split(" ")[0]}
                        {a.surecDurumAdi && <span className="text-zinc-400">·</span>}
                      </span>
                    ))}
                    {t.adaySayisi > 3 && (
                      <span className="text-[10px] text-zinc-400">+{t.adaySayisi - 3}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
          {filtreli.length === 0 && (
            <div className="col-span-full rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Filtreye uyan talep bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {/* Tablo Görünümü */}
      {gorunum === "tablo" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Firma / Birim</th>
                <th className="px-4 py-3 font-medium">Talep Sahibi</th>
                <th className="px-4 py-3 font-medium">Aday Türü</th>
                <th className="px-4 py-3 font-medium">İlerleme</th>
                <th className="px-4 py-3 font-medium">Yaş</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtreli.map((t) => {
                const prog = getProgressBar(t.adaySayisi, t.adet);
                return (
                  <tr
                    key={t.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/talepler/${t.id}`}
                        className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        #{t.talepNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.firmaAd}</p>
                      <p className="text-xs text-zinc-500">{t.birimAd}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.talepSahibi}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.adayTuru}</td>
                    <td className="px-4 py-3">
                      {prog ? (
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            <span>{t.adaySayisi}/{t.adet}</span>
                            <span>%{prog.pct}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${prog.renk}`}
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500 dark:text-zinc-400">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                      t.deadlineGectiMi ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {t.yasi} gün
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {fmtDate(t.deadline)}
                      {t.deadlineGectiMi && (
                        <span className="ml-1 inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                          geçti
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        getDurumRenk(t.durumAdi, t.basariylaKapandi, t.deadlineGectiMi)
                      }`}>
                        {t.basariylaKapandi && "✅ "}
                        {t.durumAdi || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtreli.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Filtreye uyan talep bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
