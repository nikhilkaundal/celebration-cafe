"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveAddressMapProps {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lng: number) => void;
}

export function InteractiveAddressMap({
  latitude,
  longitude,
  onPositionChange,
}: InteractiveAddressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current) return;

      try {
        // Import Leaflet dynamically on client-side to prevent SSR window errors
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        // Fix Leaflet marker icon paths for Next.js bundler
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        if (!mapInstanceRef.current && containerRef.current) {
          const map = L.map(containerRef.current, {
            center: [latitude, longitude],
            zoom: 16,
            zoomControl: true,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          const marker = L.marker([latitude, longitude], {
            draggable: true,
          }).addTo(map);

          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            if (isMounted) {
              onPositionChange(pos.lat, pos.lng);
            }
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;

          // Invalidate map size after modal animation finishes to prevent blank tiles!
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 300);
        } else if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerInstanceRef.current.setLatLng([latitude, longitude]);
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 150);
        }
      } catch (e) {
        console.warn("Leaflet map initialization error:", e);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-border shadow-inner bg-card">
      <div ref={containerRef} className="w-full h-full z-0 min-h-[200px]" />
      <div className="absolute top-2.5 left-2.5 z-[400] bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-400/40 shadow-lg flex items-center gap-1.5">
        📍 Drag pin on map to adjust exact location
      </div>
    </div>
  );
}
