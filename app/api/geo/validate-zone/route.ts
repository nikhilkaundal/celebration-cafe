import { NextRequest, NextResponse } from "next/server";

// Celebration Cafe Hamirpur Coordinates
const CAFE_LAT = 31.6862;
const CAFE_LNG = 76.5213;
const MAX_DELIVERY_RADIUS_KM = 12.0; // 12 km Hamirpur Town & Surroundings Zone

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, city, pincode } = body;

    // If coordinates exist, use precise distance check
    if (typeof latitude === "number" && typeof longitude === "number") {
      const distanceKm = calculateHaversineDistance(CAFE_LAT, CAFE_LNG, latitude, longitude);
      const isServiceable = distanceKm <= MAX_DELIVERY_RADIUS_KM;

      return NextResponse.json({
        isServiceable,
        distanceKm: Math.round(distanceKm * 10) / 10,
        maxRadiusKm: MAX_DELIVERY_RADIUS_KM,
        message: isServiceable
          ? `Within delivery zone (${Math.round(distanceKm * 10) / 10} km from Celebration Cafe)`
          : `Outside delivery zone (${Math.round(distanceKm * 10) / 10} km away, max service distance is ${MAX_DELIVERY_RADIUS_KM} km)`,
      });
    }

    // Fallback text check: Hamirpur area pincodes (177001, 177005, 177020, etc.)
    const hamirpurPincodes = ["177001", "177005", "177020", "177002", "177003", "177004"];
    const textCity = city ? String(city).toLowerCase() : "";
    const textPincode = pincode ? String(pincode).trim() : "";

    const matchesHamirpur =
      textCity.includes("hamirpur") || hamirpurPincodes.includes(textPincode);

    return NextResponse.json({
      isServiceable: matchesHamirpur,
      distanceKm: null,
      maxRadiusKm: MAX_DELIVERY_RADIUS_KM,
      message: matchesHamirpur
        ? "Within Hamirpur Delivery Zone"
        : "Address appears to be outside our Hamirpur delivery area",
    });
  } catch (err: any) {
    console.error("Validate zone error:", err);
    return NextResponse.json({ isServiceable: true, distanceKm: 0, maxRadiusKm: MAX_DELIVERY_RADIUS_KM });
  }
}
