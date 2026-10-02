import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import ExcelIndirButton from "@/components/ExcelIndirButton";
import TalepStatuBadge from "@/components/TalepStatuBadge";
import { isKapaliDurum, pozisyonYasi, deadlineGecti, statununTonu, isBasariKapatildi } from "@/lib/domain";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

function fmtDateShort(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const bugun = new Date();
  const [talepler, firmalar, adaylar, surecDurumlari] = await Promise.all([
    prisma.talep.findMany({
      include: {
        isBirimi: {
          select: { ad: true, firmaId: true, firma: { select: { ad: true } } },
        },
        durum: { select: { id: true, ad: true, sira: true, ton: true } },
        adaylar: {
          select: {
            id: true,
            adayAdi: true,
            surecDurum: { select: { id: true, ad: true, sira: true, ton: true } },
            iseBaslamaTarihi: true,
          },
        },
        olusturan: { select: { name: true } },
      },
      orderBy: { talepNo: "desc" },
    }),
    prisma.firma.findMany({ orderBy: { ad: "asc" } }),
    prisma.aday.findMany({
      select: {
        surecDurum: { select: { ad: true, sira: true } },
        iseBaslamaTarihi: true,
      },
    }),
    prisma.surecDurumu.findMany({ orderBy: { sira: "asc" } }),
  ]);

  // KPI
  const aktifTalepTonlari = new Set<string>(["yeni", "ic", "dis", "gorsme", "secim", "kabul"]);
  const toplamTalep = talepler.length;
  const aktifTalep = talepler.filter((t) => aktifTalepTonlari.has(statununTonu(t.durum))).length;
  const basariylaKapandiTalep = talepler.filter((t) => {
    const hedef = parseInt(t.adet || "0", 10);
    if (hedef <= 0) return false;
    return t.adaylar.filter((a) => a.surecDurum?.ton === "karsilandi").length >= hedef;
  }).length;
  const kapaliTalep = basariylaKapandiTalep;
  const toplamAday = talepler.reduce((a, t) => a + t.adaylar.length, 0);
  const iseBasanAday = talepler.reduce((a, t) => a + t.adaylar.filter((a) => a.surecDurum?.ton === "karsilandi").length, 0);
  const bekleyenAday = talepler.reduce((a, t) => a + t.adaylar.filter((a) => a.surecDurum?.ton !== "karsilandi").length, 0);

  // Uyarılar
  const gecikmis = talepler.filter((t) => deadlineGecti(t.durum, t.deadline));
  const yaklasan = talepler.filter((t) => {
    if (!t.deadline) return false;
    const kalan = Math.ceil((t.deadline.getTime() - bugun.getTime()) / 86400000);
    return kalan >= 0 && kalan <= 7;
  });

  // Firma analiz
  const firmaAnaliz = firmalar.map((f) => {
    const ft = talepler.filter((t) => t.isBirimi.firmaId === f.id);
    const aktif = ft.filter((t) => !isKapaliDurum(t.durum?.ad || ""));
    const toplamHedef = ft.reduce((a, t) => a + (parseInt(t.adet || "0") || 0), 0);
    const mevcutAday = ft.reduce((a, t) => a + t.adaylar.filter((a) => a.surecDurum?.ton !== "karsilandi").length, 0);
    const doluluk = toplamHedef > 0 ? Math.round((mevcutAday / toplamHedef) * 100) : 0;
    const gecikmisCount = ft.filter((t) => deadlineGecti(t.durum, t.deadline)).length;
    return {
      firma: f.ad,
      toplamTalep: ft.length,
      aktifTalep: aktif.length,
      doluluk,
      gecikmis: gecikmisCount,
      hedef: toplamHedef,
      mevcut: mevcutAday,
    };
  }).filter((f) => f.toplamTalep > 0).sort((a, b) => b.toplamTalep - a.toplamTalep);

  // Grafige veriler
  const durumDagilimi = surecDurumlari.map((s) => ({
    name: s.ad,
    value: talepler.reduce((a, t) => a + t.adaylar.filter((a) => a.surecDurum?.ad === s.ad).length, 0),
  })).filter((d) => d.value > 0);

  const firmaTalepBar = firmaAnaliz.map((f) => ({ name: f.firma.slice(0, 15), value: f.toplamTalep }));

  const fillRateBar = firmaAnaliz.map((f) => ({
    firma: f.firma.slice(0, 15),
    doluluk: f.doluluk,
    renk: f.doluluk >= 80 ? "#10b981" : f.doluluk >= 50 ? "#f59e0b" : "#ef4444",
  }));

  // Trend
  const son90Gun = new Date(bugun.getTime() - 90 * 86400000);
  const trendData = Array.from({ length: 13 }, (_, i) => {
    const baslangic = new Date(bugun.getTime() - (90 - i * 7) * 86400000);
    const bitis = new Date(bugun.getTime() - (83 - i * 7) * 86400000);
    const olusturan = talepler.filter((t) => {
      const d = new Date(t.olusturulmaTarihi);
      return d >= baslangic && d < bitis;
    }).length;
    const kapatilan = talepler.filter((t) => {
      if (!isKapaliDurum(t.durum?.ad || "")) return false;
      const d = new Date(t.olusturulmaTarihi);
      return d >= baslangic && d < bitis;
    }).length;
    const haftaNum = Math.floor((bugun.getTime() - baslangic.getTime()) / 86400000 / 7);
    const gun = baslangic.getDate();
    const ay = baslangic.toLocaleString("tr-TR", { month: "short" });
    return {
      hafta: `${gun} ${ay}`,
      olusturan,
      kapatilan,
    };
  });

  const pipelineData = surecDurumlari.map((s) => ({
    name: s.ad.length > 20 ? s.ad.slice(0, 18) + "…" : s.ad,
    value: talepler.reduce((a, t) => a + t.adaylar.filter((a) => a.surecDurum?.ad === s.ad).length, 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6"];

  function getProgressBar(pct: number) {
    const renk = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-zinc-500";
    return { pct, renk };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Yönetici Özeti
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Outsource talepleri ve doluluk durumu — {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <ExcelIndirButton />
      </div>

      {/* 1. Üst KPI Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Toplam Talep", deger: toplamTalep, alt: `${aktifTalep} aktif`, renk: "text-blue-600 dark:text-blue-400" },
          { label: "Aktif Talep", deger: aktifTalep, alt: "açık pozisyon", renk: "text-amber-600 dark:text-amber-400" },
          { label: "Kapalı Talep", deger: kapaliTalep, alt: "başarıyla tamamlandı", renk: "text-emerald-600 dark:text-emerald-400" },
          { label: "Toplam Aday", deger: toplamAday, alt: `${iseBasanAday} işe başladı`, renk: "text-purple-600 dark:text-purple-400" },
          { label: "Aday Pipeline", deger: bekleyenAday, alt: "bekleyen", renk: "text-indigo-600 dark:text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-400/10" />
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {s.label}
            </p>
            <p className={`mt-2 text-3xl font-bold ${s.renk}`}>
              {s.deger}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {s.alt}
            </p>
          </div>
        ))}
      </div>

      {/* 6. Kritik Uyarılar */}
      {yaklasan.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-2xl">🟡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {yaklasan.length} talebin deadline&apos;ı 7 gün içinde doluyor
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Yaklaşan son tarihler — acil işlem gereklidir.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {yaklasan.map((t) => {
                const kalan = Math.ceil((t.deadline!.getTime() - bugun.getTime()) / 86400000);
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/talepler/${t.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/40 transition"
                  >
                    #{t.talepNo} · {t.isBirimi.firma.ad} · {kalan} gün kaldı
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Talep Dağılımı + 3. Firma Analizi + 4. Trend + 5. Pipeline */}
      <DashboardCharts
        durumDagilimi={durumDagilimi}
        firmaTalepBar={firmaTalepBar}
        fillRateBar={fillRateBar}
        trendData={trendData}
        pipelineData={pipelineData}
      />

      {/* 3. Firma Bazında Tablo */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Firma Bazında Doluluk
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Firmaların talep sayısı, aday sayısı ve hedefe ulaşma oranı
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium text-center">Talep</th>
                <th className="px-4 py-3 font-medium text-center">Aktif</th>
                <th className="px-4 py-3 font-medium text-center">Aday</th>
                <th className="px-4 py-3 font-medium">Hedef / Doluluk</th>
                <th className="px-4 py-3 font-medium">Geçen Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {firmaAnaliz.map((f) => (
                <tr key={f.firma} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{f.firma}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-zinc-100 px-2 py-1 font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{f.toplamTalep}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{f.aktifTalep}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-purple-100 px-2 py-1 font-semibold text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">{f.mevcut}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">{f.mevcut}/{f.hedef || "—"}</span>
                        <span className={`font-semibold ${
                          f.doluluk >= 100 ? "text-emerald-600 dark:text-emerald-400" :
                          f.doluluk >= 50 ? "text-blue-600 dark:text-blue-400" :
                          "text-zinc-600 dark:text-zinc-400"
                        }`}>%{f.doluluk}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressBar(f.doluluk).renk}`}
                          style={{ width: `${Math.min(f.doluluk, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {f.gecikmis > 0 ? (
                      <span className="rounded-lg bg-red-100 px-2 py-1 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{f.gecikmis}</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {firmaAnaliz.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Henüz firma verisi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detaylı Talep Listesi */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Aktif Talepler — Detay
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tüm açık talepler, aday durumu ve ilerleme
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {talepler
            .filter((t) => !isKapaliDurum(t.durum?.ad || ""))
            .map((t) => {
              const hedef = parseInt(t.adet || "0", 10);
              const prog = hedef > 0 ? getProgressBar(Math.min(Math.round((t.adaylar.length / hedef) * 100), 100)) : null;
              return (
                <div key={t.id} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{t.talepNo}</span>
                        <TalepStatuBadge durum={t.durum} />
                        {deadlineGecti(t.durum, t.deadline) && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800" title="Deadline geçti">
                            ⚠ geçti
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.adayTuru}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.isBirimi.firma.ad} · {t.isBirimi.ad}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium ${pozisyonYasi(t.olusturulmaTarihi) > 30 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {pozisyonYasi(t.olusturulmaTarihi)} gün
                    </span>
                  </div>

                  {prog && hedef > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        <span>{t.adaylar.length}/{hedef} aday</span>
                        <span>%{prog.pct}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-full rounded-full ${prog.renk}`} style={{ width: `${prog.pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{t.talepSahibi}</span>
                    {t.deadline && (
                      <span className={deadlineGecti(t.durum, t.deadline) ? "text-red-600 dark:text-red-400" : ""}>
                        DL: {fmtDateShort(t.deadline)}{deadlineGecti(t.durum, t.deadline) && " ⚠"}
                      </span>
                    )}
                  </div>

                  {t.adaylar.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.adaylar.slice(0, 4).map((a) => (
                        <span key={a.id} className="max-w-[100px] truncate rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" title={`${a.adayAdi}${a.surecDurum?.ad ? ` — ${a.surecDurum.ad}` : ""}`}>
                          {a.adayAdi.split(" ")[0]}{a.surecDurum?.ad && <span className="text-zinc-400">·</span>}
                        </span>
                      ))}
                      {t.adaylar.length > 4 && <span className="text-[10px] text-zinc-400">+{t.adaylar.length - 4}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          {aktifTalep === 0 && (
            <div className="col-span-full rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aktif talep bulunmuyor. Tüm talepler başarıyla kapandı.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
