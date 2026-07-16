"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, router]);

  // Don't render the navbar on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col">
      {/* Premium Navbar */}
      <header className="bg-[#1C1815] border-b border-[#2A2420] text-dark-text sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="relative w-7 h-7 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <span className="text-[16px] font-bold tracking-tight text-accent">
                VirtualPhoto
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/admin"
                className={`text-[13px] font-medium transition-colors ${
                  pathname === "/admin" || pathname.startsWith("/admin/") && pathname !== "/admin/admins"
                    ? "text-accent"
                    : "text-[#A79B87] hover:text-dark-text"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/admins"
                className={`text-[13px] font-medium transition-colors ${
                  pathname === "/admin/admins" ? "text-accent" : "text-[#A79B87] hover:text-dark-text"
                }`}
              >
                Kelola Admin
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-transparent border border-[#3E342F] text-[#A79B87] hover:text-dark-text px-4.5 py-2 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <i className="ti ti-logout text-sm" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
