import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import ExcelIndirButton from "@/components/ExcelIndirButton";
import { isKapaliDurum, deadlineGecti, statununTonu } from "@/lib/domain";
import DashboardCharts from "@/components/DashboardCharts";
import LoadingMessage from "@/components/LoadingMessage";

export const dynamic = "force-dynamic";

async function getAllRequests() {
  return prisma.request.findMany({
    include: {
      department: {
        select: {
          name: true,
          companyId: true,
          company: { select: { name: true, logoUrl: true } },
        },
      },
      status: { select: { id: true, name: true, order: true, ton: true } },
      candidates: {
        select: {
          id: true,
          candidateName: true,
          processStatus: { select: { id: true, name: true, order: true, ton: true } },
        },
      },
    },
    orderBy: { requestNo: "desc" },
  });
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const bugun = new Date();
  const [requests, companies, processStatuses] = await Promise.all([
    getAllRequests(),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.processStatus.findMany({ orderBy: { order: "asc" } }),
  ]);

  // KPI
  const aktifTalepTonlari = new Set<string>(["yeni", "ic", "dis", "gorsme", "secim", "kabul"]);
  const toplamTalep = requests.length;
  const aktifTalep = requests.filter((r) => aktifTalepTonlari.has(statununTonu(r.status))).length;
  const basariylaKapandiTalep = requests.filter((r) => {
    const hedef = parseInt(r.quantity || "0", 10);
    if (hedef <= 0) return false;
    return r.candidates.filter((a) => a.processStatus?.ton === "karsilandi").length >= hedef;
  }).length;
  const kapaliTalep = basariylaKapandiTalep;
  const toplamAday = requests.reduce((a, r) => a + r.candidates.length, 0);
  const iseBasanAday = requests.reduce((a, r) => a + r.candidates.filter((a) => a.processStatus?.ton === "karsilandi").length, 0);
  const bekleyenAday = requests.reduce((a, r) => a + r.candidates.filter((a) => a.processStatus?.ton !== "karsilandi").length, 0);

  // Uyarılar
  const gecikmis = requests.filter((r) => deadlineGecti(r.status, r.deadline));
  const yaklasan = requests.filter((r) => {
    if (!r.deadline) return false;
    const kalan = Math.ceil((r.deadline.getTime() - bugun.getTime()) / 86400000);
    return kalan >= 0 && kalan <= 7;
  });

  // Firma analiz
  const firmaAnaliz = companies.map((c) => {
    const ft = requests.filter((r) => r.department.companyId === c.id);
    const aktif = ft.filter((r) => !isKapaliDurum(r.status));
    const toplamHedef = ft.reduce((a, r) => a + (parseInt(r.quantity || "0") || 0), 0);
    const mevcutAday = ft.reduce((a, r) => a + r.candidates.filter((a) => a.processStatus?.ton !== "karsilandi").length, 0);
    const doluluk = toplamHedef > 0 ? Math.round((mevcutAday / toplamHedef) * 100) : 0;
    const gecikmisCount = ft.filter((r) => deadlineGecti(r.status, r.deadline)).length;
    return {
      firma: c.name,
      toplamTalep: ft.length,
      aktifTalep: aktif.length,
      doluluk,
      gecikmis: gecikmisCount,
      hedef: toplamHedef,
      mevcut: mevcutAday,
    };
  }).filter((f) => f.toplamTalep > 0).sort((a, b) => b.toplamTalep - a.toplamTalep);

  // Grafige veriler
  const durumDagilimi = processStatuses.map((s) => ({
    name: s.name,
    value: requests.reduce((a, r) => a + r.candidates.filter((a) => a.processStatus?.name === s.name).length, 0),
  })).filter((d) => d.value > 0);

  const firmaTalepBar = firmaAnaliz.map((f) => ({ name: f.firma.slice(0, 15), value: f.toplamTalep }));

  const fillRateBar = firmaAnaliz.map((f) => ({
    firma: f.firma.slice(0, 15),
    doluluk: f.doluluk,
    renk: f.doluluk >= 80 ? "#10b981" : f.doluluk >= 50 ? "#f59e0b" : "#ef4444",
  }));

  // Trend hesaplama yardımcı fonksiyon
  function hesaplaTrend(gunSayisi: number) {
    if (gunSayisi === -1) {
      // Tümü — tüm veriyi haftalık grupla
      if (requests.length === 0) return [];
      const ilkTarih = new Date(Math.min(...requests.map((r) => new Date(r.createdAt).getTime())));
      const gunFark = Math.ceil((bugun.getTime() - ilkTarih.getTime()) / 86400000);
      const haftaSayisi = Math.ceil(gunFark / 7);
      return Array.from({ length: Math.min(haftaSayisi, 52) }, (_, i) => {
        const baslangic = new Date(bugun.getTime() - (gunFark - i * 7) * 86400000);
        const bitis = new Date(bugun.getTime() - (gunFark - (i + 1) * 7) * 86400000);
        const olusturan = requests.filter((r) => {
          const d = new Date(r.createdAt);
          return d >= bitis && d < baslangic;
        }).length;
        const kapatilan = requests.filter((r) => {
          if (!isKapaliDurum(r.status)) return false;
          const d = new Date(r.createdAt);
          return d >= bitis && d < baslangic;
        }).length;
        const gun = baslangic.getDate();
        const ay = baslangic.toLocaleString("tr-TR", { month: "short" });
        return { hafta: `${gun} ${ay}`, olusturan, kapatilan };
      }).reverse();
    }
    const gunler = Array.from({ length: gunSayisi }, (_, i) => i + 1);
    return gunler.map((_, i) => {
      const baslangic = new Date(bugun.getTime() - (gunSayisi - i * 7) * 86400000);
      const bitis = new Date(bugun.getTime() - (gunSayisi - (i + 1) * 7) * 86400000);
      const olusturan = requests.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= bitis && d < baslangic;
      }).length;
      const kapatilan = requests.filter((r) => {
        if (!isKapaliDurum(r.status)) return false;
        const d = new Date(r.createdAt);
        return d >= bitis && d < baslangic;
      }).length;
      const gun = baslangic.getDate();
      const ay = baslangic.toLocaleString("tr-TR", { month: "short" });
      return { hafta: `${gun} ${ay}`, olusturan, kapatilan };
    });
  }

  const trendData30 = hesaplaTrend(30);
  const trendData90 = hesaplaTrend(90);
  const trendData180 = hesaplaTrend(180);
  const trendDataTumu = hesaplaTrend(-1);

  const pipelineData = processStatuses.map((s) => ({
    name: s.name.length > 20 ? s.name.slice(0, 18) + "…" : s.name,
    value: requests.reduce((a, r) => a + r.candidates.filter((a) => a.processStatus?.name === s.name).length, 0),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  function getProgressBar(pct: number) {
    const renk = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-amber-500" : "bg-zinc-500";
    return { pct, renk };
  }

  return (
    <Suspense fallback={<LoadingMessage />}>
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
              {yaklasan.map((r) => {
                const kalan = Math.ceil((r.deadline!.getTime() - bugun.getTime()) / 86400000);
                return (
                  <Link
                    key={r.id}
                    href={`/dashboard/requests/${r.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/40 transition"
                  >
                    #{r.requestNo} · {r.department.name} · {kalan} gün kaldı
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
        trendData30={trendData30}
        trendData90={trendData90}
        trendData180={trendData180}
        trendDataTumu={trendDataTumu}
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
      </div>
    </Suspense>
  );
}
