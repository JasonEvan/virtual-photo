"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface EventDetail {
  heroImage?: string | null;
  frameImage?: string | null;
  frameImage11?: string | null;
  frameImage34?: string | null;
  frameImage169?: string | null;
  maxPhotos?: number;
}

interface Packet {
  id: string;
  name: string;
  hasPhoto: boolean;
  hasNotes: boolean;
  hasVn: boolean;
  hasFilter: boolean;
  hasGif: boolean;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  detail?: EventDetail | null;
  packet?: Packet | null;
}

type Screen = "landing" | "camera" | "result" | "done";

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

export default function TrialPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [guestValid, setGuestValid] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>("landing");

  const [photosUsed, setPhotosUsed] = useState(0);
  const [chancesLeft, setChancesLeft] = useState<number | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState<"Natural" | "Black & White">("Natural");
  const [selectedRatio, setSelectedRatio] = useState<"1:1" | "3:4" | "16:9">(
    "3:4",
  );
  const [processedFrame11, setProcessedFrame11] = useState<string | null>(null);
  const [processedFrame34, setProcessedFrame34] = useState<string | null>(null);
  const [processedFrame169, setProcessedFrame169] = useState<string | null>(
    null,
  );
  const [processedFrameLegacy, setProcessedFrameLegacy] = useState<
    string | null
  >(null);

  // Get active processed frame based on selected ratio
  const getActiveFrame = useCallback(() => {
    if (selectedRatio === "1:1") return processedFrame11;
    if (selectedRatio === "16:9") return processedFrame169;
    return processedFrame34 || processedFrameLegacy;
  }, [
    selectedRatio,
    processedFrame11,
    processedFrame34,
    processedFrame169,
    processedFrameLegacy,
  ]);

  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [saving, setSaving] = useState(false);
  const [guestPhotos, setGuestPhotos] = useState<
    {
      id: string;
      pictureUrl: string;
      guestName: string;
      notes: string | null;
      voiceUrl?: string | null;
    }[]
  >([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id?: string;
    pictureUrl: string;
    guestName: string;
    notes: string | null;
    voiceUrl?: string | null;
  } | null>(null);

  const [downloading, setDownloading] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceBase64, setVoiceBase64] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize trial session setup
  useEffect(() => {
    setTimeout(() => {
      setEvent({
        id: "trial-event",
        name: "Sesi Uji Coba (Trial)",
        slug: "trial",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        detail: {
          heroImage: null,
          frameImage11: null,
          frameImage34: null,
          frameImage169: null,
          maxPhotos: 999,
        },
      });
      setGuestValid(true);
      setChancesLeft(999);
      setLoading(false);
      setShowWelcomeModal(true);
    }, 0);
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const stored = localStorage.getItem("vphoto_trial_photos");
      if (stored) {
        setGuestPhotos(JSON.parse(stored).slice(0, 9));
      }
    } catch (err) {
      console.error("Failed to load trial photos:", err);
    }
  }, []);

  // Fetch guest photos on mount
  useEffect(() => {
    setTimeout(() => {
      fetchPhotos();
    }, 0);
  }, [fetchPhotos]);

  // Process frame images (chroma key green screen removal)
  useEffect(() => {
    if (!event?.detail) return;
    let cancelled = false;

    // Legacy
    if (event.detail.frameImage) {
      removeGreenScreen(event.detail.frameImage).then((result) => {
        if (!cancelled) setProcessedFrameLegacy(result);
      });
    } else {
      setTimeout(() => setProcessedFrameLegacy(null), 0);
    }

    // 1:1
    if (event.detail.frameImage11) {
      removeGreenScreen(event.detail.frameImage11).then((result) => {
        if (!cancelled) setProcessedFrame11(result);
      });
    } else {
      setTimeout(() => setProcessedFrame11(null), 0);
    }

    // 3:4
    if (event.detail.frameImage34) {
      removeGreenScreen(event.detail.frameImage34).then((result) => {
        if (!cancelled) setProcessedFrame34(result);
      });
    } else {
      setTimeout(() => setProcessedFrame34(null), 0);
    }

    // 16:9
    if (event.detail.frameImage169) {
      removeGreenScreen(event.detail.frameImage169).then((result) => {
        if (!cancelled) setProcessedFrame169(result);
      });
    } else {
      setTimeout(() => setProcessedFrame169(null), 0);
    }

    return () => {
      cancelled = true;
    };
  }, [
    event?.detail?.frameImage,
    event?.detail?.frameImage11,
    event?.detail?.frameImage34,
    event?.detail?.frameImage169,
    event?.detail,
  ]);

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

  const heroImage = event?.detail?.heroImage;

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((track) => track.stop());

        const finalDuration = Math.min(Math.round(duration), 30);
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        setRecordingDuration(finalDuration);
        setIsRecording(false);

        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      setMediaRecorder(recorder);
      startTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (elapsed >= 30) {
          if (recorder.state === "recording") {
            recorder.stop();
          }
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setRecordingDuration(elapsed);
        }
      }, 500);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Gagal mengakses mikrofon.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [mediaRecorder]);

  const downloadPhoto = useCallback(async () => {
    if (!capturedPhoto || !event) return;
    try {
      let imageUrl = capturedPhoto;
      const activeFrame = getActiveFrame();
      if (activeFrame) {
        const photoImg = await loadImage(capturedPhoto);
        const frameImg = await loadImage(activeFrame);
        const canvas = document.createElement("canvas");
        canvas.width = frameImg.naturalWidth;
        canvas.height = frameImg.naturalHeight;
        const ctx = canvas.getContext("2d")!;

        // Draw guest photo covering the frame area (object-cover)
        const sAspect = photoImg.naturalWidth / photoImg.naturalHeight;
        const dAspect = canvas.width / canvas.height;
        let sWidth = photoImg.naturalWidth;
        let sHeight = photoImg.naturalHeight;
        let sx = 0;
        let sy = 0;

        if (sAspect > dAspect) {
          sWidth = sHeight * dAspect;
          sx = (photoImg.naturalWidth - sWidth) / 2;
        } else {
          sHeight = sWidth / dAspect;
          sy = (photoImg.naturalHeight - sHeight) / 2;
        }

        ctx.drawImage(
          photoImg,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

        imageUrl = canvas.toDataURL("image/jpeg", 0.95);
      }

      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `foto-trial-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download photo:", err);
    }
  }, [capturedPhoto, getActiveFrame, event]);

  const handleDownload = useCallback(
    async (
      pictureUrl: string,
      guestName: string,
      notes: string | null,
      voiceUrl: string | null,
    ) => {
      if (downloading) return;
      setDownloading(true);
      try {
        const res = await fetch(`/api/trial/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pictureUrl, guestName, notes, voiceUrl }),
        });
        if (!res.ok) throw new Error("Failed to download ZIP");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeName = guestName.replace(/[^a-zA-Z0-9]/g, "_") || "guest";
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

  const savePhoto = useCallback(async () => {
    if (!capturedPhoto || !event || saving) return;
    setSaving(true);
    try {
      let blob: Blob;
      const activeFrame = getActiveFrame();
      if (activeFrame) {
        const photoImg = await loadImage(capturedPhoto);
        const frameImg = await loadImage(activeFrame);
        const canvas = document.createElement("canvas");
        canvas.width = frameImg.naturalWidth;
        canvas.height = frameImg.naturalHeight;
        const ctx = canvas.getContext("2d")!;

        // Draw guest photo covering the frame area (object-cover)
        const sAspect = photoImg.naturalWidth / photoImg.naturalHeight;
        const dAspect = canvas.width / canvas.height;
        let sWidth = photoImg.naturalWidth;
        let sHeight = photoImg.naturalHeight;
        let sx = 0;
        let sy = 0;

        if (sAspect > dAspect) {
          sWidth = sHeight * dAspect;
          sx = (photoImg.naturalWidth - sWidth) / 2;
        } else {
          sHeight = sWidth / dAspect;
          sy = (photoImg.naturalHeight - sHeight) / 2;
        }

        ctx.drawImage(
          photoImg,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92),
        );
      } else {
        const res = await fetch(capturedPhoto);
        blob = await res.blob();
      }
      // Convert blob to Base64 to store in localStorage
      const reader = new FileReader();
      const base64Photo = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Save to localStorage
      const stored = localStorage.getItem("vphoto_trial_photos");
      const trialPhotos = stored ? JSON.parse(stored) : [];
      const newPhoto = {
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2),
        pictureUrl: base64Photo,
        guestName: guestName.trim() || "Tamu Uji Coba",
        notes: notes || "",
        voiceUrl: voiceBase64 || null,
        createdAt: new Date().toISOString(),
      };

      trialPhotos.unshift(newPhoto);
      localStorage.setItem("vphoto_trial_photos", JSON.stringify(trialPhotos));

      await fetchPhotos();
      navigateTo("done");
    } finally {
      setSaving(false);
    }
  }, [
    capturedPhoto,
    event,
    saving,
    notes,
    guestName,
    voiceBase64,
    getActiveFrame,
    navigateTo,
    fetchPhotos,
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

  if (guestValid === false) {
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
    <div className="min-h-screen bg-background flex justify-center min-[403px]:px-3 min-[403px]:py-8 sm:py-12">
      {/* Phone frame */}
      <div className="w-full max-w-93.75 bg-[#F7F3ED] min-[403px]:rounded-[36px] min-[403px]:shadow-[0_20px_60px_rgba(28,24,21,0.25),0_0_0_8px_#1C1815] overflow-hidden flex flex-col min-h-dvh sm:min-h-dvh min-[403px]:h-203 min-[403px]:max-h-[90vh] min-[403px]:min-h-0 relative">
        {/* Hidden canvas + video for camera */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />

        {screen === "landing" && (
          <div className="flex flex-col flex-1 min-h-dvh sm:min-h-dvh animate-[fadeIn_0.35s_ease] overflow-y-auto">
            {/* Brand Banner */}
            <div className="relative w-full h-16 bg-[#F8F8F8] shrink-0 border-b border-[#EBE5D9]">
              <Image
                src="/brand.jpeg"
                alt="Kiranya Bahagia Virtual Photobooth"
                fill
                priority
                unoptimized
                className="object-contain py-3 px-4"
              />
            </div>

            {/* Hero (9:16 Aspect Ratio) */}
            <div className="relative w-full aspect-9/16 overflow-hidden bg-linear-to-br from-[#2A2420] via-dark to-[#100D0B] shrink-0">
              {heroImage && (
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  className="object-contain"
                />
              )}

              {/* Quota + CTA overlapping hero bottom */}
              <div className="absolute bottom-0 inset-x-0 px-6 pb-5 pt-8">
                <div className="flex items-center justify-between bg-black/30 backdrop-blur-md border border-black/10 rounded-xl px-4 py-3 mb-3">
                  <span className="text-[12.5px] text-white">
                    Sisa kesempatan foto kamu
                  </span>
                  <span className="text-[12.5px] font-semibold text-white">
                    {chancesLeft !== null ? chancesLeft - photosUsed : 0}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo("camera")}
                  disabled={chancesLeft === null || photosUsed >= chancesLeft}
                  className="w-full bg-white/80 text-black rounded-xl py-4 text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-white/30 disabled:text-black/40 disabled:cursor-not-allowed shadow-lg"
                >
                  <i className="ti ti-camera" />
                  Mulai ambil foto
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 shrink-0">
              {/* Guest photos gallery */}
              {guestPhotos.length > 0 && (
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-text-muted font-medium mb-3">
                    Galeri foto tamu
                  </div>
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
                  <Link
                    href={`/trial/gallery`}
                    className="w-full border border-border-subtle rounded-xl py-3.5 text-[13px] font-medium text-text-primary flex items-center justify-center gap-2 mt-4 hover:bg-accent-hover transition-colors text-center"
                  >
                    <i className="ti ti-layout-grid text-accent" />
                    Lihat Semua Foto
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== SCREEN: CAMERA ===== */}
        {screen === "camera" && (
          <div className="flex flex-col flex-1 h-full animate-[fadeIn_0.35s_ease]">
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
          <div className="flex flex-col flex-1 h-full animate-[fadeIn_0.35s_ease]">
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
            <div className="flex-1 px-6 py-4 flex flex-col overflow-y-auto min-h-0">
              {/* Polaroid */}
              {getActiveFrame() && capturedPhoto ? (
                <>
                  <div
                    className={`relative self-center my-1.5 rotate-[-1.5deg] animate-[polaroidIn_0.5s_ease] ${
                      filter === "Black & White"
                        ? "grayscale contrast-[1.05]"
                        : ""
                    }`}
                    style={{
                      width: "250px",
                    }}
                  >
                    <Image
                      src={capturedPhoto}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <Image
                      src={getActiveFrame()!}
                      alt=""
                      width={400}
                      height={
                        selectedRatio === "1:1"
                          ? 400
                          : selectedRatio === "3:4"
                            ? 533
                            : 711
                      }
                      priority
                      className="relative w-full block"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-surface p-3 pb-4 rounded shadow-[0_8px_24px_rgba(28,24,21,0.18)] rotate-[-1.5deg] self-center my-1.5 animate-[polaroidIn_0.5s_ease]">
                  <div
                    style={{
                      width: "250px",
                      aspectRatio:
                        selectedRatio === "1:1"
                          ? "1/1"
                          : selectedRatio === "3:4"
                            ? "3/4"
                            : "9/16",
                    }}
                    className={`relative overflow-hidden flex items-center justify-center bg-linear-to-br from-[#D9CBAE] via-accent-light to-accent ${
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

              {/* Ratio Selector Button Group */}
              <div className="flex flex-col gap-2 mt-4 px-2">
                <div className="text-[10px] uppercase tracking-widest text-[#8F8372] font-semibold text-center">
                  Pilih Rasio Frame
                </div>
                <div className="flex gap-1.5 bg-[#EFEBE4] p-1.5 rounded-xl border border-border/40">
                  {(() => {
                    const hasAnyFrame = !!(
                      event?.detail?.frameImage11 ||
                      event?.detail?.frameImage34 ||
                      event?.detail?.frameImage169 ||
                      event?.detail?.frameImage
                    );

                    return (
                      [
                        { label: "1:1 Square", val: "1:1" },
                        { label: "3:4 Portrait", val: "3:4" },
                        { label: "16:9 Portrait", val: "16:9" },
                      ] as const
                    ).map((item) => {
                      const isAvailable =
                        !hasAnyFrame ||
                        (item.val === "1:1"
                          ? !!event?.detail?.frameImage11
                          : item.val === "16:9"
                            ? !!event?.detail?.frameImage169
                            : !!event?.detail?.frameImage34 ||
                              !!event?.detail?.frameImage);

                      return (
                        <button
                          key={item.val}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedRatio(item.val)}
                          className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                            selectedRatio === item.val
                              ? "bg-dark text-dark-text shadow-sm"
                              : "text-text-muted hover:text-text-primary bg-transparent"
                          } disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:text-text-muted`}
                        >
                          {item.label}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Retake */}
              <button
                type="button"
                onClick={() => navigateTo("camera")}
                className="w-full border border-border-subtle rounded-xl py-3.75 text-[14.5px] font-medium text-text-primary flex items-center justify-center gap-2 mt-4 active:bg-accent-hover transition-colors shrink-0"
              >
                <i className="ti ti-camera" />
                Ambil ulang foto
              </button>

              {/* Filter toggle */}
              {(!event?.packet || event.packet.hasFilter) && (
                <div className="flex gap-2 mt-5 mb-5 shrink-0">
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
              )}

              {/* Nama Pengirim */}
              <input
                type="text"
                placeholder="Nama Pengirim (wajib)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="w-full border border-border rounded-xl px-3.5 py-3 text-[13.5px] font-inherit bg-surface text-text-primary placeholder:text-[#A79B87] mb-3 mt-1 shrink-0"
              />

              {/* Notes */}
              <textarea
                rows={4}
                placeholder="Tulis ucapan kamu (wajib)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="w-full border border-border rounded-xl px-3.5 py-3 text-[13.5px] font-inherit resize-none bg-surface text-text-primary placeholder:text-[#A79B87] mb-3 shrink-0"
              />

              {/* Voice note row */}
              {(!event?.packet || event.packet.hasVn) && (
                <div className="flex items-center gap-3 border border-border rounded-xl px-3.5 py-3 bg-surface mb-3 shrink-0">
                  <button
                    type="button"
                    onClick={
                      isRecording
                        ? stopRecording
                        : audioBlob
                          ? () => {
                              setAudioBlob(null);
                              setVoiceBase64(null);
                            }
                          : startRecording
                    }
                    className={`w-9.5 h-9.5 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 ${
                      isRecording
                        ? "bg-red-500 animate-pulse text-white"
                        : audioBlob
                          ? "bg-red-600 text-white"
                          : "bg-[#2A2420] text-dark-text"
                    }`}
                  >
                    <i
                      className={`ti ${isRecording ? "ti-player-stop" : audioBlob ? "ti-trash" : "ti-microphone"}`}
                    />
                  </button>
                  <div className="flex items-center gap-0.5 flex-1 h-5">
                    {isRecording ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-[12.5px] text-red-500 animate-pulse font-medium">
                          Merekam...
                        </span>
                        <span className="text-[11.5px] text-text-muted ml-auto font-mono">
                          {recordingDuration}s / 30s
                        </span>
                      </div>
                    ) : audioBlob ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-[12.5px] text-green-600 font-medium">
                          Pesan suara direkam
                        </span>
                        <span className="text-[11.5px] text-text-muted ml-auto font-mono">
                          {recordingDuration}s
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12.5px] text-text-muted">
                        Ketuk ikon untuk rekam pesan suara
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                type="button"
                onClick={savePhoto}
                disabled={saving || !guestName.trim() || !notes.trim()}
                className="w-full bg-dark text-dark-text rounded-xl py-4 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 shrink-0"
              >
                <i className="ti ti-check" />
                {saving ? "Menyimpan..." : "Simpan foto"}
              </button>
              <button
                type="button"
                onClick={downloadPhoto}
                className="w-full border border-border-subtle rounded-xl py-3.75 text-[14.5px] font-medium text-text-primary flex items-center justify-center gap-2 mt-2.5 active:bg-accent-hover transition-colors shrink-0"
              >
                <i className="ti ti-download" />
                Unduh ke hp
              </button>
            </div>
          </div>
        )}

        {/* ===== SCREEN: DONE ===== */}
        {screen === "done" && (
          <div className="flex flex-col items-center justify-center flex-1 px-8 py-8 text-center h-full animate-[fadeIn_0.35s_ease] overflow-y-auto min-h-0">
            <div className="w-15.5 h-15.5 rounded-full bg-success/20 text-success flex items-center justify-center text-[26px] mb-4.5">
              <i className="ti ti-heart" />
            </div>
            <div className="text-[22px] font-medium text-text-primary mb-2 font-serif">
              Foto tersimpan
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed mb-7">
              Terima kasih sudah berbagi momen ini bersama {event.name}.
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
                setGuestName("");
                setAudioBlob(null);
                setRecordingDuration(0);
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
                  onClick={() =>
                    handleDownload(
                      selectedPhoto.pictureUrl,
                      selectedPhoto.guestName,
                      selectedPhoto.notes,
                      selectedPhoto.voiceUrl || null,
                    )
                  }
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

      {/* iOS-Style Welcome Dialog */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-67.5 bg-white/90 backdrop-blur-2xl rounded-[14px] text-center shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col font-sans select-none animate-[iosAlertIn_0.28s_cubic-bezier(0.25,1,0.5,1)]">
            <div className="px-4.5 pt-5 pb-4.5">
              <h3 className="text-[17px] font-semibold text-[#030303] leading-tight">
                Welcome to Trial
              </h3>
              <p className="text-[13px] text-[#030303] mt-2 leading-[1.4] whitespace-pre-line font-normal">
                Virtual Photobooth by Kiranya Bahagia!{"\n\n"}
                Halaman ini hanya untuk 1 kali trial. Foto yang diambil tidak
                akan disimpan. Desain dapat dicustom sesuai tema acaramu.
                Nikmati semua fitur yang tersedia ya!{"\n\n"}
                <strong>Cocok? Yuk, langsung booking.</strong>
              </p>
            </div>
            <div className="flex flex-col border-t border-[#3F3F3F]/15">
              <button
                type="button"
                onClick={() => {
                  window.open(
                    "https://wa.me/6288905844274?text=Halo%20Kiranya%20Bahagia,%20saya%20ingin%20booking%20Virtual%20Photobooth",
                    "_blank",
                  );
                }}
                className="w-full py-3 text-[17px] text-[#007AFF] font-normal hover:bg-[#EAEAEA]/60 active:bg-[#EAEAEA] border-none cursor-pointer transition-colors outline-none"
              >
                Booking Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="w-full py-3 text-[17px] text-[#007AFF] font-semibold hover:bg-[#EAEAEA]/60 active:bg-[#EAEAEA] border-t border-[#3F3F3F]/15 cursor-pointer transition-colors outline-none"
              >
                Mulai Trial
              </button>
            </div>
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
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes iosAlertIn {
          from { opacity: 0; transform: scale(1.18); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
