import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import UserCreateForm from "@/components/UserCreateForm";

export const dynamic = "force-dynamic";

export default async function KullanicilarPage() {
  const user = await getSessionUser();
  // Yalnızca admin erişebilir
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

  const users = await prisma.user.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Kullanıcılar
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Kullanıcı oluşturabilir ve kayıtlı kullanıcıları görüntüleyebilirsiniz.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-block text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Özet
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Kullanıcı Oluştur
          </h3>
          <UserCreateForm />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Kayıtlı Kullanıcılar ({users.length})
          </h3>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {u.name ?? "-"}
                  </p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
