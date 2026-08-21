import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "geo-reverse", { limit: 60, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many reverse geocoding requests" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
    }

    // Option A: If Google Maps API Key is provided in process.env.GOOGLE_MAPS_API_KEY
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey && googleApiKey.trim()) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey.trim()}`;
        const gRes = await fetch(gUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === "OK" && gData.results && gData.results.length > 0) {
            const firstResult = gData.results[0];
            const comp = firstResult.address_components || [];

            let house = "";
            let road = "";
            let sublocality = "";
            let city = "Hamirpur";
            let state = "Himachal Pradesh";
            let pincode = "177001";

            for (const c of comp) {
              const types = c.types || [];
              if (types.includes("street_number") || types.includes("premise") || types.includes("subpremise")) {
                house = c.long_name;
              } else if (types.includes("route")) {
                road = c.long_name;
              } else if (types.includes("sublocality") || types.includes("neighborhood")) {
                sublocality = c.long_name;
              } else if (types.includes("locality") || types.includes("administrative_area_level_3")) {
                city = c.long_name;
              } else if (types.includes("administrative_area_level_1")) {
                state = c.long_name;
              } else if (types.includes("postal_code")) {
                pincode = c.long_name.replace(/\D/g, "").substring(0, 6);
              }
            }

            const line1 = [house, road].filter(Boolean).join(", ") || sublocality || firstResult.formatted_address.split(",")[0];

            return NextResponse.json({
              line1,
              landmark: sublocality,
              city,
              state,
              pincode,
              formatted_address: firstResult.formatted_address,
              source: "google_maps",
            });
          }
        }
      } catch (gErr) {
        console.warn("Google Maps geocoding fallback to OSM:", gErr);
      }
    }

    // Option B: Free OpenStreetMap Nominatim reverse geocoding
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: {
        "User-Agent": "CelebrationCafe/1.0 (contact@celebrationcafe.in)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        line1: "",
        landmark: "",
        city: "Hamirpur",
        state: "Himachal Pradesh",
        pincode: "177001",
        source: "fallback",
      });
    }

    const data = await res.json();
    const addr = data.address || {};

    const road = addr.road || addr.street || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
    const house = addr.house_number || addr.building || "";
    const landmark = addr.amenity || addr.shop || addr.suburb || addr.village || "";
    const city = addr.city || addr.town || addr.county || addr.district || "Hamirpur";
    const state = addr.state || "Himachal Pradesh";
    const pincode = addr.postcode ? addr.postcode.replace(/\s+/g, "").substring(0, 6) : "177001";

    const line1 = [house, road].filter(Boolean).join(", ") || data.display_name?.split(",")[0] || "";

    return NextResponse.json({
      line1,
      landmark,
      city,
      state,
      pincode,
      formatted_address: data.display_name || "",
      source: "openstreetmap",
    });
  } catch (err: any) {
    console.error("Reverse geocoding error:", err);
    return NextResponse.json({
      line1: "",
      landmark: "",
      city: "Hamirpur",
      state: "Himachal Pradesh",
      pincode: "177001",
      source: "error_fallback",
    });
  }
}
