import React from "react";

export default function App() {
  return (
    <main className="relative w-full min-h-screen bg-[#F4E4C0] text-[#2A1508] overflow-hidden font-sans select-none">
      {/* ── TOP ORGANIC SVG WAVE BLOB ───────────────────────────── */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 210"
          fill="none"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(90px, 13vw, 210px)" }}
        >
          <path
            d="M0 0H1440V95C1390 145 1270 48 1080 108C900 162 720 42 540 118C360 188 180 62 0 138V0Z"
            fill="#3B4A2F"
          />
          <path
            d="M0 0H1440V68C1390 118 1270 22 1080 82C900 136 720 16 540 92C360 162 180 36 0 112V0Z"
            fill="#4A5B3C"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* ── BOTTOM ORGANIC SVG WAVE BLOB ────────────────────────── */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 210"
          fill="none"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(90px, 13vw, 210px)" }}
        >
          <path
            d="M0 210H1440V115C1380 65 1240 162 1040 95C840 32 660 148 460 80C260 16 100 128 0 72V210Z"
            fill="#8B4D2A"
          />
          <path
            d="M0 210H1440V138C1380 88 1240 185 1040 118C840 55 660 172 460 104C260 40 100 152 0 96V210Z"
            fill="#A05A35"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* ── GIANT BACKGROUND WATERMARK WORDMARK ────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(90px, 18vw, 320px)",
            color: "#C4622D",
            opacity: 0.065,
            whiteSpace: "nowrap",
            letterSpacing: "-0.025em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          CELEBRATION
        </span>
      </div>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#3B4A2F]/90 text-[#F4E4C0] backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/images/logos/logo.svg"
              alt="Celebration Food Cafe"
              className="h-10 md:h-12 w-auto object-contain filter drop-shadow-md"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button className="text-[#F4E4C0] border-b-2 border-[#C4622D] text-xs font-bold tracking-[0.16em] uppercase py-1.5">
              HOME
            </button>
            <button className="text-[#F4E4C0]/80 hover:text-white text-xs font-bold tracking-[0.16em] uppercase py-1.5 transition-colors">
              MENU
            </button>
            <button className="text-[#F4E4C0]/80 hover:text-white text-xs font-bold tracking-[0.16em] uppercase py-1.5 transition-colors">
              OUR STORY
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:block text-[11px] font-semibold tracking-wider text-[#F4E4C0]/80 uppercase">
              Open 8am – 10pm
            </div>
            <button className="bg-[#C4622D] text-[#F4E4C0] hover:brightness-110 px-5 py-2.5 rounded-full font-extrabold text-xs flex items-center gap-2 shadow-xl transition-all">
              <span>Cart</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── LEFT FLOATING PNG CUTOUT — DRINK GLASS (Raised to top-[40%]) ── */}
      <div className="absolute z-20 pointer-events-auto hidden md:block top-[40%] -translate-y-1/2 left-[-15px] lg:left-3 xl:left-8 transform -rotate-8 transition-transform duration-500 hover:-rotate-6 hover:scale-105 cursor-pointer">
        <div className="relative group">
          <img
            src="/images/home%20screen%20png/coffe.png"
            alt="Signature Cold Brew Coffee"
            className="w-[290px] md:w-[340px] lg:w-[380px] xl:w-[410px] h-auto object-contain filter drop-shadow-[0_20px_35px_rgba(42,21,8,0.28)]"
          />
          <div className="absolute bottom-10 left-6 rotate-[-6deg] bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs sm:text-sm tracking-widest uppercase px-4 py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap">
            COLD BREW
          </div>
        </div>
      </div>

      {/* ── RIGHT FLOATING PNG CUTOUT — WOOD-FIRED PIZZA ── */}
      <div className="absolute z-20 pointer-events-auto hidden md:block top-[48%] -translate-y-1/2 right-[-15px] lg:right-3 xl:right-8 transform rotate-8 transition-transform duration-500 hover:rotate-6 hover:scale-105 cursor-pointer">
        <div className="relative group">
          <img
            src="/images/home%20screen%20png/pizza.png"
            alt="Wood-Fired Pizza"
            className="w-[310px] md:w-[360px] lg:w-[420px] xl:w-[450px] h-auto object-contain filter drop-shadow-[0_20px_35px_rgba(42,21,8,0.28)]"
          />
          <div className="absolute bottom-10 left-6 rotate-[6deg] bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs sm:text-sm tracking-widest uppercase px-4 py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap">
            SIGNATURE
          </div>
        </div>
      </div>

      {/* ── CENTER HERO CONTENT ────────────────────────────────── */}
      <section className="relative z-25 min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 pb-20 -translate-y-4 sm:-translate-y-6">
        <p className="text-[0.72rem] font-bold tracking-[0.32em] text-[#8B4D2A] uppercase mb-2">
          CAFE &amp; RESTAURANT
        </p>

        <h1 className="font-heading font-black text-[clamp(2.2rem,4.8vw,4.2rem)] text-[#2A1508] leading-[1.08] tracking-tight mb-4">
          Where Every<br />Bite Tells<br />a Story
        </h1>

        <div className="flex items-center gap-1.5 my-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4622D] opacity-35" />
          <div className="w-5 h-1.5 rounded-full bg-[#C4622D]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C4622D] opacity-35" />
        </div>

        <p className="max-w-[320px] text-sm sm:text-base text-[#6B4226] leading-relaxed font-medium mb-6">
          Artisan wood-fired pizza, gourmet burgers, fresh thalis &amp; celebration cakes crafted with love in the hills of HP.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <a
            href="#menu"
            className="bg-[#C4622D] text-[#F4E4C0] font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_6px_24px_rgba(196,98,45,0.42)] transition-all hover:brightness-110 no-underline"
          >
            Explore Menu &nbsp;→
          </a>
        </div>

        <div className="mt-3 inline-flex items-center gap-2.5 bg-[#FAF7F0] backdrop-blur-md px-5 py-2 rounded-full border border-[#C4622D]/35 shadow-md">
          <span className="text-[#C4622D] text-sm">★★★★★</span>
          <span className="text-xs text-[#2A1508] font-bold">4.9 &middot; 2,400+ reviews</span>
        </div>
      </section>
    </main>
  );
}
