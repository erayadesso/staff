import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import ExcelIndirButton from "@/components/ExcelIndirButton";
import TalepStatuBadge from "@/components/TalepStatuBadge";
import {
  deadlineGecti,
  isKapaliDurum,
  pozisyonYasi,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

function fmtDateShort(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [talepler, firmalar] = await Promise.all([
    prisma.talep.findMany({
      include: {
        isBirimi: {
          select: {
            ad: true,
            firmaId: true,
            firma: { select: { ad: true } },
          },
        },
        adaylar: {
          select: { id: true, adayAdi: true, surecDurumAdi: true },
        },
        olusturan: { select: { name: true } },
      },
      orderBy: { talepNo: "asc" },
    }),
    prisma.firma.findMany({ orderBy: { ad: "asc" } }),
  ]);

  const toplamTalep = talepler.length;
  const aktifTalep = talepler.filter((t) => !isKapaliDurum(t.durumAdi)).length;
  const kapaliTalep = talepler.filter((t) => isKapaliDurum(t.durumAdi)).length;
  const toplamAday = talepler.reduce((a, t) => a + t.adaylar.length, 0);
  const ortalamaAday = toplamTalep > 0 ? (toplamAday / toplamTalep).toFixed(1) : "0";

  const gecikmisTalepler = talepler.filter(
    (t) => deadlineGecti(t.durumAdi, t.deadline)
  );
  const gecikmisSayisi = gecikmisTalepler.length;

  const bugun = new Date();
  const gunIcinde = talepler.filter((t) => {
    if (!t.deadline) return false;
    const kalan = Math.ceil((t.deadline.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
    return kalan >= 0 && kalan <= 7;
  });

  // Firma bazında gruplama
  const firmaOzet = firmalar
    .map((firma) => {
      const firmaTalepleri = talepler.filter(
        (t) => t.isBirimi.firmaId === firma.id
      );
      const aktifler = firmaTalepleri.filter((t) => !isKapaliDurum(t.durumAdi));
      const kapalilar = firmaTalepleri.filter((t) => isKapaliDurum(t.durumAdi));
      const adaySayisi = firmaTalepleri.reduce((a, t) => a + t.adaylar.length, 0);
      const toplamHedef = firmaTalepleri.reduce((a, t) => {
        const adet = parseInt(t.adet || "0", 10);
        return a + (adet > 0 ? adet : 0);
      }, 0);
      const doluluk = toplamHedef > 0 ? Math.round((adaySayisi / toplamHedef) * 100) : 0;
      const enYasli = aktifler.reduce(
        (max, t) => Math.max(max, pozisyonYasi(t.olusturulmaTarihi)),
        0
      );
      return {
        firma,
        talepSayisi: firmaTalepleri.length,
        aktifTalepSayisi: aktifler.length,
        kapaliTalepSayisi: kapalilar.length,
        adaySayisi,
        toplamHedef,
        doluluk,
        enYasli,
        aktifler,
      };
    })
    .filter((o) => o.talepSayisi > 0);

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

      {/* Özet Kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Toplam Talep", deger: toplamTalep, renk: "text-blue-600 dark:text-blue-400", alt: `${aktifTalep} aktif` },
          { label: "Aktif Pozisyon", deger: aktifTalep, renk: "text-amber-600 dark:text-amber-400", alt: `${aktifTalep} açık` },
          { label: "Kapalı Talep", deger: kapaliTalep, renk: "text-emerald-600 dark:text-emerald-400", alt: "başarıyla tamamlandı" },
          { label: "Toplam Aday", deger: toplamAday, renk: "text-purple-600 dark:text-purple-400", alt: `Ort: ${ortalamaAday}/talep` },
          { label: "Doluluk Oranı", deger: "%", alt: firmaOzet.reduce((a, f) => a + f.doluluk, 0) > 0 ? `${Math.round(firmaOzet.reduce((a, f) => a + f.doluluk, 0) / firmaOzet.length)}% ortalama` : "veri yok" },
        ].map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
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

      {/* Kritik Uyarılar */}
      {(gecikmisSayisi > 0 || gunIcinde.length > 0) && (
        <div className="space-y-3">
          {gecikmisSayisi > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
              <span className="text-2xl">🔴</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {gecikmisSayisi} talebin deadline&apos;i geçti
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Müşteri son geçerlilik tarihi geçmiş talepler — acil işlem gereklidir.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gecikmisTalepler.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300"
                    >
                      #{t.talepNo} · {t.isBirimi.firma.ad} · {pozisyonYasi(t.olusturulmaTarihi)} gündür açık
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {gunIcinde.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <span className="text-2xl">🟡</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {gunIcinde.length} talebin deadline&apos;i 7 gün içinde doluyor
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Yaklaşan son tarihler — takip gereklidir.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gunIcinde.map((t) => {
                    const kalan = Math.ceil((t.deadline!.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300"
                      >
                        #{t.talepNo} · {t.isBirimi.firma.ad} · {kalan} gün kaldı
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Firma Bazında Tablo */}
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
                <th className="px-4 py-3 font-medium">Yaşlı Pozisyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {firmaOzet.map((o) => (
                <tr
                  key={o.firma.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {o.firma.ad}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center text-zinc-700 dark:text-zinc-300">
                    <span className="rounded-lg bg-zinc-100 px-2 py-1 font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {o.talepSayisi}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {o.aktifTalepSayisi}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-purple-100 px-2 py-1 font-semibold text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                      {o.adaySayisi}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {o.adaySayisi}/{o.toplamHedef || "—"}
                        </span>
                        <span className={`font-semibold ${
                          o.doluluk >= 100 ? "text-emerald-600 dark:text-emerald-400" :
                          o.doluluk >= 50 ? "text-blue-600 dark:text-blue-400" :
                          "text-zinc-600 dark:text-zinc-400"
                        }`}>
                          %{o.doluluk}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressBar(o.doluluk).renk}`}
                          style={{ width: `${Math.min(o.doluluk, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                    {o.aktifTalepSayisi > 0 ? (
                      <span className={`${o.enYasli > 30 ? "text-red-600 dark:text-red-400" : ""}`}>
                        {o.enYasli} gün
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {firmaOzet.length === 0 && (
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
            .filter((t) => !isKapaliDurum(t.durumAdi))
            .map((t) => {
              const prog = t.adet ? getProgressBar(Math.min(Math.round((t.adaylar.length / parseInt(t.adet)) * 100), 100)) : null;
              const hedef = parseInt(t.adet || "0", 10);
              return (
                <div
                  key={t.id}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{t.talepNo}
                        </span>
                        <TalepStatuBadge durumAdi={t.durumAdi} />
                        {deadlineGecti(t.durumAdi, t.deadline) && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800"
                            title="Müşteri son geçerlilik tarihi geçti"
                          >
                            ⚠ geçti
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {t.adayTuru}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t.isBirimi.firma.ad} · {t.isBirimi.ad}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium ${
                      pozisyonYasi(t.olusturulmaTarihi) > 30 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
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
                        <div
                          className={`h-full rounded-full ${prog.renk}`}
                          style={{ width: `${prog.pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{t.talepSahibi}</span>
                    {t.deadline && (
                      <span className={deadlineGecti(t.durumAdi, t.deadline) ? "text-red-600 dark:text-red-400" : ""}>
                        DL: {fmtDateShort(t.deadline)}
                        {deadlineGecti(t.durumAdi, t.deadline) && " ⚠"}
                      </span>
                    )}
                  </div>

                  {t.adaylar.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.adaylar.slice(0, 4).map((a) => (
                        <span
                          key={a.id}
                          className="max-w-[100px] truncate rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          title={`${a.adayAdi}${a.surecDurumAdi ? ` — ${a.surecDurumAdi}` : ""}`}
                        >
                          {a.adayAdi.split(" ")[0]}
                          {a.surecDurumAdi && (
                            <span className="text-zinc-400">·</span>
                          )}
                        </span>
                      ))}
                      {t.adaylar.length > 4 && (
                        <span className="text-[10px] text-zinc-400">
                          +{t.adaylar.length - 4}
                        </span>
                      )}
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
