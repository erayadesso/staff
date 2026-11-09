import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import StatuYoneticisi from "@/components/StatuYoneticisi";

export const dynamic = "force-dynamic";

export default async function StatulerPage() {
  const user = await getSessionUser();

  // Giriş yapılmamışsa → login'e yönlendir
  if (!user) {
    redirect("/");
  }

  // Admin değilse → açık mesaj
  if (user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Yetkisiz Erişim
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Bu sayfaya yalnızca yöneticiler erişebilir.
              <br />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Mevcut rol: {user.role} ({user.email})
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <StatuYoneticisi />;
}
