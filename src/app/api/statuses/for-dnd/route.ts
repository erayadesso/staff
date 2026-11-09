import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

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
    // 1) Talep durumlarını getir
    const requestStatuses = await prisma.requestStatus.findMany({
      orderBy: { order: "asc" },
    });

    // 2) Her talep durumu için mapping'leri getir (basit query)
    const allMappings = await prisma.processStatusMapping.findMany({
      orderBy: { order: "asc" },
    });

    // 3) Tüm mapped process status ID'leri
    const mappedProcessStatusIds = new Set(
      allMappings.map((m) => m.processStatusId)
    );

    // 4) Eşleşmemiş (boşta) process status'leri getir
    const freeProcessStatuses = await prisma.processStatus.findMany({
      where: {
        id: { notIn: Array.from(mappedProcessStatusIds) },
      },
      orderBy: { order: "asc" },
    });

    // 5) Mapping'lerden process status'leri grupla
    const mappingByRequestStatus = new Map<string, typeof allMappings>();
    for (const m of allMappings) {
      if (!mappingByRequestStatus.has(m.requestStatusId)) {
        mappingByRequestStatus.set(m.requestStatusId, []);
      }
      mappingByRequestStatus.get(m.requestStatusId)!.push(m);
    }

    // 6) Process status name→obje map (lookup için)
    const processStatusMap = new Map<string, { id: string; name: string; ton: string | null; order: number }>();
    for (const ps of freeProcessStatuses) {
      processStatusMap.set(ps.id, {
        id: ps.id,
        name: ps.name,
        ton: ps.ton,
        order: ps.order,
      });
    }
    // Mapped olanları da ekle (ancak free olarak değil, ilişkili olduğu request'te)
    const allProcessStatus = await prisma.processStatus.findMany({
      where: { id: { in: Array.from(mappedProcessStatusIds) } },
      select: { id: true, name: true, ton: true, order: true },
    });
    for (const ps of allProcessStatus) {
      processStatusMap.set(ps.id, {
        id: ps.id,
        name: ps.name,
        ton: ps.ton,
        order: ps.order,
      });
    }

    // 7) Formatla
    const formattedRequestStatuses = requestStatuses.map((rs) => {
      const mappings = mappingByRequestStatus.get(rs.id) || [];
      const processStatuses = mappings.map((m) => {
        const ps = processStatusMap.get(m.processStatusId);
        return ps
          ? { id: ps.id, name: ps.name, ton: ps.ton, order: m.order }
          : { id: m.processStatusId, name: "?", ton: null, order: m.order };
      });

      return {
        id: rs.id,
        name: rs.name,
        ton: rs.ton,
        order: rs.order,
        processStatuses: processStatuses.sort((a, b) => a.order - b.order),
      };
    });

    const formattedFreeProcessStatuses = freeProcessStatuses.map((ps) => ({
      id: ps.id,
      name: ps.name,
      ton: ps.ton,
      order: ps.order,
    }));

    return NextResponse.json({
      ok: true,
      requestStatuses: formattedRequestStatuses,
      freeProcessStatuses: formattedFreeProcessStatuses,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Stack:", stack);
    return NextResponse.json(
      { error: "Veriler yüklenirken hata oluştu.", details: msg },
      { status: 500 }
    );
  }
}
