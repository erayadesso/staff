import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import TalepForm from "@/components/TalepForm";

export const dynamic = "force-dynamic";

export default async function YeniTalepPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const birimler = await prisma.isBirimi.findMany({
    include: { firma: true },
    orderBy: [{ firma: { ad: "asc" } }, { ad: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/talepler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Talepler
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Yeni Talep
        </h1>
      </div>

      <TalepForm
        birimler={birimler.map((b) => ({
          id: b.id,
          ad: b.ad,
          firmaAd: b.firma.ad,
        }))}
      />
    </div>
  );
}
