import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Özet" },
  { href: "/dashboard/talepler", label: "Talepler" },
  { href: "/dashboard/adaylar", label: "Adaylar" },
  { href: "/dashboard/firmalar", label: "Firmalar" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Outsource Talepleri
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user?.name ?? user?.email}
                <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {user?.role}
                </span>
              </p>
            </div>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === "ADMIN" && (
                <>
                  <Link
                    href="/dashboard/kullanicilar"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    Kullanıcılar
                  </Link>
                  <Link
                    href="/dashboard/statuler"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    Statüler
                  </Link>
                </>
              )}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
