-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsBirimi" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,

    CONSTRAINT "IsBirimi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talep" (
    "id" TEXT NOT NULL,
    "talepNo" SERIAL NOT NULL,
    "talepSahibi" TEXT NOT NULL,
    "adayTuru" TEXT NOT NULL,
    "adet" TEXT,
    "notlar" TEXT,
    "guncelNot" TEXT,
    "durumAdi" TEXT NOT NULL,
    "olusturulmaTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "isBirimiId" TEXT NOT NULL,
    "olusturanId" TEXT,

    CONSTRAINT "Talep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aday" (
    "id" TEXT NOT NULL,
    "talepId" TEXT NOT NULL,
    "domain" TEXT,
    "talepDetaylari" TEXT,
    "adayAdi" TEXT NOT NULL,
    "source" TEXT,
    "surecDurumAdi" TEXT,
    "adayCost" TEXT,
    "iseBaslamaTarihi" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalepDurumu" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TalepDurumu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurecDurumu" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SurecDurumu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Firma_ad_key" ON "Firma"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "IsBirimi_firmaId_ad_key" ON "IsBirimi"("firmaId", "ad");

-- CreateIndex
CREATE UNIQUE INDEX "Talep_talepNo_key" ON "Talep"("talepNo");

-- CreateIndex
CREATE UNIQUE INDEX "TalepDurumu_ad_key" ON "TalepDurumu"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "SurecDurumu_ad_key" ON "SurecDurumu"("ad");

-- AddForeignKey
ALTER TABLE "IsBirimi" ADD CONSTRAINT "IsBirimi_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talep" ADD CONSTRAINT "Talep_isBirimiId_fkey" FOREIGN KEY ("isBirimiId") REFERENCES "IsBirimi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talep" ADD CONSTRAINT "Talep_olusturanId_fkey" FOREIGN KEY ("olusturanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aday" ADD CONSTRAINT "Aday_talepId_fkey" FOREIGN KEY ("talepId") REFERENCES "Talep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
