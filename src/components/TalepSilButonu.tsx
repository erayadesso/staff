"use client";

import { useRouter } from "next/navigation";

export default function TalepSilButonu({
  talepNo,
  talepId,
}: {
  talepNo: number;
  talepId: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        if (!confirm(`Talep #${talepNo} silinecek. Onaylıyor musunuz?`))
          return;
        const res = await fetch(`/api/talepler/${talepId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error ?? "Talep silinemedi.");
        } else {
          alert("Talep silindi.");
          router.push("/dashboard/talepler");
        }
      }}
      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
    >
      Talebi Sil
    </button>
  );
}
