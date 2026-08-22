"use client";

import React, { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// Utility to optimize Unsplash image URLs for fast WebP/AVIF delivery
function optimizeImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  if (url.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has("auto")) parsed.searchParams.set("auto", "format");
      if (!parsed.searchParams.has("fit")) parsed.searchParams.set("fit", "crop");
      if (!parsed.searchParams.has("q")) parsed.searchParams.set("q", "70");
      return parsed.toString();
    } catch (e) {
      return url;
    }
  }
  return url;
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { src, alt, style, className, loading = "lazy", decoding = "async", ...rest } = props;

  const optimizedSrc = optimizeImageUrl(src);
  const isInvalidSrc = !optimizedSrc || optimizedSrc.trim() === "";

  const handleError = () => {
    setDidError(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (didError || isInvalidSrc) {
    return (
      <div
        className={`inline-block bg-stone-900/60 text-center align-middle ${className ?? ""}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src ?? undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={style}>
      {/* Background Skeleton Shimmer while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-800/50 animate-pulse z-0" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        {...rest}
      />
    </div>
  );
}

export default ImageWithFallback;
