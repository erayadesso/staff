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
    candidateName?: string;
    domain?: string;
    requestDetails?: string;
    source?: string;
    processStatusId?: string;
    cost?: string;
    startDate?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const candidateName = body.candidateName?.trim();
  if (!candidateName || !body.requestId) {
    return NextResponse.json(
      { error: "Aday adı ve talep zorunludur." },
      { status: 400 }
    );
  }

  const reqObj = await prisma.request.findUnique({
    where: { id: body.requestId },
  });
  if (!reqObj) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  let startDate: Date | null = null;
  if (body.startDate) {
    const d = new Date(body.startDate);
    if (!Number.isNaN(d.getTime())) startDate = d;
  }

  const candidate = await prisma.candidate.create({
    data: {
      requestId: reqObj.id,
      candidateName,
      domain: body.domain?.trim() || null,
      requestDetails: body.requestDetails?.trim() || null,
      source: body.source?.trim() || null,
      processStatusId: body.processStatusId || null,
      cost: body.cost?.trim() || null,
      startDate,
    },
  });

  // Yeni aday eklendikten sonra talebin statüsünü otomatik güncelle
  await talepDurumunuGuncelle(reqObj.id);

  return NextResponse.json({ ok: true, candidate }, { status: 201 });
}
