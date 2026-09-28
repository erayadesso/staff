import Link from "next/link";
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

export default async function TaleplerPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const talepler = await prisma.talep.findMany({
    include: {
      isBirimi: {
        select: {
          ad: true,
          firma: { select: { ad: true, logoUrl: true } },
        },
      },
      adaylar: { select: { id: true, adayAdi: true, surecDurumAdi: true, iseBaslamaTarihi: true } },
    },
    orderBy: { talepNo: "desc" },
  });

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
          durumAdi: t.durumAdi,
          firmaAd: t.isBirimi.firma.ad,
          firmaLogo: t.isBirimi.firma.logoUrl,
          birimAd: t.isBirimi.ad,
          adaylar: t.adaylar,
          adaySayisi: t.adaylar.length,
          olusturulmaTarihi: t.olusturulmaTarihi,
          deadline: t.deadline,
          yasi: pozisyonYasi(t.olusturulmaTarihi),
          deadlineGectiMi: deadlineGecti(t.durumAdi, t.deadline),
          basariylaKapandi: isBasariKapatildi(t.adaylar, t.adet),
        }))}
      />
    </div>
  );
}
