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

interface GIFInstance {
  addFrame: (element: HTMLCanvasElement, options?: { delay: number; copy?: boolean }) => void;
  on: (event: 'finished', callback: (blob: Blob) => void) => void;
  render: () => void;
}

interface WindowWithGif extends Window {
  GIF?: new (options: {
    workers: number;
    quality: number;
    workerScript: string;
    width?: number;
    height?: number;
  }) => GIFInstance;
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

  const [showGifModal, setShowGifModal] = useState(false);
  const [checkedPhotos, setCheckedPhotos] = useState<Record<string, boolean>>({});
  const [gifSpeed, setGifSpeed] = useState<0.3 | 0.6 | 1.0>(0.6);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [generatingGif, setGeneratingGif] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);

  // Load gif.js script with fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as unknown as WindowWithGif;
      if (w.GIF) {
        setTimeout(() => setGifLoaded(true), 0);
        return;
      }

      const existing = document.querySelector('script[src*="gif.js"]');
      if (existing) {
        existing.addEventListener("load", () => {
          setTimeout(() => setGifLoaded(true), 0);
        });
        setTimeout(() => {
          if (w.GIF) {
            setGifLoaded(true);
          }
        }, 1500);
        return;
      }

      const loadScript = (src: string, onFallback: () => void) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          setTimeout(() => setGifLoaded(true), 0);
        };
        script.onerror = () => {
          script.remove();
          onFallback();
        };
        document.body.appendChild(script);
      };

      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js",
        () => {
          loadScript(
            "https://unpkg.com/gif.js@0.2.0/dist/gif.js",
            () => {
              loadScript(
                "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js",
                () => {
                  console.error("All GIF CDNs failed to load.");
                }
              );
            }
          );
        }
      );
    }
  }, []);

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

  const preprocessFramesWithWatermark = useCallback(
    async (
      photosArray: typeof guestPhotos,
      eventLabel: string,
    ): Promise<HTMLCanvasElement[]> => {
      return Promise.all(
        photosArray.map(async (p) => {
          return new Promise<HTMLCanvasElement>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || 600;
              canvas.height = img.naturalHeight || 800;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                const barHeight = Math.max(30, Math.round(canvas.height * 0.05));
                ctx.fillRect(
                  0,
                  canvas.height - barHeight,
                  canvas.width,
                  barHeight,
                );

                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                const fontSize = Math.max(
                  11,
                  Math.round(canvas.height * 0.018),
                );
                ctx.font = `600 ${fontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                  eventLabel || "Kiranya Bahagia Virtual Photobooth",
                  canvas.width / 2,
                  canvas.height - barHeight / 2,
                );
                ctx.restore();
              }
              resolve(canvas);
            };
            img.onerror = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 600;
              canvas.height = 800;
              resolve(canvas);
            };
            img.src = p.pictureUrl;
          });
        }),
      );
    },
    [],
  );

  const generateGif = useCallback(async () => {
    const selected = guestPhotos.filter((p) => p.id && checkedPhotos[p.id]);
    if (selected.length < 2) {
      alert("Pilih minimal 2 foto untuk membuat GIF.");
      return;
    }
    setGeneratingGif(true);
    setGifUrl(null);

    try {
      const cdns = [
        "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
        "https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js",
        "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
      ];

      let workerBlob: Blob | null = null;
      for (const url of cdns) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            workerBlob = await res.blob();
            break;
          }
        } catch (e) {
          console.warn("Failed to fetch worker from " + url, e);
        }
      }

      if (!workerBlob) {
        throw new Error("Failed to load GIF worker script from CDNs.");
      }

      const workerUrl = URL.createObjectURL(workerBlob);
      const w = window as unknown as WindowWithGif;
      if (!w.GIF) {
        alert("Pustaka pembuat GIF belum dimuat. Silakan coba lagi.");
        setGeneratingGif(false);
        return;
      }

      const frames = await preprocessFramesWithWatermark(selected, event?.name || "Kiranya Bahagia");

      const gif = new w.GIF({
        workers: 2,
        quality: 10,
        workerScript: workerUrl,
        width: 300,
        height: 400
      });

      for (const canvas of frames) {
        gif.addFrame(canvas, { delay: gifSpeed * 1000, copy: true });
      }

      gif.on("finished", (blob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGifUrl(reader.result as string);
          setGeneratingGif(false);
          URL.revokeObjectURL(workerUrl);
        };
        reader.readAsDataURL(blob);
      });

      gif.render();
    } catch (err) {
      console.error(err);
      alert("Gagal membuat GIF.");
      setGeneratingGif(false);
    }
  }, [guestPhotos, checkedPhotos, gifSpeed, event, preprocessFramesWithWatermark]);

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

        {/* Bottom bar for GIF creation */}
        {guestPhotos.length >= 2 && (
          <div className="p-4 bg-[#F7F3ED] border-t border-border shrink-0">
            <button
              type="button"
              onClick={() => {
                setGifUrl(null);
                const initialChecked: Record<string, boolean> = {};
                guestPhotos.forEach((p) => {
                  if (p.id) initialChecked[p.id] = true;
                });
                setCheckedPhotos(initialChecked);
                setShowGifModal(true);
              }}
              className="w-full bg-[#1C1815] text-white rounded-xl py-3 text-[13px] font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              <span className="text-[9px] font-bold border border-current rounded px-0.8 scale-90 select-none leading-none mr-0.5">GIF</span>
              Buat GIF Animasi ({guestPhotos.length} foto)
            </button>
          </div>
        )}
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
            <div className="relative bg-[#1C1815] flex items-center justify-center overflow-hidden">
              <Image
                src={selectedPhoto.pictureUrl}
                alt={selectedPhoto.guestName}
                width={600}
                height={800}
                className="w-full h-auto max-h-[65vh] object-contain"
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

      {/* GIF Maker Modal */}
      {showGifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[rgba(28,24,21,0.75)] backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-85 bg-[#F7F3ED] rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset] animate-[modalIn_0.3s_ease] flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40 shrink-0">
              <h3 className="text-[15px] font-semibold text-text-primary">
                Buat GIF Animasi
              </h3>
              <button
                type="button"
                onClick={() => setShowGifModal(false)}
                className="w-7 h-7 rounded-full bg-accent-hover flex items-center justify-center border-none cursor-pointer text-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 flex flex-col gap-5">
              {/* Photo Selector Grid */}
              <div className="flex flex-col gap-2 shrink-0">
                <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                  Pilih Foto (Min. 2)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {guestPhotos.map((gp) => (
                    <button
                      key={gp.id}
                      type="button"
                      onClick={() => {
                        if (gp.id) {
                          setCheckedPhotos((prev) => ({
                            ...prev,
                            [gp.id!]: !prev[gp.id!],
                          }));
                          setGifUrl(null);
                        }
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer active:scale-95 transition-all ${
                        gp.id && checkedPhotos[gp.id]
                          ? "border-accent ring-2 ring-accent/35"
                          : "border-border opacity-65"
                      }`}
                    >
                      <Image
                        src={gp.pictureUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      {gp.id && checkedPhotos[gp.id] && (
                        <div className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-accent flex items-center justify-center shadow-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-white">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Controller */}
              <div className="flex flex-col gap-2 shrink-0">
                <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                  Kecepatan Animasi
                </span>
                <div className="flex gap-2">
                  {([
                    { label: "🐢 Lambat", val: 1.0 },
                    { label: "🚶 Sedang", val: 0.6 },
                    { label: "⚡ Cepat", val: 0.3 },
                  ] as const).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setGifSpeed(opt.val);
                        setGifUrl(null);
                      }}
                      className={`flex-1 py-2.5 rounded-[10px] border text-[12px] font-medium transition-colors cursor-pointer ${
                        gifSpeed === opt.val
                          ? "bg-dark text-dark-text border-dark"
                          : "border-border text-[#6B6357] hover:bg-accent-hover"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview area */}
              <div className="flex flex-col gap-2 shrink-0 items-center">
                <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase self-start">
                  Pratinjau
                </span>
                <div className="w-48 aspect-square rounded-xl bg-accent-hover border border-border/40 overflow-hidden flex items-center justify-center relative">
                  {generatingGif ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span className="text-[11px] text-text-muted">
                        Mengolah GIF...
                      </span>
                    </div>
                  ) : gifUrl ? (
                    <Image
                      src={gifUrl}
                      alt="GIF Preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <p className="text-[12px] text-text-muted">
                        Ketuk tombol di bawah untuk membuat pratinjau GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-border/40 shrink-0 flex flex-col gap-2">
              {gifUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = gifUrl;
                    link.download = `greeting-gif-${Date.now()}.gif`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-accent text-white rounded-xl py-3.5 text-[13.5px] font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-0.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Unduh File GIF
                </button>
              )}

              <button
                type="button"
                disabled={
                  generatingGif ||
                  !gifLoaded ||
                  guestPhotos.filter((p) => p.id && checkedPhotos[p.id])
                    .length < 2
                }
                onClick={generateGif}
                className="w-full bg-dark text-dark-text rounded-xl py-3.5 text-[13.5px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-0.5">
                  <path d="m15 4-2 2M19 8l-2-2M20 3l-2.5 2.5M10.5 12.5 3 20M14.5 8.5 7 16" />
                </svg>
                {generatingGif ? "Mengolah GIF..." : !gifLoaded ? "Memuat Pustaka..." : gifUrl ? "Buat Ulang Pratinjau GIF" : "Buat Pratinjau GIF"}
              </button>
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
