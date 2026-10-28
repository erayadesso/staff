"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  _count: { requests: number };
}

interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  departments: Department[];
}

interface FirmalarListesiProps {
  companies: Company[];
  isAdmin: boolean;
}

type Toast = { id: number; message: string; type: "error" | "success" };

export default function FirmalarListesi({
  companies,
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
  const [yeniBirimEklenenFirma, setYeniBirimEklenenFirma] = useState<string | null>(null);
  const [yeniBirimAdi, setYeniBirimAdi] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filtrelenen = companies
    .map((c) => {
      const eslesenBirimler = c.departments.filter(
        (d) =>
          !arama.trim() ||
          d.name.toLowerCase().includes(arama.trim().toLowerCase())
      );
      const firmaEslesiyor = c.name
        .toLowerCase()
        .includes(arama.trim().toLowerCase());
      return { company: c, eslesenBirimler, gorunur: firmaEslesiyor || eslesenBirimler.length > 0 };
    })
    .filter((x) => !arama.trim() || x.gorunur);

  async function firmaGuncelle(id: string, ad: string) {
    if (!ad.trim()) return;
    try {
      const res = await fetch(`/api/companies/${id}`, {
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
      const res = await fetch(`/api/companies/${id}`, {
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
      const res = await fetch(`/api/companies/${id}`, {
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
      const res = await fetch(`/api/companies/${id}`, {
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
      const res = await fetch(`/api/departments/${id}`, {
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

  async function birimSil(birimId: string) {
    const onay = confirm(
      "Bu iş birimini silmek istediğinize emin misiniz?"
    );
    if (!onay) return;
    try {
      const res = await fetch(`/api/departments/${birimId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "İş birimi silinemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setToasts((prev) => [...prev, { id: Date.now(), message: "İş birimi silindi.", type: "success" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
      router.refresh();
    } catch {
      setToasts((prev) => [...prev, { id: Date.now(), message: "Bir hata oluştu.", type: "error" }]);
      setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
    }
  }

  async function yeniBirimEkle(companyId: string) {
    if (!yeniBirimAdi.trim()) return;
    try {
      const res = await fetch(`/api/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: yeniBirimAdi, firmaId: companyId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setToasts((prev) => [...prev, { id: Date.now(), message: d.error ?? "İş birimi eklenemedi.", type: "error" }]);
        setTimeout(() => { setToasts((prev) => prev.slice(1)); }, 4000);
        return;
      }
      setYeniBirimEklenenFirma(null);
      setYeniBirimAdi("");
      setToasts((prev) => [...prev, { id: Date.now(), message: "İş birimi eklendi.", type: "success" }]);
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

      {filtrelenen.map(({ company: c, eslesenBirimler }) => (
        <div
          key={c.id}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-2">
            {duzenlenenFirma === c.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  value={firmaAdi}
                  onChange={(e) => setFirmaAdi(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button
                  onClick={() => firmaGuncelle(c.id, firmaAdi)}
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
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 shrink-0 rounded object-contain"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {c.name}
                  </h2>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 items-center gap-2">
                    {c.logoUrl && (
                      <button
                        onClick={() => logoKaldir(c.id)}
                        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        Logo Kaldır
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setLogoDuzenlenenFirma(logoDuzenlenenFirma === c.id ? null : c.id);
                        setLogoUrl(c.logoUrl ?? "");
                      }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                    >
                      Logo
                    </button>
                    <button
                      onClick={() => {
                        setDuzenlenenFirma(c.id);
                        setFirmaAdi(c.name);
                      }}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => firmaSil(c.id)}
                      className="shrink-0 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {logoDuzenlenenFirma === c.id && (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Logo görsel URL'si (https://...)"
                className={inputClass}
                autoFocus
              />
              <button
                onClick={() => logoKaydet(c.id)}
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

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                İş Birimleri
              </h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    setYeniBirimEklenenFirma(yeniBirimEklenenFirma === c.id ? null : c.id);
                    setYeniBirimAdi("");
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  + İş Birimi Ekle
                </button>
              )}
            </div>

            {yeniBirimEklenenFirma === c.id && (
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={yeniBirimAdi}
                  onChange={(e) => setYeniBirimAdi(e.target.value)}
                  placeholder="İş birimi adı"
                  className={inputClass}
                  autoFocus
                />
                <button
                  onClick={() => yeniBirimEkle(c.id)}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setYeniBirimEklenenFirma(null);
                    setYeniBirimAdi("");
                  }}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                >
                  Vazgeç
                </button>
              </div>
            )}

            <ul className="space-y-1">
              {eslesenBirimler.length === 0 && (
                <li className="text-sm text-zinc-500">İş birimi yok.</li>
              )}
              {eslesenBirimler.map((d) =>
                duzenlenenBirim === d.id ? (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 rounded-lg bg-zinc-50 p-1 text-sm dark:bg-zinc-900"
                  >
                    <input
                      value={birimAdi}
                      onChange={(e) => setBirimAdi(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    <button
                      onClick={() => birimGuncelle(d.id, birimAdi)}
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
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-900"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {d.name}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">
                        {d._count.requests} talep
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setDuzenlenenBirim(d.id);
                              setBirimAdi(d.name);
                            }}
                            className="shrink-0 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => birimSil(d.id)}
                            className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
