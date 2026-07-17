"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/admin"
                className={`text-[13px] font-medium transition-colors ${
                  pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/admins")
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

          {/* Desktop Logout Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-transparent border border-[#3E342F] text-[#A79B87] hover:text-dark-text px-4.5 py-2 rounded-xl text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <i className="ti ti-logout text-sm" />
              Keluar
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#A79B87] hover:text-dark-text focus:outline-none p-2 cursor-pointer transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {/* ponytail: keep dropdown implementation simple with standard state toggle */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#221D1A] border-t border-[#2A2420] px-6 py-4 flex flex-col gap-4">
            <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className={`text-[14px] font-medium transition-colors ${
                pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/admins")
                  ? "text-accent"
                  : "text-[#A79B87] hover:text-dark-text"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/admins"
              onClick={() => setIsMenuOpen(false)}
              className={`text-[14px] font-medium transition-colors ${
                pathname === "/admin/admins" ? "text-accent" : "text-[#A79B87] hover:text-dark-text"
              }`}
            >
              Kelola Admin
            </Link>
            <hr className="border-[#2A2420]" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
              className="w-full text-left bg-transparent text-[#A79B87] hover:text-dark-text py-1 text-[14px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <i className="ti ti-logout" />
              Keluar
            </button>
          </div>
        )}
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
