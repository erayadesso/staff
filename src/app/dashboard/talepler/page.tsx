import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import TalepFiltreliListesi from "@/components/TalepFiltreliListesi";
import ExcelIndirButton from "@/components/ExcelIndirButton";
import {
  deadlineGecti,
  isBasariKapatildi,
  pozisyonYasi,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

const cacheliTalepler = unstable_cache(
  async () => {
    const talepler = await prisma.talep.findMany({
      include: {
        isBirimi: {
          select: {
            ad: true,
            firma: { select: { ad: true, logoUrl: true } },
          },
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
      },
      orderBy: { talepNo: "desc" },
    });
    return {
      talepler: talepler.map((t) => ({
        id: t.id,
        talepNo: t.talepNo,
        talepSahibi: t.talepSahibi,
        adayTuru: t.adayTuru,
        adet: t.adet,
        durum: t.durum,
        firmaAd: t.isBirimi.firma.ad,
        firmaLogo: t.isBirimi.firma.logoUrl,
        birimAd: t.isBirimi.ad,
        adaySayisi: t.adaylar.length,
        adaylar: t.adaylar.map((a) => ({
          id: a.id,
          adayAdi: a.adayAdi,
          surecDurum: a.surecDurum,
          iseBaslamaTarihi: a.iseBaslamaTarihi
            ? a.iseBaslamaTarihi.toISOString()
            : null,
        })),
        olusturulmaTarihi: t.olusturulmaTarihi
          ? t.olusturulmaTarihi.toISOString()
          : null,
        deadline: t.deadline ? t.deadline.toISOString() : null,
      })),
    };
  },
  ["talepler-veri"],
  { revalidate: 30 }
);

export default async function TaleplerPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const { talepler } = await cacheliTalepler();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Talepler
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Tüm outsource kaynak talepleri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelIndirButton />
          <Link
            href="/dashboard/talepler/yeni"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            + Yeni Talep
          </Link>
        </div>
      </div>

      <TalepFiltreliListesi
        talepler={talepler.map((t) => ({
          id: t.id,
          talepNo: t.talepNo,
          talepSahibi: t.talepSahibi,
          adayTuru: t.adayTuru,
          adet: t.adet,
          durum: t.durum as any,
          firmaAd: t.firmaAd,
          firmaLogo: t.firmaLogo,
          birimAd: t.birimAd,
          adaylar: t.adaylar.map((a) => ({
            id: a.id,
            adayAdi: a.adayAdi,
            surecDurum: a.surecDurum as any,
            iseBaslamaTarihi: a.iseBaslamaTarihi ? new Date(a.iseBaslamaTarihi) : null,
          })),
          adaySayisi: t.adaySayisi,
          olusturulmaTarihi: new Date(t.olusturulmaTarihi!),
          deadline: t.deadline ? new Date(t.deadline) : null,
          yasi: pozisyonYasi(t.olusturulmaTarihi ? new Date(t.olusturulmaTarihi) : new Date()),
          deadlineGectiMi: deadlineGecti(t.durum as any, t.deadline ? new Date(t.deadline) : null),
          basariylaKapandi: isBasariKapatildi(
            t.adaylar.map((a) => ({ surecDurum: a.surecDurum })),
            t.adet
          ),
        }))}
      />
    </div>
  );
}
