import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Mevcut sistemde domain.ts'deki ADAYDAN_TALEP_DURUMU map'ini
 * ProcessStatusMapping tablosuna sync eder.
 * POST /api/statuses/sync-mapping
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  try {
    // Mevcut mapping
    const existingMappings = await prisma.processStatusMapping.findMany();
    if (existingMappings.length > 0) {
      return NextResponse.json({
        ok: true,
        message: `Hali hazırda ${existingMappings.length} mapping var. Sync atlandı.`,
        existingCount: existingMappings.length,
      });
    }

    // Talep durumları
    const requestStatuses = await prisma.requestStatus.findMany({
      select: { id: true, name: true },
    });
    const reqNameToId = new Map(requestStatuses.map((rs) => [rs.name, rs.id]));

    // Aday durumları
    const processStatuses = await prisma.processStatus.findMany({
      select: { id: true, name: true },
    });

    // Eski sistem mapping (domain.ts ADAYDAN_TALEP_DURUMU'dan gelen değerler)
    // Bu mapping manuel olarak güncellenmeli veya domain.ts'den okunmalı
    // Şimdilik boş mapping döndür — admin UI ile dolduracak
    
    return NextResponse.json({
      ok: true,
      message: "Sync hazır. Admin UI ile eşleştirmeleri yapın.",
      requestStatuses: requestStatuses.map((rs) => ({ id: rs.id, name: rs.name })),
      processStatuses: processStatuses.map((ps) => ({ id: ps.id, name: ps.name })),
      existingMappingCount: existingMappings.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
