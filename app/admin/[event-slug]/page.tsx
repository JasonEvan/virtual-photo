"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

interface EventDetail {
  heroImage?: string | null;
  frameImage?: string | null;
  coupleNames?: string | null;
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
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
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

  const [coupleNames, setCoupleNames] = useState("");
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
        setCoupleNames(data.detail?.coupleNames ?? "");
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

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    if (heroFile) formData.append("heroImage", heroFile);
    if (frameFile) formData.append("frameImage", frameFile);
    formData.append("coupleNames", coupleNames);

    const res = await fetch(`/api/events/slug/${slug}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      const updated = await res.json();
      setEvent(updated);
      setHeroPreview(updated.detail?.heroImage ?? null);
      setFramePreview(updated.detail?.frameImage ?? null);
      setCoupleNames(updated.detail?.coupleNames ?? "");
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
      <div className="w-full max-w-[480px]">
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
        />

        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5">
          <div className="text-[14.5px] font-semibold text-text-primary mb-0.5">
            Nama mempelai
          </div>
          <div className="text-xs text-text-muted mb-4">
            Ditampilkan di hero section
          </div>
          <input
            type="text"
            value={coupleNames}
            onChange={(e) => setCoupleNames(e.target.value)}
            className="w-full border border-border rounded-[10px] px-3 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
            placeholder="Ayu & Bagas"
          />
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
