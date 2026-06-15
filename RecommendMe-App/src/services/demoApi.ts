import { QueryRequest, QueryResponse } from "./api";

// Demo mode - simulates backend responses for showcase
const DEMO_DELAY = 1500;

const demoFollowUps: Record<string, string[]> = {
  default: [
    "What's your approximate budget for this?",
    "Do you have any brand preferences or specific requirements?",
    "Where will you primarily be using this?",
  ],
  trek: [
    "How many days is the trek, and will you be camping or staying in lodges?",
    "What's your budget range for the full set of gear?",
    "Have you trekked before, or is this your first time?",
  ],
  laptop: [
    "What will you primarily use this laptop for — coding, design, gaming, or general use?",
    "Do you prefer Windows, macOS, or are you open to either?",
    "How important is portability vs. screen size to you?",
  ],
  gift: [
    "What's the occasion — birthday, anniversary, or just because?",
    "What are their main hobbies or interests?",
    "What's your budget range?",
  ],
  kitchen: [
    "Are you setting up from scratch or adding to existing equipment?",
    "Do you cook mostly Indian food, or a mix of cuisines?",
    "What's your total budget for the kitchen setup?",
  ],
};

const demoRecommendations: QueryResponse = {
  type: "recommendations",
  summary: "Based on your requirements, here are my curated recommendations across key categories. Each product has been selected for value, quality, and fit for your specific needs.",
  categories: [
    {
      name: "Waterproof Trekking Tent",
      why_needed: "Essential for overnight camping in variable mountain weather.",
      budget_allocation: "₹3,000 – ₹6,000",
      products: [
        {
          title: "Quechua MH100 2-Person Tent",
          price: "₹3,499",
          rating: 4.5,
          reviews: "2,140",
          source: "Decathlon",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=200&fit=crop",
          reason: "Best weight-to-price ratio for Himalayan conditions. Easy to set up solo.",
        },
        {
          title: "Naturehike Cloud-Up 2 Ultralight",
          price: "₹5,299",
          rating: 4.7,
          reviews: "892",
          source: "Amazon",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=200&h=200&fit=crop",
          reason: "Ultra-lightweight at 1.7kg. Premium build quality with double-wall design.",
        },
        {
          title: "Coleman Sundome 2-Person Tent",
          price: "₹4,199",
          rating: 4.3,
          reviews: "3,456",
          source: "Flipkart",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=200&h=200&fit=crop",
          reason: "Trusted brand with excellent ventilation and rain fly coverage.",
        },
      ],
      expert_tip: "Always look for a tent rated for 3-season use with a waterproof rating above 2000mm for mountain treks.",
    },
    {
      name: "Trekking Backpack (40-50L)",
      why_needed: "Carry all gear comfortably for multi-day treks with proper weight distribution.",
      budget_allocation: "₹2,500 – ₹5,000",
      products: [
        {
          title: "Wildcraft Trailblazer 50L",
          price: "₹2,999",
          rating: 4.4,
          reviews: "1,876",
          source: "Amazon",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=200&h=200&fit=crop",
          reason: "Indian brand designed for Indian trails. Rain cover included, great hip belt support.",
        },
        {
          title: "Decathlon Forclaz Trek 500 50+10L",
          price: "₹4,499",
          rating: 4.6,
          reviews: "654",
          source: "Decathlon",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop",
          reason: "Adjustable back system fits all torso sizes. Top-loading + front panel access.",
        },
        {
          title: "Impulse Rucksack 60L + 5L",
          price: "₹1,899",
          rating: 4.1,
          reviews: "4,230",
          source: "Flipkart",
          link: "#demo",
          thumbnail: "https://images.unsplash.com/photo-1585916420730-d7f95e942d43?w=200&h=200&fit=crop",
          reason: "Budget-friendly option with surprisingly good build quality. Great for first-time trekkers.",
        },
      ],
      expert_tip: "Your backpack should weigh no more than 20% of your body weight when fully loaded. Try it on before buying if possible.",
    },
  ],
};

function detectCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("trek") || lower.includes("hike") || lower.includes("camp")) return "trek";
  if (lower.includes("laptop") || lower.includes("computer") || lower.includes("coding")) return "laptop";
  if (lower.includes("gift") || lower.includes("birthday") || lower.includes("present")) return "gift";
  if (lower.includes("kitchen") || lower.includes("cook") || lower.includes("food")) return "kitchen";
  return "default";
}

let messageCount = 0;

export async function sendDemoQuery(request: QueryRequest): Promise<QueryResponse> {
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY));

  messageCount++;

  // First message = follow-up, second+ = recommendations
  if (messageCount % 2 === 1) {
    const category = detectCategory(request.user_message);
    return {
      type: "followup",
      questions: demoFollowUps[category] || demoFollowUps.default,
    };
  }

  return demoRecommendations;
}
