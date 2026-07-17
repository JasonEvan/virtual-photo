"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function TrialGalleryPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id?: string;
    pictureUrl: string;
    guestName: string;
    notes: string | null;
    voiceUrl?: string | null;
  } | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Initialize trial session and load photos from localStorage
  useEffect(() => {
    setTimeout(() => {
      setEvent({
        id: "trial-event",
        name: "Sesi Uji Coba (Trial)",
        slug: "trial",
      });

      try {
        const stored = localStorage.getItem("vphoto_trial_photos");
        if (stored) {
          setGuestPhotos(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load trial photos:", err);
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  const handleDownload = useCallback(
    async (photo: {
      pictureUrl: string;
      guestName: string;
      notes: string | null;
      voiceUrl?: string | null;
    }) => {
      if (downloading) return;
      setDownloading(true);
      try {
        const res = await fetch(`/api/trial/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pictureUrl: photo.pictureUrl,
            guestName: photo.guestName,
            notes: photo.notes,
            voiceUrl: photo.voiceUrl || null,
          }),
        });
        if (!res.ok) throw new Error("Failed to download ZIP");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeName =
          photo.guestName.replace(/[^a-zA-Z0-9]/g, "_") || "guest";
        link.download = `greeting-trial-${safeName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert("Gagal mengunduh ZIP.");
      } finally {
        setDownloading(false);
      }
    },
    [downloading],
  );

  const handleDownloadAll = useCallback(async () => {
    if (guestPhotos.length === 0) return;
    setDownloadingAll(true);
    try {
      const res = await fetch("/api/trial/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: guestPhotos }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal mengunduh ZIP.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "gallery-trial-all-greetings.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh ZIP.");
    } finally {
      setDownloadingAll(false);
    }
  }, [guestPhotos]);

  const handleClearGallery = useCallback(() => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus semua foto uji coba di galeri ini?",
      )
    ) {
      localStorage.removeItem("vphoto_trial_photos");
      setGuestPhotos([]);
    }
  }, []);

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
      <div className="w-full max-w-93.75 bg-[#F7F3ED] min-[403px]:rounded-[36px] min-[403px]:shadow-[0_20px_60px_rgba(28,24,21,0.25),0_0_0_8px_#1C1815] overflow-hidden flex flex-col min-h-dvh sm:min-h-dvh min-[403px]:h-203 min-[403px]:max-h-[90vh] min-[403px]:min-h-0 relative">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-5 pt-4.5 pb-3.5 border-b border-border shrink-0">
          <Link
            href="/trial"
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
          {guestPhotos.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={downloadingAll}
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent bg-accent/5 hover:bg-accent/10 active:bg-accent/15 text-[11px] font-semibold text-accent cursor-pointer transition-colors disabled:opacity-50"
              >
                <i className={downloadingAll ? "ti ti-loader animate-spin" : "ti ti-download"} />
                {downloadingAll ? "Unduh..." : "Unduh Semua"}
              </button>
              <button
                type="button"
                onClick={handleClearGallery}
                className="w-8.5 h-8.5 rounded-full hover:bg-red-50 flex items-center justify-center border-none cursor-pointer transition-colors"
                title="Kosongkan Galeri Uji Coba"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-red-500"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
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
                      id: gp.id,
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
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(28,24,21,0.75)] backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="w-full max-w-85 bg-[#F7F3ED] rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] animate-[modalIn_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <div className="relative">
              <Image
                src={selectedPhoto.pictureUrl}
                alt={selectedPhoto.guestName}
                width={400}
                height={533}
                className="w-full aspect-3/4 object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-[rgba(255,255,255,0.9)] hover:bg-black/60 active:scale-90 transition-all cursor-pointer border border-white/10 text-[18px] font-light leading-none"
              >
                ×
              </button>
            </div>

            {/* Details */}
            <div className="px-6 pt-5 pb-5">
              <div className="text-[15px] font-semibold text-text-primary tracking-[-0.01em]">
                {selectedPhoto.guestName}
              </div>
              {selectedPhoto.notes && (
                <div className="text-[13px] text-text-muted mt-1.5 leading-[1.65]">
                  {selectedPhoto.notes}
                </div>
              )}
              {selectedPhoto.voiceUrl && (
                <div className="mt-4 p-3.5 bg-[rgba(0,0,0,0.035)] rounded-2xl">
                  <div className="text-[10px] tracking-[0.16em] uppercase text-text-muted font-semibold mb-2 flex items-center gap-1.5">
                    <i className="ti ti-microphone text-[11px]" />
                    Pesan Suara
                  </div>
                  <audio
                    src={selectedPhoto.voiceUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full h-9 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="flex-1 py-4 text-[13.5px] font-medium text-text-primary active:bg-accent-hover transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {selectedPhoto && (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => handleDownload(selectedPhoto)}
                  className="flex-1 py-4 text-[13.5px] font-semibold text-accent active:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer border-l border-border/60"
                >
                  {downloading ? (
                    <>
                      <i className="ti ti-loader animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-download text-[14px]" />
                      Unduh ZIP
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
