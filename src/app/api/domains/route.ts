import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const domains = await prisma.domain.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, requests: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(domains);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  let body: { name?: string; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Alan adı zorunlu." }, { status: 400 });
  }

  // Aynı ad üst-alan altında veya üst-alan olmadan duplikasyon kontrolü
  const duplicate = await prisma.domain.findFirst({
    where: {
      name,
      OR: [
        { parentId: body.parentId ?? null },
        ...(body.parentId ? [{ parentId: null, name }] as const : []),
      ],
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: `"${name}" zaten var.` }, { status: 409 });
  }

  try {
    const domain = await prisma.domain.create({
      data: {
        name,
        parentId: body.parentId || null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, requests: true } },
      },
    });
    return NextResponse.json(domain, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Alan adı eklenemedi." }, { status: 500 });
  }
}
