import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  let body: {
    requestOwner?: string;
    candidateType?: string;
    quantity?: string;
    notes?: string;
    currentNote?: string;
    statusId?: string;
    deadline?: string | null;
    adessoDuration?: string | null;
    departmentId?: string;
    domainId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const requestOwner = body.requestOwner?.trim();
  const candidateType = body.candidateType?.trim();
  if (!requestOwner || !candidateType || !body.departmentId) {
    return NextResponse.json(
      { error: "Talep sahibi, aday türü ve iş birimi zorunludur." },
      { status: 400 }
    );
  }

  const department = await prisma.department.findUnique({
    where: { id: body.departmentId },
  });
  if (!department) {
    return NextResponse.json({ error: "Geçersiz iş birimi." }, { status: 400 });
  }

  const quantityText = body.quantity?.trim();
  if (quantityText) {
    const quantityNum = Number(quantityText);
    if (!/^\d+$/.test(quantityText) || quantityNum < 1 || quantityNum > 100) {
      return NextResponse.json(
        { error: "Adet 1 ile 100 arasında bir tam sayı olmalıdır." },
        { status: 400 }
      );
    }
  }

  let deadline: Date | null = null;
  if (body.deadline) {
    const d = new Date(body.deadline);
    if (!Number.isNaN(d.getTime())) deadline = d;
  }

  let adessoDuration: Date | null = null;
  if (body.adessoDuration) {
    const d = new Date(body.adessoDuration);
    if (!Number.isNaN(d.getTime())) adessoDuration = d;
  }

  // Varsayılan talep durumu: en düşük sira'lı "yeni" ton (ya da ilk kayıt)
  let statusId: string | null = null;
  if (body.statusId) {
    const d = await prisma.requestStatus.findUnique({ where: { id: body.statusId } });
    if (d) statusId = d.id;
  }
  if (!statusId) {
    const varsayilan = await prisma.requestStatus.findFirst({
      where: { ton: "yeni" },
      orderBy: { order: "asc" },
    });
    statusId = varsayilan?.id ?? null;
  }

  try {
    const request = await prisma.request.create({
      data: {
        requestOwner,
        candidateType,
        quantity: body.quantity?.trim() || null,
        notes: body.notes?.trim() || null,
        currentNote: body.currentNote?.trim() || null,
        statusId,
        deadline,
        adessoDuration,
        departmentId: department.id,
        createdById: user.id,
        domainId: body.domainId || null,
      },
    });


    return NextResponse.json({ ok: true, request }, { status: 201 });
  } catch (err: any) {
    console.error("Talep oluşturulurken hata:", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu talep zaten mevcut." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Talep oluşturulamadı." },
      { status: 500 }
    );
  }
}
