import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import TalepFiltreliListesi from "@/components/TalepFiltreliListesi";
import ExcelIndirButton from "@/components/ExcelIndirButton";
import {
  deadlineGecti,
  isBasariKapatildi,
  pozisyonYasi,
} from "@/lib/domain";
import LoadingMessage from "@/components/LoadingMessage";

export const dynamic = "force-dynamic";

async function getFilteredTalepler(showCancelled: boolean) {
  const aktifTalepTonlari = ["yeni", "ic", "dis", "gorsme", "secim", "kabul", "karsilandi"];
  return prisma.talep.findMany({
    where: showCancelled ? undefined : {
      durum: {
        ton: { in: aktifTalepTonlari },
      },
    },
    include: {
      isBirimi: {
        select: {
          ad: true,
          firmaId: true,
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
}

export default async function TaleplerPage({
  searchParams,
}: {
  searchParams: Promise<{ showCancelled?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const showCancelled = params.showCancelled === 'true';

  const talepler = await getFilteredTalepler(showCancelled);

  return (
    <Suspense fallback={<LoadingMessage />}>
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
          <Link
            href={`/dashboard/talepler?showCancelled=${!showCancelled}`}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              showCancelled
                ? 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            <span className={`inline-block h-4 w-7 rounded-full p-0.5 transition-colors ${
              showCancelled ? 'bg-blue-500' : 'bg-zinc-400'
            }`}>
              <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${
                showCancelled ? 'translate-x-3' : 'translate-x-0'
              }`} />
            </span>
            {showCancelled ? 'İptal/Karşılanamadı Gizle' : 'İptal/Karşılanamadı Göster'}
          </Link>
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
          durum: t.durum,
          firmaAd: t.isBirimi.firma.ad,
          firmaLogo: t.isBirimi.firma.logoUrl,
          birimAd: t.isBirimi.ad,
          adaylar: t.adaylar,
          adaySayisi: t.adaylar.length,
          olusturulmaTarihi: t.olusturulmaTarihi,
          deadline: t.deadline,
          yasi: pozisyonYasi(t.olusturulmaTarihi),
          deadlineGectiMi: deadlineGecti(t.durum, t.deadline),
          basariylaKapandi: isBasariKapatildi(t.adaylar, t.adet),
        }))}
      />
    </div>
    </Suspense>
  );
}
