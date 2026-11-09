"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ProcessStatusItem {
  id: string;
  name: string;
  ton: string | null;
  order: number;
}

interface RequestStatusItem {
  id: string;
  name: string;
  ton: string | null;
  order: number;
  processStatuses: ProcessStatusItem[];
}

/* ------------------------------------------------------------------ */
/* Drag Handle                                                         */
/* ------------------------------------------------------------------ */

function DragHandle() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Ton Badge                                                           */
/* ------------------------------------------------------------------ */

function TonBadge({ ton }: { ton: string | null }) {
  if (!ton) return null;
  const cls =
    ton === "aktif"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : ton === "beklemede"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {ton}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Process Card (sadece sıralama, kendi içinde sürüklenebilir)         */
/* ------------------------------------------------------------------ */

function ProcessCard({
  item,
  index,
  onRemove,
}: {
  item: ProcessStatusItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `proc-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition hover:border-zinc-400 hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {index + 1}
        </span>
        <DragHandle />
        <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {item.name}
        </span>
        <TonBadge ton={item.ton} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="ml-2 rounded p-1 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          title="Buradan çıkar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Request Step                                                      */
/* ------------------------------------------------------------------ */

function RequestStep({
  item,
  index,
  isOver,
  onRemoveProcess,
}: {
  item: RequestStatusItem;
  index: number;
  isOver: boolean;
  onRemoveProcess: (requestStatusId: string, processStatusId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `req-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute -left-5 top-0 h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
      )}
      {index < 9 && (
        <div className="absolute -left-5 bottom-0 h-8 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
      )}

      <div
        className={`relative rounded-2xl border-2 bg-white p-5 shadow-sm transition-all dark:bg-zinc-950 ${
          isOver
            ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500/60 dark:bg-indigo-950/10"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
        data-step-id={item.id}
      >
        {/* Step header — sürüklenebilir */}
        <div
          {...attributes}
          {...listeners}
          className="mb-4 flex cursor-grab items-center gap-3 active:cursor-grabbing"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            {index + 1}
          </div>
          <DragHandle />
          <h3 className="flex-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h3>
          <TonBadge ton={item.ton} />
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {item.processStatuses.length} aday
          </span>
        </div>

        {/* Process statuses list */}
        <div className="space-y-2">
          {item.processStatuses.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-zinc-300 py-6 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Aday durumu sürükleyip bırakın
              </p>
            </div>
          ) : (
            <SortableContext
              items={item.processStatuses.map((ps) => `proc-${ps.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {item.processStatuses
                  .sort((a, b) => a.order - b.order)
                  .map((ps, idx) => (
                    <ProcessCard
                      key={ps.id}
                      item={{ ...ps, order: idx }}
                      index={idx}
                      onRemove={(id) => onRemoveProcess(item.id, id)}
                    />
                  ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Free Pool Item                                                      */
/* ------------------------------------------------------------------ */

function FreePoolItem({ item }: { item: ProcessStatusItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `free-${item.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition hover:border-zinc-400 hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
      >
        <DragHandle />
        <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {item.name}
        </span>
        <TonBadge ton={item.ton} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function StatuYoneticisi() {
  const [requestStatuses, setRequestStatuses] = useState<RequestStatusItem[]>([]);
  const [freeProcessStatuses, setFreeProcessStatuses] = useState<ProcessStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Refs for reliable access
  const requestStatusesRef = useRef(requestStatuses);
  const freeProcessStatusesRef = useRef(freeProcessStatuses);
  const overIdRef = useRef<string | null>(null);

  useEffect(() => { requestStatusesRef.current = requestStatuses; }, [requestStatuses]);
  useEffect(() => { freeProcessStatusesRef.current = freeProcessStatuses; }, [freeProcessStatuses]);

  // Sensors — rectIntersection nested contexts'te daha iyi çalışır
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/statuses/for-dnd", { credentials: "include" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const baseMsg = errData.error || `HTTP ${res.status}`;
          const detailMsg = errData.details ? ` (${errData.details})` : "";
          const codeMsg = errData.errorCode ? ` [${errData.errorCode}]` : "";
          const msg = baseMsg + detailMsg + codeMsg;
          if (res.status === 401) {
            throw new Error(`Oturum bulunamadı. ${errData.debug ? "Debug: " + JSON.stringify(errData.debug) : "Lütfen çıkış yapıp tekrar giriş yapın."}`);
          }
          if (res.status === 403) {
            throw new Error(`Yönetici yetkiniz yok. ${msg}`);
          }
          throw new Error(msg);
        }
        const data = await res.json();
        if (data.ok) {
          setRequestStatuses(data.requestStatuses || []);
          setFreeProcessStatuses(data.freeProcessStatuses || []);
          setError(null);
        } else {
          throw new Error(data.error || "Veri yüklenemedi");
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Veriler yüklenirken hata oluştu.");
        toast.error(err.message || "Veriler yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Helper functions ──

  function isFreeId(id: string): boolean {
    return freeProcessStatusesRef.current.some((ps) => ps.id === id);
  }

  function getProcessInRequest(processId: string): { requestStatusId: string; processId: string } | null {
    for (const rs of requestStatusesRef.current) {
      if (rs.processStatuses.some((ps) => ps.id === processId)) {
        return { requestStatusId: rs.id, processId };
      }
    }
    return null;
  }

  function findRequestById(reqId: string) {
    return requestStatusesRef.current.find((rs) => rs.id === reqId);
  }

  // ── Drag handlers ──

  // Highlight target step — over elementinin data-step-id attribute'ından oku
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;

    const overIdStr = over.id.toString();
    let stepId: string | null = null;

    if (overIdStr.startsWith("req-")) {
      // Doğrudan step elementi
      stepId = overIdStr.slice("req-".length);
    } else if (overIdStr.startsWith("proc-")) {
      // process card içinde bir step var — DOM'dan data-step-id bul
      // over.data.current'ten parent bilgisini almaya çalış
      // Basit yaklaşım: process card'ın data-step-id attribute'ını bul
      const procId = overIdStr.slice("proc-".length);
      // Bu ID ile eşleşen process'i bul
      for (const rs of requestStatusesRef.current) {
        if (rs.processStatuses.some((ps) => ps.id === procId)) {
          stepId = rs.id;
          break;
        }
      }
    }

    if (stepId) {
      setOverId(stepId);
      overIdRef.current = stepId;
    } else {
      setOverId(null);
      overIdRef.current = null;
    }
  }, [requestStatusesRef]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  // ── Drop logic ──
  const doDrop = useCallback((activeIdStr: string, overIdStr: string | null) => {
    if (!overIdStr) return;

    const currentFree = freeProcessStatusesRef.current;
    const currentRequest = requestStatusesRef.current;

    // Source type
    const isFreeSource = activeIdStr.startsWith("free-");
    const cleanActiveId = isFreeSource
      ? activeIdStr.slice("free-".length)
      : activeIdStr.replace("proc-", "");

    // Target request ID
    let targetReqId: string | null = null;

    if (overIdStr.startsWith("req-")) {
      targetReqId = overIdStr.slice("req-".length);
    } else if (overIdStr.startsWith("proc-")) {
      // process card — onun içindeki step'i bul
      const procId = overIdStr.slice("proc-".length);
      const procInfo = getProcessInRequest(procId);
      targetReqId = procInfo?.requestStatusId ?? null;
    }

    // ── Case 1: Free → Request Step ──
    if (isFreeSource && targetReqId && isFreeId(cleanActiveId)) {
      const item = currentFree.find((ps) => ps.id === cleanActiveId);
      if (!item) return;

      const targetRs = findRequestById(targetReqId);
      if (!targetRs) return;

      setFreeProcessStatuses((prev) => prev.filter((ps) => ps.id !== cleanActiveId));
      setRequestStatuses((prev) =>
        prev.map((rs) =>
          rs.id === targetReqId
            ? {
                ...rs,
                processStatuses: [
                  ...rs.processStatuses,
                  { ...item, order: rs.processStatuses.length },
                ],
              }
            : rs
        )
      );
      toast.success(`"${item.name}" → "${targetRs.name}" adımına eklendi`);
      return;
    }

    // ── Case 2: Reorder process within request step ──
    if (activeIdStr.startsWith("proc-") && targetReqId) {
      const activeProc = getProcessInRequest(cleanActiveId);
      if (!activeProc) return;

      const items = findRequestById(activeProc.requestStatusId)?.processStatuses || [];
      const oldIdx = items.findIndex((ps) => ps.id === activeProc.processId);
      if (oldIdx === -1) return;

      let newIdx = oldIdx;
      if (overIdStr.startsWith("proc-")) {
        const overProc = getProcessInRequest(overIdStr.slice("proc-".length));
        if (overProc && overProc.requestStatusId === activeProc.requestStatusId) {
          newIdx = items.findIndex((ps) => ps.id === overProc.processId);
        }
      }

      if (oldIdx !== newIdx && newIdx !== -1) {
        setRequestStatuses((prev) =>
          prev.map((rs) => {
            if (rs.id === activeProc.requestStatusId) {
              return { ...rs, processStatuses: arrayMove([...items], oldIdx, newIdx) };
            }
            return rs;
          })
        );
      }
      return;
    }

    // ── Case 3: Reorder request steps ──
    if (activeIdStr.startsWith("req-") && overIdStr.startsWith("req-")) {
      const oldIdx = currentRequest.findIndex((rs) => rs.id === cleanActiveId);
      const newIdx = currentRequest.findIndex((rs) => rs.id === targetReqId!);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setRequestStatuses((prev) => arrayMove(prev, oldIdx, newIdx));
      }
    }
  }, [getProcessInRequest, findRequestById, isFreeId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      setOverId(null);
      overIdRef.current = null;
      return;
    }

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    setActiveId(null);
    setOverId(null);
    overIdRef.current = null;

    doDrop(activeIdStr, overIdStr);
  }, [doDrop]);

  // ── Remove process from bucket ──
  const handleRemoveProcess = useCallback(
    (requestStatusId: string, processStatusId: string) => {
      const rs = requestStatusesRef.current.find((r) => r.id === requestStatusId);
      const item = rs?.processStatuses.find((ps) => ps.id === processStatusId);
      if (!item) return;

      setRequestStatuses((prev) =>
        prev.map((rs) =>
          rs.id === requestStatusId
            ? { ...rs, processStatuses: rs.processStatuses.filter((ps) => ps.id !== processStatusId) }
            : rs
        )
      );
      setFreeProcessStatuses((prev) => [...prev, { ...item, order: prev.length }]);
      toast.info(`"${item.name}" boşta listeye taşındı`);
    },
    []
  );

  // ── Save handler ──

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        requestStatuses: requestStatusesRef.current.map((rs, idx) => ({
          id: rs.id,
          name: rs.name,
          ton: rs.ton,
          order: idx,
          processStatuses: rs.processStatuses.map((ps, pIdx) => ({
            processStatusId: ps.id,
            order: pIdx,
          })),
        })),
        freeProcessStatuses: freeProcessStatusesRef.current.map((ps) => ({
          id: ps.id,
          name: ps.name,
          ton: ps.ton,
          order: ps.order,
          requestStatusId: null,
        })),
      };

      const res = await fetch("/api/statuses/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kaydetme başarısız.");
      }

      toast.success(data.message || "Değişiklikler kaydedildi.");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600 dark:border-zinc-600 dark:border-t-indigo-400" />
          <p className="text-sm text-zinc-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Veri yüklenemedi</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Statü Yöneticisi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Talep durumlarını yukarıdan aşağıya sürükleyerek sıralayın. Aday durumlarını sağdaki panelden ilgili adımlara sürükleyin.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6">
          {/* Steps Column */}
          <div className="flex-1">
            <div className="relative pl-10">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-700" />

              <SortableContext
                items={requestStatuses.map((rs) => `req-${rs.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6 pb-6">
                  {requestStatuses.map((rs, idx) => (
                    <RequestStep
                      key={rs.id}
                      item={{ ...rs, processStatuses: rs.processStatuses.sort((a, b) => a.order - b.order) }}
                      index={idx}
                      isOver={overId === rs.id}
                      onRemoveProcess={handleRemoveProcess}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Free Pool Sidebar */}
          <div className="w-72 shrink-0">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Boştaki Aday Durumları
                  </h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {freeProcessStatuses.length}
                  </span>
                </div>
                {freeProcessStatuses.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-400">
                    Tüm aday durumları talep adımlarına atanmış.
                  </p>
                ) : (
                  <SortableContext
                    items={freeProcessStatuses.map((ps) => `free-${ps.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {freeProcessStatuses.map((ps) => (
                        <FreePoolItem key={ps.id} item={ps} />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
