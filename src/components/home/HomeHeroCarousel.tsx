"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import type { HomeQuickCard } from "./homeQuickCards";

const SLIDES = [
  {
    src: "/images/home/hero-1.png",
    alt: "Aktivitas pendaratan ikan di pelabuhan",
  },
  {
    src: "/images/home/hero-2.png",
    alt: "Sortir dan penanganan hasil tangkapan di dermaga",
  },
  {
    src: "/images/home/hero-3.png",
    alt: "Inspeksi mutu ikan tuna di fasilitas pengolahan",
  },
] as const;

const AUTO_MS = 3500;

type Props = {
  userName?: string | null;
  menuCards: HomeQuickCard[];
};

export default function HomeHeroCarousel({ userName, menuCards }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            quality={100}
            unoptimized
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-black/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(105deg, rgba(26, 43, 60, 0.88) 0%, rgba(26, 43, 60, 0.6) 32%, rgba(26, 43, 60, 0.22) 52%, rgba(0, 0, 0, 0.3) 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col lg:flex-row">
        <div className="flex shrink-0 flex-col justify-center px-6 py-6 md:px-10 lg:w-[40%] lg:max-w-lg lg:py-8 xl:px-12">
          <span className="inline-flex w-fit rounded-md border border-cyan/40 bg-cyan/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-navy shadow-sm">
            PT Perindo
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            Selamat Datang{userName ? `, ${userName}` : ""}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-100/95 md:text-base">
            PERFISH (Perindo Fish Information System). Kelola seluruh data perikanan PT
            Perindo dari satu sistem terpadu.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center px-4 pb-14 pt-1 md:px-8 lg:px-10 lg:pb-14 xl:pr-12">
          <div className="flex min-h-0 flex-col rounded-2xl border border-white/25 bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.04] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/10 md:rounded-3xl md:p-4 lg:p-5">
            <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-white/15 pb-2.5">
              <span className="h-7 w-1 rounded-full bg-cyan" aria-hidden />
              <h2 className="text-base font-semibold tracking-tight text-white md:text-lg">
                Menu Utama
              </h2>
            </div>

            <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2 sm:gap-2.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.35)_transparent]">
              {menuCards.map((card) => {
                const Icon = card.icon;
                return (
                  <a
                    key={card.label}
                    href={card.href}
                    className="group flex items-start gap-2.5 rounded-xl border border-white/20 bg-black/25 p-3 shadow-inner backdrop-blur-sm transition-all duration-200 hover:border-cyan/55 hover:bg-black/40 md:gap-3 md:p-3.5"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 md:h-10 md:w-10 ${card.color}`}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white group-hover:text-cyan transition-colors md:text-base">
                        {card.label}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-300/90">
                        {card.description}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi carousel — bawah tengah */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 md:bottom-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Slide sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-black/60 md:h-10 md:w-10"
        >
          <HiOutlineChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Slide hero"
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full border border-white/20 transition-all ${
                i === index ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/65"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Slide berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-md transition hover:border-white/50 hover:bg-black/60 md:h-10 md:w-10"
        >
          <HiOutlineChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </section>
  );
}
