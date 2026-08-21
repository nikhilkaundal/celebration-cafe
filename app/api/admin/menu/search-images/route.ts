import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface ImageSuggestion {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  photographerName: string;
  photographerUrl: string;
}

// Curated high-res food image library fallback
const CURATED_FOOD_REGISTRY: Record<string, ImageSuggestion[]> = {
  pizza: [
    {
      id: "p1",
      thumbUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80",
      alt: "Freshly baked pizza",
      photographerName: "Ivan Torres",
      photographerUrl: "https://unsplash.com/@ivantorres",
    },
    {
      id: "p2",
      thumbUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1000&auto=format&fit=crop&q=80",
      alt: "Margherita Pizza",
      photographerName: "Mahmood Khattab",
      photographerUrl: "https://unsplash.com/@mahmoodkhattab",
    },
    {
      id: "p3",
      thumbUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80",
      alt: "Cheesy Pepperoni Pizza",
      photographerName: "Alan Hardman",
      photographerUrl: "https://unsplash.com/@alan_hardman",
    },
    {
      id: "p4",
      thumbUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1000&auto=format&fit=crop&q=80",
      alt: "Paneer Tandoori Pizza",
      photographerName: "Shourav Sheikh",
      photographerUrl: "https://unsplash.com/@shouravsheikh",
    },
  ],
  burger: [
    {
      id: "b1",
      thumbUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&auto=format&fit=crop&q=80",
      alt: "Gourmet Cheese Burger",
      photographerName: "Amirali Mirhashemian",
      photographerUrl: "https://unsplash.com/@amirali_mirhashemian",
    },
    {
      id: "b2",
      thumbUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80",
      alt: "Veggie Burger with Fries",
      photographerName: "Jonathan Borba",
      photographerUrl: "https://unsplash.com/@jonathanborba",
    },
    {
      id: "b3",
      thumbUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1000&auto=format&fit=crop&q=80",
      alt: "Crispy Aloo Tikki Burger",
      photographerName: "Foodiesfeed",
      photographerUrl: "https://unsplash.com/@foodiesfeed",
    },
  ],
  momo: [
    {
      id: "m1",
      thumbUrl: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=1000&auto=format&fit=crop&q=80",
      alt: "Steamed Veg Momos with Chutney",
      photographerName: "Praveen Gupta",
      photographerUrl: "https://unsplash.com/@praveengupta",
    },
    {
      id: "m2",
      thumbUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1000&auto=format&fit=crop&q=80",
      alt: "Fried Dumplings Momos",
      photographerName: "Sjoerd van der Wal",
      photographerUrl: "https://unsplash.com/@sjoerd",
    },
  ],
  coffee: [
    {
      id: "c1",
      thumbUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80",
      alt: "Hot Cappuccino Latte Art",
      photographerName: "Nathan Dumlao",
      photographerUrl: "https://unsplash.com/@nate_dumlao",
    },
    {
      id: "c2",
      thumbUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=1000&auto=format&fit=crop&q=80",
      alt: "Iced Cold Coffee with Cream",
      photographerName: "Demi DeHerrera",
      photographerUrl: "https://unsplash.com/@demideherrera",
    },
  ],
  default: [
    {
      id: "d1",
      thumbUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80",
      alt: "Restaurant Dish",
      photographerName: "Unsplash Food",
      photographerUrl: "https://unsplash.com",
    },
    {
      id: "d2",
      thumbUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80",
      alt: "Fresh Gourmet Meal",
      photographerName: "Unsplash Food",
      photographerUrl: "https://unsplash.com",
    },
    {
      id: "d3",
      thumbUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1000&auto=format&fit=crop&q=80",
      alt: "Grilled Cheese Sandwich",
      photographerName: "Unsplash Food",
      photographerUrl: "https://unsplash.com",
    },
    {
      id: "d4",
      thumbUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&auto=format&q=80",
      fullUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1000&auto=format&fit=crop&q=80",
      alt: "Chocolate Cake Dessert",
      photographerName: "Unsplash Food",
      photographerUrl: "https://unsplash.com",
    },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "search-images", { limit: 30, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many search requests. Please wait a moment." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // 1. If UNSPLASH_ACCESS_KEY is available, call live Unsplash Search API
    if (accessKey && accessKey !== "placeholder-unsplash-key") {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query + " food dish"
          )}&per_page=6&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${accessKey}`,
            },
          }
        );

        if (unsplashRes.ok) {
          const data = await unsplashRes.json();
          if (data.results && data.results.length > 0) {
            const results: ImageSuggestion[] = data.results.map((item: any) => ({
              id: item.id,
              thumbUrl: item.urls.small || item.urls.thumb,
              fullUrl: item.urls.regular || item.urls.full,
              alt: item.alt_description || query,
              photographerName: item.user.name,
              photographerUrl: item.user.links.html,
            }));

            return NextResponse.json({ results, source: "unsplash_live" });
          }
        }
      } catch (unsplashErr) {
        console.warn("Unsplash API call failed, using fallback:", unsplashErr);
      }
    }

    // 2. Fallback: Search in curated food registry by matching keywords
    const lowerQuery = query.toLowerCase();
    let matchedCategory = "default";

    if (lowerQuery.includes("pizza")) matchedCategory = "pizza";
    else if (lowerQuery.includes("burger")) matchedCategory = "burger";
    else if (lowerQuery.includes("momo") || lowerQuery.includes("dumpling")) matchedCategory = "momo";
    else if (lowerQuery.includes("coffee") || lowerQuery.includes("latte") || lowerQuery.includes("cappuccino") || lowerQuery.includes("tea")) matchedCategory = "coffee";

    const suggestions = CURATED_FOOD_REGISTRY[matchedCategory] || CURATED_FOOD_REGISTRY["default"];

    return NextResponse.json({ results: suggestions, source: "curated_fallback" });
  } catch (err: any) {
    console.error("Search images error:", err);
    return NextResponse.json({ results: [] });
  }
}
