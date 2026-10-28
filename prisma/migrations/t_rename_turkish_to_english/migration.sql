-- Rename TalepDurumu -> RequestStatus
ALTER TABLE "TalepDurumu" RENAME TO "RequestStatus";
ALTER TABLE "TalepDurumu" RENAME CONSTRAINT "TalepDurumu_pkey" TO "RequestStatus_pkey";
ALTER INDEX IF EXISTS "TalepDurumu_ad_key" RENAME TO "RequestStatus_name_key";
ALTER TABLE "TalepDurumu" RENAME COLUMN "ad" TO "name";
ALTER TABLE "TalepDurumu" RENAME COLUMN "sira" TO "order";

-- Rename SurecDurumu -> ProcessStatus
ALTER TABLE "SurecDurumu" RENAME TO "ProcessStatus";
ALTER TABLE "SurecDurumu" RENAME CONSTRAINT "SurecDurumu_pkey" TO "ProcessStatus_pkey";
ALTER INDEX IF EXISTS "SurecDurumu_ad_key" RENAME TO "ProcessStatus_name_key";
ALTER TABLE "SurecDurumu" RENAME COLUMN "ad" TO "name";
ALTER TABLE "SurecDurumu" RENAME COLUMN "sira" TO "order";

-- Rename Firma -> Company
ALTER TABLE "Firma" RENAME TO "Company";
ALTER TABLE "Firma" RENAME CONSTRAINT "Firma_pkey" TO "Company_pkey";
ALTER INDEX IF EXISTS "Firma_ad_key" RENAME TO "Company_name_key";
ALTER TABLE "Firma" RENAME COLUMN "ad" TO "name";

-- Rename IsBirimi -> Department
ALTER TABLE "IsBirimi" RENAME TO "Department";
ALTER TABLE "IsBirimi" RENAME CONSTRAINT "IsBirimi_pkey" TO "Department_pkey";
ALTER INDEX IF EXISTS "IsBirimi_firmaId_ad_key" RENAME TO "Department_companyId_name_key";
ALTER TABLE "IsBirimi" RENAME COLUMN "ad" TO "name";
ALTER TABLE "IsBirimi" RENAME COLUMN "firmaId" TO "companyId";

-- Rename Talep -> Request
ALTER TABLE "Talep" RENAME TO "Request";
ALTER TABLE "Talep" RENAME CONSTRAINT "Talep_pkey" TO "Request_pkey";
ALTER TABLE "Talep" RENAME COLUMN "talepNo" TO "requestNo";
ALTER TABLE "Talep" RENAME COLUMN "talepSahibi" TO "requestOwner";
ALTER TABLE "Talep" RENAME COLUMN "adayTuru" TO "candidateType";
ALTER TABLE "Talep" RENAME COLUMN "adet" TO "quantity";
ALTER TABLE "Talep" RENAME COLUMN "notlar" TO "notes";
ALTER TABLE "Talep" RENAME COLUMN "guncelNot" TO "currentNote";
ALTER TABLE "Talep" RENAME COLUMN "durumId" TO "statusId";
ALTER TABLE "Talep" RENAME COLUMN "olusturulmaTarihi" TO "createdAt";
ALTER TABLE "Talep" RENAME COLUMN "deadline" TO "deadline";
ALTER TABLE "Talep" RENAME COLUMN "isBirimiId" TO "departmentId";
ALTER TABLE "Talep" RENAME COLUMN "olusturanId" TO "createdById";
ALTER TABLE "Talep" RENAME COLUMN "adessoSuresi" TO "adessoDuration";

-- Rename Aday -> Candidate
ALTER TABLE "Aday" RENAME TO "Candidate";
ALTER TABLE "Aday" RENAME CONSTRAINT "Aday_pkey" TO "Candidate_pkey";
ALTER TABLE "Aday" RENAME COLUMN "talepId" TO "requestId";
ALTER TABLE "Aday" RENAME COLUMN "talepDetaylari" TO "requestDetails";
ALTER TABLE "Aday" RENAME COLUMN "adayAdi" TO "candidateName";
ALTER TABLE "Aday" RENAME COLUMN "adayCost" TO "cost";
ALTER TABLE "Aday" RENAME COLUMN "iseBaslamaTarihi" TO "startDate";
ALTER TABLE "Aday" RENAME COLUMN "firmaAd" TO "clientName";
ALTER TABLE "Aday" RENAME COLUMN "surecDurumId" TO "processStatusId";

-- Update foreign key references
-- Request.statusId -> RequestStatus.id
DO $$ BEGIN
  ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Talep_durumId_fkey";
  ALTER TABLE "Request" ADD CONSTRAINT "Request_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "RequestStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Request.departmentId -> Department.id
DO $$ BEGIN
  ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Talep_isBirimiId_fkey";
  ALTER TABLE "Request" ADD CONSTRAINT "Request_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Request.createdById -> User.id
DO $$ BEGIN
  ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Talep_olusturanId_fkey";
  ALTER TABLE "Request" ADD CONSTRAINT "Request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Candidate.requestId -> Request.id (cascade delete)
DO $$ BEGIN
  ALTER TABLE "Candidate" DROP CONSTRAINT IF EXISTS "Aday_talepId_fkey";
  ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Candidate.processStatusId -> ProcessStatus.id
DO $$ BEGIN
  ALTER TABLE "Candidate" DROP CONSTRAINT IF EXISTS "Aday_surecDurumId_fkey";
  ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_processStatusId_fkey" FOREIGN KEY ("processStatusId") REFERENCES "ProcessStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Department.companyId -> Company.id
DO $$ BEGIN
  ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "IsBirimi_firmaId_fkey";
  ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Rename constraints for _count
DO $$ BEGIN
  ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Talep_adaylar_fkey";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Update _count junction table names
ALTER TABLE IF EXISTS "_TalepAday" RENAME TO "_RequestToCandidate";
ALTER TABLE "_RequestToCandidate" RENAME CONSTRAINT "_TalepAday_AB_unique" TO "_RequestToCandidate_AB_unique";
ALTER TABLE "_RequestToCandidate" RENAME CONSTRAINT "_TalepAday_B_fkey" TO "_RequestToCandidate_B_fkey";
ALTER TABLE "_RequestToCandidate" RENAME CONSTRAINT "_TalepAday_A_fkey" TO "_RequestToCandidate_A_fkey";
