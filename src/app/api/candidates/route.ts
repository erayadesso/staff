import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { talepDurumunuGuncelle } from "@/lib/otomatik-talep";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: {
    requestId?: string;
    request_id?: string;
    candidateName?: string;
    adayAdi?: string;
    domain?: string;
    requestDetails?: string;
    talepDetaylari?: string;
    source?: string;
    processStatusId?: string;
    surecDurumId?: string;
    cost?: string;
    adayCost?: string;
    startDate?: string | null;
    iseBaslamaTarihi?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // Hem camelCase hem snake_case kabul et (kaynaşma dönemi)
  const requestId = body.requestId ?? body.request_id;
  const candidateName = (body.candidateName ?? body.adayAdi)?.trim();
  if (!candidateName || !requestId) {
    return NextResponse.json(
      { error: "Aday adı ve talep zorunludur." },
      { status: 400 }
    );
  }

  const reqObj = await prisma.request.findUnique({
    where: { id: requestId },
  });
  if (!reqObj) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  let startDate: Date | null = null;
  const startDateRaw = body.startDate ?? body.iseBaslamaTarihi;
  if (startDateRaw) {
    const d = new Date(startDateRaw);
    if (!Number.isNaN(d.getTime())) startDate = d;
  }

  const candidate = await prisma.candidate.create({
    data: {
      requestId: reqObj.id,
      candidateName,
      domain: body.domain?.trim() || null,
      requestDetails: (body.requestDetails ?? body.talepDetaylari) || null,
      source: body.source?.trim() || null,
      processStatusId: (body.processStatusId ?? body.surecDurumId) || null,
      cost: (body.cost ?? body.adayCost)?.trim() || null,
      startDate,
    },
  });

  // Yeni aday eklendikten sonra talebin statüsünü otomatik güncelle
  await talepDurumunuGuncelle(reqObj.id);

  return NextResponse.json({ ok: true, candidate }, { status: 201 });
}
