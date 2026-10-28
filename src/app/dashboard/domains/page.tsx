import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import DomainYonetimi from "@/components/DomainYonetimi";

export const dynamic = "force-dynamic";

// Tüm alan adlarını hierarchical olarak yükle
async function getDomainsWithChildren() {
  return prisma.domain.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, requests: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function DomainlarPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const allDomains = await getDomainsWithChildren();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Yetkinlik Merkezleri
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Yetkinlik merkezlerini ve alt kırılımlarını yönetin.
        </p>
      </div>

      <DomainYonetimi
        domains={allDomains}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
