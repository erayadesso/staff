import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/**
 * Bulk statü kaydetme — Sürükle-bırak ile yapılan değişiklikleri kaydeder
 * 
 * Payload:
 * {
 *   requestStatuses: [
 *     {
 *       id: string;
 *       name: string;
 *       ton: string;
 *       order: number;
 *       processStatuses: [
 *         { processStatusId: string; order: number }
 *       ]
 *     }
 *   ],
 *   freeProcessStatuses: [
 *     { id: string; name: string; ton: string; order: number; requestStatusId: string | null }
 *   ]
 * }
 */

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.requestStatuses || !Array.isArray(body.requestStatuses)) {
    return NextResponse.json({ error: "Geçersiz payload." }, { status: 400 });
  }

  try {
    // Transaction ile atomik güncelleme
    await prisma.$transaction(async (tx) => {
      // 1) Talep durumlarını güncelle
      for (const rs of body.requestStatuses) {
        await tx.requestStatus.update({
          where: { id: rs.id },
          data: {
            name: rs.name,
            ton: rs.ton,
            order: rs.order,
          },
        });

        // 2) Process status mapping'lerini güncelle
        if (rs.processStatuses?.length) {
          for (const pm of rs.processStatuses) {
            await tx.processStatusMapping.upsert({
              where: { processStatusId: pm.processStatusId },
              update: {
                requestStatusId: rs.id,
                order: pm.order,
              },
              create: {
                id: crypto.randomUUID(),
                processStatusId: pm.processStatusId,
                requestStatusId: rs.id,
                order: pm.order,
              },
            });
          }
        }
      }

      // 3) Boştaki process status'leri güncelle (mapped=false olanlar)
      if (body.freeProcessStatuses?.length) {
        for (const fps of body.freeProcessStatuses) {
          const updateData: {
            name?: string;
            ton?: string;
            order?: number;
            requestStatusId?: string | null;
          } = {};
          if (fps.name) updateData.name = fps.name;
          if (fps.ton) updateData.ton = fps.ton;
          if (fps.order !== undefined) updateData.order = fps.order;
          if (fps.requestStatusId === null || fps.requestStatusId === "") {
            updateData.requestStatusId = null;
          } else if (fps.requestStatusId) {
            updateData.requestStatusId = fps.requestStatusId;
          }

          if (Object.keys(updateData).length > 0) {
            await tx.processStatus.update({
              where: { id: fps.id },
              data: updateData,
            });
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      message: `${body.requestStatuses.length} talep durumu kaydedildi.`,
    });
  } catch (error) {
    console.error("Bulk save error:", error);
    return NextResponse.json(
      { error: "Kaydetme sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
