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

    // domain.ts ADAYDAN_TALEP_DURUMU map'ten eşleştirmeleri parse et
    // Bu mapping manuel olarak domain.ts'den okunur
    const domainMappings: [processName: string, requestName: string | null][] = [
      // CV Süreci
      ["CV gönderildi", "📤 Müşteriye Sunuldu"],
      // Müşteri Süreci
      ["Müşteri görüşmesi", "🤝 Görüşme Yapılıyor"],
      ["Müşteri beğendi", "🤝 Görüşme Yapılıyor"],
      ["adesso - Aday görüşmesi", "🤝 Görüşme Yapılıyor"],
      ["İkinci müşteri görüşmesi", "🤝 Görüşme Yapılıyor"],
      // Teklif/Sözleşme
      ["Teklif yapıldı", "🎯 Aday Seçildi"],
      ["Teklif kabul", "📝 İşe Giriş Süreci"],
      ["Sözleşme süreci", "📝 İşe Giriş Süreci"],
      // Çıkış/Kapanış
      ["İşe başladı", "✅ Talep Karşılandı"],
      ["Uygun CV Bulunamadı. LOST", "🔴 Karşılanamadı"],
      ["Farklı projeye atandı", "❌ İptal Edildi"],
      ["Müşteri talebi değişti", "❌ İptal Edildi"],
      // Diğer
      ["Aday süreci beklemede", "⏸️ Beklemede"],
      ["İşe giriş evrakları hazırlanıyor", "📝 İşe Giriş Süreci"],
      ["Evraklar teslim edildi", "📝 İşe Giriş Süreci"],
      ["Başlangıca hazır", "📝 İşe Giriş Süreci"],
    ];

    // Mevcut DB isimleriyle eşleştir
    const inserts = [];
    const skipped: string[] = [];

    for (const [processName, requestName] of domainMappings) {
      // null olanları atla (talep durumu değişmez)
      if (!requestName) {
        skipped.push(`${processName} → (null, atlandı)`);
        continue;
      }

      const psId = psNameToId.get(processName);
      const rsId = reqNameToId.get(requestName);

      if (!psId) {
        skipped.push(`${processName} → ${requestName} (ProcessStatus bulunamadı)`);
        continue;
      }
      if (!rsId) {
        skipped.push(`${processName} → ${requestName} (RequestStatus bulunamadı)`);
        continue;
      }

      // Zaten var mı kontrol et
      const exists = await prisma.processStatusMapping.findFirst({
        where: { processStatusId: psId, requestStatusId: rsId },
      });
      if (exists) continue;

      inserts.push({ psId, rsId });
    }

    // Bulk insert
    if (inserts.length > 0) {
      // Prisma ile tek seferde insert
      for (const ins of inserts) {
        await prisma.processStatusMapping.create({
          data: {
            processStatusId: ins.psId,
            requestStatusId: ins.rsId,
            order: 0,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Sync tamamlandı: ${inserts.length} yeni mapping eklendi, ${skipped.length} atlandı.`,
      insertedCount: inserts.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
