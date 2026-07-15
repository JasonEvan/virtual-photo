"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface EventDetail {
  heroImage?: string | null;
  frameImage?: string | null;
  maxPhotos?: number;
  numGuests?: number | null;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  detail?: EventDetail | null;
}

interface DropzoneProps {
  label: string;
  icon: string;
  description: string;
  hint: string;
  aspectClass: string;
  maxWidthClass?: string;
  previewUrl: string | null;
  onFile: (file: File) => void;
  onReset: () => void;
}

function Dropzone({
  label,
  icon,
  description,
  hint,
  aspectClass,
  maxWidthClass,
  previewUrl,
  onFile,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFile(file);
  };

  return (
    <div className="bg-surface border border-border rounded-[14px] p-5 mb-5">
      <div className="text-[14.5px] font-semibold text-text-primary mb-0.5">
        {label}
      </div>
      <div className="text-xs text-text-muted mb-4">{description}</div>
      <div className="flex flex-col items-center">
        <label
          className={`border-[1.5px] border-dashed border-accent-light bg-accent-surface rounded-xl cursor-pointer hover:border-accent hover:bg-accent-hover transition-colors relative overflow-hidden flex flex-col items-center justify-center p-7 text-center ${aspectClass} ${maxWidthClass ?? ""}`}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="" fill className="object-cover" />
          ) : (
            <>
              <i className={`ti ${icon} text-[26px] text-accent mb-2`} />
              <div className="text-[12.5px] text-text-on-accent font-medium">
                Klik untuk unggah
              </div>
              <div className="text-[11px] text-text-on-accent-muted mt-0.5">
                {hint}
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params["event-slug"] as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);

  const [maxPhotos, setMaxPhotos] = useState(2);
  const [numGuests, setNumGuests] = useState<number | "">("");
  const [savingNumGuests, setSavingNumGuests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

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
        setHeroPreview(data.detail?.heroImage ?? null);
        setFramePreview(data.detail?.frameImage ?? null);
        setMaxPhotos(data.detail?.maxPhotos ?? 2);
        setNumGuests(data.detail?.numGuests ?? "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleHeroFile = (file: File) => {
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const handleFrameFile = (file: File) => {
    setFrameFile(file);
    setFramePreview(URL.createObjectURL(file));
  };

  const handleSaveNumGuests = async () => {
    setSavingNumGuests(true);
    const res = await fetch(`/api/events/slug/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numGuests: numGuests === "" ? null : Number(numGuests),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEvent(updated);
      setNumGuests(updated.detail?.numGuests ?? "");
      showToast("Jumlah tamu disimpan");
    } else {
      const err = await res.json();
      showToast(err.error || "Gagal menyimpan");
    }
    setSavingNumGuests(false);
  };

  const handleDownloadQR = async () => {
    if (!event) return;
    const res = await fetch(`/api/events/${event.id}/guests/qr`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcodes-${event.slug}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    if (heroFile) formData.append("heroImage", heroFile);
    if (frameFile) formData.append("frameImage", frameFile);
    formData.append("maxPhotos", String(maxPhotos));

    const res = await fetch(`/api/events/slug/${slug}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      const updated = await res.json();
      setEvent(updated);
      setHeroPreview(updated.detail?.heroImage ?? null);
      setFramePreview(updated.detail?.frameImage ?? null);
      setMaxPhotos(updated.detail?.maxPhotos ?? 2);
      setHeroFile(null);
      setFrameFile(null);
      showToast("Perubahan disimpan");
    } else {
      showToast("Gagal menyimpan");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center px-4 py-10">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex justify-center px-4 py-10">
        <p className="text-sm text-text-muted">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center px-4 py-10">
      <div className="w-full max-w-120">
        <h1 className="text-[20px] font-semibold text-text-primary mb-1">
          {event.name}
        </h1>
        <p className="text-[13px] text-text-muted mb-7">
          Unggah foto hero dan desain frame polaroid untuk mempelai.
        </p>

        <Dropzone
          label="Foto hero"
          icon="ti-photo-plus"
          description="Rasio 16:9, ditampilkan di bagian atas landing page."
          hint="PNG atau JPG, rasio 16:9"
          aspectClass="aspect-video"
          previewUrl={heroPreview}
          onFile={handleHeroFile}
          onReset={() => {
            setHeroFile(null);
            setHeroPreview(event.detail?.heroImage ?? null);
          }}
        />

        <Dropzone
          label="Template frame polaroid"
          icon="ti-frame"
          description="Bingkai dekoratif yang membungkus hasil foto tamu."
          hint="PNG transparan, rasio 3:4"
          aspectClass="aspect-[3/4]"
          maxWidthClass="max-w-[220px] mx-auto"
          previewUrl={framePreview}
          onFile={handleFrameFile}
          onReset={() => {
            setFrameFile(null);
            setFramePreview(event.detail?.frameImage ?? null);
          }}
        />

        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5">
          <div className="text-[14.5px] font-semibold text-text-primary mb-0.5">
            Batas foto per tamu
          </div>
          <div className="text-xs text-text-muted mb-4">
            Jumlah foto yang bisa diambil oleh setiap tamu
          </div>
          <input
            type="number"
            min={1}
            max={10}
            value={maxPhotos}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setMaxPhotos(0);
                return;
              }
              const n = parseInt(v);
              if (!isNaN(n)) setMaxPhotos(n);
            }}
            onBlur={() => setMaxPhotos((p) => Math.max(1, p))}
            className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5">
          <div className="text-[14.5px] font-semibold text-text-primary mb-0.5">
            Jumlah tamu
          </div>
          <div className="text-xs text-text-muted mb-4">
            {event.detail
              ? "Total tamu yang diundang ke event ini"
              : "Simpan detail event terlebih dahulu untuk mengatur jumlah tamu"}
          </div>
          <input
            type="number"
            min={1}
            value={numGuests}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setNumGuests("");
                return;
              }
              const n = parseInt(v);
              if (!isNaN(n)) setNumGuests(n);
            }}
            disabled={!event.detail}
            className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors disabled:bg-[#F0EDE8] disabled:text-text-muted mb-3"
            placeholder="Contoh: 100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveNumGuests}
              disabled={!event.detail || savingNumGuests || numGuests === ""}
              className="flex-1 bg-dark text-dark-text rounded-[10px] px-4 py-2.5 text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <i className="ti ti-device-floppy" />
              {savingNumGuests ? "..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!event.detail?.numGuests}
              className="flex-1 border border-border rounded-[10px] px-4 py-2.5 text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-50 bg-surface text-text-primary"
            >
              <i className="ti ti-download" />
              Unduh
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-dark text-dark-text rounded-xl py-3.5 text-[14.5px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <i className="ti ti-device-floppy" />
          {saving ? "Menyimpan..." : "Simpan perubahan"}
        </button>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-dark-text rounded-full px-5 py-3 text-[13px] flex items-center gap-2">
            <i className="ti ti-check text-success" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
