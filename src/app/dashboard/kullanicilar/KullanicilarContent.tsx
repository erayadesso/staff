"use client";

import { useState } from "react";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export default function KullanicilarContent({ users }: { users: User[] }) {
  const [seciliKullanici, setSeciliKullanici] = useState<User | null>(null);
  const [yeniSifre, setYeniSifre] = useState("");
  const [formAcik, setFormAcik] = useState(false);
  const [silmeOnay, setSilmeOnay] = useState<string | null>(null);
  const [yeniEmail, setYeniEmail] = useState("");
  const [yeniAd, setYeniAd] = useState("");
  const [yeniSifreOlustur, setYeniSifreOlustur] = useState("");
  const [yeniRol, setYeniRol] = useState("VIEWER");
  const [formOlusturAcik, setFormOlusturAcik] = useState(false);
  const [olusturYukle, setOlusturYukle] = useState(false);

  const sifreDegistir = async () => {
    if (!seciliKullanici || !yeniSifre) {
      toast.error("Yeni şifre giriniz.");
      return;
    }
    try {
      const res = await fetch(`/api/kullanicilar/${seciliKullanici.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sifre: yeniSifre }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Şifre başarıyla değiştirildi.");
        setYeniSifre("");
        setFormAcik(false);
        setSeciliKullanici(null);
      } else {
        toast.error(data.error || "Hata oluştu.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  const kullaniciSil = async (id: string) => {
    try {
      const res = await fetch(`/api/kullanicilar/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Kullanıcı silindi.");
        setSilmeOnay(null);
        window.location.reload();
      } else {
        toast.error(data.error || "Silme başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  const yeniKullaniciOlustur = async () => {
    if (!yeniEmail || !yeniSifreOlustur) {
      toast.error("E-posta ve şifre zorunludur.");
      return;
    }
    setOlusturYukle(true);
    try {
      const res = await fetch("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: yeniEmail,
          name: yeniAd,
          sifre: yeniSifreOlustur,
          role: yeniRol,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Kullanıcı başarıyla oluşturuldu.");
        setYeniEmail("");
        setYeniAd("");
        setYeniSifreOlustur("");
        setFormOlusturAcik(false);
        window.location.reload();
      } else {
        toast.error(data.error || "Oluşturma başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setOlusturYukle(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Kullanıcı Yönetimi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Kullanıcı oluşturabilir, şifre değiştirebilir ve silebilirsiniz.
        </p>
        <a
          href="/dashboard"
          className="mt-2 inline-block text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Özet
        </a>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Kayıtlı Kullanıcılar ({users.length})
        </h3>

        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  Ad
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  E-posta
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  Rol
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  Durum
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                    {u.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSeciliKullanici(u);
                          setYeniSifre("");
                          setFormAcik(true);
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                      >
                        Şifre Değiştir
                      </button>
                      <button
                        onClick={() => setSilmeOnay(u.id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button
        onClick={() => {
          setFormOlusturAcik(true);
          setYeniEmail("");
          setYeniAd("");
          setYeniSifreOlustur("");
        }}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        + Yeni Kullanıcı Ekle
      </button>

      {/* Yeni kullanıcı oluşturma modal */}
      {formOlusturAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Yeni Kullanıcı Ekle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  E-posta
                </label>
                <input
                  type="email"
                  value={yeniEmail}
                  onChange={(e) => setYeniEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="kullanici@adesso.com.tr"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={yeniAd}
                  onChange={(e) => setYeniAd(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Şifre
                </label>
                <input
                  type="password"
                  value={yeniSifreOlustur}
                  onChange={(e) => setYeniSifreOlustur(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="En az 8 karakter"
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Rol
                </label>
                <select
                  value={yeniRol}
                  onChange={(e) => setYeniRol(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setFormOlusturAcik(false);
                    setYeniEmail("");
                    setYeniAd("");
                    setYeniSifreOlustur("");
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  disabled={olusturYukle}
                >
                  İptal
                </button>
                <button
                  onClick={yeniKullaniciOlustur}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  disabled={olusturYukle}
                >
                  {olusturYukle ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şifre değiştirme modal */}
      {formAcik && seciliKullanici && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Şifre Değiştir — {seciliKullanici.name || seciliKullanici.email}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Yeni şifre girin"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setFormAcik(false);
                    setSeciliKullanici(null);
                    setYeniSifre("");
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  İptal
                </button>
                <button
                  onClick={sifreDegistir}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme onay modal */}
      {silmeOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Kullanıcıyı Sil
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSilmeOnay(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                İptal
              </button>
              <button
                onClick={() => kullaniciSil(silmeOnay)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
