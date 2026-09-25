import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Bootstrap + referans verileri yükler.
 * Kullanım: npm run seed
 * - İlk Admin hesabını oluşturur
 * - Firma / İş Birimi / Talep & Süreç durumlarını (TANIMLAMALAR'dan) ekler
 */
const prisma = new PrismaClient();

const ADMIN_EMAIL = "eray.aykilic@adesso.com.tr";
const ADMIN_NAME = "Eray Aykılıç";
const ADMIN_PASSWORD = "Nevsehir123456789!";

const TALEP_DURUMLARI = [
  "🆕 Yeni Talep",
  "🔵 Süreç Devam Ediyor",
  "🟡 Sürece Dahil Olmadık",
  "🔴 Lost",
  "✅ Completed",
  "🔵 Beklemede",
  "🔴 Geri Çekildi",
];

const SUREC_DURUMLARI = [
  "⚪️ TechHead CV Taraması",
  "🔵 CV hazırlanıyor",
  "🔵 CV müşteriye gönderilmek üzere hazırlandı",
  "🔵 CV gönderildi",
  "🟡 Müşteri görüşmesi",
  "🔴 Müşteri görüşmesi olumsuz",
  "🔴 Müşteri beğenmedi",
  "🟢 Müşteri beğendi",
  "✅ Onaylandı",
  "🔴 Aday süreçten çekildi",
  "⏳ Müşteri bekleniyor",
  "🔵 adesso - Aday tarama sürecinde",
  "🟡 adesso - Aday görüşmesi",
  "🟢 Müşteri Satın Alma Formu Bekleniyor",
  "🔴 Farklı projeye atandı",
  "🔴 Müşteri talebi değişti",
  "🟢 Müşteri beğendi - Teklif Talep Etti",
  "🔴 Uygun CV Bulunamadı. LOST",
  "🔵 CV Kalitesi Yetersiz - Yeni CV Bekleniyor",
  "🟢 Müşteri görüşmesi tamamlandı - Sonuç bekleniyor",
  "🟢 Teklif yapıldı",
  "🟢 Teklif kabul",
  "🔵 İkinci müşteri görüşmesi",
  "🔴 Sözleşme süreci",
  "✅ İşe başladı",
  "⏸️ Aday süreci beklemede",
];

// Excel'deki "Firma - İş Birimi" tanımlamaları (TANIMLAMALAR col C)
const FIRMA_IS_BIRIMLERI: Record<string, string[]> = {
  KFT: [
    "KFT - Remote",
    "KFT - Mobil Çözümler",
    "KFT - Gayri Nakdi Kullandırım Çözümleri",
    "KFT - Dijital Bankacılık Çözümleri",
    "KFT - Dijital Çözümler",
    "KFT - Tahsis Çözümleri",
    "KFT - Gişe Çözümleri",
    "KFT - Kurumsal Çözümler Servisi",
    "KFT - Takas ve Fraud Çözümler Servisi",
    "KFT - ATM ve POS Çözümler Servisi",
    "KFT - Proje Yönetim Ofisi",
    "KFT - Hazine Çözümleri",
    "KFT - Uygulama Geliştirme",
  ],
  Shell: ["Shell - B2B Çözümler", "Shell - B2C Çözümler"],
  N11: ["N11"],
  Opet: ["Opet - Superapp Dış Kaynak"],
  Eurail: ["Eurail"],
  chainiq: ["chainiq"],
  Aktech: ["Aktech"],
  Yıldıztech: [
    "Yıldıztech - QA",
    "Yıldıztech - AI",
    "Yıldıztech - DevOps",
  ],
  Hansgrohe: ["Hansgrohe - DevOps"],
  Edenred: ["Edenred"],
  "ING Bank": ["ING Bank"],
  "X Firması": ["X Firması"],
};

async function main() {
  // 1) Admin hesabı
  const email = ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: { email, name: ADMIN_NAME, passwordHash, role: "ADMIN" },
    });
    console.log(`Admin oluşturuldu: ${email}`);
  } else {
    console.log(`Admin zaten mevcut: ${email}`);
  }

  // 2) Firma + İş Birimleri (idempotent)
  for (const [firmaAd, birimler] of Object.entries(FIRMA_IS_BIRIMLERI)) {
    const firma = await prisma.firma.upsert({
      where: { ad: firmaAd },
      update: {},
      create: { ad: firmaAd },
    });
    for (const birimAd of birimler) {
      await prisma.isBirimi.upsert({
        where: { firmaId_ad: { firmaId: firma.id, ad: birimAd } },
        update: {},
        create: { firmaId: firma.id, ad: birimAd },
      });
    }
  }
  console.log(`Firma/İş Birimleri: ${Object.keys(FIRMA_IS_BIRIMLERI).length} firma`);

  // 3) Talep durumları
  for (let i = 0; i < TALEP_DURUMLARI.length; i++) {
    await prisma.talepDurumu.upsert({
      where: { ad: TALEP_DURUMLARI[i] },
      update: { sira: i },
      create: { ad: TALEP_DURUMLARI[i], sira: i },
    });
  }

  // 4) Süreç durumları
  for (let i = 0; i < SUREC_DURUMLARI.length; i++) {
    await prisma.surecDurumu.upsert({
      where: { ad: SUREC_DURUMLARI[i] },
      update: { sira: i },
      create: { ad: SUREC_DURUMLARI[i], sira: i },
    });
  }
  console.log(`Talep durumu: ${TALEP_DURUMLARI.length}, Süreç durumu: ${SUREC_DURUMLARI.length}`);
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
