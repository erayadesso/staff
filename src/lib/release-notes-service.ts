/**
 * Release Notes Service — Singleton pattern
 * 
 * İki bileşen de bu servisi kullanır, tek fetch yapılır.
 * - fetch(): Aktif release note'u getirir, cache'ler
 * - isSeen(version): localStorage'da version görülmüş mü kontrol eder
 * - markSeen(version): version'u localStorage'a kaydeder
 * - useReleaseNote(): Hook — bileşenlere tek state sağlar
 */

import { useState, useEffect } from "react";

export interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  body: string;
  createdAt: string;
}

const CACHE_KEY = "release_note_cache";
const SEEN_KEY = "release_notes_seen";

let cached: ReleaseNote | null = null;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * API'den release note çeker, cache'e kaydeder.
 */
export async function fetchReleaseNote(): Promise<ReleaseNote | null> {
  try {
    const res = await fetch("/api/release-notes");
    const data = await res.json();
    if (data.ok && data.releaseNote) {
      cached = data.releaseNote;
      // Cache'e de yaz (sayfa yenilenirse hızlı erişim)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      } catch { /* localStorage kapalıysa */ }
      notifyListeners();
      return cached;
    }
  } catch {
    // Network hatası — cache'ten dene
  }

  // Cache'den dene
  if (!cached) {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) cached = JSON.parse(stored);
    } catch { /* */ }
  }

  notifyListeners();
  return cached;
}

/**
 * Belirtilen versiyon localStorage'da görülmüş mü?
 */
export function isSeen(version: string): boolean {
  return localStorage.getItem(SEEN_KEY) === version;
}

/**
 * Versiyonu localStorage'a kaydet (görülmiş olarak işaretle)
 */
export function markSeen(version: string): void {
  localStorage.setItem(SEEN_KEY, version);
}

/**
 * Bileşenler için listener pattern — state değiştiğinde otomatik re-render
 */
export function useReleaseNote() {
  const [state, setState] = useState<{
    releaseNote: ReleaseNote | null;
    loading: boolean;
  }>({ releaseNote: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    // İlk yükleme — cache varsa hemen göster, sonra API'den güncelle
    if (cached) {
      setState({ releaseNote: cached, loading: false });
    } else {
      fetchReleaseNote().then(() => {
        if (!cancelled) {
          setState({ releaseNote: cached, loading: false });
        }
      });
    }

    // Listener kaydet (başka component'ten state değişirse güncelle)
    const listener = () => {
      if (!cancelled) {
        setState({ releaseNote: cached, loading: false });
      }
    };
    listeners.add(listener);

    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return state;
}
