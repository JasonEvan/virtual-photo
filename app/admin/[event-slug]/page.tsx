"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface EventDetail {
  heroImage?: string | null;
  frameImage?: string | null;
  frameImage11?: string | null;
  frameImage34?: string | null;
  frameImage169?: string | null;
  maxPhotos?: number;
  numGuests?: number | null;
}

interface DropzoneColProps {
  label: string;
  icon: string;
  hint: string;
  aspectClass: string;
  previewUrl: string | null;
  onFile: (file: File) => void;
}

function DropzoneCol({
  label,
  icon,
  hint,
  aspectClass,
  previewUrl,
  onFile,
}: DropzoneColProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFile(file);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-[11px] font-semibold text-text-primary mb-1.5 text-center">
        {label}
      </div>
      <label
        className={`w-full border-[1.5px] border-dashed border-accent-light bg-accent-surface rounded-xl cursor-pointer hover:border-accent hover:bg-accent-hover transition-colors relative overflow-hidden flex flex-col items-center justify-center p-3 text-center ${aspectClass}`}
      >
        {previewUrl ? (
          <Image src={previewUrl} alt="" fill className="object-cover" />
        ) : (
          <>
            <i className={`ti ${icon} text-[18px] text-accent mb-1`} />
            <div className="text-[10px] text-text-on-accent font-medium leading-tight">
              Unggah
            </div>
            <div className="text-[8px] text-text-on-accent-muted mt-0.5 scale-90 shrink-0">
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
  );
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

  const [frame11File, setFrame11File] = useState<File | null>(null);
  const [frame11Preview, setFrame11Preview] = useState<string | null>(null);

  const [frame34File, setFrame34File] = useState<File | null>(null);
  const [frame34Preview, setFrame34Preview] = useState<string | null>(null);

  const [frame169File, setFrame169File] = useState<File | null>(null);
  const [frame169Preview, setFrame169Preview] = useState<string | null>(null);

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
        setFrame11Preview(data.detail?.frameImage11 ?? null);
        setFrame34Preview(data.detail?.frameImage34 ?? null);
        setFrame169Preview(data.detail?.frameImage169 ?? null);
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

  const handleFrame11File = (file: File) => {
    setFrame11File(file);
    setFrame11Preview(URL.createObjectURL(file));
  };

  const handleFrame34File = (file: File) => {
    setFrame34File(file);
    setFrame34Preview(URL.createObjectURL(file));
  };

  const handleFrame169File = (file: File) => {
    setFrame169File(file);
    setFrame169Preview(URL.createObjectURL(file));
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
    if (frame11File) formData.append("frameImage11", frame11File);
    if (frame34File) formData.append("frameImage34", frame34File);
    if (frame169File) formData.append("frameImage169", frame169File);
    formData.append("maxPhotos", String(maxPhotos));

    const res = await fetch(`/api/events/slug/${slug}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      const updated = await res.json();
      setEvent(updated);
      setHeroPreview(updated.detail?.heroImage ?? null);
      setFrame11Preview(updated.detail?.frameImage11 ?? null);
      setFrame34Preview(updated.detail?.frameImage34 ?? null);
      setFrame169Preview(updated.detail?.frameImage169 ?? null);
      setMaxPhotos(updated.detail?.maxPhotos ?? 2);
      setHeroFile(null);
      setFrame11File(null);
      setFrame34File(null);
      setFrame169File(null);
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

        <div className="bg-surface border border-border rounded-[14px] p-5 mb-5">
          <div className="text-[14.5px] font-semibold text-text-primary mb-0.5">
            Template frame polaroid
          </div>
          <div className="text-xs text-text-muted mb-4 font-normal">
            Bingkai dekoratif transparan (PNG) untuk membungkus foto tamu.
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DropzoneCol
              label="Rasio 1:1"
              icon="ti-frame"
              hint="PNG, 1:1"
              aspectClass="aspect-square"
              previewUrl={frame11Preview}
              onFile={handleFrame11File}
            />
            <DropzoneCol
              label="Rasio 3:4"
              icon="ti-frame"
              hint="PNG, 3:4"
              aspectClass="aspect-[3/4]"
              previewUrl={frame34Preview}
              onFile={handleFrame34File}
            />
            <DropzoneCol
              label="Rasio 16:9"
              icon="ti-frame"
              hint="PNG, 16:9"
              aspectClass="aspect-[9/16]"
              previewUrl={frame169Preview}
              onFile={handleFrame169File}
            />
          </div>
        </div>

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
