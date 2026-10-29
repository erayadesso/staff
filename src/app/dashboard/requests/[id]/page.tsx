import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import AdayListesi from "@/components/AdayListesi";
import TalepDurumu from "@/components/TalepDurumu";
import TalepSilButonu from "@/components/TalepSilButonu";
import TalepStatuBadge from "@/components/TalepStatuBadge";
import {
  deadlineGecti,
  isBasariKapatildi,
  isKapaliDurum,
  kalanGun,
  pozisyonYasi,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function TalepDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          name: true,
          company: { select: { name: true } },
        },
      },
      status: { select: { id: true, name: true, order: true, ton: true } },
      createdBy: { select: { name: true, email: true } },
      domain: {
        select: { id: true, name: true, parent: { select: { id: true, name: true } } },
      },
      candidates: {
        select: {
          id: true,
          candidateName: true,
          source: true,
          processStatus: { select: { id: true, name: true, order: true, ton: true } },
          domain: true,
          cost: true,
          startDate: true,
          requestDetails: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Talep bulunamadı.{" "}
          <Link
            href="/dashboard/requests"
            className="text-zinc-900 underline dark:text-zinc-100"
          >
            Taleplere dön
          </Link>
        </p>
      </div>
    );
  }

  const processStatuses = await prisma.processStatus.findMany({
    orderBy: { order: "asc" },
  });
  const requestStatuses = await prisma.requestStatus.findMany({
    orderBy: { order: "asc" },
  });

  const acikAdaylar = request.candidates.filter(
    (a) => a.processStatus?.ton && a.processStatus.ton !== "kapandi" && a.processStatus.ton !== "bekliyor"
  ).length;

  const basariylaKapatildi = isBasariKapatildi(request.candidates, request.quantity);

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/requests"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Talepler
        </Link>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Talep #{request.requestNo} — {request.candidateType}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {request.department.company.name} · {request.department.name} ·{" "}
                {request.requestOwner}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isBasariKapatildi(request.candidates, request.quantity) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
                  ✅ Başarıyla Kapandı
                </span>
              )}
              <TalepStatuBadge durum={request.status} className="px-2 py-1 text-xs" />
              {user.role === "ADMIN" && (
                <TalepSilButonu requestNo={request.requestNo} requestId={request.id} />
              )}
            </div>
          </div>
      </div>

      {!basariylaKapatildi && deadlineGecti(request.status, request.deadline) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ Müşteri talep son geçerlilik tarihi (DEADLINE) geçti.
          {kalanGun(request.deadline) != null &&
            kalanGun(request.deadline)! < 0 && (
              <span className="ml-1 font-medium">
                {Math.abs(kalanGun(request.deadline)!)} gün geçti
              </span>
            )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Talep Bilgileri
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Adet</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {request.quantity ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Oluşturulma</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {fmtDate(request.createdAt)}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    ({basariylaKapatildi || isKapaliDurum(request.status)
                      ? pozisyonYasi(request.createdAt) + ' gündür kapalı'
                      : pozisyonYasi(request.createdAt) + ' gündür açık'
                    })
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Müşteri Son Geçerlilik</dt>
                <dd
                  className={
                    (!basariylaKapatildi && deadlineGecti(request.status, request.deadline))
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "font-medium text-zinc-800 dark:text-zinc-200"
                  }
                >
                  {fmtDate(request.deadline)}
                  {(!basariylaKapatildi && deadlineGecti(request.status, request.deadline)) && (
                    <span className="ml-1 inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      geçti
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">adesso Süresi (Hedef)</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {fmtDate(request.adessoDuration)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Oluşturan</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {request.createdBy?.name ?? "—"}
                </dd>
              </div>
              {request.domain && (
                <div>
                  <dt className="text-xs text-zinc-500">Yetkinlik Merkezi</dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {request.domain.parent ? (
                      <>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {request.domain.parent.name}
                        </span>{" "}
                        →{" "}
                      </>
                    ) : null}
                    {request.domain.name}
                  </dd>
                </div>
              )}
            </dl>
            {request.notes && (
              <div className="mt-4">
                <dt className="text-xs text-zinc-500">Notlar</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {request.notes}
                </dd>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Aday Listesi ({request.candidates.length})
              </h2>
              {acikAdaylar > 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {acikAdaylar} olumlu
                </span>
              )}
            </div>
            <AdayListesi
              adaylar={request.candidates.map((a) => ({
                id: a.id,
                candidateName: a.candidateName,
                source: a.source,
                processStatus: a.processStatus,
                domain: a.domain,
                cost: a.cost,
                startDate: a.startDate,
                requestDetails: a.requestDetails,
                createdAt: a.createdAt,
              }))}
              processStatuses={processStatuses}
              request_id={request.id}
            />
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <TalepDurumu
              requestId={request.id}
              statusId={request.statusId}
              currentNote={request.currentNote}
              requestStatuses={requestStatuses}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
