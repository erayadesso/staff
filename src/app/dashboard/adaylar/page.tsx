import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import AdayBagla from "@/components/AdayBagla";

export const dynamic = "force-dynamic";

export default async function BaglantisizAdaylarPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [baglantisizlar, talepler] = await Promise.all([
    prisma.aday.findMany({
      where: { talepId: null },
      orderBy: { firmaAd: "asc" },
    }),
    prisma.talep.findMany({
      include: { isBirimi: { include: { firma: true } } },
      orderBy: { talepNo: "asc" },
    }),
  ]);

  // Firma bazında gurupla
  const firmaGruplari = new Map<string, typeof baglantisizlar>();
  for (const a of baglantisizlar) {
    const anahtar = a.firmaAd ?? "Bilinmeyen";
    if (!firmaGruplari.has(anahtar)) firmaGruplari.set(anahtar, []);
    firmaGruplari.get(anahtar)!.push(a);
  }
  const gruplar = Array.from(firmaGruplari.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bağlantısız Adaylar ({baglantisizlar.length})
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Excel&apos;de talep numarası olmayan adaylar. Firma seçip talebe bağlayabilirsiniz.
        </p>
      </div>

      {gruplar.map(([firma, adaylar]) => (
        <section
          key={firma}
          className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <header className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {firma} <span className="text-xs font-normal text-zinc-400">({adaylar.length})</span>
            </h2>
          </header>
          <ul className="divide-y divide-zinc-100 px-6 dark:divide-zinc-800/60">
            {adaylar.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {a.adayAdi}
                  </p>
                  {a.domain && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {a.domain}
                    </span>
                  )}
                  {a.source && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {a.source}
                    </span>
                  )}
                  {a.surecDurumAdi && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {a.surecDurumAdi}
                    </span>
                  )}
                </div>
                <AdayBagla
                  adayId={a.id}
                  talepler={talepler.map((t) => ({
                    id: t.id,
                    talepNo: t.talepNo,
                    firmaAd: t.isBirimi.firma.ad,
                    adayTuru: t.adayTuru,
                  }))}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {baglantisizlar.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Bağlantısız aday bulunmuyor.
        </p>
      )}
    </div>
  );
}
