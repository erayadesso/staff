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
 * Bir statünün DB kaydı (id/ad/sira/ton) ya da yalnızca ton string'i.
 * Renk/amblem ve hiçbir statü fonksiyonu artık isim string'i üzerinden
 * çalışmaz; hepsi bu tipin `ton` alanını kullanır.
 */
export interface StatuNesne {
  id?: string | null;
  ad?: string | null;
  sira?: number | null;
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
 * Ton bazlı: kapanan ve beklemeye alınan süreçler kapalı kabul edilir.
 */
export const KAPALI_TONLARI = new Set<string>(["kapandi", "bekliyor"]);

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

/** Aday statüsünün ilerleme skoru — `sira` alanına göre (büyük = daha ileri). */
export function adayIlerlemeSkoru(durum: StatuNesne | null | undefined): number {
  if (!durum || typeof durum.sira !== "number") return -1;
  return durum.sira;
}

/** Aday statü adı -> talep tonu haritası (hard-coded UI sabiti, DB'den bağımsız). */
const ADAYDAN_TALEPE = new Map<string, string>([
  ["Aday Belirlendi", "ic"],
  ["İç Değerlendirmede", "ic"],
  ["Sunum İçin Onaylandı", "ic"],
  ["NoName CV Hazırlanıyor", "dis"],
  ["Müşteriye Sunuma Hazır", "dis"],
  ["Müşteriye İletildi", "dis"],
  ["Müşteri Değerlendirmesinde", "dis"],
  ["Görüşme Talep Edildi", "gorsme"],
  ["Görüşme Planlandı", "gorsme"],
  ["Görüşme Tamamlandı", "gorsme"],
  ["Dış Kaynak Hizmet Teklifi İletildi", "dis"],
  ["Aday Seçildi", "secim"],
  ["Başlangıç Tarihi Netleştiriliyor", "secim"],
  ["İşe Giriş Evrakları Hazırlanıyor", "kabul"],
  ["Evraklar Teslim Edildi", "kabul"],
  ["Başlangıca Hazır", "kabul"],
  ["İşe Başladı", "karsilandi"],
]);

/**
 * Talebin statüsünü, talepteki EN İLERİ aktif adayın süreç durumuna göre
 * belirler ve eşleşen TALEP DURUM id'sini döndürür.
 * - Çıkış (reddedilen/çekilen/beklemedeki) adaylar ilerlemeye sayılmaz.
 * - Hiç aktif aday yoksa ya da eşleşme yoksa varsayılan talep durumu döner.
 */
export function talepDurumuBelirle(
  adayDurumlari: (StatuNesne | null | undefined)[],
  talepDurumlari: StatuNesne[],
  fallback: StatuNesne | null = null
): string | null {
  let enIleriSira = -1;
  let secilenTon: string | null = null;

  for (const d of adayDurumlari) {
    if (!d) continue;
    const ton = d.ton;
    if (!ton) continue;
    if (ADAY_CIKIS_TONLARI.has(ton)) continue;
    const talepTon = ADAYDAN_TALEPE.get(d.ad || "");
    if (!talepTon) continue;
    const sira = typeof d.sira === "number" ? d.sira : -1;
    if (sira > enIleriSira) {
      enIleriSira = sira;
      secilenTon = talepTon;
    }
  }

  if (secilenTon !== null) {
    // Eşleşen tondaki adaylardan en üst siradakini seç
    const aday = talepDurumlari
      .filter((t) => t.ton === secilenTon)
      .sort((a, b) => (b.sira ?? 0) - (a.sira ?? 0))[0];
    if (aday?.id) return aday.id;
  }

  return fallback?.id ?? null;
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
 * talebin karşılandığını döndürür.
 */
export function isBasariKapatildi(
  adaylar: { surecDurum: string | StatuNesne | null | undefined }[],
  adet: string | null | undefined
): boolean {
  const iseBaslayan = adaylar.filter(
    (a) => statununTonu(a.surecDurum) === "karsilandi"
  ).length;
  const hedef = parseAdet(adet);
  return hedef > 0 && iseBaslayan === hedef;
}
