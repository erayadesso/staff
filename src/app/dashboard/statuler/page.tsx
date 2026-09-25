import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import StatuYonetimi from "@/components/StatuYonetimi";

export const dynamic = "force-dynamic";

export default async function StatulerPage() {
  const user = await getSessionUser();
  // Yalnızca admin erişebilir
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bu sayfaya yalnızca yöneticiler erişebilir.
        </p>
      </div>
    );
  }

  const [talepDurumlari, surecDurumlari] = await Promise.all([
    prisma.talepDurumu.findMany({ orderBy: { sira: "asc" } }),
    prisma.surecDurumu.findMany({ orderBy: { sira: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Statü Yönetimi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Talep ve aday süreç statülerini ekleyebilir, düzenleyebilir veya
          silebilirsiniz.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatuYonetimi
          tip="talep"
          baslik="Talep Durumları"
          statuler={talepDurumlari}
        />
        <StatuYonetimi
          tip="surec"
          baslik="Aday Süreç Durumları"
          statuler={surecDurumlari}
        />
      </div>
    </div>
  );
}
