import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import FirmaEkleForm from "@/components/FirmaEkleForm";
import FirmalarListesi from "@/components/FirmalarListesi";

export const dynamic = "force-dynamic";

export default async function FirmalarPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const firmalar = await prisma.firma.findMany({
    include: {
      isBirimleri: {
        include: { _count: { select: { talepler: true } } },
        orderBy: { ad: "asc" },
      },
    },
    orderBy: { ad: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Firmalar
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Müşteri firmalar ve iş birimleri.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <FirmalarListesi firmalar={firmalar} isAdmin={user.role === "ADMIN"} />
            {firmalar.length === 0 && (
              <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                Henüz firma eklenmemiş.{" "}
                <Link
                  href="/dashboard/firmalar"
                  className="text-zinc-900 underline dark:text-zinc-100"
                >
                  Firma ekleyin
                </Link>
              </p>
            )}
          </div>
        </div>

        {user.role === "ADMIN" && (
          <div>
            <div className="lg:sticky lg:top-6">
              <FirmaEkleForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
