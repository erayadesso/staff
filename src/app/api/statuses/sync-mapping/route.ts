import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Domain.ts ADAYDAN_TALEP_DURUMU map'ten mevcut mapping'leri
 * ProcessStatusMapping tablosuna sync eder.
 * POST /api/statuses/sync-mapping
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  try {
    // Mevcut mapping kontrolü
    const existingMappings = await prisma.processStatusMapping.findMany();
    if (existingMappings.length > 0) {
      return NextResponse.json({
        ok: true,
        message: `Hali hazırda ${existingMappings.length} mapping var. Sync atlandı.`,
        existingCount: existingMappings.length,
      });
    }

    // Talep durumları (id → name)
    const requestStatuses = await prisma.requestStatus.findMany({
      select: { id: true, name: true },
    });
    const reqNameToId = new Map<string, string>(
      requestStatuses.map((rs) => [rs.name, rs.id])
    );

    // Aday durumları (id → name)
    const processStatuses = await prisma.processStatus.findMany({
      select: { id: true, name: true },
    });
    const psNameToId = new Map<string, string>(
      processStatuses.map((ps) => [ps.name, ps.id])
    );

    // RequestStatus ID lookup name'den
    const reqIdByName = new Map<string, string>();
    for (const rs of requestStatuses) reqIdByName.set(rs.name, rs.id);

    // DB-driven eşleştirmeleri oluştur
    const mappings: { psId: string; rsId: string }[] = [];

    for (const [processName, requestName] of [
      // CV → Teklif
      ["Müşteriye İletildi", "Müşteri Teklif Değerlendirmesinde"],
      // Görüşme → Görüşme
      ["Görüşme Planlandı", "Görüşme Aşamasında"],
      ["Görüşme Tamamlandı", "Görüşme Aşamasında"],
      // Teklif/Seçim
      ["Dış Kaynak Hizmet Teklifi İletildi", "Seçim ve Başlangıç Planlaması"],
      ["Aday Seçildi", "Seçim ve Başlangıç Planlaması"],
      // İşe Giriş
      ["Başlangıç Tarihi Netleştiriliyor", "İşe Giriş Sürecinde"],
      ["İşe Giriş Evrakları Hazırlanıyor", "İşe Giriş Sürecinde"],
      ["Evraklar Teslim Edildi", "İşe Giriş Sürecinde"],
      ["Başlangıca Hazır", "İşe Giriş Sürecinde"],
      // Kapanış
      ["İşe Başladı", "Talep Karşılandı"],
      ["İç Değerlendirmede Uygun Bulunmadı", "Karşılanamadan Kapatıldı"],
      ["Müşteri Tarafından Uygun Bulunmadı", "İptal Edildi"],
      ["Aday Süreçten Çekildi", "İptal Edildi"],
      ["Aday Süreci Beklemede", "Beklemeye Alındı"],
    ] as [string, string][]) {
      const psId = psNameToId.get(processName);
      const rsId = reqIdByName.get(requestName);

      if (psId && rsId) {
        mappings.push({ psId, rsId });
      }
    }

    // Bulk insert
    let inserted = 0;
    for (const { psId, rsId } of mappings) {
      const exists = await prisma.processStatusMapping.findFirst({
        where: { processStatusId: psId, requestStatusId: rsId },
      });
      if (!exists) {
        await prisma.processStatusMapping.create({
          data: { processStatusId: psId, requestStatusId: rsId, order: 0 },
        });
        inserted++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Sync tamamlandı: ${inserted} yeni mapping eklendi.`,
      insertedCount: inserted,
      totalMappings: inserted + existingMappings.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
