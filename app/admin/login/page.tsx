"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Gagal masuk");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1815] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic background lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(217,203,174,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(217,203,174,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Card container */}
      <div className="w-full max-w-100 bg-[#2A2420]/80 backdrop-blur-md border border-[#3E342F] rounded-3xl p-8.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-[cardIn_0.4s_ease-out]">
        <div className="text-center mb-7.5">
          <div className="relative w-16 h-16 mx-auto mb-4.5 overflow-hidden rounded-2xl border border-[#3E342F]">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              priority
              className="object-cover"
            />
          </div>
          <h1 className="text-[21px] font-semibold text-dark-text tracking-tight">
            Admin Console
          </h1>
          <p className="text-[12.5px] text-[#A79B87] mt-1.5 leading-relaxed">
            Silakan masukkan kredensial Anda untuk mengelola event
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-red-400 text-[12.5px] text-center flex items-center justify-center gap-1.5">
              <i className="ti ti-alert-circle text-base" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#A79B87] uppercase tracking-widest mb-1.5 pl-0.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6357]">
                <i className="ti ti-user text-base" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-[#1C1815] border border-[#3E342F] rounded-xl pl-10 pr-4 py-3.25 text-[13.5px] text-dark-text outline-none focus:border-accent transition-colors placeholder-[#6B6357]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#A79B87] uppercase tracking-widest mb-1.5 pl-0.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6357]">
                <i className="ti ti-key text-base" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-[#1C1815] border border-[#3E342F] rounded-xl pl-10 pr-4 py-3.25 text-[13.5px] text-dark-text outline-none focus:border-accent transition-colors placeholder-[#6B6357]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-dark px-4 py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] mt-2 shadow-[0_4px_20px_rgba(217,203,174,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="ti ti-loader animate-spin text-base" />
                Memproses...
              </>
            ) : (
              <>
                <i className="ti ti-login text-base" />
                Masuk ke Console
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
