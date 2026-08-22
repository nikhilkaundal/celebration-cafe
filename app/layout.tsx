import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { LenisProvider } from "@/components/LenisProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Celebration Food Cafe | Hamirpur",
  description: "Order online from Celebration Food Cafe, Hamirpur. Dine-in, pickup or delivery.",
  icons: {
    icon: "/images/logos/Short%20logo.svg",
    apple: "/images/logos/Short%20logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-body">
        <LenisProvider>
          <CartProvider>
            {children}
            <Toaster position="top-center" richColors />
            <Analytics />
          </CartProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
