-- Statü yönetimi FK tabanlı dinamik mimariye geçiş
-- 1) Ton alanları eklenir
ALTER TABLE "SurecDurumu" ADD COLUMN "ton" TEXT NOT NULL DEFAULT 'varsayilan';
ALTER TABLE "TalepDurumu" ADD COLUMN "ton" TEXT NOT NULL DEFAULT 'varsayilan';

-- 2) Talep/Aday için FK sütunları eklenir
ALTER TABLE "Talep" ADD COLUMN "durumId" TEXT;
ALTER TABLE "Aday" ADD COLUMN "surecDurumId" TEXT;

-- 3) Yeni statü ekle (Müşteri Geri Bildirimi Bekleniyor → Dış Kaynak Hizmet Teklifi İletildi)
UPDATE "SurecDurumu" SET "ad" = 'Dış Kaynak Hizmet Teklifi İletildi' WHERE "ad" = 'Müşteri Geri Bildirimi Bekleniyor';
INSERT INTO "TalepDurumu" ("id", "ad", "sira", "ton")
  SELECT gen_random_uuid(), 'Müşteri Teklif Değerlendirmesinde', 6, 'dis'
  WHERE NOT EXISTS (SELECT 1 FROM "TalepDurumu" WHERE "ad" = 'Müşteri Teklif Değerlendirmesinde');

-- 4) Durum tablolarına ad -> ton eşlemesi
UPDATE "TalepDurumu" SET "ton" = 'yeni'      WHERE "ad" = 'Talep Alındı';
UPDATE "TalepDurumu" SET "ton" = 'ic'        WHERE "ad" IN ('Aday Taraması Yapılıyor','İç Değerlendirmede');
UPDATE "TalepDurumu" SET "ton" = 'dis'       WHERE "ad" IN ('Müşteri Değerlendirmesinde','Müşteri Teklif Değerlendirmesinde');
UPDATE "TalepDurumu" SET "ton" = 'gorsme'    WHERE "ad" = 'Görüşme Aşamasında';
UPDATE "TalepDurumu" SET "ton" = 'secim'     WHERE "ad" = 'Seçim ve Başlangıç Planlaması';
UPDATE "TalepDurumu" SET "ton" = 'kabul'     WHERE "ad" IN ('İşe Giriş Sürecinde','Başlangıca Hazır');
UPDATE "TalepDurumu" SET "ton" = 'karsilandi' WHERE "ad" = 'Talep Karşılandı';
UPDATE "TalepDurumu" SET "ton" = 'bekliyor'  WHERE "ad" = 'Beklemeye Alındı';
UPDATE "TalepDurumu" SET "ton" = 'kapandi'   WHERE "ad" IN ('İptal Edildi','Karşılanamadan Kapatıldı');

UPDATE "SurecDurumu" SET "ton" = 'ic'         WHERE "ad" IN ('Aday Belirlendi','İç Değerlendirmede','Sunum İçin Onaylandı');
UPDATE "SurecDurumu" SET "ton" = 'dis'        WHERE "ad" IN ('NoName CV Hazırlanıyor','Müşteriye Sunuma Hazır','Müşteriye İletildi','Müşteri Değerlendirmesinde');
UPDATE "SurecDurumu" SET "ton" = 'gorsme'     WHERE "ad" IN ('Görüşme Talep Edildi','Görüşme Planlandı','Görüşme Tamamlandı','Dış Kaynak Hizmet Teklifi İletildi');
UPDATE "SurecDurumu" SET "ton" = 'secim'      WHERE "ad" IN ('Aday Seçildi','Başlangıç Tarihi Netleştiriliyor');
UPDATE "SurecDurumu" SET "ton" = 'kabul'      WHERE "ad" IN ('İşe Giriş Evrakları Hazırlanıyor','Evraklar Teslim Edildi','Başlangıca Hazır');
UPDATE "SurecDurumu" SET "ton" = 'karsilandi' WHERE "ad" = 'İşe Başladı';
UPDATE "SurecDurumu" SET "ton" = 'bekliyor'   WHERE "ad" = 'Aday Süreci Beklemede';
UPDATE "SurecDurumu" SET "ton" = 'kapandi'    WHERE "ad" IN ('İç Değerlendirmede Uygun Bulunmadı','Müşteri Tarafından Uygun Bulunmadı','Aday Süreçten Çekildi');

-- 5) Eski string statü değerlerini karşılık gelen FK'ya eşle
UPDATE "Talep" t
SET "durumId" = d."id"
FROM "TalepDurumu" d
WHERE d."ad" = t."durumAdi"
  AND t."durumAdi" IS NOT NULL
  AND t."durumAdi" <> '';

UPDATE "Aday" a
SET "surecDurumId" = d."id"
FROM "SurecDurumu" d
WHERE d."ad" = a."surecDurumAdi"
  AND a."surecDurumAdi" IS NOT NULL
  AND a."surecDurumAdi" <> '';

-- Eşleşmeyen talepler için "yeni" tona düş
UPDATE "Talep" t
SET "durumId" = d."id"
FROM "TalepDurumu" d
WHERE t."durumId" IS NULL
  AND d."ton" = 'yeni'
  AND d."sira" = (SELECT MIN("sira") FROM "TalepDurumu" WHERE "ton" = 'yeni');

-- 6) Indeks + FK eklenir
CREATE INDEX "Talep_durumId_idx" ON "Talep"("durumId");
CREATE INDEX "Aday_surecDurumId_idx" ON "Aday"("surecDurumId");

ALTER TABLE "Talep" ADD CONSTRAINT "Talep_durumId_fkey" FOREIGN KEY ("durumId") REFERENCES "TalepDurumu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Aday" ADD CONSTRAINT "Aday_surecDurumId_fkey" FOREIGN KEY ("surecDurumId") REFERENCES "SurecDurumu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7) Eski string sütunları kaldırılır
ALTER TABLE "Talep" DROP COLUMN "durumAdi";
ALTER TABLE "Aday" DROP COLUMN "surecDurumAdi";
