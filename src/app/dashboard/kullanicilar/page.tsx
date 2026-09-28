import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import KullanicilarContent from "./KullanicilarContent";

export const dynamic = "force-dynamic";

export default async function KullanicilarPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bu sayfaya yalnızca yöneticiler erişebilir.{" "}
          <Link
            href="/dashboard"
            className="text-zinc-900 underline dark:text-zinc-100"
          >
            Özete dön
          </Link>
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <KullanicilarContent users={users} />;
}
