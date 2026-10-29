import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import TalepForm from "@/components/TalepForm";

export const dynamic = "force-dynamic";

export default async function YeniTalepPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const departments = await prisma.department.findMany({
    include: { company: true },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });

  const domains = await prisma.domain.findMany({
    include: {
      parent: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const yeniDurum =
    (await prisma.requestStatus.findFirst({
      where: { ton: "yeni" },
      orderBy: { order: "asc" },
      select: { id: true, name: true, order: true, ton: true },
    })) ??
    (await prisma.requestStatus.findFirst({
      orderBy: { order: "asc" },
      select: { id: true, name: true, order: true, ton: true },
    }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/requests"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Talepler
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Yeni Talep
        </h1>
      </div>

      <TalepForm
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          companyName: d.company.name,
        }))}
        yeniDurum={yeniDurum}
        domains={domains.map((d) => ({
          id: d.id,
          name: d.name,
          parentName: d.parent?.name,
        }))}
      />
    </div>
  );
}
