"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  packetId?: string | null;
  packet?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  slug: "",
  startDate: "",
  endDate: "",
  packetId: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [packetsList, setPacketsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setEvents(data);
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/packets");
        if (res.ok) {
          const data = await res.json();
          setPacketsList(data);
        }
      } catch (err) {
        console.error("Failed to fetch packets:", err);
      }
    })();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (event: Event) => {
    setForm({
      name: event.name,
      slug: event.slug,
      startDate: event.startDate,
      endDate: event.endDate,
      packetId: event.packetId || "",
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) cancelForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancelForm();
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: editingId ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      showToast("Event updated");
    } else {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      showToast("Event created");
    }
    cancelForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    showToast("Event deleted");
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-background flex justify-center px-4 py-10">
      <div className="w-full max-w-130">
        <h1 className="text-[20px] font-semibold text-text-primary mb-1">
          Events
        </h1>
        <p className="text-[13px] text-text-muted mb-7">
          Manage events for the virtual photo booth.
        </p>

        <button
          onClick={openCreate}
          className="w-full bg-dark text-dark-text rounded-xl px-6 py-3.5 text-sm font-medium mb-6 active:scale-[0.98] transition-transform"
        >
          + Create Event
        </button>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
          >
            <div className="bg-surface border border-border rounded-[14px] p-5 w-full max-w-105 shadow-lg">
              <div className="text-[14.5px] font-semibold text-text-primary mb-4">
                {editingId ? "Edit Event" : "New Event"}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                    placeholder="Pernikahan Ayu & Bagas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Packet
                  </label>
                  <select
                    value={form.packetId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, packetId: e.target.value }))
                    }
                    required
                    className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                  >
                    <option value="" disabled>
                      Select a packet
                    </option>
                    {packetsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    required
                    disabled={!!editingId}
                    className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="ayu-bagas"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      required
                      className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      required
                      className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-dark text-dark-text rounded-xl px-6 py-3 text-sm font-medium active:scale-[0.98] transition-transform"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="border border-border-subtle rounded-[10px] px-4 py-3 text-sm font-medium text-text-primary hover:bg-accent-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted text-center py-8">Loading...</p>
        ) : events.length === 0 ? (
          <div className="bg-surface border border-border rounded-[14px] p-8 text-center">
            <p className="text-sm text-text-muted">No events yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-surface border border-border rounded-[14px] p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/admin/${event.slug}`}
                    className="flex-1 min-w-0 hover:opacity-70 transition-opacity"
                  >
                    <div className="text-[14.5px] font-semibold text-text-primary">
                      {event.name}
                    </div>
                    <div className="text-[12px] text-text-muted mt-0.5">
                      /{event.slug}
                    </div>
                  </Link>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(event)}
                      className="border border-border-subtle rounded-[10px] px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-accent-hover transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="border border-border-subtle rounded-[10px] px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-text-secondary flex items-center justify-between mt-1">
                  <span>
                    {event.startDate} — {event.endDate}
                  </span>
                  {event.packet?.name && (
                    <span className="px-2.5 py-0.75 bg-accent/15 text-accent rounded-full font-medium text-[10px] uppercase tracking-wider font-semibold">
                      {event.packet.name.split(":")[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-dark-text rounded-full px-5 py-3 text-sm flex items-center gap-2">
            <span className="text-success">&#10003;</span>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
