import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdessoEmail } from "@/lib/domain";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { email?: string; name?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() ?? null;
  const password = body.password ?? "";
  const requestedRole = body.role === "ADMIN" ? "ADMIN" : "VIEWER";

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "E-posta, ad ve şifre zorunludur." },
      { status: 400 }
    );
  }

  // Sadece adesso domaini
  if (!isAdessoEmail(email)) {
    return NextResponse.json(
      { error: "Yalnızca @adesso.com.tr uzantılı e-postalar kabul edilir." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Şifre en az 8 karakter olmalıdır." },
      { status: 400 }
    );
  }

  const userCount = await prisma.user.count();

  // İlk kullanıcı bootstrap: ADMIN olarak oluşturulur
  if (userCount === 0) {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, name, passwordHash: hash, role: "ADMIN" },
    });
    return NextResponse.json({ ok: true, bootstrap: true });
  }

  // Diğer kullanıcılar yalnızca oturum açmış ADMIN tarafından oluşturulabilir
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta zaten kayıtlı." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash: hash, role: requestedRole },
  });

  return NextResponse.json({ ok: true });
}
