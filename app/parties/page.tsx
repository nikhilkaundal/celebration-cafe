"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  PartyPopper,
  Calendar as CalendarIcon,
  Users,
  Utensils,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  ArrowRight,
  DollarSign,
  MapPin,
  Check,
  Clock,
  Gift,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

const OCCASION_TYPES = [
  { id: "birthday", label: "Birthday Party", emoji: "🎂", desc: "Custom cakes & balloon decor" },
  { id: "anniversary", label: "Anniversary", emoji: "💍", desc: "Romantic candlelit setup" },
  { id: "gettogether", label: "Get-Together", emoji: "🎉", desc: "Group seating & snack platters" },
  { id: "corporate", label: "Corporate Event", emoji: "💼", desc: "Formal setup & chai pitchers" },
  { id: "other", label: "Other Event", emoji: "✨", desc: "Custom party arrangements" },
];

const PREORDER_ITEMS = [
  { id: "p-1", name: "Artisan Tandoori Paneer Pizza (Large)", category: "Wood-Fired Pizza", price: 469 },
  { id: "p-2", name: "Belgian Chocolate Truffle Cake (1 Kg)", category: "Custom Cake", price: 899 },
  { id: "p-3", name: "Special Veg Thali Platter (Per Person)", category: "Group Meal", price: 180 },
  { id: "p-4", name: "Chicken Thali Platter (Per Person)", category: "Group Meal", price: 220 },
  { id: "p-5", name: "Masala Chai Party Pitcher (10 Cups)", category: "Beverage", price: 250 },
];

export default function BookForPartiesPage() {
  const today = new Date().toISOString().split("T")[0];

  // Form state
  const [occasion, setOccasion] = useState("birthday");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("06:00 PM");
  const [guestCount, setGuestCount] = useState(15);
  const [budget, setBudget] = useState("₹5,000 – ₹15,000");

  // Preorder collapsible & items state
  const [showPreorderMenu, setShowPreorderMenu] = useState(false);
  const [preorders, setPreorders] = useState<{ [key: string]: number }>({});

  // Contact info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Submission state
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updatePreorderQty = (id: string, delta: number) => {
    setPreorders((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const calculatePreorderTotal = () => {
    return Object.entries(preorders).reduce((total, [id, qty]) => {
      const item = PREORDER_ITEMS.find((p) => p.id === id);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please enter your name and phone number");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const randomRef = "PARTY-" + Math.floor(1000 + Math.random() * 9000);
      setSubmittedRef(randomRef);
      setSubmitting(false);
    }, 800);
  };

  const activeOccasion = OCCASION_TYPES.find((o) => o.id === occasion);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-40 bg-pine text-stone backdrop-blur-md border-b border-marigold/20 px-6 py-3.5 flex items-center justify-between shadow-xl">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/images/logos/logo.svg"
            alt="Celebration Food Cafe"
            className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="sr-only">Celebration Cafe</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider text-stone/80 hover:text-marigold transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* ── Hero Banner Strip ── */}
      <div className="relative min-h-[300px] bg-pine text-stone flex items-center justify-center overflow-hidden border-b border-marigold/20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1400&h=600&fit=crop&auto=format&q=80"
          alt="Party Celebration Backdrop"
          className="w-full h-full object-cover opacity-30 absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/80 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-3 pt-8 pb-12">
          <p className="text-xs font-semibold tracking-[0.25em] text-marigold uppercase flex items-center justify-center gap-1.5">
            Private Seating & Custom Catering
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-stone">
            Host Your Celebration With Us
          </h1>
          <p className="text-stone/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Birthdays, anniversaries, or corporate get-togethers. Let Celebration Cafe handle the food, custom cakes, and decor in Hamirpur.
          </p>
        </div>
      </div>

      {/* ── Main Content Grid (2 Columns on Desktop) ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait">
          {submittedRef ? (
            /* ── Confirmation Card State ── */
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card text-card-foreground border border-accent/40 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center mx-auto shadow-md">
                <PartyPopper className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Party Enquiry Received
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground">
                  Enquiry Reference #{submittedRef}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Thank you, <strong>{name}</strong>! We have received your party request.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-muted/40 border border-border rounded-2xl p-6 text-left space-y-3 text-xs md:text-sm">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Occasion Type</span>
                  <span className="font-bold text-accent capitalize">{activeOccasion?.label}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Event Date & Time</span>
                  <span className="font-bold text-foreground">{date} at {time}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Expected Guests</span>
                  <span className="font-bold text-foreground">{guestCount} Guests</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Budget Tier</span>
                  <span className="font-bold text-foreground">{budget}</span>
                </div>
                {calculatePreorderTotal() > 0 && (
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Pre-Ordered Food Total</span>
                    <span className="font-bold text-primary">₹{calculatePreorderTotal()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Phone Contact</span>
                  <span className="font-bold text-foreground">{phone}</span>
                </div>
              </div>

              {/* Reassurance Note */}
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 text-xs text-foreground flex items-start gap-3 text-left">
                <PartyPopper className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  <strong>What happens next:</strong> Our event catering team will call you within <strong>24 hours</strong> on <strong>{phone}</strong> to confirm custom menu options & pricing setup.
                </span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/?text=Hi%20Celebration%20Cafe,%20following%20up%20on%20my%20party%20enquiry%20%23${submittedRef}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Instant WhatsApp Follow-up</span>
                </a>
                <button
                  onClick={() => {
                    setSubmittedRef(null);
                    setName("");
                    setPhone("");
                  }}
                  className="bg-muted hover:bg-muted/80 text-foreground font-bold px-6 py-3.5 rounded-2xl text-xs border border-border"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── 2-Column Form Layout ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Interactive Form */}
              <motion.form
                key="partyForm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="lg:col-span-7 bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-8"
              >
                {/* Section Header */}
                <div className="border-b border-border pb-4">
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Party Booking Enquiry
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill out event details below. Our Hamirpur team will reach out with a custom quote.
                  </p>
                </div>

                {/* ── STEP 1: Occasion Type ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Select Occasion Type
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {OCCASION_TYPES.map((type) => {
                      const active = occasion === type.id;
                      return (
                        <motion.button
                          key={type.id}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setOccasion(type.id)}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                            active
                              ? "bg-accent/10 border-accent text-foreground shadow-md ring-2 ring-accent/30"
                              : "bg-background border-border text-foreground hover:border-accent/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{type.emoji}</span>
                            {active && <Check className="w-4 h-4 text-accent" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs">{type.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ── STEP 2: Date, Time & Guests ── */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Date, Time & Guests
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Event Date *</label>
                      <input
                        type="date"
                        min={today}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Preferred Time *</label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="12:00 PM">12:00 PM (Lunch Party)</option>
                        <option value="03:00 PM">03:00 PM (Hi-Tea / Snacks)</option>
                        <option value="06:00 PM">06:00 PM (Evening Party)</option>
                        <option value="08:00 PM">08:00 PM (Dinner Celebration)</option>
                      </select>
                    </div>
                  </div>

                  {/* Guest Stepper */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Expected Guests</label>
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground text-sm">{guestCount} Guests</p>
                        <p className="text-xs text-accent font-medium mt-0.5">
                          {guestCount <= 20 ? "10–20 Guests (Semi-Private)" : guestCount <= 50 ? "20–50 Guests (Private Dining)" : "50+ Guests (Full Hall Booking)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setGuestCount((g) => Math.max(5, g - 5))}
                          className="w-9 h-9 rounded-full border border-border bg-background font-bold text-foreground hover:bg-muted"
                        >
                          -5
                        </button>
                        <span className="font-bold text-base text-accent w-6 text-center tabular-nums">{guestCount}</span>
                        <button
                          type="button"
                          onClick={() => setGuestCount((g) => Math.min(100, g + 5))}
                          className="w-9 h-9 rounded-full bg-accent text-accent-foreground font-bold hover:opacity-90 shadow-xs"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── STEP 3: Collapsible Pre-Order Menu ── */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Pre-Order Food & Cake (Optional)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPreorderMenu(!showPreorderMenu)}
                    className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-2xl p-4 hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Utensils className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {showPreorderMenu ? "Hide Food Menu" : "Click to Add Pizzas, Thalis or Cake"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Object.keys(preorders).length > 0
                            ? `${Object.values(preorders).reduce((a, b) => a + b, 0)} items added (₹${calculatePreorderTotal()})`
                            : "Pre-selecting items helps us calculate instant quotes"}
                        </p>
                      </div>
                    </div>
                    {showPreorderMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showPreorderMenu && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-background border border-border rounded-2xl p-4 space-y-3"
                      >
                        {PREORDER_ITEMS.map((item) => {
                          const qty = preorders[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0"
                            >
                              <div>
                                <p className="font-bold text-foreground">{item.name}</p>
                                <p className="text-muted-foreground">₹{item.price}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updatePreorderQty(item.id, -1)}
                                  className="w-6 h-6 rounded-full border border-border flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold text-accent w-4 text-center tabular-nums">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updatePreorderQty(item.id, 1)}
                                  className="w-6 h-6 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── STEP 4: Budget & Contact Details ── */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Budget & Contact Details
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Estimated Budget</label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      <option value="Under ₹5,000">Under ₹5,000 (Small Gathering)</option>
                      <option value="₹5,000 – ₹15,000">₹5,000 – ₹15,000 (Medium Party)</option>
                      <option value="₹15,000+">₹15,000+ (Grand Celebration / Full Hall)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Anish Verma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="e.g. 98055XXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Event Notes & Decor Requests (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Balloon decoration, eggless chocolate cake, DJ speaker setup"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Submitting this form sends your request to our Hamirpur cafe manager. We will call you within 24 hours with custom quotes.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-2xl text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? "Sending Party Enquiry…" : "Send Party Enquiry"}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.form>

              {/* Right 5 Columns: Sticky Event Live Preview Card */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="bg-pine text-stone border border-marigold/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-marigold" />
                      <h3 className="font-heading text-lg font-bold text-stone">Event Summary</h3>
                    </div>
                    <span className="bg-marigold text-pineDark text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      Live Preview
                    </span>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Selected Occasion</span>
                      <span className="font-bold text-marigold flex items-center gap-1">
                        <span>{activeOccasion?.emoji}</span>
                        <span>{activeOccasion?.label}</span>
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Date & Time</span>
                      <span className="font-bold text-stone">{date} at {time}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Guest Count</span>
                      <span className="font-bold text-stone">{guestCount} Guests</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Budget Range</span>
                      <span className="font-bold text-stone">{budget}</span>
                    </div>

                    {calculatePreorderTotal() > 0 && (
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-stone/60">Pre-Order Food Total</span>
                        <span className="font-bold text-marigold">₹{calculatePreorderTotal()}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2 text-xs">
                    <p className="font-semibold text-marigold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Celebration Cafe Hamirpur
                    </p>
                    <p className="text-stone/70">
                      Main Bazar Road, Hamirpur, HP 177001
                    </p>
                    <p className="text-stone/70 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-marigold" /> Open Daily: 9 AM – 10 PM
                    </p>
                  </div>

                  <div className="text-[11px] text-stone/60 text-center leading-relaxed">
                    Need instant help? Call us directly at <strong className="text-marigold">+91 98000 00000</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
