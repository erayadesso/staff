"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
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
/* Type'lar                                                            */
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
/* Sortable Item Component (iç içe draggable)                          */
/* ------------------------------------------------------------------ */

function SortableItem({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm transition hover:border-zinc-400 hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
      >
        {/* Drag handle */}
        <svg
          className="h-4 w-4 shrink-0 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aday Durumu Item (sürüklenebilir)                                   */
/* ------------------------------------------------------------------ */

function ProcessStatusCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ProcessStatusItem;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  return (
    <SortableItem id={item.id}>
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
            autoFocus
            onBlur={() => {
              setEditing(false);
              if (editName.trim() && editName !== item.name) {
                onEdit(item.id, editName.trim());
              } else {
                setEditName(item.name);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                if (editName.trim() && editName !== item.name) {
                  onEdit(item.id, editName.trim());
                } else {
                  setEditName(item.name);
                }
              } else if (e.key === "Escape") {
                setEditing(false);
                setEditName(item.name);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {item.name}
          </span>
          {item.ton && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                item.ton === "aktif"
                  ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : item.ton === "beklemede"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {item.ton}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="rounded p-0.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </SortableItem>
  );
}

/* ------------------------------------------------------------------ */
/* Talep Durumu Bucket (hedef alan)                                    */
/* ------------------------------------------------------------------ */

function RequestStatusBucket({
  item,
  isOver,
  onEdit,
  onRemove,
  onAddFree,
}: {
  item: RequestStatusItem;
  isOver: boolean;
  onEdit: (id: string, name: string, ton: string) => void;
  onRemove: (requestStatusId: string, processStatusId: string) => void;
  onAddFree: (processStatusId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editTon, setEditTon] = useState(item.ton || "aktif");

  return (
    <div
      className={`rounded-2xl border-2 bg-white p-4 shadow-sm transition-all dark:bg-zinc-950 ${
        isOver
          ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm font-semibold dark:border-zinc-600 dark:bg-zinc-800"
              autoFocus
              onBlur={() => {
                setEditing(false);
                if (editName.trim()) onEdit(item.id, editName.trim(), editTon);
              }}
            />
            <select
              value={editTon}
              onChange={(e) => setEditTon(e.target.value)}
              onBlur={() => onEdit(item.id, editName, editTon)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="aktif">Aktif</option>
              <option value="beklemede">Beklemede</option>
              <option value="kapali">Kapalı</option>
            </select>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(true);
                  setEditName(item.name);
                }}
                className="text-left text-sm font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
              >
                {item.name}
              </button>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  item.ton === "aktif"
                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                    : item.ton === "beklemede"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {item.ton}
              </span>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {item.processStatuses.length}
            </span>
          </>
        )}
      </div>

      {/* Process statuses */}
      <div className="space-y-2">
        {item.processStatuses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 py-4 text-center text-xs text-zinc-400 dark:border-zinc-700">
            Aday durumu sürükleyin
          </p>
        ) : (
          <SortableContext
            items={item.processStatuses.map((ps) => ps.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {item.processStatuses.map((ps) => (
                <ProcessStatusCard
                  key={ps.id}
                  item={ps}
                  onEdit={(id, name) => {
                    // Edit handled by parent
                  }}
                  onDelete={(id) => onRemove(item.id, id)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Add free process status button */}
      {/* <button
        onClick={() => onAddFree(item.id)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-xs text-zinc-400 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Aday durumu ekle
      </button> */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Boşta kalan Aday Durumları Pool                                     */
/* ------------------------------------------------------------------ */

function FreeProcessStatusPool({
  items,
  onEdit,
  onDelete,
  onRemoveFromPool,
}: {
  items: ProcessStatusItem[];
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onRemoveFromPool: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Boştaki Aday Durumları{" "}
        <span className="text-xs font-normal text-zinc-500">
          ({items.length} adet)
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-400">
          Tüm aday durumları talep durumlarına atanmış.
        </p>
      ) : (
        <div className="space-y-2">
          <SortableContext
            items={items.map((ps) => ps.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((ps) => (
              <ProcessStatusCard
                key={ps.id}
                item={ps}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        </div>
      )}
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

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // credentials: include — Next.js JWT cookie'sini gönderir
        const res = await fetch("/api/statuses/for-dnd", { credentials: "include" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // API'den gelen detaylı mesajı kullan
          const msg = errData.error || `HTTP ${res.status}`;
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

  // Drag & Drop handlers
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id.toString();
    
    // Check if over a request status bucket
    const isOverBucket = requestStatuses.some((rs) => rs.id === overId);
    if (isOverBucket) {
      setOverId(overId);
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Check if dragging from free pool
    const isFromFreePool = freeProcessStatuses.some((ps) => ps.id === activeId);
    
    // Check if over a request status bucket
    const targetBucket = requestStatuses.find((rs) => rs.id === overId);

    if (isFromFreePool && targetBucket) {
      // Add to bucket
      const item = freeProcessStatuses.find((ps) => ps.id === activeId);
      if (item) {
        setFreeProcessStatuses((prev) => prev.filter((ps) => ps.id !== activeId));
        setRequestStatuses((prev) =>
          prev.map((rs) =>
            rs.id === overId
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
      }
    } else if (targetBucket && active.data.current?.sortable?.originalIndex !== undefined) {
      // Reorder within same bucket
      const oldIndex = active.data.current.sortable.originalIndex;
      const newIndex = over.id.toString().includes("_")
        ? overId.split("_")[1]
        : oldIndex;
      
      setRequestStatuses((prev) =>
        prev.map((rs) => {
          if (rs.id === overId || overId.startsWith(rs.id + "_")) {
            const processStatusId = overId.replace(rs.id + "_", "");
            const processIndex = rs.processStatuses.findIndex(
              (ps) => ps.id === processStatusId
            );
            if (processIndex !== -1 && oldIndex !== newIndex) {
              const newProcessStatuses = arrayMove(
                rs.processStatuses,
                oldIndex,
                newIndex
              );
              return { ...rs, processStatuses: newProcessStatuses };
            }
          }
          return rs;
        })
      );
    }

    setActiveId(null);
    setOverId(null);
  };

  // Edit handlers
  const handleEditRequestStatus = (
    id: string,
    name: string,
    ton: string
  ) => {
    setRequestStatuses((prev) =>
      prev.map((rs) =>
        rs.id === id ? { ...rs, name, ton } : rs
      )
    );
  };

  const handleRemoveFromBucket = (
    requestStatusId: string,
    processStatusId: string
  ) => {
    const item = requestStatuses
      .find((rs) => rs.id === requestStatusId)
      ?.processStatuses.find((ps) => ps.id === processStatusId);
    
    if (item) {
      setRequestStatuses((prev) =>
        prev.map((rs) =>
          rs.id === requestStatusId
            ? {
                ...rs,
                processStatuses: rs.processStatuses.filter(
                  (ps) => ps.id !== processStatusId
                ),
              }
            : rs
        )
      );
      setFreeProcessStatuses((prev) => [...prev, item]);
    }
  };

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        requestStatuses: requestStatuses.map((rs) => ({
          id: rs.id,
          name: rs.name,
          ton: rs.ton,
          order: rs.order,
          processStatuses: rs.processStatuses.map((ps, idx) => ({
            processStatusId: ps.id,
            order: idx,
          })),
        })),
        freeProcessStatuses: freeProcessStatuses.map((ps) => ({
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
  };

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
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Veri yüklenemedi
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
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
          Aday durumlarını talep durumlarının içine sürükleyerek eşleştirin.
          Değişiklikleri kaydetmeyi unutmayın.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </div>

      {/* Drag & Drop Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => {
          setActiveId(event.active.id.toString());
        }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Request Status Buckets */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Talep Durumları{" "}
              <span className="text-xs font-normal text-zinc-500">
                (Aday durumlarını içlerine sürükleyin)
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {requestStatuses.map((rs) => (
                <RequestStatusBucket
                  key={rs.id}
                  item={{
                    ...rs,
                    processStatuses: rs.processStatuses.sort((a, b) => a.order - b.order),
                  }}
                  isOver={overId === rs.id}
                  onEdit={handleEditRequestStatus}
                  onRemove={handleRemoveFromBucket}
                  onAddFree={() => {}}
                />
              ))}
            </div>
          </div>

          {/* Free Process Statuses Pool */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Boştaki Aday Durumları
            </h2>
            <div className="sticky top-4">
              <FreeProcessStatusPool
                items={freeProcessStatuses}
                onEdit={() => {}}
                onDelete={() => {}}
                onRemoveFromPool={() => {}}
              />
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
