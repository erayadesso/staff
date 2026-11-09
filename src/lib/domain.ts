export const ADESSO_DOMAIN = "adesso.com.tr";

/** E-postanın @adesso.com.tr uzantılı olup olmadığını kontrol eder */
export function isAdessoEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return /^[^\s@]+@adesso\.com\.tr$/.test(lower);
}

/** Admin tarafından oluşturma için geçerli e-posta mi? (adesso domain şart) */
export function isValidInviteEmail(email: string): {
  ok: boolean;
  reason?: string;
} {
  if (!isAdessoEmail(email)) {
    return {
      ok: false,
      reason: "Yalnızca @adesso.com.tr uzantılı e-postalar kabul edilir.",
    };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Statü Nesnesi & Ton                                                */
/* ------------------------------------------------------------------ */

/**
 * Bir statünün DB kaydı (id/name/order/ton) ya da yalnızca ton string'i.
 * Renk/amblem ve hiçbir statü fonksiyonu artık isim string'i üzerinden
 * çalışmaz; hepsi bu tipin `ton` alanını kullanır.
 */
export interface StatuNesne {
  id?: string | null;
  name?: string | null;
  order?: number | null;
  ton?: string | null;
}

/** UI sabit ton seti — domain.ts'te hard-coded kalır, DB'den gelmez. */
export type StatuTon =
  | "yeni"
  | "ic"
  | "dis"
  | "gorsme"
  | "secim"
  | "kabul"
  | "karsilandi"
  | "bekliyor"
  | "kapandi"
  | "varsayilan";

export type TalepStatuTon = StatuTon;
export type AdayStatuTon = Exclude<StatuTon, "yeni">;

/** Bir statünün tonunu döndürür; hem nesne hem ham ton string'i kabul eder. */
export function statununTonu(
  t: string | StatuNesne | null | undefined
): string {
  if (!t) return "varsayilan";
  if (typeof t === "string") return t || "varsayilan";
  return t.ton || "varsayilan";
}

/**
 * Kapalı (terminal) tonlar: bu tondaki bir talep açık pozisyon sayılmaz.
 * Eski sistem: kapandi, bekliyor
 * Yeni sistem: kapali, beklemede
 */
export const KAPALI_TONLARI = new Set<string>(["kapandi", "bekliyor", "kapali", "beklemede"]);

/** Aday tarafında ilerlemeye sayılmayan çıkış tonları (red/çekilme/bekleme). */
export const ADAY_CIKIS_TONLARI = new Set<string>(["kapandi", "bekliyor"]);

/** Talebin açık bir pozisyon olup olmadığını ton'a göre döner. */
export function isKapaliDurum(durum: string | StatuNesne | null | undefined): boolean {
  if (!durum) return false;
  if (typeof durum === "string") return KAPALI_TONLARI.has(durum);
  return KAPALI_TONLARI.has(durum.ton || "varsayilan");
}

/** Talebin açık pozisyon olarak sayılıp sayılmayacağı */
export function isAcikTalep(durum: string | StatuNesne | null | undefined): boolean {
  return !isKapaliDurum(durum);
}

/* ------------------------------------------------------------------ */
/* Renk / Amblem — ton bazlı (UI sabiti, DB'den bağımsız)               */
/* ------------------------------------------------------------------ */

/** Tonun light/dark uyumlu talep badge sınıflarını döndürür. */
export function talepStatuRenk(t: string | StatuNesne | null | undefined): string {
  switch (statununTonu(t)) {
    case "yeni":
      return "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800";
    case "ic":
      return "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800";
    case "dis":
      return "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800";
    case "gorsme":
      return "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800";
    case "secim":
      return "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800";
    case "kabul":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800";
    case "karsilandi":
      return "bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:text-white dark:ring-emerald-500";
    case "bekliyor":
      return "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800";
    case "kapandi":
      return "bg-zinc-200 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
  }
}

/** Tonun light/dark uyumlu aday badge sınıflarını döndürür. */
export function adayStatuRenk(t: string | StatuNesne | null | undefined): string {
  switch (statununTonu(t)) {
    case "ic":
      return "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800";
    case "dis":
      return "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800";
    case "gorsme":
      return "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800";
    case "secim":
      return "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800";
    case "kabul":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800";
    case "karsilandi":
      return "bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:text-white dark:ring-emerald-500";
    case "bekliyor":
      return "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800";
    case "kapandi":
      return "bg-zinc-200 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
  }
}

/** Tona göre ekstra görsel ipucu (ikon/metin) — talep. */
export function talepStatuAmblem(t: string | StatuNesne | null | undefined): string {
  switch (statununTonu(t)) {
    case "karsilandi":
      return "✓";
    case "kabul":
      return "👏";
    case "gorsme":
      return "🤝";
    case "secim":
      return "🎯";
    case "bekliyor":
      return "⏸";
    case "kapandi":
      return "•";
    default:
      return "";
  }
}

/** Tona göre ekstra görsel ipucu (ikon) — aday. */
export function adayStatuAmblem(t: string | StatuNesne | null | undefined): string {
  switch (statununTonu(t)) {
    case "karsilandi":
      return "✓";
    case "bekliyor":
      return "⏸";
    default:
      return "";
  }
}

/**
 * Aday statüsünün <select> öğesi için güvenli (açık tonlu) sınıflarını döndürür.
 * Badge'deki dolgun/koyu (text-white) tonlar <select>'e uygulanınca açılır
 * menüdeki seçenek metinleri görünmez olabildiğinden, burada her ton açık
 * arka plan + koyu metin olarak döner.
 */
export function adayStatuRenkSelect(t: string | StatuNesne | null | undefined): string {
  if (statununTonu(t) === "karsilandi") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800";
  }
  return adayStatuRenk(t);
}

/* ------------------------------------------------------------------ */
/* Aday ilerleme skoru ve otomatik talep statüsü                       */
/* ------------------------------------------------------------------ */

/** Aday statüsünün ilerleme skoru — `order` alanına göre (büyük = daha ileri). */
export function adayIlerlemeSkoru(durum: StatuNesne | null | undefined): number {
  if (!durum || typeof durum.order !== "number") return -1;
  return durum.order;
}

/**
 * Aday süreci durumları → Talep durumu eşleştirme haritası.
 * null = Talep durumu değişmez, string = doğrudan talep durumu adı
 */
export const ADAYDAN_TALEP_DURUMU = new Map<string, string | null>([
  // CV Süreci
  ["TechHead CV Taraması", null],
  ["CV hazırlanıyor", null],
  ["CV müşteriye gönderilmek üzere hazırlandı", null],
  ["CV gönderildi", "📤 Müşteriye Sunuldu"],
  ["adesso - Aday tarama sürecinde", null],

  // Müşteri Süreci
  ["Müşteri görüşmesi", "🤝 Görüşme Yapılıyor"],
  ["Müşteri görüşmesi olumsuz", null],
  ["Müşteri beğenmedi", null],
  ["Müşteri beğendi", "🤝 Görüşme Yapılıyor"],
  ["adesso - Aday görüşmesi", "🤝 Görüşme Yapılıyor"],
  ["İkinci müşteri görüşmesi", "🤝 Görüşme Yapılıyor"],
  ["Müşteri görüşmesi tamamlandı - Sonuç bekleniyor", null],
  ["Müşteri beğendi - Teklif Talep Etti", "🎯 Aday Seçildi"],

  // Teklif/Sözleşme
  ["Teklif yapıldı", "🎯 Aday Seçildi"],
  ["Teklif kabul", "📝 İşe Giriş Süreci"],
  ["Sözleşme süreci", "📝 İşe Giriş Süreci"],

  // Çıkış/Kapanış
  ["Onaylandı", null],
  ["İşe başladı", "✅ Talep Karşılandı"],
  ["Uygun CV Bulunamadı. LOST", "🔴 Karşılanamadı"],
  ["Farklı projeye atandı", "❌ İptal Edildi"],
  ["Müşteri talebi değişti", "❌ İptal Edildi"],

  // Diğer
  ["CV Kalitesi Yetersiz - Yeni CV Bekleniyor", null],
  ["Aday süreçten çekildi", null],
  ["Müşteri bekleniyor", null],
  ["Aday süreci beklemede", "⏸️ Beklemede"],
  ["Müşteri Satın Alma Formu Bekleniyor", null],
  ["İşe giriş evrakları hazırlanıyor", "📝 İşe Giriş Süreci"],
  ["Evraklar teslim edildi", "📝 İşe Giriş Süreci"],
  ["Başlangıca hazır", "📝 İşe Giriş Süreci"],
]);

/**
 * Aday süreci durumuna göre Talep durumunu otomatik belirler.
 * Database-driven mapping kullanır (ProcessStatusMapping tablosu).
 * Eski sistem: ADAYDAN_TALEP_DURUMU map (fallback).
 * Sadece "aktif" tonlu adaylar ilerlemeye sayılır.
 *
 * @param adayDurumlari - Talepteki adayların süreç durumları
 * @param talepDurumlari - Mevcut tüm talep durumları
 * @param fallback - Hiç eşleşme yoksa kullanılacak fallback talep durumu
 * @returns Eşleşen talep durumu ID'si veya fallback
 */
export async function talepDurumuBelirle(
  adayDurumlari: (StatuNesne | null | undefined)[],
  talepDurumlari: StatuNesne[],
  fallback: StatuNesne | null = null
): Promise<string | null> {
  // 1) Adayların en ileri aktif durumunu bul
  let enIleriSira = -1;
  let enIleriAdayAdi: string | null = null;

  for (const aday of adayDurumlari) {
    if (!aday) continue;
    const ton = aday.ton;

    // Sadece aktif adaylar ilerlemeye sayılır
    if (ton !== "aktif") continue;

    const adayAdi = aday.name || "";
    const sira = typeof aday.order === "number" ? aday.order : -1;
    if (sira > enIleriSira) {
      enIleriSira = sira;
      enIleriAdayAdi = adayAdi;
    }
  }

  // 2) Eşleşen tale p durumunu bul (database + fallback)
  if (enIleriAdayAdi) {
    const secilenTalepDurumu = await findRequestStatusByProcessStatus(
      enIleriAdayAdi,
      talepDurumlari
    );
    if (secilenTalepDurumu) return secilenTalepDurumu;
  }

  return fallback?.id ?? null;
}

/**
 * ProcessStatus adından RequestStatus bulur.
 * Önce database'den (ProcessStatusMapping), sonra hardcoded map'ten bakar.
 */
async function findRequestStatusByProcessStatus(
  processStatusName: string,
  talepDurumlari: StatuNesne[]
): Promise<string | null> {
  try {
    const { prisma } = await import("@/lib/prisma");

    // Database'den mapping'i kontrol et
    const mapping = await prisma.processStatusMapping.findFirst({
      where: {
        processStatus: {
          name: processStatusName,
        },
      },
      include: {
        requestStatus: true,
      },
    });

    if (mapping?.requestStatus?.id) {
      return mapping.requestStatus.id;
    }

    // Database'de yoksa, hardcoded map'ten dene (backward compat)
    const direct = ADAYDAN_TALEP_DURUMU.get(processStatusName);
    if (direct !== undefined) {
      const talep = talepDurumlari.find((t) => t.name === direct);
      if (talep?.id) return talep.id;
    }

    // Case-insensitive eşleşme
    const lower = processStatusName.toLowerCase();
    for (const [key, value] of ADAYDAN_TALEP_DURUMU) {
      if (key.toLowerCase() === lower && value !== undefined) {
        const talep = talepDurumlari.find((t) => t.name === value);
        if (talep?.id) return talep.id;
        break;
      }
    }
  } catch (err) {
    console.error("findRequestStatusByProcessStatus error:", err);
  }

  return null;
}

/**
 * Geçiş kuralı — esnek sira-bazlı. İleri geçişe ve geriye dönüşe serbest izin
 * verilir; yalnızca aynı statüye geçiş de geçerlidir (no-op).
 */
export function gecerliTalepGecisi(mevcut: number | null, hedef: number | null): boolean {
  if (mevcut === hedef) return true;
  // İleri ya da geri her mesafedeki geçiş serbesttir
  return true;
}

/* ------------------------------------------------------------------ */
/* Tarih ve adet yardımcıları                                          */
/* ------------------------------------------------------------------ */

/** İki tarih arasındaki tam gün farkını döner (negatif = hedef geçmiş). */
export function gunFarki(hedef: Date, bugun: Date = new Date()): number {
  const a = new Date(hedef.getFullYear(), hedef.getMonth(), hedef.getDate());
  const b = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Açık bir talebin kaç gündür açık olduğu (oluşturulma tarihinden bugüne, min 0) */
export function pozisyonYasi(olusturulmaTarihi: Date, bugun: Date = new Date()): number {
  return Math.max(0, gunFarki(olusturulmaTarihi, bugun));
}

/** Talebin deadline'ı bugünü geçmiş ve hâlâ açık bir pozisyon olup olmadığı */
export function deadlineGecti(
  durum: string | StatuNesne | null | undefined,
  deadline: Date | null,
  bugun: Date = new Date()
): boolean {
  if (!deadline) return false;
  if (isKapaliDurum(durum)) return false;
  return gunFarki(deadline, bugun) > 0;
}

/** Deadline'a kalan gün sayısı (negatif = geçmiş gün, null = deadline yok) */
export function kalanGun(deadline: Date | null, bugun: Date = new Date()): number | null {
  if (!deadline) return null;
  return -gunFarki(deadline, bugun);
}

/** Metin içindeki tüm sayıları toplayarak adet miktarını çözer (ör. "2-4" -> 6, "1+2" -> 3) */
export function parseAdet(adet: string | null | undefined): number {
  if (!adet) return 0;
  const sayilar = adet.match(/\d+/g);
  if (!sayilar) return 0;
  return sayilar.map(Number).reduce((a, b) => a + b, 0);
}

/**
 * "İşe Başladı" (karsilandi tonu) statüsündeki adaylar hedef adede ulaştıysa
 * talebin karşılandığını döndürür. (Hedefin üzerinde bile olsa başarılıdır.)
 */
export function isBasariKapatildi(
  adaylar: { processStatus: string | StatuNesne | null | undefined }[],
  adet: string | null | undefined
): boolean {
  const iseBaslayan = adaylar.filter(
    (a) => statununTonu(a.processStatus) === "karsilandi"
  ).length;
  const hedef = parseAdet(adet);
  return hedef > 0 && iseBaslayan >= hedef;
}
