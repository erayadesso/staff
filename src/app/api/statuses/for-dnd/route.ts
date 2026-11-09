import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Drag-and-drop için statü verilerini getirir
 * GET /api/statuses/for-dnd
 * 
 * Raw SQL — Prisma relation sorunlarını bypass eder.
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
    // 1) Talep durumları
    const requestStatuses: any[] = await prisma.$queryRaw`
      SELECT id, name, "order", ton FROM "RequestStatus" ORDER BY "order" ASC
    `;

    // 2) Mapping'ler — kolon adları küçük harf
    const mappings: any[] = await prisma.$queryRaw`
      SELECT id, "processstatusid", "requeststatusid", "order" 
      FROM "ProcessStatusMapping" 
      ORDER BY "order" ASC
    `;

    // 3) Mapping'deki process status ID'leri
    const mappedIds = mappings.map((m: any) => m.processstatusid);

    // 4) Mapping'deki process status'ler
    let mappedProcessStatuses: any[] = [];
    if (mappedIds.length > 0) {
      const placeholders = mappedIds.map((_: any, i: number) => `$${i + 2}`).join(",");
      mappedProcessStatuses = await prisma.$queryRawUnsafe(
        `SELECT id, name, ton, "order" FROM "ProcessStatus" WHERE id IN (${placeholders})`,
        ...mappedIds
      );
    }

    // 5) Free (eşleşmemiş) process status'ler
    let freeProcessStatuses: any[] = [];
    if (mappedIds.length > 0) {
      const placeholders = mappedIds.map((_: any, i: number) => `$${i + 2}`).join(",");
      freeProcessStatuses = await prisma.$queryRawUnsafe(
        `SELECT id, name, "order", ton FROM "ProcessStatus" WHERE id NOT IN (${placeholders}) ORDER BY "order" ASC`,
        ...mappedIds
      );
    } else {
      freeProcessStatuses = await prisma.$queryRaw`
        SELECT id, name, "order", ton FROM "ProcessStatus" ORDER BY "order" ASC
      `;
    }

    // Map oluştur (lookup)
    const processStatusMap = new Map<string, any>();
    for (const ps of freeProcessStatuses) processStatusMap.set(ps.id, ps);
    for (const ps of mappedProcessStatuses) processStatusMap.set(ps.id, ps);

    // Mapping'leri requestStatus'e göre grupla
    const mappingByRequestStatus = new Map<string, any[]>();
    for (const m of mappings) {
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
        mappingCount: mappings.length,
        freeCount: formattedFreeProcessStatuses.length,
        mappedProcessCount: mappedProcessStatuses.length,
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
