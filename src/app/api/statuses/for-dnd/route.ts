import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/**
 * Drag-and-drop için statü verilerini getirir
 * GET /api/statuses/for-dnd
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  try {
    // Talep durumlarını ve eşleşen process status'leri getir
    const requestStatuses = await prisma.requestStatus.findMany({
      orderBy: { order: "asc" },
      include: {
        processMappings: {
          include: {
            processStatus: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // ProcessStatusMapping ile eşleşen process status ID'leri
    const mappedProcessStatusIds = new Set(
      requestStatuses.flatMap((rs) => rs.processMappings.map((m) => m.processStatusId))
    );

    // Eşleşmemiş (boşta) process status'leri getir
    const freeProcessStatuses = await prisma.processStatus.findMany({
      where: {
        id: { notIn: Array.from(mappedProcessStatusIds) },
      },
      orderBy: { order: "asc" },
    });

    // Formatla
    const formattedRequestStatuses = requestStatuses.map((rs) => ({
      id: rs.id,
      name: rs.name,
      ton: rs.ton,
      order: rs.order,
      processStatuses: rs.processMappings.map((m) => ({
        id: m.processStatus.id,
        name: m.processStatus.name,
        ton: m.processStatus.ton,
        order: m.order,
      })),
    }));

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
    return NextResponse.json(
      { error: "Veriler yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
