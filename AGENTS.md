# ADesso Outsource Talepleri — Agent Coding Specifications

## 🎯 Proje Özeti

**Adesso Outsource Talepleri**, outsource kaynak yönetimi ve aday takip sistemi için geliştirilmiş bir Next.js web uygulaması. Yöneticilere talep durumu, firma analizi, aday pipeline ve KPI dashboard'ları sağlar.

**Tech Stack:**
- **Framework:** Next.js 16.3.6 (App Router) + Turbopack
- **Database:** Supabase PostgreSQL (aws-1-eu-west-3)
- **ORM:** Prisma 6.19.3
- **Auth:** JWT-based session (cookie)
- **Styling:** Tailwind CSS (dark mode support)
- **Deploy:** Render (free tier, Frankfurt region, `plan: free`)

---

## 🚫 Critical — Asla Yapılmaması Gerekenler

### 1. `unstable_cache` Kullanımı
- `unstable_cache` **RSC stream'inde `Date` serialize sorunlarına yol açar** (React error #441).
- Dashboard ve talep sayfalarında `unstable_cache` yerine **plain `Promise.all`** kullan.
- Cache gerekirse **güvenli alternatifler** tercih et:
  - `revalidate: 30` ile route segment config
  - İstemci tarafı cache (SWR, React Query — henüz gerekli değil)

### 2. `connection_limit` Değişikliği
- `.env` dosyasındaki `DATABASE_URL?pgbouncer=true&connection_limit=1` **DOĞRU AYARDIR**.
- Supabase transaction pooling (`pgbouncer=true`) ile birlikte `connection_limit=1` kullanılır.
- **Asla artırıma çalışma** — pooler ile çakışma riski.

### 3. `force-dynamic` Korunmalı
- Tüm dashboard ve talep sayfalarında `export const dynamic = "force-dynamic"` **zorunlu**.
- Static generation kullanılmaz — her istekte fresh render yapılır.

### 4. `searchParams` Promise Type
- Next.js 16'da `searchParams` bir `Promise` object'tir.
- **Her zaman `await` ile çöz:**
  ```ts
  // ✅ DOĞRU
  export default async function Page({ searchParams }) {
    const params = await searchParams;
    const showCancelled = params.showCancelled === 'true';
  }

  // ❌ YANLIŞ
  const params = searchParams; // Promise çözülmemiş
  ```

### 5. Kapalı Taleplerin Varsayılan Görünmesi
- İptal Edildi (`kapandi`) ve Karşılanamadan Kapatıldı (`kapandi`) talepleri varsayılan olarak **gizli** tutulmalı.
- Toggle state'i URL parametresi ile yönetilir: `?showCancelled=true/false`.
- **Varsayılan:** `showCancelled=false` (gizli)

### 6. `kapanisTarihi` Kolonu
- Veritabanından **silinebilen** bir kolon.
- Migration dosyaları da silinmelidir.
- Kullanıcı onayı olmadan geri eklenmemeli.

---

## ✅ Kodlama Standartları

### Server Components (RSC)
```ts
// ✅ DOĞRU — Server component patterni
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [talepler, firmalar] = await Promise.all([
    prisma.talep.findMany({ include: { ... } }),
    prisma.firma.findMany()
  ]);
  // ...
}

// ❌ YANLIŞ — Kullanıcı etkileşimi gerektiren şeyleri server'da yapma
export default async function Page() {
  const [data, user] = await Promise.all([...]);
  // Burada client-side state management yapmaya çalışma
}
```

### Client Components
- `"use client"` directive **zorunlu**
- Client componentlerde sadece UI state management ve event handling bulunur
- Server'dan gelen veriyi **prop olarak** al, local state'e taşıma

### Prisma Queries
```ts
// ✅ DOĞRU — Selective fields, minimal data transfer
const talepler = await prisma.talep.findMany({
  include: {
    isBirimi: {
      select: {
        ad: true,
        firmaId: true,
        firma: { select: { ad: true, logoUrl: true } }
      }
    },
    durum: { select: { id: true, ad: true, sira: true, ton: true } },
    adaylar: {
      select: {
        id: true,
        adayAdi: true,
        surecDurum: { select: { id: true, ad: true, sira: true, ton: true } }
      }
    }
  },
  orderBy: { talepNo: "desc" }
});

// ❌ YANLIŞ — Gereksiz veri transferi
const talepler = await prisma.talep.findMany({
  include: { olusturan: { select: { name: true } } } // Kullanılmıyor!
});
```

### Domain Logic (lib/domain.ts)
- `statununTonu()` fonksiyonu **tek kaynak** olarak kullanılmalı
- Ton bazlı filtreleme için `KAPALI_TONLARI`, `ADAY_CIKIS_TONLARI` constant'ları kullan
- `isKapaliDurum()`, `isAcikTalep()` fonksiyonlarını tercih et

```ts
import { statununTonu, isKapaliDurum } from "@/lib/domain";

// ✅ DOĞRU
talepler.filter(t => !isKapaliDurum(t.durum))

// ❌ YANLIŞ
talepler.filter(t => t.durum.ad !== "İptal Edildi") // Hard-coded string
```

### Toggle State Management
- URL-based state yönetimi (`?showCancelled=true/false`)
- `Link` component ile doğrudan URL güncelleme
- Toggle state'i sayfalar arası paylaşılabilir

```tsx
<Link
  href={`/dashboard?showCancelled=${!showCancelled}`}
  className="inline-flex items-center gap-2 rounded-lg px-4 py-2..."
>
  {showCancelled ? 'İptal/Karşılanamadı Gizle' : 'İptal/Karşılanamadı Göster'}
</Link>
```

---

## 🏗️ Mimari Kurallar

### Proje Yapısı
```
app/
├── api/                    # Route handlers
│   ├── adaylar/[id]/route.ts
│   ├── talepler/route.ts
│   └── health/route.ts     # Keep-alive endpoint
├── dashboard/              # Dashboard sayfaları
│   ├── page.tsx
│   ├── talepler/page.tsx
│   └── talepler/[id]/page.tsx
components/                 # Reusable UI components
lib/                        # Shared utilities
├── prisma.ts               # Prisma client singleton
├── session.ts              # JWT session handling
├── domain.ts               # Business logic
└── types.ts                # TypeScript types
```

### Server-Client Boundary
- `app/` altındaki tüm components **Server Component** (varsayılan)
- `"use client"` directive kullananlar **Client Component**
- Server'dan Client'a veri geçişi **prop olarak** yapılır
- **Server-side'da asla `useState`, `useEffect` kullanma**

### Data Flow
```
Request → Server Component (DB fetch) → RSC Stream → Client Component (hydration) → UI
```

---

## 🚀 Deployment & Performance

### Render Free Tier Kuralları
1. **Cold Start:** 15 dakika inaktiflik sonrası servis uykuya geçer
2. **Keep-Alive:** Harici cron servisi (cron-job.org, UptimeRobot) ile `/api/health` endpoint'ine periyodik istek gönderilmeli (5dk aralık)
3. **Region:** Frankfurt (render.yaml'da `region: frankfurt`)
4. **Build Command:** `npm install && npm run build`

### Performance Optimizasyonları
- `Promise.all` ile paralel DB sorguları (tek bağlantıda olsa da)
- Gereksiz `include`/`select` kaldırma (örn. `olusturan`, `iseBaslamaTarihi`)
- `force-dynamic` + minimal payload
- **Skeleton loading için `Suspense` kullan** (sayfa geçişlerinde "Veriler yükleniyor..." göster)

### LCP (Largest Contentful Paint) Hedefleri
- Hedef: **< 2.5s** (soğuk başlatma hariç)
- Mevcut LCP: **~4.1s** (DB sorgu süresi + RSC render)
- Soğuk başlatma: **~3.7-4.1s** (cron job yoksa)

### Build & Test
```bash
# TypeScript check
npx tsc --noEmit

# Production build
npm run build

# Local dev
npm run dev
```

---

## 🔐 Security & Authentication

### JWT Session
- Cookie-based authentication
- `getSessionUser()` fonksiyonu ile kullanıcı doğrulama
- Her sayfa/route handler'da `if (!user) return null;` kontrolü

### API Route Guards
```ts
const user = await getSessionUser();
if (!user || user.role !== "ADMIN") {
  return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
}
```

### Environment Variables
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
SESSION_SECRET="<32+ byte random key>"
RESEND_API_KEY=""  # Email gönderimi için
```

**ASLA `.env` dosyasını commit etme!**

---

## 📦 Package & Dependency Management

### Next.js 16 Dikkat Edilmesi Gerekenler
- `unstable_cache` yerine `'use cache'` directive (daha stabil)
- `searchParams` artık `Promise` type
- `revalidateTag` 2. parametre zorunlu: `revalidateTag("tag", "max")`
- Cache Components (`'use cache'`) tercih edilmeli

### Prisma Schema
- `TalepDurumu` → `ton` alanı ile filtreleme (id/ad değil)
- `SurecDurumu` → Aday süreç durumları
- FK ilişkileri: `talepId`, `durumId`, `surecDurumId`

---

## 🧪 Testing & Validation

### Manual Test Checklist
- [ ] `/dashboard` sayfası yükleniyor mu?
- [ ] `/dashboard/talepler` toggle çalışıyor mu?
- [ ] Toggle OFF → sadece aktif + başarılı kapalı talepler gösteriliyor mu?
- [ ] Toggle ON → tüm talepler (İptal/Karşılanamadı dahil) gösteriliyor mu?
- [ ] `npm run build` başarılı oluyor mu?
- [ ] Render'da deploy başarılı oluyor mu?

### Common Errors & Solutions
| Error | Cause | Solution |
|-------|-------|----------|
| React error #441 | `unstable_cache` RSC serialize hatası | `unstable_cache` kaldır, `Promise.all` kullan |
| `searchParams` undefined | Promise çözülmemiş | `await searchParams` kullan |
| `revalidateTag` TS error | 2. parametre eksik | `revalidateTag("tag", "max")` kullan |
| Deploy fail (503) | Render infrastructure maintenance | Bekle, manuel deploy dene |

---

## 📝 Commit Convention

### Commit Message Format
```
<Type>: <summary>

<description if needed>
```

**Types:**
- `Add:` — Yeni özellik/component
- `Fix:` — Bug düzeltmesi
- `Optimize:` — Performans iyileştirme
- `Revert:` — Önceki commit'in geri alınması
- `Remove:` — Gereksiz kod/component silme

**Örnekler:**
```
Add: toggle switch - İptal/Karşılanamadı talepler varsayılan gizli
Fix: dashboard 500 hatası - unstable_cache kaldırıldı (RSC serialize sorunu)
Optimize: dashboard gereksiz alanları kaldır (olusturan join + iseBaslamaTarihi)
```

---

## 🎨 UI/UX Standards

### Language
- Tüm UI metinleri **Türkçe**
- Hata mesajları, buton text'leri, placeholder'lar Türkçe

### Toggle Switch Pattern
- **Label:** `"İptal/Karşılanamadı Göster"` (varsayılan) / `"İptal/Karşılanamadı Gizle"` (açık)
- **State:** URL parametresi (`?showCancelled=true/false`)
- **Component:** `<Link>` ile doğrudan URL güncelleme
- **Style:** 
  - Pasif: `bg-zinc-100 text-zinc-700`
  - Aktif: `bg-zinc-900 text-white`

### Loading State
- **Component:** `LoadingMessage.tsx`
- **Trigger:** `Suspense` fallback
- **Content:** `"Veriler yükleniyor..."` (pulse animation)

### Dark Mode
- Tailwind `dark:` modifier'ları **zorunlu**
- `dark:` ve normal mod birlikte test edilmeli

---

## 📊 Domain Rules (Business Logic)

### Talep Statü Tonları
```
yeni → aktif
ic → aktif
dis → aktif
gorsme → aktif
secim → aktif
kabul → aktif
karsilandi → başarıyla kapandı
bekliyor → kapalı
kapandi → kapalı (İptal Edildi, Karşılanamadan Kapatıldı)
varsayilan → kapalı
```

### Aktif Talep Tanımı
- `durum.ton IN (yeni, ic, dis, gorsme, secim, kabul)`

### Başarıyla Kapalı Tanımı
- `karsilandi` tonlu aday sayısı ≥ talep.adet

### Toggle Filtresi
- **Gizli (varsayılan):** Aktif + Başarıyla kapalı talepler
- **Göster:** Tüm talepler (İptal/Karşılanamadı dahil)

---

## 🔧 Development Workflow

1. **Local Development**
   ```bash
   cd "/Users/eray.aykilic/Documents/openCode_EA/adesso Outsource Talepleri/app"
   npm install
   npm run dev
   # http://localhost:3000
   ```

2. **Commit & Push**
   ```bash
   git add -A
   git commit -m "Type: summary"
   git push origin main
   ```

3. **Render Deploy**
   - Otomatik: `main` branch'e push sonrası
   - Manuel: Render dashboard → Deploy history → Deploy latest commit
   - **Not:** Render infrastructure maintenance sırasında deploy durabilir

4. **Test**
   - Local'de `npm run dev` ile test
   - `npm run build` ile production build doğrulama
   - Render'da canlı test

---

## ⚡ Known Limitations & Workarounds

### 1. Render Free Tier Cold Start
**Problem:** 15dk inaktiflik sonrası servis uyar
**Workaround:** 
- Harici cron servisi (cron-job.org, UptimeRobot) ile `/api/health` ping
- Periyot: 5dk
- Veya manuel sayfa ziyareti

### 2. Next.js 16 `unstable_cache` Riski
**Problem:** `unstable_cache` RSC stream'inde `Date` serialize hatası verir
**Workaround:** 
- `Promise.all` ile direct DB query
- Cache gerekirse route segment config kullan

### 3. Tek DB Bağlantısı
**Problem:** `connection_limit=1` nedeniyle paralel sorgular seri çalışır
**Workaround:**
- `Promise.all` ile batch query
- Gereksiz JOIN/remove (örn. `olusturan`)
- `select` ile sadece gerekli alanları çek

### 4. Transatlantik DB Gecikmesi
**Problem:** Render (Frankfurt) ↔ Supabase (Paris) ~10ms RTT
**Optimization:**
- Minimal data transfer (selective `select`)
- Aggregation queries kullan
- Cache (ileride değerlendirilebilir)

---

## 📚 Reference Files

| Dosya | Amaç |
|-------|------|
| `src/lib/domain.ts` | Business logic, ton mapping, renk/amblem |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/session.ts` | JWT session handling |
| `src/app/api/health/route.ts` | Keep-alive endpoint |
| `render.yaml` | Render deployment config |
| `.env` | Environment variables (never commit!) |

---

## 🆘 Troubleshooting

### Site Erişilemez (HTTP 000/503)
1. Render status page kontrol: **status.render.com**
2. Deploy history'de hata var mı bak
3. `git push` sonrası 2-5dk bekle
4. Render infrastructure maintenance olabilir (15 Ekim gibi)

### TypeScript Hataları
- `searchParams` → `await` ile çöz
- `revalidateTag` → 2. parametre ekle
- `unstable_cache` → kaldır, `Promise.all` kullan
- `as any` → `StatuNesne` cast kullan

### LCP Performans Sorunu
1. Cold start kontrol (cron job kurulu mu?)
2. DB query optimize (gereksiz field kaldır)
3. Client-side hydration test
4. **Hedef:** < 2.5s (soğuk başlatma hariç)

---

## 🎯 Agent Behavior Guidelines

### Bu projede çalışırken:
1. **Her zaman `npm run build` ile doğrula** — Hata varsa hemen bildir
2. **`async/await` pattern'ini koru** — `searchParams` çözülmemiş kalsın
3. **Gereksiz veri transferini kaldır** — `select` ile minimum alan
4. **Türkçe UI metinlerini koru** — Çeviri yapma
5. **Toggle state'i URL'de tut** — Cookie/localStorage kullanma
6. **Dark mode test et** — `dark:` modifierları eksik kalmasın
7. **Render free tier kısıtlamalarını unutma** — Soğuk başlatma normaldir

### Agent'e Özel Notlar:
- `unstable_cache` kullanma, RSC serialize sorunlarına yol açar
- `connection_limit=1` ile ilgili değişiklik önerme
- `force-dynamic` koru, static generation yapma
- Domain logic'de hard-coded string kullanma, `statununTonu()` kullan
- UI metinlerini Türkçe bırak, çeviri yapma
