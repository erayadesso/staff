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
/* Otomatik Talep Statüsü — en ileri aktif adaya göre                 */
/* ------------------------------------------------------------------ */

/** Aday statüsünden belirlenmesi gereken talep statüsü haritası */
const ADAYDAN_TALEPE: Record<string, string> = {
  "Aday Belirlendi": "Aday Taraması Yapılıyor",
  "İç Değerlendirmede": "Aday Taraması Yapılıyor",
  "Sunum İçin Onaylandı": "Aday Taraması Yapılıyor",
  "NoName CV Hazırlanıyor": "Müşteri Değerlendirmesinde",
  "Müşteriye Sunuma Hazır": "Müşteri Değerlendirmesinde",
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
