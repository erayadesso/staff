import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const YENI_TALEP_STATULERI = [
  "Talep Alındı",
  "Aday Taraması Yapılıyor",
  "İç Değerlendirmede",
  "Müşteri Değerlendirmesinde",
  "Görüşme Aşamasında",
  "Seçim ve Başlangıç Planlaması",
  "İşe Giriş Sürecinde",
  "Başlangıca Hazır",
  "Talep Karşılandı",
  "Beklemeye Alındı",
  "İptal Edildi",
  "Karşılanamadan Kapatıldı",
];

const YENI_ADAY_STATULERI = [
  "Aday Belirlendi",
  "İç Değerlendirmede",
  "Sunum İçin Onaylandı",
  "NoName CV Hazırlanıyor",
  "Müşteriye Sunuma Hazır",
  "Müşteriye İletildi",
  "Müşteri Değerlendirmesinde",
  "Görüşme Talep Edildi",
  "Görüşme Planlandı",
  "Görüşme Tamamlandı",
  "Müşteri Geri Bildirimi Bekleniyor",
  "Aday Seçildi",
  "Başlangıç Tarihi Netleştiriliyor",
  "İşe Giriş Evrakları Hazırlanıyor",
  "Evraklar Teslim Edildi",
  "Başlangıca Hazır",
  "İşe Başladı",
  "İç Değerlendirmede Uygun Bulunmadı",
  "Müşteri Tarafından Uygun Bulunmadı",
  "Aday Süreçten Çekildi",
  "Aday Süreci Beklemede",
];

// Eski talep durumu -> yeni talep durumu
const TALEP_MAP: Record<string, string> = {
  "🆕 Yeni Talep": "Talep Alındı",
  "🔵 Süreç Devam Ediyor": "Aday Taraması Yapılıyor", // sonra otomatik dahilinde en ileri adaya göre belirlenecek
  "🟡 Sürece Dahil Olmadık": "Karşılanamadan Kapatıldı",
  "🔴 Lost": "Karşılanamadan Kapatıldı",
  "✅ Completed": "Talep Karşılandı",
  "🔵 Beklemede": "Beklemeye Alındı",
  "🔴 Geri Çekildi": "İptal Edildi",
  "": "Talep Alındı",
};

// Eski aday durumu -> yeni aday durumu
const ADAY_MAP: Record<string, string> = {
  "⚪️ TechHead CV Taraması": "Aday Belirlendi",
  "🔵 adesso - Aday tarama sürecinde": "Aday Belirlendi",
  "🔵 CV hazırlanıyor": "NoName CV Hazırlanıyor",
  "🔵 CV Kalitesi Yetersiz - Yeni CV Bekleniyor": "NoName CV Hazırlanıyor",
  "🔵 CV müşteriye gönderilmek üzere hazırlandı": "Müşteriye Sunuma Hazır",
  "🔵 CV gönderildi": "Müşteriye İletildi",
  "🟡 Müşteri görüşmesi": "Görüşme Planlandı",
  "🔵 İkinci müşteri görüşmesi": "Görüşme Planlandı",
  "🟡 adesso - Aday görüşmesi": "Görüşme Tamamlandı",
  "🟢 Müşteri görüşmesi tamamlandı - Sonuç bekleniyor": "Müşteri Geri Bildirimi Bekleniyor",
  "⏳ Müşteri bekleniyor": "Müşteri Geri Bildirimi Bekleniyor",
  "🔴 Müşteri görüşmesi olumsuz": "Müşteri Tarafından Uygun Bulunmadı",
  "Müşteri görüşmesi olumsuz": "Müşteri Tarafından Uygun Bulunmadı",
  "Müşteri Görüşmesi Olumsuz": "Müşteri Tarafından Uygun Bulunmadı",
  "🔴 Müşteri beğenmedi": "Müşteri Tarafından Uygun Bulunmadı",
  "🔴 Müşteri talebi değişti": "Müşteri Tarafından Uygun Bulunmadı",
  "🟢 Müşteri beğendi": "Aday Seçildi",
  "🟢 Müşteri beğendi - Teklif Talep Etti": "Aday Seçildi",
  "🟢 Teklif yapıldı": "Aday Seçildi",
  "🟢 Teklif kabul": "Aday Seçildi",
  "Teklif Kabul": "Aday Seçildi",
  "✅ Onaylandı": "Aday Seçildi",
  "🔴 Aday süreçten çekildi": "Aday Süreçten Çekildi",
  "🔴 Farklı projeye atandı": "Aday Süreçten Çekildi",
  "🔴 Uygun CV Bulunamadı. LOST": "İç Değerlendirmede Uygun Bulunmadı",
  "🟢 Müşteri Satın Alma Formu Bekleniyor": "Başlangıç Tarihi Netleştiriliyor",
  "🔴 Sözleşme süreci": "İşe Giriş Evrakları Hazırlanıyor",
  "✅ İşe başladı": "İşe Başladı",
  "⏸️ Aday süreci beklemede": "Aday Süreci Beklemede",
};

async function main() {
  // 1. Talepleri güncelle
  console.log("=== Talep durumlari guncelleniyor ===");
  const talepler = await prisma.talep.findMany({ select: { id: true, durumAdi: true } });
  for (const t of talepler) {
    const yeni = TALEP_MAP[t.durumAdi];
    if (yeni && yeni !== t.durumAdi) {
      await prisma.talep.update({ where: { id: t.id }, data: { durumAdi: yeni } });
      console.log(`  "${t.durumAdi}" -> "${yeni}"`);
    } else if (!yeni) {
      console.log(`  !! Eslesme yok (dokunulmadi): "${t.durumAdi}"`);
    }
  }

  // 2. Adaylari guncelle
  console.log("\n=== Aday durumlari guncelleniyor ===");
  const adaylar = await prisma.aday.findMany({ select: { id: true, surecDurumAdi: true } });
  for (const a of adaylar) {
    if (a.surecDurumAdi == null) continue;
    const yeni = ADAY_MAP[a.surecDurumAdi];
    if (yeni && yeni !== a.surecDurumAdi) {
      await prisma.aday.update({ where: { id: a.id }, data: { surecDurumAdi: yeni } });
      console.log(`  "${a.surecDurumAdi}" -> "${yeni}"`);
    } else if (!yeni) {
      console.log(`  !! Eslesme yok (dokunulmadi): "${a.surecDurumAdi}"`);
    }
  }

  // 3. TalepDurumu tablosunu yenile
  console.log("\n=== TalepDurumu tablosu yenileniyor ===");
  await prisma.talepDurumu.deleteMany({});
  for (let i = 0; i < YENI_TALEP_STATULERI.length; i++) {
    await prisma.talepDurumu.create({
      data: { ad: YENI_TALEP_STATULERI[i], sira: i },
    });
  }

  // 4. SurecDurumu tablosunu yenile
  console.log("=== SurecDurumu tablosu yenileniyor ===");
  await prisma.surecDurumu.deleteMany({});
  for (let i = 0; i < YENI_ADAY_STATULERI.length; i++) {
    await prisma.surecDurumu.create({
      data: { ad: YENI_ADAY_STATULERI[i], sira: i },
    });
  }

  console.log("\n✅ Tamamlandi");
}

main().catch(console.error).finally(() => process.exit());
