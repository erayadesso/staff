import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import StatuYoneticisi from "@/components/StatuYoneticisi";

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

  return <StatuYoneticisi />;
}
