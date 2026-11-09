import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Tip = "talep" | "surec";

/** Talep statüleri için geçerli tonlar (yeni sistem) */
const TALEP_TONLARI = new Set(["aktif", "beklemede", "kapali"]);

/** Talep statüsü için order bazlı otomatik ton atama */
function otomatikTonBelirle(order: number): string {
  if (order <= 5) return "aktif";       // Talep Alındı → İşe Giriş Süreci
  if (order === 6) return "kapali";     // Talep Karşılandı
  if (order === 7) return "beklemede";  // Beklemede
  return "kapali";                      // İptal, Karşılanamadı
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    ad?: string;
    sira?: number;
    ton?: string;
  } | null;
  if (!body || !body.ad?.trim() || (body.tip !== "talep" && body.tip !== "surec")) {
    return NextResponse.json({ error: "Tip ve ad zorunludur." }, { status: 400 });
  }

  const ad = body.ad.trim();
  let ton = "aktif"; // Varsayılan: aktif

  try {
    if (body.tip === "talep") {
      const order = body.sira ?? (await prisma.requestStatus.count());
      // Otomatik ton atama — API'den gelen ton yoksa veya geçersizse otomatik ata
      const requestedTon = body.ton?.trim();
      ton = requestedTon && TALEP_TONLARI.has(requestedTon) ? requestedTon : otomatikTonBelirle(order);
      const kayit = await prisma.requestStatus.create({ data: { name: ad, order, ton } });
      return NextResponse.json({ ok: true, kayit }, { status: 201 });
    }
    const order = body.sira ?? (await prisma.processStatus.count());
    const kayit = await prisma.processStatus.create({ data: { name: ad, order, ton } });
    return NextResponse.json({ ok: true, kayit }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu statü zaten mevcut." }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    id?: string;
    ad?: string;
    ton?: string;
  } | null;
  if (
    !body ||
    !body.id ||
    !body.ad?.trim() ||
    (body.tip !== "talep" && body.tip !== "surec")
  ) {
    return NextResponse.json({ error: "Tip, id ve ad zorunludur." }, { status: 400 });
  }

  const data: { name: string; ton?: string } = { name: body.ad.trim() };
  if (body.ton !== undefined && body.ton !== null && body.ton.trim()) {
    const ton = body.ton.trim();
    if (body.tip === "talep") {
      data.ton = TALEP_TONLARI.has(ton) ? ton : undefined;
    } else {
      // Süreç statüleri için eski tonları da kabul et (backward compatibility)
      const eskiTonlar = new Set(["yeni","ic","dis","gorsme","secim","kabul","karsilandi","bekliyor","kapandi","varsayilan", ...TALEP_TONLARI]);
      data.ton = eskiTonlar.has(ton) ? ton : undefined;
    }
  }

  try {
    if (body.tip === "talep") {
      const kayit = await prisma.requestStatus.update({
        where: { id: body.id },
        data,
      });
      return NextResponse.json({ ok: true, kayit });
    }
    const kayit = await prisma.processStatus.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json({ ok: true, kayit });
  } catch {
    return NextResponse.json({ error: "Statü bulunamadı veya ad çakışıyor." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    tip?: Tip;
    id?: string;
  } | null;
  if (!body || !body.id || (body.tip !== "talep" && body.tip !== "surec")) {
    return NextResponse.json({ error: "Tip ve id zorunludur." }, { status: 400 });
  }

  try {
    if (body.tip === "talep") {
      await prisma.requestStatus.delete({ where: { id: body.id } });
    } else {
      await prisma.processStatus.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Statü bulunamadı." }, { status: 404 });
  }
}
