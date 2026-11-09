import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Drag-and-drop için statü verilerini getirir
 * GET /api/statuses/for-dnd
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Oturum bulunamadı. Lütfen giriş yapın.", debug: { hasSession: false } },
      { status: 401 }
    );
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: `Bu sayfaya erişim yetkiniz yok. Mevcut rol: ${user.role}` },
      { status: 403 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");

    // 1) Talep durumları
    const requestStatuses: any[] = await prisma.$queryRaw`
      SELECT id, name, "order", ton FROM "RequestStatus" ORDER BY "order" ASC
    `;

    // 2) Yeni mapping tablosu
    const newMappings: any[] = await prisma.$queryRaw`
      SELECT id, "processstatusid", "requeststatusid", "order" 
      FROM "ProcessStatusMapping" 
      ORDER BY "order" ASC
    `;

    // 3) Eski mapping: ProcessStatus.request_status_id
    const oldMappedStatuses: any[] = await prisma.$queryRaw`
      SELECT id, name, "order", ton, request_status_id 
      FROM "ProcessStatus" 
      WHERE request_status_id IS NOT NULL
    `;

    // Eski mapping'lerden mapping oluştur
    const oldMappings: any[] = oldMappedStatuses.map((ps) => ({
      id: `old-${ps.id}`,
      processstatusid: ps.id,
      requeststatusid: ps.requeststatusid || ps.request_status_id,
      order: 0,
      source: "old" as const,
    }));

    // Tüm mapping'leri birleştir
    const allMappings = [...oldMappings, ...newMappings];

    // Mapping'deki tüm process status ID'leri
    const mappedIds = allMappings.map((m: any) => m.processstatusid);

    // Tüm mapped process status'ler (lookup)
    let mappedProcessStatuses: any[] = [];
    if (mappedIds.length > 0) {
      const placeholders = mappedIds.map((_: any, i: number) => `$${i + 1}`).join(",");
      mappedProcessStatuses = await prisma.$queryRawUnsafe(
        `SELECT id, name, ton, "order" FROM "ProcessStatus" WHERE id IN (${placeholders})`,
        ...mappedIds
      );
    }

    // Free (eşleşmemiş) process status'ler
    let freeProcessStatuses: any[] = [];
    if (mappedIds.length > 0) {
      const placeholders = mappedIds.map((_: any, i: number) => `$${i + 1}`).join(",");
      freeProcessStatuses = await prisma.$queryRawUnsafe(
        `SELECT id, name, "order", ton FROM "ProcessStatus" WHERE id NOT IN (${placeholders}) ORDER BY "order" ASC`,
        ...mappedIds
      );
    } else {
      freeProcessStatuses = await prisma.$queryRaw`
        SELECT id, name, "order", ton FROM "ProcessStatus" ORDER BY "order" ASC
      `;
    }

    // Lookup map
    const processStatusMap = new Map<string, any>();
    for (const ps of mappedProcessStatuses) processStatusMap.set(ps.id, ps);
    for (const ps of freeProcessStatuses) processStatusMap.set(ps.id, ps);

    // Mapping'leri requestStatus'e göre grupla
    const mappingByRequestStatus = new Map<string, any[]>();
    for (const m of allMappings) {
      const key = m.requeststatusid;
      if (!mappingByRequestStatus.has(key)) mappingByRequestStatus.set(key, []);
      mappingByRequestStatus.get(key)!.push(m);
    }

    // Formatla
    const formattedRequestStatuses = requestStatuses.map((rs: any) => {
      const rsMappings = mappingByRequestStatus.get(rs.id) || [];
      const processStatuses = rsMappings
        .map((m: any) => {
          const ps = processStatusMap.get(m.processstatusid);
          return ps
            ? { id: ps.id, name: ps.name, ton: ps.ton, order: m.order }
            : { id: m.processstatusid, name: "?", ton: null, order: m.order };
        })
        .sort((a: any, b: any) => a.order - b.order);

      return {
        id: rs.id,
        name: rs.name,
        ton: rs.ton,
        order: rs.order,
        processStatuses,
        mappingSource: rsMappings.some((m: any) => m.source === "old") ? "system" : "manual",
      };
    });

    const formattedFreeProcessStatuses = freeProcessStatuses.map((ps: any) => ({
      id: ps.id,
      name: ps.name,
      ton: ps.ton,
      order: ps.order,
    }));

    return NextResponse.json({
      ok: true,
      requestStatuses: formattedRequestStatuses,
      freeProcessStatuses: formattedFreeProcessStatuses,
      meta: {
        requestStatusCount: formattedRequestStatuses.length,
        mappingCount: allMappings.length,
        newMappingCount: newMappings.length,
        oldMappingCount: oldMappings.length,
        freeCount: formattedFreeProcessStatuses.length,
        mappedProcessCount: mappedIds.length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
    const code = (error as any)?.code ?? "UNKNOWN";
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error("❌ for-dnd error:", { msg, code, stack });
    return NextResponse.json(
      { 
        error: "Veriler yüklenirken hata oluştu.", 
        details: msg,
        errorCode: code,
      },
      { status: 500 }
    );
  }
}
