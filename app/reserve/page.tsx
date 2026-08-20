"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  ArrowRight,
  Utensils,
  Check,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

const TIME_SLOTS = [
  { time: "09:00 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "11:30 AM", available: true },
  { time: "01:00 PM", available: true },
  { time: "02:30 PM", available: false }, // Booked
  { time: "04:00 PM", available: true },
  { time: "05:30 PM", available: true },
  { time: "07:00 PM", available: true },
  { time: "08:30 PM", available: true },
  { time: "09:30 PM", available: true },
];

export default function ReserveTablePage() {
  const today = new Date().toISOString().split("T")[0];

  // Form State
  const [date, setDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("07:00 PM");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");

  // Confirmation State
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please enter your name and phone number");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const randomRef = "CELEB-" + Math.floor(1000 + Math.random() * 9000);
      setConfirmedRef(randomRef);
      setSubmitting(false);
    }, 800);
  };

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

      {/* ── Hero Banner ── */}
      <div className="relative min-h-[300px] bg-pine text-stone flex items-center justify-center overflow-hidden border-b border-marigold/20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1400&h=600&fit=crop&auto=format&q=80"
          alt="Cafe Interior Ambiance"
          className="w-full h-full object-cover opacity-30 absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/80 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-3 pt-8 pb-12">
          <p className="text-xs font-semibold tracking-[0.25em] text-marigold uppercase flex items-center justify-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-marigold" />
            Dine-In Experience
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-stone">
            Reserve Your Table
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-stone/80 pt-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-marigold" /> Main Bazar Road, Hamirpur, HP
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-marigold" /> Open Daily: 9:00 AM – 10:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid (2 Columns on Desktop) ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait">
          {confirmedRef ? (
            /* ── Confirmation Card ── */
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card text-card-foreground border border-accent/40 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Booking Request Received
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground">
                  Table Reservation #{confirmedRef}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Thank you, <strong>{name}</strong>! We have logged your table reservation.
                </p>
              </div>

              {/* Reservation Summary Box */}
              <div className="bg-muted/40 border border-border rounded-2xl p-6 text-left space-y-3 text-xs md:text-sm">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-bold text-foreground">{date} at {selectedTime}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-bold text-foreground">{partySize} Person{partySize > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span className="font-bold text-foreground">{phone}</span>
                </div>
                {requests && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Special Notes</span>
                    <span className="font-bold text-accent">{requests}</span>
                  </div>
                )}
              </div>

              {/* Reassurance Trust Box */}
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 text-xs text-foreground flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Confirmation Notice:</strong> Our cafe manager will confirm your table via SMS/Call on <strong>{phone}</strong> within 30 minutes.
                </span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/?text=Hi%20Celebration%20Cafe,%20checking%20my%20table%20reservation%20%23${confirmedRef}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
                <button
                  onClick={() => {
                    setConfirmedRef(null);
                    setName("");
                    setPhone("");
                    setRequests("");
                  }}
                  className="bg-muted hover:bg-muted/80 text-foreground font-bold px-6 py-3.5 rounded-2xl text-xs border border-border"
                >
                  Make Another Reservation
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── 2-Column Desktop Grid ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Columns: Form */}
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="lg:col-span-7 bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-8"
              >
                <div className="border-b border-border pb-4">
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Table Reservation Form
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Book a table at Celebration Cafe on Main Bazar Road, Hamirpur.
                  </p>
                </div>

                {/* Step 1: Date & Time */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Select Date & Time
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Reservation Date *</label>
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
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Selected Slot</label>
                      <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm font-bold text-accent">
                        {selectedTime}
                      </div>
                    </div>
                  </div>

                  {/* Slots Grid */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">Available Time Slots</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                            !slot.available
                              ? "bg-muted/20 text-muted-foreground/40 border border-border/30 cursor-not-allowed line-through"
                              : selectedTime === slot.time
                              ? "bg-accent text-accent-foreground font-bold shadow-md scale-105"
                              : "bg-background text-foreground border border-border hover:border-accent/40"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 2: Party Size */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Number of Guests
                    </h3>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-sm">{partySize} Person{partySize > 1 ? "s" : ""}</p>
                      <p className="text-xs text-accent font-medium mt-0.5">Standard table arrangement</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                        className="w-9 h-9 rounded-full border border-border bg-background font-bold hover:bg-muted"
                      >
                        -
                      </button>
                      <span className="font-bold text-base text-accent w-6 text-center tabular-nums">{partySize}</span>
                      <button
                        type="button"
                        onClick={() => setPartySize((p) => Math.min(12, p + 1))}
                        className="w-9 h-9 rounded-full bg-accent text-accent-foreground font-bold hover:opacity-90 shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {partySize >= 12 && (
                    <p className="text-xs text-accent bg-accent/10 border border-accent/30 p-3 rounded-xl">
                      💡 Hosting 12+ guests? Check out our{" "}
                      <Link href="/parties" className="underline font-bold">
                        Party & Event Booking
                      </Link>{" "}
                      page for custom catering!
                    </p>
                  )}
                </div>

                {/* Step 3: Contact Info */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Guest Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
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
                        placeholder="e.g. 98160XXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Window seating preferred, birthday dessert surprise"
                      value={requests}
                      onChange={(e) => setRequests(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                    We will confirm your table via SMS/Call within 30 minutes of submission.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-2xl text-base shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? "Submitting Request…" : "Confirm Table Reservation"}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.form>

              {/* Right 5 Columns: Sticky Live Reservation Preview */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="bg-pine text-stone border border-marigold/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-marigold" />
                      <h3 className="font-heading text-lg font-bold text-stone">Reservation Summary</h3>
                    </div>
                    <span className="bg-marigold text-pineDark text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      Live Preview
                    </span>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Date & Time</span>
                      <span className="font-bold text-marigold">{date} at {selectedTime}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Party Size</span>
                      <span className="font-bold text-stone">{partySize} Guest{partySize > 1 ? "s" : ""}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-stone/60">Confirmation</span>
                      <span className="font-bold text-stone">Within 30 mins via SMS</span>
                    </div>
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
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
