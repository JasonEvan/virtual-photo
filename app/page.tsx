"use client";

import Link from "next/link";
import Image from "next/image";

// ponytail: keep landing page simple, fast, and dependency-free with standard Tailwind styling
export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F3ED] text-[#1C1815] flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Premium Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 overflow-hidden rounded-xl bg-dark flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              priority
              className="object-cover"
            />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-accent">
            Kiranya Bahagia
          </span>
        </div>
        <Link
          href="/admin"
          className="text-[13px] font-semibold text-[#6B6357] hover:text-[#1C1815] transition-colors"
        >
          Portal Admin
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center py-12 md:py-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-[12px] font-semibold tracking-wide uppercase mb-6">
          ✨ Web-Based Photobooth
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-dark mb-6 leading-[1.1] max-w-3xl">
          Capture memories at your events,{" "}
          <span className="text-accent">instantly.</span>
        </h1>

        <p className="text-base md:text-lg text-[#6B6357] max-w-xl mb-10 leading-relaxed">
          A premium, zero-install guest photobooth with AI green screen removal,
          custom voice messages, and automated GIF animations.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mb-16">
          <Link
            href="/trial"
            className="flex-1 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl py-4 px-6 text-[14px] shadow-lg shadow-accent/20 hover:shadow-xl transition-all active:scale-[0.98] text-center"
          >
            Mulai Demo Gratis
          </Link>
          <Link
            href="/admin"
            className="flex-1 bg-dark hover:bg-dark/95 text-white font-semibold rounded-2xl py-4 px-6 text-[14px] shadow-lg transition-all active:scale-[0.98] text-center"
          >
            Masuk Dashboard
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-4">
          <div className="p-6 bg-white/60 rounded-2xl border border-border/40 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-dark mb-2">
              Instant Photo Capture
            </h3>
            <p className="text-[13px] text-[#6B6357] leading-relaxed">
              Guests scan a QR code and take beautiful photos immediately inside
              their mobile browser. No app install required.
            </p>
          </div>

          <div className="p-6 bg-white/60 rounded-2xl border border-border/40 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-dark mb-2">
              Voice Message Cards
            </h3>
            <p className="text-[13px] text-[#6B6357] leading-relaxed">
              Let guests leave custom voice greetings that pair directly with
              their virtual photo keepsake cards.
            </p>
          </div>

          <div className="p-6 bg-white/60 rounded-2xl border border-border/40 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <h3 className="text-[15px] font-bold text-dark mb-2">
              Animated GIF Creator
            </h3>
            <p className="text-[13px] text-[#6B6357] leading-relaxed">
              Compile multiple photos automatically with a custom event
              watermark overlay and download a loopable GIF.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-[12px] text-[#A79B87] border-t border-border/45">
        &copy; {new Date().getFullYear()} VirtualPhoto. All rights reserved.
      </footer>
    </div>
  );
}
