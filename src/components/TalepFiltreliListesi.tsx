"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TalepStatuBadge from "@/components/TalepStatuBadge";
import { talepStatuRenk } from "@/lib/domain";

interface Talep {
  id: string;
  talepNo: number;
  talepSahibi: string;
  adayTuru: string;
  adet: string | null;
  durumAdi: string;
  firmaAd: string;
  firmaLogo: string | null;
  birimAd: string;
  adaylar: { id: string; adayAdi: string; surecDurumAdi: string | null; iseBaslamaTarihi: Date | null }[];
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
  const [seciliDurumlar, setSeciliDurumlar] = useState<string[]>([]);
  const [arama, setArama] = useState("");
  const [gorunum, setGorunum] = useState<"kart" | "tablo">("kart");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

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
  // Durum adı -> sayı haritasını tek geçişte hesapla (badge adedi ve filtre için)
  const durumSayilari = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of talepler) {
      map.set(t.durumAdi, (map.get(t.durumAdi) ?? 0) + 1);
    }
    return map;
  }, [talepler]);

  const durumlar = useMemo(
    () => Array.from(durumSayilari.keys()).sort(),
    [durumSayilari]
  );

  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return talepler.filter((t) => {
      if (firma && t.firmaAd !== firma) return false;
      if (seciliDurumlar.length > 0 && !seciliDurumlar.includes(t.durumAdi))
        return false;
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
  }, [talepler, firma, seciliDurumlar, arama]);

  const toplamAday = filtreli.reduce((s, t) => s + t.adaySayisi, 0);
  const aktifTalep = filtreli.filter((t) => !t.basariylaKapandi).length;

  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  function getProgressBar(adaySayisi: number, adet: string | null) {
    const hedef = parseInt(adet || "0", 10);
    if (!hedef || hedef <= 0) return null;
    const pct = Math.min(Math.round((adaySayisi / hedef) * 100), 100);
    const renk = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500";
    return { pct, renk };
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function getSortIndicator(column: string) {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  const siraliTalepler = useMemo(() => {
    let sonuc = [...filtreli];
    if (sortColumn && sortDirection) {
      sonuc.sort((a, b) => {
        let valA: string | number | Date;
        let valB: string | number | Date;

        switch (sortColumn) {
          case "talepNo":
            valA = a.talepNo;
            valB = b.talepNo;
            break;
          case "firmaAd":
            valA = a.firmaAd.toLowerCase();
            valB = b.firmaAd.toLowerCase();
            break;
          case "talepSahibi":
            valA = a.talepSahibi.toLowerCase();
            valB = b.talepSahibi.toLowerCase();
            break;
          case "adayTuru":
            valA = a.adayTuru.toLowerCase();
            valB = b.adayTuru.toLowerCase();
            break;
          case "olusturulmaTarihi":
            valA = a.olusturulmaTarihi.getTime();
            valB = b.olusturulmaTarihi.getTime();
            break;
          case "yasi":
            valA = a.yasi;
            valB = b.yasi;
            break;
          case "deadline":
            valA = a.deadline?.getTime() || 0;
            valB = b.deadline?.getTime() || 0;
            break;
          case "durumAdi":
            valA = a.durumAdi.toLowerCase();
            valB = b.durumAdi.toLowerCase();
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sonuc;
  }, [filtreli, sortColumn, sortDirection]);

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

        {durumlar.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSeciliDurumlar([])}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                seciliDurumlar.length === 0
                  ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                  : "bg-white text-zinc-600 ring-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              Tümü
            </button>
            {durumlar.map((d) => {
              const secili = seciliDurumlar.includes(d);
              const renk = talepStatuRenk(d);
              const amblem = d === "Talep Karşılandı" ? "✓" : "";
              return (
                <button
                  key={d}
                  onClick={() =>
                    setSeciliDurumlar((prev) =>
                      secili
                        ? prev.filter((x) => x !== d)
                        : [...prev, d]
                    )
                  }
                  title="Filtrelemek için tıklayın"
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                    secili
                      ? `${renk} ring-2 ring-zinc-900 dark:ring-zinc-100`
                      : "bg-white/60 text-zinc-500 ring-zinc-200 opacity-70 hover:opacity-100 dark:bg-zinc-900/40 dark:text-zinc-400 dark:ring-zinc-800"
                  }`}
                >
                  {amblem && <span aria-hidden>{amblem}</span>}
                  {amblem && " "}
                  {d || "—"}
                  <span className="ml-1 opacity-70">
                    {durumSayilari.get(d)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
                      <TalepStatuBadge durumAdi={t.durumAdi} />
                      {t.deadlineGectiMi && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800"
                          title="Müşteri son geçerlilik tarihi geçti"
                        >
                          ⚠ geçti
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {t.firmaLogo ? (
                        <img
                          src={t.firmaLogo}
                          alt={t.firmaAd}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-5 w-5 shrink-0 rounded object-contain"
                        />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {t.firmaAd.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {t.adayTuru}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {t.firmaAd} · {t.birimAd}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {t.yasi} gün
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1" title="Oluşturulma">
                    <span aria-hidden>📅</span>
                    {fmtDate(t.olusturulmaTarihi)}
                  </span>
                  <span>{t.talepSahibi}</span>
                  {t.adet && <span>Hedef: {t.adet}</span>}
                  {t.deadline && (
                    <span className={t.deadlineGectiMi ? "text-red-600 dark:text-red-400" : ""}>
                      Son: {fmtDateShort(t.deadline)}
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
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Adaylar ({t.adaySayisi})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {t.adaylar.map((a) => (
                        <span
                          key={a.id}
                          className={`inline-flex max-w-[140px] items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                            a.iseBaslamaTarihi
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                          title={`${a.adayAdi}${a.surecDurumAdi ? ` — ${a.surecDurumAdi}` : ""}`}
                        >
                          {a.adayAdi.split(" ")[0]}
                          {a.surecDurumAdi && <span className="text-zinc-400">·</span>}
                        </span>
                      ))}
                    </div>
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
                <th
                  onClick={() => handleSort("talepNo")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  No{getSortIndicator("talepNo")}
                </th>
                <th
                  onClick={() => handleSort("firmaAd")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Firma / Birim{getSortIndicator("firmaAd")}
                </th>
                <th
                  onClick={() => handleSort("talepSahibi")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Talep Sahibi{getSortIndicator("talepSahibi")}
                </th>
                <th
                  onClick={() => handleSort("adayTuru")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Aday Türü{getSortIndicator("adayTuru")}
                </th>
                <th
                  onClick={() => handleSort("olusturulmaTarihi")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Oluşturulma{getSortIndicator("olusturulmaTarihi")}
                </th>
                <th className="px-4 py-3 font-medium">İlerleme</th>
                <th
                  onClick={() => handleSort("yasi")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Yaş{getSortIndicator("yasi")}
                </th>
                <th
                  onClick={() => handleSort("deadline")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Deadline{getSortIndicator("deadline")}
                </th>
                <th
                  onClick={() => handleSort("durumAdi")}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 transition select-none"
                >
                  Durum{getSortIndicator("durumAdi")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {siraliTalepler.map((t) => {
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
                      <div className="flex items-center gap-2">
                        {t.firmaLogo ? (
                          <img
                            src={t.firmaLogo}
                            alt={t.firmaAd}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-6 w-6 shrink-0 rounded object-contain"
                          />
                        ) : (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {t.firmaAd.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.firmaAd}</p>
                          <p className="text-xs text-zinc-500">{t.birimAd}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.talepSahibi}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{t.adayTuru}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                      {fmtDate(t.olusturulmaTarihi)}
                    </td>
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
                      <TalepStatuBadge durumAdi={t.durumAdi} />
                    </td>
                  </tr>
                );
              })}
              {siraliTalepler.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
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
