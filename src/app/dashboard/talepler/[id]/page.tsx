import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import AdayListesi from "@/components/AdayListesi";
import TalepDurumu from "@/components/TalepDurumu";
import TalepSilButonu from "@/components/TalepSilButonu";
import TalepStatuBadge from "@/components/TalepStatuBadge";
import {
  deadlineGecti,
  isBasariKapatildi,
  kalanGun,
  pozisyonYasi,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function TalepDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  const talep = await prisma.talep.findUnique({
    where: { id },
    include: {
      isBirimi: {
        select: {
          ad: true,
          firma: { select: { ad: true } },
        },
      },
      olusturan: { select: { name: true, email: true } },
      adaylar: {
        select: {
          id: true,
          adayAdi: true,
          source: true,
          surecDurumAdi: true,
          domain: true,
          adayCost: true,
          iseBaslamaTarihi: true,
          talepDetaylari: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!talep) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Talep bulunamadı.{" "}
          <Link
            href="/dashboard/talepler"
            className="text-zinc-900 underline dark:text-zinc-100"
          >
            Taleplere dön
          </Link>
        </p>
      </div>
    );
  }

  const surecDurumlari = await prisma.surecDurumu.findMany({
    orderBy: { sira: "asc" },
  });
  const talepDurumlari = await prisma.talepDurumu.findMany({
    orderBy: { sira: "asc" },
  });

  const acikAdaylar = talep.adaylar.filter(
    (a) => a.surecDurumAdi && /beğendi|Onaylandı|Teklif/i.test(a.surecDurumAdi)
  ).length;

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/talepler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Talepler
        </Link>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Talep #{talep.talepNo} — {talep.adayTuru}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {talep.isBirimi.firma.ad} · {talep.isBirimi.ad} ·{" "}
                {talep.talepSahibi}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isBasariKapatildi(talep.adaylar, talep.adet) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
                  ✅ Başarıyla Kapandı
                </span>
              )}
              <TalepStatuBadge durumAdi={talep.durumAdi} className="px-2 py-1 text-xs" />
              {user.role === "ADMIN" && (
                <TalepSilButonu talepNo={talep.talepNo} talepId={talep.id} />
              )}
            </div>
          </div>
      </div>

      {deadlineGecti(talep.durumAdi, talep.deadline) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ Müşteri talep son geçerlilik tarihi (DEADLINE) geçti.
          {kalanGun(talep.deadline) != null &&
            kalanGun(talep.deadline)! < 0 && (
              <span className="ml-1 font-medium">
                {Math.abs(kalanGun(talep.deadline)!)} gün geçti
              </span>
            )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Talep Bilgileri
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Adet</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {talep.adet ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Oluşturulma</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {fmtDate(talep.olusturulmaTarihi)}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    ({pozisyonYasi(talep.olusturulmaTarihi)} gündür açık)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Müşteri Son Geçerlilik</dt>
                <dd
                  className={
                    deadlineGecti(talep.durumAdi, talep.deadline)
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "font-medium text-zinc-800 dark:text-zinc-200"
                  }
                >
                  {fmtDate(talep.deadline)}
                  {deadlineGecti(talep.durumAdi, talep.deadline) && (
                    <span className="ml-1 inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      geçti
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">adesso Süresi (Hedef)</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {fmtDate(talep.adessoSuresi)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Oluşturan</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {talep.olusturan?.name ?? "—"}
                </dd>
              </div>
            </dl>
            {talep.notlar && (
              <div className="mt-4">
                <dt className="text-xs text-zinc-500">Notlar</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {talep.notlar}
                </dd>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Aday Listesi ({talep.adaylar.length})
              </h2>
              {acikAdaylar > 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {acikAdaylar} olumlu
                </span>
              )}
            </div>
            <AdayListesi
              adaylar={talep.adaylar.map((a) => ({
                id: a.id,
                adayAdi: a.adayAdi,
                source: a.source,
                surecDurumAdi: a.surecDurumAdi,
                domain: a.domain,
                adayCost: a.adayCost,
                iseBaslamaTarihi: a.iseBaslamaTarihi,
                talepDetaylari: a.talepDetaylari,
                createdAt: a.createdAt,
              }))}
              surecDurumlari={surecDurumlari.map((d) => d.ad)}
              talepId={talep.id}
            />
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <TalepDurumu
              talepId={talep.id}
              mevcutDurum={talep.durumAdi}
              guncelNot={talep.guncelNot}
              talepDurumlari={talepDurumlari.map((d) => d.ad)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
