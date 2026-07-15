"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  slug: string;
}

interface GuestPhoto {
  id: string;
  pictureUrl: string;
  guestName: string;
  notes: string | null;
  voiceUrl?: string | null;
}

export default function GalleryPage() {
  const { "slug-event": slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    pictureUrl: string;
    guestName: string;
    notes: string | null;
    voiceUrl?: string | null;
  } | null>(null);

  // Fetch Event
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/slug/${slug}`);
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setEvent(data);
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Fetch all photos of the event
  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/${event.id}/photos`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setGuestPhotos(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch photos:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-text-muted">Memuat...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-text-muted">Event tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center min-[403px]:px-3 min-[403px]:py-8 sm:py-12">
      {/* Phone frame */}
      <div className="w-full max-w-93.75 bg-[#F7F3ED] min-[403px]:rounded-[36px] min-[403px]:shadow-[0_20px_60px_rgba(28,24,21,0.25),0_0_0_8px_#1C1815] overflow-hidden flex flex-col min-h-dvh sm:min-h-dvh relative">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-5 pt-4.5 pb-3.5 border-b border-border shrink-0">
          <Link
            href={`/${event.slug}`}
            className="w-8.5 h-8.5 rounded-full bg-accent-hover flex items-center justify-center border-none cursor-pointer text-text-primary text-base shrink-0"
          >
            <i className="ti ti-chevron-left" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text-primary truncate">
              Galeri Foto Tamu
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 truncate">
              {event.name}
            </div>
          </div>
        </div>

        {/* Scrollable Gallery Content */}
        <div className="px-6 py-5 flex-1 flex flex-col overflow-y-auto">
          {guestPhotos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent-hover flex items-center justify-center mb-4">
                <i className="ti ti-photo-off text-[28px] text-accent" />
              </div>
              <p className="text-sm text-text-muted font-medium">
                Belum ada foto galeri.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {guestPhotos.map((gp) => (
                <button
                  key={gp.id}
                  type="button"
                  onClick={() =>
                    setSelectedPhoto({
                      pictureUrl: gp.pictureUrl,
                      guestName: gp.guestName,
                      notes: gp.notes,
                      voiceUrl: gp.voiceUrl,
                    })
                  }
                  className="rounded-lg overflow-hidden border border-border bg-surface cursor-pointer active:scale-[0.97] transition-transform text-left"
                >
                  <Image
                    src={gp.pictureUrl}
                    alt={gp.guestName}
                    width={150}
                    height={150}
                    className="w-full aspect-square object-cover"
                  />
                  {gp.notes && (
                    <div className="px-1.5 py-1.5 text-[10px] text-text-muted leading-tight line-clamp-2">
                      {gp.notes}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,21,0.7)] animate-[fadeIn_0.2s_ease]"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="w-full max-w-85 mx-4 bg-[#F7F3ED] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-[modalIn_0.25s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.pictureUrl}
              alt={selectedPhoto.guestName}
              width={400}
              height={533}
              className="w-full aspect-3/4 object-cover"
            />
            <div className="px-5 py-4">
              <div className="text-[14px] font-medium text-text-primary">
                {selectedPhoto.guestName}
              </div>
              {selectedPhoto.notes && (
                <div className="text-[13px] text-text-muted mt-1 leading-relaxed">
                  {selectedPhoto.notes}
                </div>
              )}
              {selectedPhoto.voiceUrl && (
                <div className="mt-3.5 pt-3 border-t border-border/40">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-text-muted font-medium mb-1.5">
                    Pesan Suara
                  </div>
                  <audio
                    src={selectedPhoto.voiceUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-9 rounded-lg"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="w-full border-t border-border py-3.5 text-[13.5px] font-medium text-text-primary active:bg-accent-hover transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
