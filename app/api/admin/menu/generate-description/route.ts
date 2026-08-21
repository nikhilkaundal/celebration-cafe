import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Smart Culinary Description Template Generator
function generateCulinaryDescription(dishName: string, category?: string, isVeg: boolean = true): string {
  const name = dishName.trim();
  const lower = name.toLowerCase();

  // Pizza
  if (lower.includes("pizza")) {
    if (lower.includes("onion")) {
      return "Hand-tossed pizza topped with sweet caramelized red onions, melted mozzarella, and signature tomato herb sauce.";
    }
    if (lower.includes("paneer")) {
      return "Smoky tandoori paneer cubes, bell peppers, and onion rings baked over a golden crispy crust with extra cheese.";
    }
    if (lower.includes("margherita") || lower.includes("cheese")) {
      return "Classic Italian pizza loaded with double mozzarella cheese, fresh basil leaves, and slow-cooked tomato reduction.";
    }
    return "Handcrafted wood-fired style pizza with fresh garden toppings, rich mozzarella cheese, and aromatic Italian herbs.";
  }

  // Burger
  if (lower.includes("burger")) {
    if (lower.includes("paneer") || lower.includes("cheese")) {
      return "Crispy paneer patty stacked with fresh lettuce, tomatoes, creamy cheese blend, and signature house sauce in toasted brioche buns.";
    }
    if (lower.includes("aloo") || lower.includes("veg")) {
      return "Crispy spiced potato tikki burger layered with fresh cucumber, onions, mint mayonnaise, and tangy tomato sauce.";
    }
    return "Juicy handcrafted patty layered with fresh lettuce, sliced tomatoes, melted cheese, and gourmet cafe spread.";
  }

  // Momos
  if (lower.includes("momo") || lower.includes("dumpling")) {
    if (lower.includes("fried")) {
      return "Golden crispy fried momos stuffed with seasoned garden vegetables, served hot with spicy Himalayan red chilli dip.";
    }
    if (lower.includes("kurkure")) {
      return "Crunchy double-coated kurkure momos tossed in secret spices, served with fiery schezwan sauce and creamy mayo.";
    }
    return "Steamed Himalayan momos filled with finely minced fresh veggies, aromatic garlic, and served with authentic spicy red chutney.";
  }

  // Sandwich & Toast
  if (lower.includes("sandwich") || lower.includes("toast")) {
    if (lower.includes("cheese") || lower.includes("grilled")) {
      return "Golden grilled artisan bread loaded with melted cheese, bell peppers, corn, and house Italian seasoning.";
    }
    return "Freshly toasted gourmet sandwich layered with crisp garden veggies, herb mayo, and special cafe spices.";
  }

  // Coffee & Shakes
  if (lower.includes("coffee") || lower.includes("latte") || lower.includes("cappuccino")) {
    if (lower.includes("cold") || lower.includes("iced")) {
      return "Rich espresso blended with chilled milk, thick vanilla cream, and dark chocolate drizzle, served over ice.";
    }
    return "Freshly brewed artisan Arabica coffee with silky steamed milk foam and subtle aromatic cocoa dusting.";
  }

  if (lower.includes("shake") || lower.includes("smoothie")) {
    return "Thick & creamy gourmet milk shake blended with premium ice cream, rich syrup, and topped with whipped cream.";
  }

  // Pasta & Noodles
  if (lower.includes("pasta") || lower.includes("macaroni")) {
    if (lower.includes("white") || lower.includes("alfredo")) {
      return "Penne pasta tossed in velvety white garlic cream sauce with sweet corn, broccoli, and freshly grated parmesan.";
    }
    return "Delicious pasta cooked in rich tomato basil sauce with fresh vegetables, chilli flakes, and oregano blend.";
  }

  if (lower.includes("maggi") || lower.includes("noodle")) {
    return "Special cafe-style masala Maggi tossed with fresh onions, capsicum, sweet corn, and aromatic mountain spices.";
  }

  // Thali & Meals
  if (lower.includes("thali") || lower.includes("meal")) {
    return "Wholesome HP special meal platter featuring seasonal sabzi, dal tadka, steamed rice, fresh butter rotis, salad, and sweet.";
  }

  // Generic Fallback based on Veg/Non-Veg
  if (isVeg) {
    return `Delightful ${name} prepared fresh with farm-picked ingredients, subtle spices, and signature Himalayan cafe flavors.`;
  }
  return `Succulent ${name} cooked to perfection with authentic spices and chef special gourmet garnishing.`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "generate-desc", { limit: 30, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { dishName, category, isVeg } = await req.json();

    if (!dishName || typeof dishName !== "string" || dishName.trim().length < 2) {
      return NextResponse.json({ error: "Dish name is required" }, { status: 400 });
    }

    const description = generateCulinaryDescription(dishName, category, isVeg);

    return NextResponse.json({
      success: true,
      description,
    });
  } catch (err: any) {
    console.error("Generate Description Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate description" }, { status: 500 });
  }
}
