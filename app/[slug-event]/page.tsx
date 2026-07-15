"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";

interface EventDetail {
  heroImage?: string | null;
  frameImage?: string | null;
  coupleNames?: string | null;
  tagline?: string | null;
  maxPhotos?: number;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  detail?: EventDetail | null;
}

type Screen = "landing" | "camera" | "result" | "done";

function getInitials(names: string): string {
  const parts = names.split(/[&+,]/).map((s) => s.trim());
  if (parts.length >= 2) return `${parts[0][0]}&${parts[1][0]}`;
  return parts[0]?.[0] ?? "?";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function removeGreenScreen(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = imageData.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        if (g > 80 && g > r * 1.4 && g > b * 1.4) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function GuestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params["slug-event"] as string;
  const guestId = searchParams.get("guest");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestValid, setGuestValid] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>("landing");

  const [photosUsed, setPhotosUsed] = useState(0);
  const [chancesLeft, setChancesLeft] = useState<number | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState<"Natural" | "Black & White">("Natural");
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [guestPhotos, setGuestPhotos] = useState<
    {
      id: string;
      pictureUrl: string;
      guestName: string;
      notes: string | null;
    }[]
  >([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    pictureUrl: string;
    guestName: string;
    notes: string | null;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch event
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/events/slug/${slug}`);
      if (!res.ok) {
        if (!cancelled) setLoading(false);
        return;
      }
      const data = await res.json();
      if (!cancelled) {
        setEvent(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Validate guest query param
  useEffect(() => {
    if (!guestId || !event) {
      if (event) {
        setTimeout(() => setGuestValid(false), 0);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/events/${event.id}/guests/validate?guestId=${guestId}`,
      );
      if (!res.ok) {
        if (!cancelled) setGuestValid(false);
        return;
      }
      const data = await res.json();
      if (!cancelled) {
        setGuestValid(data.valid);
        if (data.valid) setChancesLeft(data.chancesLeft);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guestId, event]);

  // Fetch guest photos
  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/events/${event.id}/photos`);
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) setGuestPhotos(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [event]);

  // Process frame image (chroma key green screen removal)
  useEffect(() => {
    const frameUrl = event?.detail?.frameImage;
    if (!frameUrl) {
      setTimeout(() => setProcessedFrame(null), 0);
      return;
    }
    let cancelled = false;
    removeGreenScreen(frameUrl).then((result) => {
      if (!cancelled) setProcessedFrame(result);
    });
    return () => {
      cancelled = true;
    };
  }, [event?.detail?.frameImage]);

  // Camera management
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Camera permission denied or unavailable
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (screen === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [screen, startCamera, stopCamera]);

  const coupleNames = event?.detail?.coupleNames ?? event?.name ?? "";
  const heroImage = event?.detail?.heroImage;
  const tagline = event?.detail?.tagline || "Kami menikah";
  const initials = getInitials(coupleNames);

  const navigateTo = useCallback((s: Screen) => {
    setFilter("Natural");
    setScreen(s);
  }, []);

  const takePhoto = useCallback(() => {
    if (chancesLeft === null || photosUsed >= chancesLeft) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    setPhotosUsed((p) => p + 1);
    navigateTo("result");
  }, [photosUsed, chancesLeft, navigateTo]);

  const savePhoto = useCallback(async () => {
    if (!capturedPhoto || !event || saving) return;
    setSaving(true);
    try {
      let blob: Blob;
      if (processedFrame) {
        const photoImg = await loadImage(capturedPhoto);
        const frameImg = await loadImage(processedFrame);
        const canvas = document.createElement("canvas");
        canvas.width = photoImg.naturalWidth;
        canvas.height = photoImg.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(photoImg, 0, 0);
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92),
        );
      } else {
        const res = await fetch(capturedPhoto);
        blob = await res.blob();
      }
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("guestName", "John Doe");
      formData.append("notes", notes);
      if (guestId) formData.append("guestId", guestId);

      const saveRes = await fetch(`/api/events/${event.id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (saveRes.ok) {
        setChancesLeft((c) => (c !== null ? c - 1 : c));
        navigateTo("done");
      }
    } finally {
      setSaving(false);
    }
  }, [
    capturedPhoto,
    event,
    saving,
    notes,
    navigateTo,
    processedFrame,
    guestId,
  ]);

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

  if (!guestId || guestValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-75">
          <div className="w-18 h-18 mx-auto mb-5 rounded-full bg-accent-hover flex items-center justify-center">
            <i className="ti ti-qrcode text-[32px] text-accent" />
          </div>
          <div className="text-[17px] font-medium text-text-primary mb-2">
            Tautan tidak valid
          </div>
          <div className="text-[13px] text-text-muted leading-relaxed">
            Silakan kunjungi website ini melalui pemindaian QR code yang
            diberikan oleh admin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center px-3 py-8 sm:py-12">
      {/* Phone frame */}
      <div className="w-full max-w-93.75 bg-[#F7F3ED] sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(28,24,21,0.25),0_0_0_8px_#1C1815] overflow-hidden flex flex-col min-h-dvh sm:min-h-dvh relative">
        {/* Hidden canvas + video for camera */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />

        {/* ===== SCREEN: LANDING ===== */}
        {screen === "landing" && (
          <div className="flex flex-col min-h-dvh sm:min-h-dvh animate-[fadeIn_0.35s_ease]">
            {/* Hero */}
            <div className="relative w-full h-105 overflow-hidden bg-linear-to-br from-[#2A2420] via-dark to-[#100D0B] shrink-0">
              {heroImage && (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-b from-[rgba(28,24,21,0.15)] via-[rgba(28,24,21,0.15)] to-[rgba(28,24,21,0.92)]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[15vw] text-white/8 font-serif tracking-wide font-medium">
                  {initials}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-1 flex flex-col">
              <div className="mb-5">
                <div className="text-[11px] tracking-[0.14em] uppercase text-accent font-medium mb-1.5">
                  {tagline}
                </div>
                <div className="text-[30px] leading-[1.05] font-medium text-text-primary font-serif">
                  {coupleNames}
                </div>
                <div className="text-[13px] text-text-muted mt-1.5 tracking-wide">
                  {formatDate(event.startDate)}
                  {event.endDate !== event.startDate &&
                    ` — ${formatDate(event.endDate)}`}
                </div>
              </div>

              {/* Quota */}
              <div className="flex items-center justify-between bg-accent-hover border border-[#DCD3BF] rounded-xl px-4 py-3 mb-5">
                <span className="text-[12.5px] text-[#5A5347]">
                  Sisa kesempatan foto kamu
                </span>
                <span className="text-[12.5px] font-medium text-[#5A5347]">
                  {chancesLeft !== null ? chancesLeft - photosUsed : 0}
                </span>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => navigateTo("camera")}
                disabled={chancesLeft === null || photosUsed >= chancesLeft}
                className="w-full bg-dark text-dark-text rounded-xl py-4 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:bg-[#C9C2B4] disabled:cursor-not-allowed"
              >
                <i className="ti ti-camera" />
                Mulai ambil foto
              </button>

              {/* Guest photos gallery */}
              {guestPhotos.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#DCD3BF]">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-accent font-medium mb-3">
                    Galeri foto tamu
                  </div>
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SCREEN: CAMERA ===== */}
        {screen === "camera" && (
          <div className="flex flex-col min-h-dvh sm:min-h-dvh animate-[fadeIn_0.35s_ease]">
            {/* Topbar */}
            <div className="flex items-center gap-3 px-5 pt-4.5 pb-3.5 border-b border-border shrink-0">
              <button
                type="button"
                onClick={() => navigateTo("landing")}
                className="w-8.5 h-8.5 rounded-full bg-accent-hover flex items-center justify-center border-none cursor-pointer text-text-primary text-base shrink-0"
              >
                <i className="ti ti-chevron-left" />
              </button>
              <div>
                <div className="text-[15px] font-medium text-text-primary">
                  Foto langsung
                </div>
                {/* <div className="text-[11.5px] text-text-muted mt-px">
                  Pilih efek lalu jepret
                </div> */}
              </div>
            </div>

            {/* Viewfinder */}
            <div className="flex-1 bg-[#2A2420] relative flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute top-4 left-4 bg-[rgba(28,24,21,0.6)] text-dark-text text-[11px] px-3 py-1.5 rounded-full font-medium">
                Natural
              </div>
            </div>

            {/* Controls */}
            <div className="bg-dark py-5 px-6 shrink-0">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-16.5 h-16.5 rounded-full bg-dark-text border-4 border-[#6B6357] cursor-pointer active:scale-90 transition-transform"
                  aria-label="Jepret foto"
                />
              </div>
              <div className="text-center text-[11.5px] text-[#A79B87] mt-3.5">
                Foto ini akan memakai 1 dari{" "}
                {chancesLeft !== null ? chancesLeft - photosUsed : 0}{" "}
                kesempatanmu
              </div>
            </div>
          </div>
        )}

        {/* ===== SCREEN: RESULT ===== */}
        {screen === "result" && (
          <div className="flex flex-col min-h-dvh sm:min-h-dvh animate-[fadeIn_0.35s_ease]">
            {/* Topbar */}
            <div className="flex items-center gap-3 px-5 pt-4.5 pb-3.5 border-b border-border shrink-0">
              <button
                type="button"
                onClick={() => navigateTo("camera")}
                className="w-8.5 h-8.5 rounded-full bg-accent-hover flex items-center justify-center border-none cursor-pointer text-text-primary text-base shrink-0"
              >
                <i className="ti ti-chevron-left" />
              </button>
              <div>
                <div className="text-[15px] font-medium text-text-primary">
                  Pratinjau foto
                </div>
                <div className="text-[11.5px] text-text-muted mt-px">
                  Pilih efek dan tambahkan ucapan
                </div>
              </div>
            </div>

            {/* Result content */}
            <div className="flex-1 px-6 py-6 flex flex-col">
              {/* Polaroid */}
              {processedFrame && capturedPhoto ? (
                <>
                  <div
                    className={`relative self-center my-1.5 rotate-[-1.5deg] animate-[polaroidIn_0.5s_ease] ${
                      filter === "Black & White"
                        ? "grayscale contrast-[1.05]"
                        : ""
                    }`}
                  >
                    <Image
                      src={capturedPhoto}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <Image
                      src={processedFrame}
                      alt=""
                      width={400}
                      height={533}
                      priority
                      className="relative w-full block"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-surface p-3 pb-4 rounded shadow-[0_8px_24px_rgba(28,24,21,0.18)] rotate-[-1.5deg] self-center my-1.5 animate-[polaroidIn_0.5s_ease]">
                  <div
                    className={`relative w-62.5 h-62.5 rounded-sm overflow-hidden flex items-center justify-center bg-linear-to-br from-[#D9CBAE] via-accent-light to-accent ${
                      filter === "Black & White"
                        ? "grayscale contrast-[1.05]"
                        : ""
                    }`}
                  >
                    {capturedPhoto ? (
                      <Image
                        src={capturedPhoto}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <i className="ti ti-user text-[48px] text-dark-text" />
                    )}
                  </div>
                </div>
              )}

              {/* Retake */}
              <button
                type="button"
                onClick={() => navigateTo("camera")}
                className="w-full border border-border-subtle rounded-xl py-3.75 text-[14.5px] font-medium text-text-primary flex items-center justify-center gap-2 mt-4 active:bg-accent-hover transition-colors"
              >
                <i className="ti ti-camera" />
                Ambil ulang foto
              </button>

              {/* Filter toggle */}
              <div className="flex gap-2 mt-5 mb-5">
                {(["Natural", "Black & White"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2.5 rounded-[10px] border text-[12.5px] font-medium transition-colors ${
                      filter === f
                        ? "bg-dark text-dark-text border-dark"
                        : "border-border text-[#6B6357]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <textarea
                rows={2}
                placeholder="Tulis ucapan untuk pengantin..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-border rounded-xl px-3.5 py-3 text-[13.5px] font-inherit resize-none bg-surface text-text-primary placeholder:text-[#A79B87] mb-3"
              />

              {/* Voice note row */}
              <div className="flex items-center gap-3 border border-border rounded-xl px-3.5 py-3 bg-surface mb-3">
                <button
                  type="button"
                  className="w-9.5 h-9.5 rounded-full bg-[#2A2420] text-dark-text flex items-center justify-center border-none cursor-pointer shrink-0"
                >
                  <i className="ti ti-microphone" />
                </button>
                <div className="flex items-center gap-0.5 flex-1 h-5">
                  {[6, 12, 8, 16, 10, 14, 7, 11, 9, 15, 6, 10].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2.5px] bg-border-subtle rounded-full"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-text-muted">Rekam VN</span>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={savePhoto}
                disabled={saving}
                className="w-full bg-dark text-dark-text rounded-xl py-4 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <i className="ti ti-check" />
                {saving ? "Menyimpan..." : "Simpan foto"}
              </button>
              <button
                type="button"
                className="w-full border border-border-subtle rounded-xl py-3.75 text-[14.5px] font-medium text-text-primary flex items-center justify-center gap-2 mt-2.5 active:bg-accent-hover transition-colors"
              >
                <i className="ti ti-download" />
                Unduh ke hp
              </button>
            </div>
          </div>
        )}

        {/* ===== SCREEN: DONE ===== */}
        {screen === "done" && (
          <div className="flex flex-col items-center justify-center flex-1 px-8 py-8 text-center min-h-dvh sm:min-h-dvh animate-[fadeIn_0.35s_ease]">
            <div className="w-15.5 h-15.5 rounded-full bg-success/20 text-success flex items-center justify-center text-[26px] mb-4.5">
              <i className="ti ti-heart" />
            </div>
            <div className="text-[22px] font-medium text-text-primary mb-2 font-serif">
              Foto tersimpan
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed mb-7">
              Terima kasih sudah berbagi momen ini bersama {coupleNames}.
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-text-on-accent-muted bg-accent-hover px-3.5 py-2.5 rounded-[10px] mb-6 text-left">
              <i className="ti ti-clock shrink-0" />
              Pengantin bisa lihat foto ini selama 2 minggu, setelah itu
              otomatis terhapus.
            </div>
            <button
              type="button"
              onClick={() => {
                setCapturedPhoto(null);
                setPhotosUsed(0);
                setNotes("");
                navigateTo("landing");
              }}
              className="w-full bg-dark text-dark-text rounded-xl py-4 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <i className="ti ti-arrow-left" />
              Kembali ke halaman utama
            </button>
          </div>
        )}
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

      {/* Global fadeIn keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes polaroidIn {
          from { opacity: 0; transform: rotate(-1.5deg) translateY(14px) scale(0.96); }
          to { opacity: 1; transform: rotate(-1.5deg) translateY(0) scale(1); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
