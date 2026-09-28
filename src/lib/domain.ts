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
/* Talep Statüleri                                                     */
/* ------------------------------------------------------------------ */

/** Ana akıştaki talep statüleri — sıralıdır (kısıtlı, flow halinde ilerler) */
export const TALEP_STATULERI = [
  "Talep Alındı",
  "Aday Taraması Yapılıyor",
  "İç Değerlendirmede",
  "Müşteri Değerlendirmesinde",
  "Görüşme Aşamasında",
  "Seçim ve Başlangıç Planlaması",
  "İşe Giriş Sürecinde",
  "Başlangıca Hazır",
  "Talep Karşılandı",
] as const;

/** Ana akışın dışındaki terminal/duraklama statüleri */
export const DIGER_TALEP_STATULERI = [
  "Beklemeye Alındı",
  "İptal Edildi",
  "Karşılanamadan Kapatıldı",
] as const;

/** Kapalı (terminal) statüler: artık açık pozisyon sayılmaz */
export const KAPALI_STATULER = new Set<string>([
  "Talep Karşılandı",
  "İptal Edildi",
  "Karşılanamadan Kapatıldı",
]);

/** Talebin açık bir pozisyon olup olmadığını döner */
export function isKapaliDurum(durumAdi: string): boolean {
  return KAPALI_STATULER.has(durumAdi);
}

/** Talebin açık pozisyon olarak sayılıp sayılmayacağı */
export function isAcikTalep(durumAdi: string): boolean {
  return !isKapaliDurum(durumAdi);
}

/**
 * Talep statüsüne göre duygu/durum temelli renk kodlaması.
 * Renk dili: pozitif ilerleme yeşile, bekleyen dış değerlendirmeler menevişe,
 * iç süreç maviye, duraklatılan amber'e, kapandıysa gri nüansa çeker.
 * Bu, listelerde kullanılan badge/sınıfların tek kaynağıdır.
 */
export type TalepStatuTon =
  | "yeni"      // Talep Alındı
  | "ic"        // Aday Taraması / İç Değerlendirme
  | "dis"       // Müşteri Değerlendirmesi
  | "gorsme"    // Görüşme
  | "secim"     // Seçim & Planlama
  | "kabul"     // İşe Giriş / Başlangıca Hazır
  | "karsilandi"// Talep Karşılandı
  | "bekliyor"  // Beklemeye Alındı
  | "kapandi"   // İptal / Karşılanamadan Kapatıldı
  | "varsayilan";

/** Statü adından tonu belirler. Bilinmeyen statüler varsayılan tonda gelir. */
export function talepStatuTon(durumAdi: string): TalepStatuTon {
  switch (durumAdi) {
    case "Talep Alındı":
      return "yeni";
    case "Aday Taraması Yapılıyor":
    case "İç Değerlendirmede":
      return "ic";
    case "Müşteri Değerlendirmesinde":
      return "dis";
    case "Görüşme Aşamasında":
      return "gorsme";
    case "Seçim ve Başlangıç Planlaması":
      return "secim";
    case "İşe Giriş Sürecinde":
    case "Başlangıca Hazır":
      return "kabul";
    case "Talep Karşılandı":
      return "karsilandi";
    case "Beklemeye Alındı":
      return "bekliyor";
    case "İptal Edildi":
    case "Karşılanamadan Kapatıldı":
      return "kapandi";
    default:
      return "varsayilan";
  }
}

/** Tonun light/dark uyumlu badge sınıflarını döndürür. */
export function talepStatuRenk(durumAdi: string): string {
  switch (talepStatuTon(durumAdi)) {
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

/** Duruma göre ekstra görsel ipucu (ikon/metin). */
export function talepStatuAmblem(durumAdi: string): string {
  switch (talepStatuTon(durumAdi)) {
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

/** Talep statü indeksi (ana akış sırası). Bulunamazsa -1. */
export function talepStatuIndex(durumAdi: string): number {
  return (TALEP_STATULERI as readonly string[]).indexOf(durumAdi);
}

/* ------------------------------------------------------------------ */
/* Aday Statüleri                                                      */
/* ------------------------------------------------------------------ */

/** Aday statüleri — döngü sıralaması (ilerleme açısından) */
export const ADAY_STATULERI = [
  "Aday Belirlendi",
  "İç Değerlendirmede",
  "Sunum İçin Onaylandı",
  "NoName CV Hazırlanıyor",
  "Müşteriye Sunuma Hazır",
  "Müşteriye İletildi",
  "Müşteri Değerlendirmesinde",
  "Görüşme Talep Edildi",
  "Görüşme Planlandı",
  "Görüşme Tamamlandı",
  "Müşteri Geri Bildirimi Bekleniyor",
  "Aday Seçildi",
  "Başlangıç Tarihi Netleştiriliyor",
  "İşe Giriş Evrakları Hazırlanıyor",
  "Evraklar Teslim Edildi",
  "Başlangıca Hazır",
  "İşe Başladı",
] as const;

/** Aday statüsü ilerleme skoru (büyük = daha ileri) */
export function adayIlerlemeSkoru(surecDurumAdi: string | null | undefined): number {
  if (!surecDurumAdi) return -1;
  return (ADAY_STATULERI as readonly string[]).indexOf(surecDurumAdi);
}

/** Terminal/çıkış aday statüleri (ilerleme sayılmaz) */
export const ADAY_CIKIS_STATULERI = new Set<string>([
  "İç Değerlendirmede Uygun Bulunmadı",
  "Müşteri Tarafından Uygun Bulunmadı",
  "Aday Süreçten Çekildi",
  "Aday Süreci Beklemede",
]);

/* ------------------------------------------------------------------ */
/* Aday Statü Renklendirme — talep statüleriyle aynı dil               */
/* ------------------------------------------------------------------ */

export type AdayStatuTon =
  | "ic"        // Aday Belirlendi / İç Değerlendirme / Sunum Onayı
  | "dis"       // Müşteriye sunuldu / müşteri değerlendirmesi
  | "gorsme"    // Görüşme
  | "secim"     // Aday seçildi
  | "kabul"     // İşe giriş / başlangıca hazır
  | "karsilandi"// İşe başladı
  | "bekliyor"  // Aday süreci beklemede
  | "kapandi"   // Uygun bulunmadı / çekildi
  | "varsayilan";

/** Aday statüsünden tonu belirler. Bilinmeyenler varsayılan tonda gelir. */
export function adayStatuTon(surecDurumAdi: string | null | undefined): AdayStatuTon {
  switch (surecDurumAdi) {
    case "Aday Belirlendi":
    case "İç Değerlendirmede":
    case "Sunum İçin Onaylandı":
      return "ic";
    case "NoName CV Hazırlanıyor":
    case "Müşteriye Sunuma Hazır":
    case "Müşteriye İletildi":
    case "Müşteri Değerlendirmesinde":
      return "dis";
    case "Görüşme Talep Edildi":
    case "Görüşme Planlandı":
    case "Görüşme Tamamlandı":
    case "Müşteri Geri Bildirimi Bekleniyor":
      return "gorsme";
    case "Aday Seçildi":
    case "Başlangıç Tarihi Netleştiriliyor":
      return "secim";
    case "İşe Giriş Evrakları Hazırlanıyor":
    case "Evraklar Teslim Edildi":
    case "Başlangıca Hazır":
      return "kabul";
    case "İşe Başladı":
      return "karsilandi";
    case "İç Değerlendirmede Uygun Bulunmadı":
    case "Müşteri Tarafından Uygun Bulunmadı":
    case "Aday Süreçten Çekildi":
      return "kapandi";
    case "Aday Süreci Beklemede":
      return "bekliyor";
    default:
      return "varsayilan";
  }
}

/** Aday statüsü tonunun light/dark uyumlu badge sınıflarını döndürür. */
export function adayStatuRenk(surecDurumAdi: string | null | undefined): string {
  switch (adayStatuTon(surecDurumAdi)) {
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

/** Aday statüsüne göre ekstra görsel ipucu (ikon). İşe başlayan için onay işareti. */
export function adayStatuAmblem(surecDurumAdi: string | null | undefined): string {
  switch (adayStatuTon(surecDurumAdi)) {
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
export function adayStatuRenkSelect(surecDurumAdi: string | null | undefined): string {
  const ton = adayStatuTon(surecDurumAdi);
  if (ton === "karsilandi") {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800";
  }
  return adayStatuRenk(surecDurumAdi);
}

/* ------------------------------------------------------------------ */
/* Otomatik Talep Statüsü — en ileri aktif adaya göre                 */
/* ------------------------------------------------------------------ */

/** Aday statüsünden belirlenmesi gereken talep statüsü haritası */
const ADAYDAN_TALEPE: Record<string, string> = {
  "Aday Belirlendi": "İç Değerlendirmede",
  "İç Değerlendirmede": "İç Değerlendirmede",
  "Sunum İçin Onaylandı": "İç Değerlendirmede",
  "NoName CV Hazırlanıyor": "İç Değerlendirmede",
  "Müşteriye Sunuma Hazır": "İç Değerlendirmede",
  "Müşteriye İletildi": "Müşteri Değerlendirmesinde",
  "Müşteri Değerlendirmesinde": "Müşteri Değerlendirmesinde",
  "Görüşme Talep Edildi": "Görüşme Aşamasında",
  "Görüşme Planlandı": "Görüşme Aşamasında",
  "Görüşme Tamamlandı": "Görüşme Aşamasında",
  "Müşteri Geri Bildirimi Bekleniyor": "Görüşme Aşamasında",
  "Aday Seçildi": "Seçim ve Başlangıç Planlaması",
  "Başlangıç Tarihi Netleştiriliyor": "Seçim ve Başlangıç Planlaması",
  "İşe Giriş Evrakları Hazırlanıyor": "İşe Giriş Sürecinde",
  "Evraklar Teslim Edildi": "İşe Giriş Sürecinde",
  "Başlangıca Hazır": "Başlangıca Hazır",
  "İşe Başladı": "Talep Karşılandı",
};

/**
 * Talebin statüsünü, talepteki EN İLERİ aktif adayın statüsüne göre belirler.
 * - Çıkış (reddedilen/çekilen/beklemedeki) adaylar ilerlemeye sayılmaz.
 * - Hiç aktif aday yoksa fallback durumu döner.
 * - Tüm adaylar çıkışta ise fallback döner.
 */
export function talepDurumuBelirle(
  adayDurumlari: (string | null | undefined)[],
  fallback: string = "Aday Taraması Yapılıyor"
): string {
  let enIleriSkor = -1;
  let enIleriTalep = fallback;

  for (const d of adayDurumlari) {
    if (!d) continue;
    if (ADAY_CIKIS_STATULERI.has(d)) continue;
    const skor = adayIlerlemeSkoru(d);
    const talep = ADAYDAN_TALEPE[d];
    if (!talep) continue;
    if (skor > enIleriSkor) {
      enIleriSkor = skor;
      enIleriTalep = talep;
    }
  }

  return enIleriTalep;
}

/**
 * Kısıtlı geçiş kuralı: ana akıştaki talep statüsü yalnızca kendisinden
 * bir adım ileri (ya da geriye bir adım) geçebilir. Terminal/yeni statüler
 * daha esnek yönetilir.
 */
export function gecerliTalepGecisi(mevcut: string, hedef: string): boolean {
  if (mevcut === hedef) return true;

  const curIdx = talepStatuIndex(mevcut);
  const targetIdx = talepStatuIndex(hedef);

  // Her ikisi de ana akışta
  if (curIdx >= 0 && targetIdx >= 0) {
    return Math.abs(curIdx - targetIdx) <= 1;
  }

  // Diğer statülere geçişe ana akıştan izin ver
  if (curIdx >= 0 && targetIdx < 0) return true;

  // Diğer statülerden ana akışa dönüşe izin ver
  if (curIdx < 0 && targetIdx >= 0) return true;

  // İki "diğer" statü arası geçişe izin ver
  if (curIdx < 0 && targetIdx < 0) return true;

  return false;
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
  durumAdi: string,
  deadline: Date | null,
  bugun: Date = new Date()
): boolean {
  if (!deadline) return false;
  if (isKapaliDurum(durumAdi)) return false;
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

/** "İşe Başladı" statüsündeki adaylar hedef adede ulaştıysa talebin karşılandığını döner */
export function isBasariKapatildi(
  adaylar: { surecDurumAdi: string | null }[],
  adet: string | null | undefined
): boolean {
  const iseBaslayan = adaylar.filter(
    (a) => a.surecDurumAdi === "İşe Başladı"
  ).length;
  const hedef = parseAdet(adet);
  return hedef > 0 && iseBaslayan === hedef;
}
