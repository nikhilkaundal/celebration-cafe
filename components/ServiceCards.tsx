"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import { ShoppingBag, Utensils, PartyPopper, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface ServiceCardItem {
  id: string;
  title: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  ctaText: string;
  href: string;
  image: string;
}

const SERVICES: ServiceCardItem[] = [
  {
    id: "online-order",
    title: "Online Order",
    tag: "Delivery & Pickup",
    icon: ShoppingBag,
    description: "Order fresh pizza, thalis, and beverages online. Fast doorstep delivery across Hamirpur.",
    ctaText: "Order Now",
    href: "/order",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "dine-in",
    title: "Dine-In Experience",
    tag: "Cafe Ambiance",
    icon: Utensils,
    description: "Cozy seating, mountain views, and handcrafted coffee. Visit us on Main Bazar Road.",
    ctaText: "Reserve Table",
    href: "/reserve",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "book-parties",
    title: "Book for Parties",
    icon: PartyPopper,
    tag: "Events & Birthdays",
    description: "Hosting a birthday, anniversary, or get-together? We custom-cater food & cakes for your event.",
    ctaText: "Enquire Now",
    href: "/parties",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop&auto=format&q=80",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function ServiceCards({
  onSelectService,
}: {
  onSelectService?: (href: string) => void;
}) {
  const handleClick = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
      return;
    }
    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }
    if (onSelectService) {
      onSelectService(href);
      return;
    }
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10 space-y-2">
        <p className="text-xs font-bold tracking-[0.25em] text-pine uppercase">
          Celebration Services
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-pineDark">
          How would you like to celebrate?
        </h2>
        <p className="text-pine/85 text-sm md:text-base max-w-md mx-auto leading-relaxed font-medium">
          From quick doorstep delivery to cozy dining & hosting special events in Hamirpur.
        </p>
      </div>

      {/* 3 Premium Image Service Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <motion.div
              key={service.id}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl hover:border-marigold/60 transition-all duration-300 group cursor-pointer flex flex-col justify-between p-6"
              onClick={() => handleClick(service.href)}
            >
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <ImageWithFallback
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pineDark via-pineDark/70 to-black/30" />
              </div>

              {/* Top Glass Header Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-marigold shadow-lg group-hover:bg-marigold group-hover:text-pineDark transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="bg-marigold/90 text-pineDark text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md shadow-md flex items-center gap-1">
                  {service.tag}
                </span>
              </div>

              {/* Bottom Details Body */}
              <div className="relative z-10 space-y-3 pt-12">
                <h3 className="font-heading text-2xl font-bold text-stone group-hover:text-marigold transition-colors drop-shadow-md">
                  {service.title}
                </h3>
                <p className="text-stone/85 text-xs md:text-sm leading-relaxed font-normal">
                  {service.description}
                </p>

                <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                  <span className="text-sm font-bold text-marigold group-hover:text-marigoldLight flex items-center gap-2">
                    {service.ctaText}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

export default ServiceCards;
