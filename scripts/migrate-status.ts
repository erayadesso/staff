import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * FK tabanlı statü mimarisine geçiş sonrası idempotent yardımcı:
 *  - Durum tablolarında bilinen ad -> ton eşlemesini uygular (varsayılan bırakılanları düzeltir).
 *  - Talep/Aday FK'larının dağılımını doğrular.
 * Migrasyon uygulanmadan önce çalıştırılabilir (ton/sira eşlemesi boşta tamamlanabilir).
 */

const TALEP_TON: Record<string, string> = {
  "Talep Alındı": "yeni",
  "Aday Taraması Yapılıyor": "ic",
  "İç Değerlendirmede": "ic",
  "Müşteri Değerlendirmesinde": "dis",
  "Müşteri Teklif Değerlendirmesinde": "dis",
  "Görüşme Aşamasında": "gorsme",
  "Seçim ve Başlangıç Planlaması": "secim",
  "İşe Giriş Sürecinde": "kabul",
  "Başlangıca Hazır": "kabul",
  "Talep Karşılandı": "karsilandi",
  "Beklemeye Alındı": "bekliyor",
  "İptal Edildi": "kapandi",
  "Karşılanamadan Kapatıldı": "kapandi",
};

const SUREC_TON: Record<string, string> = {
  "Aday Belirlendi": "ic",
  "İç Değerlendirmede": "ic",
  "Sunum İçin Onaylandı": "ic",
  "NoName CV Hazırlanıyor": "dis",
  "Müşteriye Sunuma Hazır": "dis",
  "Müşteriye İletildi": "dis",
  "Müşteri Değerlendirmesinde": "dis",
  "Görüşme Talep Edildi": "gorsme",
  "Görüşme Planlandı": "gorsme",
  "Görüşme Tamamlandı": "gorsme",
  "Aday Seçildi": "secim",
  "Başlangıç Tarihi Netleştiriliyor": "secim",
  "İşe Giriş Evrakları Hazırlanıyor": "kabul",
  "Evraklar Teslim Edildi": "kabul",
  "Başlangıca Hazır": "kabul",
  "İşe Başladı": "karsilandi",
  "İç Değerlendirmede Uygun Bulunmadı": "kapandi",
  "Müşteri Tarafından Uygun Bulunmadı": "kapandi",
  "Aday Süreçten Çekildi": "kapandi",
  "Aday Süreci Beklemede": "bekliyor",
};

async function main() {
  let talepTon = 0;
  const talepDurumlari = await prisma.talepDurumu.findMany();
  for (const td of talepDurumlari) {
    const ton = TALEP_TON[td.ad];
    if (ton && ton !== td.ton) {
      await prisma.talepDurumu.update({ where: { id: td.id }, data: { ton } });
      talepTon++;
    }
  }
  console.log(`TalepDurumu ton guncellenen: ${talepTon}`);

  let surecTon = 0;
  const surecDurumlari = await prisma.surecDurumu.findMany();
  for (const sd of surecDurumlari) {
    const ton = SUREC_TON[sd.ad];
    if (ton && ton !== sd.ton) {
      await prisma.surecDurumu.update({ where: { id: sd.id }, data: { ton } });
      surecTon++;
    }
  }
  console.log(`SurecDurumu ton guncellenen: ${surecTon}`);

  const bagliTalep = await prisma.talep.count({ where: { durumId: { not: null } } });
  const toplamTalep = await prisma.talep.count();
  console.log(`Talep durumId dolu: ${bagliTalep}/${toplamTalep}`);

  const bagliAday = await prisma.aday.count({ where: { surecDurumId: { not: null } } });
  const toplamAday = await prisma.aday.count();
  console.log(`Aday surecDurumId dolu: ${bagliAday}/${toplamAday}`);
}

main().finally(() => prisma.$disconnect());
