import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/**
 * Migration endpoint — eski ton değerlerini yeni sisteme günceller.
 * Admin tarafından bir kez çağrılmalı.
 *
 * POST /api/migrate-ton
 * Body: {}
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  try {
    // Talep statüleri için ton migration'ı
    // order bazlı: 0-5 aktif, 6 kapali, 7 beklemede, 8-9 kapali
    const statuses = await prisma.requestStatus.findMany({
      select: { id: true, name: true, order: true, ton: true },
    });

    const updated: { id: string; name: string; oldTon: string | null; newTon: string }[] = [];
    const skipped: { id: string; name: string; reason: string }[] = [];

    for (const s of statuses) {
      const oldTon = s.ton;
      let newTon: string;

      if (s.order == null) {
        skipped.push({ id: s.id, name: s.name, reason: "order değeri yok" });
        continue;
      }

      if (s.order <= 5) newTon = "aktif";
      else if (s.order === 6) newTon = "kapali";
      else if (s.order === 7) newTon = "beklemede";
      else newTon = "kapali";

      if (oldTon !== newTon) {
        await prisma.requestStatus.update({
          where: { id: s.id },
          data: { ton: newTon },
        });
        updated.push({ id: s.id, name: s.name, oldTon: oldTon ?? "null", newTon });
      } else {
        skipped.push({ id: s.id, name: s.name, reason: "ton zaten doğru" });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Migration tamamlandı. ${updated.length} kayıt güncellendi, ${skipped.length} kayıt atlandı.`,
      updated,
      skipped,
    });
  } catch (error) {
    console.error("Migration hatası:", error);
    return NextResponse.json({ error: "Migration sırasında hata oluştu." }, { status: 500 });
  }
}
