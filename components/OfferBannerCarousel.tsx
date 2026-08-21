"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Copy, Check, Percent, Sparkles, Tag, Info, X } from "lucide-react";
import { toast } from "sonner";

export interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  banner_image_url?: string;
  badge_text?: string;
  coupon_code?: string;
  discount_type?: string;
  discount_value?: number;
  terms_and_conditions?: string;
}

interface OfferBannerCarouselProps {
  offers: Offer[];
  autoPlayInterval?: number; // default 4500ms
}

export default function OfferBannerCarousel({
  offers,
  autoPlayInterval = 4500,
}: OfferBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Structured T&C Modal States
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [currentOfferTerms, setCurrentOfferTerms] = useState<any[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Guard against empty offers array
  const totalOffers = offers ? offers.length : 0;

  // Viewport IntersectionObserver to pause auto-play when off-screen
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const paginate = useCallback(
    (newDirection: number) => {
      if (totalOffers <= 1) return;
      setDirection(newDirection);
      setCurrentIndex((prev) => {
        if (newDirection === 1) {
          return (prev + 1) % totalOffers;
        }
        return prev === 0 ? totalOffers - 1 : prev - 1;
      });
    },
    [totalOffers]
  );

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    triggerInteractionPause();
  };

  // Pause timer on interaction and auto-resume after 3.5s
  const triggerInteractionPause = useCallback(() => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  }, []);

  async function handleOpenTermsModal(offerId: string) {
    setLoadingTerms(true);
    setTermsModalOpen(true);
    triggerInteractionPause();
    try {
      const res = await fetch(`/api/offers/terms?offer_id=${offerId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentOfferTerms(data.terms || []);
      } else {
        setCurrentOfferTerms([]);
      }
    } catch (e) {
      setCurrentOfferTerms([]);
    } finally {
      setLoadingTerms(false);
    }
  }

  // Auto-play timer
  useEffect(() => {
    if (isPaused || !isInViewport || totalOffers <= 1) return;

    const timer = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPaused, isInViewport, totalOffers, autoPlayInterval, paginate]);

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      paginate(-1);
      triggerInteractionPause();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      paginate(1);
      triggerInteractionPause();
    }
  };

  // Drag Gesture end handler
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 40;
    const velocityThreshold = 400;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      paginate(1);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      paginate(-1);
    }
    triggerInteractionPause();
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon ${code} copied! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (totalOffers === 0) return null;

  const currentOffer = offers[currentIndex] || offers[0];

  // Slide Animation Variants (Pure X-Translate, Solid Opacity to avoid white blink)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: {
      x: "0%",
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 1,
    }),
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Offers & Special Banners"
      aria-live="polite"
      className="relative w-full overflow-hidden focus:outline-none rounded-2xl group select-none bg-gradient-to-br from-[#17241E] via-[#1C2C25] to-[#121E19] text-stone border-2 border-dashed border-marigold/40 shadow-xl"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentOffer.id || currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            opacity: { duration: 0.1 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="p-4 md:p-6 relative overflow-hidden cursor-grab active:cursor-grabbing min-h-[160px] md:min-h-[170px] flex flex-col justify-between w-full"
        >
          {/* Optional Image Background with Overlay */}
          {currentOffer.banner_image_url && (
            <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay pointer-events-none">
              <img
                src={currentOffer.banner_image_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Ambient Glowing Orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-marigold/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Badge & Counter */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <span className="text-[10px] md:text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-marigold text-pineDark shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pineDark" />
              {currentOffer.badge_text || "SPECIAL OFFER"}
            </span>

            {totalOffers > 1 && (
              <span className="text-[11px] font-mono font-semibold text-stone/60 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                {currentIndex + 1} / {totalOffers}
              </span>
            )}
          </div>

          {/* Middle Row: Title & Subtitle */}
          <div className="space-y-1 my-2 relative z-10">
            <h3 className="font-heading text-base md:text-xl font-bold text-stone leading-tight">
              {currentOffer.title}
            </h3>
            {currentOffer.subtitle && (
              <p className="text-xs md:text-sm text-stone/80 line-clamp-2 leading-relaxed">
                {currentOffer.subtitle}
              </p>
            )}
          </div>

          {/* Bottom Row: Dots & Code Button */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 relative z-10">
            {/* Dot Indicators inside ticket card */}
            {totalOffers > 1 ? (
              <div className="flex items-center gap-1.5">
                {offers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIndex === idx
                        ? "w-5 bg-marigold shadow-xs"
                        : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-stone/60 text-[11px]">
                <Tag className="w-3.5 h-3.5 text-marigold" />
                <span className="truncate max-w-[200px] md:max-w-xs">
                  {currentOffer.terms_and_conditions || "Valid for online orders at Celebration Cafe"}
                </span>
              </div>
            )}

            {currentOffer.coupon_code ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTermsModal(currentOffer.id)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone/80 hover:text-white transition-colors cursor-pointer"
                  title="View Terms & Conditions"
                >
                  <Info className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleCopyCode(e, currentOffer.coupon_code!)}
                  className="bg-marigold text-pineDark hover:bg-marigoldLight font-mono text-xs md:text-sm font-extrabold px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer shrink-0"
                >
                  {copiedCode === currentOffer.coupon_code ? (
                    <>
                      <Check className="w-4 h-4 text-pineDark" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-pineDark" />
                      <span>USE: {currentOffer.coupon_code}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTermsModal(currentOffer.id)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone/80 hover:text-white transition-colors cursor-pointer"
                  title="View Terms & Conditions"
                >
                  <Info className="w-4 h-4" />
                </button>

                <span className="text-[10px] md:text-xs font-bold text-marigold bg-marigold/15 border border-marigold/30 px-2.5 py-1 rounded-lg">
                  Active Offer
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows (Desktop hover / Mobile accessible) */}
      {totalOffers > 1 && (
        <>
          <button
            onClick={() => {
              paginate(-1);
              triggerInteractionPause();
            }}
            aria-label="Previous Offer Slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-stone flex items-center justify-center transition-all opacity-80 md:opacity-0 group-hover:opacity-100 active:scale-90 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-stone" />
          </button>

          <button
            onClick={() => {
              paginate(1);
              triggerInteractionPause();
            }}
            aria-label="Next Offer Slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-stone flex items-center justify-center transition-all opacity-80 md:opacity-0 group-hover:opacity-100 active:scale-90 z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-stone" />
          </button>
        </>
      )}

      {/* Customer Dynamic T&C Modal */}
      <AnimatePresence>
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setTermsModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-card text-card-foreground border border-border w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-foreground">Terms & Conditions</h4>
                    <p className="text-[11px] text-muted-foreground">{currentOffer.title}</p>
                  </div>
                </div>

                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {loadingTerms ? (
                  <div className="py-6 text-center text-muted-foreground">Loading terms...</div>
                ) : currentOfferTerms.length === 0 ? (
                  <div className="py-4 text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">• Valid for online orders at Celebration Cafe.</p>
                    <p className="font-medium text-foreground">• Standard store terms & conditions apply.</p>
                  </div>
                ) : (
                  currentOfferTerms.map((term, idx) => (
                    <div key={term.id || idx} className="flex items-start gap-2 text-foreground font-medium">
                      <span className="font-bold text-accent">{idx + 1}.</span>
                      <span className="leading-relaxed">{term.text}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="bg-accent text-accent-foreground font-bold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
