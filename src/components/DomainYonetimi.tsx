"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Domain {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: { children: number; requests: number };
}

interface DomainYonetimiProps {
  domains: Domain[];
  isAdmin: boolean;
}

type Toast = { id: number; message: string; type: "error" | "success" };

export default function DomainYonetimi({
  domains,
  isAdmin,
}: DomainYonetimiProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");

  // State'ler
  const [yeniAltDomainFirmaId, setYeniAltDomainFirmaId] = useState<string | null>(null);
  const [yeniDomainAdi, setYeniDomainAdi] = useState("");
  const [yeniDomainParentId, setYeniDomainParentId] = useState<string | null>(null);

  const [duzenlenenDomain, setDuzenlenenDomain] = useState<string | null>(null);
  const [duzenlemeAdi, setDuzenlemeAdi] = useState("");
  const [duzenlemeParentId, setDuzenlemeParentId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  // Filtrele
  const filtrelenen = domains.filter(
    (d) =>
      !arama.trim() ||
      d.name.toLowerCase().includes(arama.trim().toLowerCase()) ||
      d.parent?.name.toLowerCase().includes(arama.trim().toLowerCase())
  );

  // Hiyerarşik ağaç oluştur
  const rootDomains = filtrelenen.filter((d) => !d.parentId);
  const childMap = new Map<string, Domain[]>();
  filtrelenen.forEach((d) => {
    if (d.parentId) {
      const children = childMap.get(d.parentId) || [];
      children.push(d);
      childMap.set(d.parentId, children);
    }
  });

  function renderDomainTree(parentId: string | null, depth: number = 0) {
    const children = parentId ? (childMap.get(parentId) || []) : rootDomains;

    return children.map((d) => (
      <div key={d.id} style={{ paddingLeft: `${depth * 24}px` }}>
        {renderDomainCard(d, depth)}
        {renderDomainTree(d.id, depth + 1)}
      </div>
    ));
  }

  function renderDomainCard(domain: Domain, depth: number) {
    const isEditing = duzenlenenDomain === domain.id;

    return (
      <div
        key={domain.id}
        className={`group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 ${
          depth === 0 ? "mb-2" : "mb-1"
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              value={duzenlemeAdi}
              onChange={(e) => setDuzenlemeAdi(e.target.value)}
              className={inputClass}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate(domain.id);
                if (e.key === "Escape") setDuzenlenenDomain(null);
              }}
            />
            <select
              value={duzenlemeParentId ?? ""}
              onChange={(e) => setDuzenlemeParentId(e.target.value || null)}
              className={selectClass}
            >
              <option value="">Üst alan yok</option>
              {domains
                .filter(
                  (dd) =>
                    dd.id !== domain.id &&
                    dd.parentId !== domain.id // Kendi çocuğu olamaz
                )
                .map((dd) => (
                  <option key={dd.id} value={dd.id}>
                    {dd.parent ? `${dd.parent.name} → ` : ""}{dd.name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => handleUpdate(domain.id)}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Kaydet
            </button>
            <button
              onClick={() => setDuzenlenenDomain(null)}
              className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
            >
              Vazgeç
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Depth indicator */}
              {depth > 0 && (
                <span className="text-zinc-300 dark:text-zinc-600">└─</span>
              )}
              {/* Parent badge */}
              {domain.parent && (
                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {domain.parent.name}
                </span>
              )}
              {/* Domain name */}
              <span
                className={`shrink-0 font-medium ${
                  depth === 0
                    ? "text-sm text-zinc-900 dark:text-zinc-100"
                    : "text-sm text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {domain.name}
              </span>
              {/* Counts */}
              <span className="shrink-0 text-[10px] text-zinc-400">
                {domain._count.children > 0 && (
                  <span className="mr-1">
                    {domain._count.children} alt
                  </span>
                )}
                {domain._count.requests > 0 && (
                  <span className="mr-1 text-amber-500">
                    {domain._count.requests} talep
                  </span>
                )}
              </span>
            </div>

            {/* Actions */}
            {isAdmin && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setYeniAltDomainFirmaId(yeniAltDomainFirmaId === domain.id ? null : domain.id);
                    setYeniDomainParentId(domain.id);
                    setYeniDomainAdi("");
                  }}
                  className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  title="Alt alan ekle"
                >
                  + Alt
                </button>
                <button
                  onClick={() => {
                    setDuzenlenenDomain(domain.id);
                    setDuzenlemeAdi(domain.name);
                    setDuzenlemeParentId(domain.parentId);
                  }}
                  className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(domain.id, domain.name)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  Sil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Yeni alt domain formu */}
        {yeniAltDomainFirmaId === domain.id && isAdmin && (
          <div className="mt-2 flex items-center gap-2 pl-4">
            <input
              value={yeniDomainAdi}
              onChange={(e) => setYeniDomainAdi(e.target.value)}
              placeholder="Alt alan adı"
              className={inputClass}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddChild(domain.id);
                if (e.key === "Escape") setYeniAltDomainFirmaId(null);
              }}
            />
            <button
              onClick={() => handleAddChild(domain.id)}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Ekle
            </button>
            <button
              onClick={() => setYeniAltDomainFirmaId(null)}
              className="shrink-0 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>
    );
  }

  async function handleAddChild(parentId: string) {
    if (!yeniDomainAdi.trim()) return;
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: yeniDomainAdi.trim(),
          parentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Eklenemedi.", "error");
        return;
      }
      setYeniDomainAdi("");
      setYeniAltDomainFirmaId(null);
      showToast("Alt alan eklendi.", "success");
      router.refresh();
    } catch {
      showToast("Bir hata oluştu.", "error");
    }
  }

  async function handleAddRoot() {
    if (!yeniDomainAdi.trim()) return;
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: yeniDomainAdi.trim(),
          parentId: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Eklenemedi.", "error");
        return;
      }
      setYeniDomainAdi("");
      showToast("Alan adı eklendi.", "success");
      router.refresh();
    } catch {
      showToast("Bir hata oluştu.", "error");
    }
  }

  async function handleUpdate(id: string) {
    if (!duzenlemeAdi.trim()) return;
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: duzenlemeAdi.trim(),
          parentId: duzenlemeParentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Güncellenemedi.", "error");
        return;
      }
      setDuzenlenenDomain(null);
      showToast("Alan adı güncellendi.", "success");
      router.refresh();
    } catch {
      showToast("Bir hata oluştu.", "error");
    }
  }

  async function handleDelete(id: string, name: string) {
    const onay = confirm(`"${name}" alan adı silinsin mi? (Alt alanlar parent'sız kalır.)`);
    if (!onay) return;
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Silinemedi.", "error");
        return;
      }
      showToast("Alan adı silindi.", "success");
      router.refresh();
    } catch {
      showToast("Bir hata oluştu.", "error");
    }
  }

  function showToast(message: string, type: "error" | "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
  }

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
            <span className="shrink-0 text-lg">
              {toast.type === "error" ? "✕" : "✓"}
            </span>
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Alan adı ara..."
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input
              value={yeniDomainAdi}
              onChange={(e) => setYeniDomainAdi(e.target.value)}
              placeholder="Yeni yetkinlik merkezi"
              className="w-52 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddRoot();
              }}
            />
            <button
              onClick={handleAddRoot}
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              + Ekle
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filtrelenen.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          {arama ? "Sonuç bulunamadı." : "Henüz yetkinlik merkezi eklenmemiş."}
        </p>
      )}

      {/* Domain tree */}
      <div className="space-y-1">
        {renderDomainTree(null)}
      </div>
    </div>
  );
}
