"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Birim {
  id: string;
  ad: string;
  _count: { talepler: number };
}

interface Firma {
  id: string;
  ad: string;
  logoUrl?: string | null;
  isBirimleri: Birim[];
}

interface FirmalarListesiProps {
  firmalar: Firma[];
  isAdmin: boolean;
}

type Toast = { id: number; message: string; type: "error" | "success" };

export default function FirmalarListesi({
  firmalar,
  isAdmin,
}: FirmalarListesiProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [duzenlenenFirma, setDuzenlenenFirma] = useState<string | null>(null);
  const [firmaAdi, setFirmaAdi] = useState("");
  const [duzenlenenBirim, setDuzenlenenBirim] = useState<string | null>(null);
  const [birimAdi, setBirimAdi] = useState("");
  const [logoDuzenlenenFirma, setLogoDuzenlenenFirma] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filtrelenen = firmalar
    .map((f) => {
      const eslesenBirimler = f.isBirimleri.filter(
        (b) =>
          !arama.trim() ||
          b.ad.toLowerCase().includes(arama.trim().toLowerCase())
      );
      const firmaEslesiyor = f.ad
        .toLowerCase()
        .includes(arama.trim().toLowerCase());
      return { firma: f, eslesenBirimler, gorunur: firmaEslesiyor || eslesenBirimler.length > 0 };
    })
    .filter((x) => !arama.trim() || x.gorunur);

  async function firmaGuncelle(id: string, ad: string) {
    if (!ad.trim()) return;
    try {
      const res = await fetch(`/api/firmalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad }),
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "Firma güncellenemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setDuzenlenenFirma(null);
      setToasts((prev) => [...prev, { id: Date.now(), message: "Firma güncellendi.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  async function logoKaydet(id: string) {
    if (!logoUrl.trim()) return;
    try {
      const res = await fetch(`/api/firmalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: logoUrl.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "Logo güncellenemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setLogoDuzenlenenFirma(null);
      setLogoUrl("");
      setToasts((prev) => [...prev, { id: Date.now(), message: "Logo güncellendi.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  async function logoKaldir(id: string) {
    try {
      const res = await fetch(`/api/firmalar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: "" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "Logo kaldırılamadı.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setLogoDuzenlenenFirma(null);
      setLogoUrl("");
      setToasts((prev) => [...prev, { id: Date.now(), message: "Logo kaldırıldı.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  async function firmaSil(id: string) {
    const onay = confirm(
      "Firma silme ile adaylar atamasız olacaktır, iş birimleri silinecektir. Onaylıyor musunuz?"
    );
    if (!onay) return;
    try {
      const res = await fetch(`/api/firmalar/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "Firma silinemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setToasts((prev) => [...prev, { id: Date.now(), message: "Firma silindi.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  async function birimGuncelle(id: string, ad: string) {
    if (!ad.trim()) return;
    try {
      const res = await fetch(`/api/is-birimleri/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad }),
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "İş birimi güncellenemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setDuzenlenenBirim(null);
      setToasts((prev) => [...prev, { id: Date.now(), message: "İş birimi güncellendi.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="space-y-4">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
              toast.type === "error"
                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
            }`}
          >
            {toast.type === "error" ? (
              <span className="shrink-0 text-lg">✕</span>
            ) : (
              <span className="shrink-0 text-lg">✓</span>
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>

      <input
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        placeholder="Firma veya iş birimi ara..."
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {filtrelenen.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Sonuç bulunamadı.
        </p>
      )}

      {filtrelenen.map(({ firma: f, eslesenBirimler }) => (
        <div
          key={f.id}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-2">
            {duzenlenenFirma === f.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={firmaAdi}
                  onChange={(e) => setFirmaAdi(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button
                  onClick={() => firmaGuncelle(f.id, firmaAdi)}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setDuzenlenenFirma(null)}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {f.logoUrl ? (
                    <img
                      src={f.logoUrl}
                      alt={f.ad}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 shrink-0 rounded object-contain"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {f.ad.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {f.ad}
                  </h2>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 items-center gap-2">
                    {f.logoUrl && (
                      <button
                        onClick={() => logoKaldir(f.id)}
                        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        Logo Kaldır
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setLogoDuzenlenenFirma(logoDuzenlenenFirma === f.id ? null : f.id);
                        setLogoUrl(f.logoUrl ?? "");
                      }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                    >
                      Logo
                    </button>
                    <button
                      onClick={() => {
                        setDuzenlenenFirma(f.id);
                        setFirmaAdi(f.ad);
                      }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => firmaSil(f.id)}
                      className="shrink-0 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {logoDuzenlenenFirma === f.id && (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Logo görsel URL'si (https://...)"
                className={inputClass}
                autoFocus
              />
              <button
                onClick={() => logoKaydet(f.id)}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Kaydet
              </button>
              <button
                onClick={() => setLogoDuzenlenenFirma(null)}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
              >
                Vazgeç
              </button>
            </div>
          )}

          <ul className="mt-3 space-y-1">
            {eslesenBirimler.length === 0 && (
              <li className="text-sm text-zinc-500">İş birimi yok.</li>
            )}
            {eslesenBirimler.map((b) =>
              duzenlenenBirim === b.id ? (
                <li
                  key={b.id}
                  className="flex items-center gap-2 rounded-lg bg-zinc-50 p-1 text-sm dark:bg-zinc-900"
                >
                  <input
                    value={birimAdi}
                    onChange={(e) => setBirimAdi(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                  <button
                    onClick={() => birimGuncelle(b.id, birimAdi)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setDuzenlenenBirim(null)}
                    className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                  >
                    Vazgeç
                  </button>
                </li>
              ) : (
                <li
                  key={b.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {b.ad}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">
                      {b._count.talepler} talep
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setDuzenlenenBirim(b.id);
                          setBirimAdi(b.ad);
                        }}
                        className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                      >
                        Düzenle
                      </button>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
