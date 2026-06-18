import type { CustomerMenuItem, CustomerRestaurant, FoodDiscoveryCategory } from "@/features/customer/types";

export interface FoodCategoryDefinition {
  id: FoodDiscoveryCategory;
  spriteX: number;
  spriteY: number;
}

export const foodDiscoveryCategories: FoodCategoryDefinition[] = [
  { id: "South Indian", spriteX: 128, spriteY: 76 },
  { id: "Desserts", spriteX: 357, spriteY: 76 },
  { id: "Biryani", spriteX: 582, spriteY: 76 },
  { id: "Pizza", spriteX: 812, spriteY: 76 },
  { id: "Cake", spriteX: 1040, spriteY: 76 },
  { id: "Chinese", spriteX: 1266, spriteY: 76 },
  { id: "Burger", spriteX: 1492, spriteY: 76 },
  { id: "Shawarma", spriteX: 128, spriteY: 307 },
  { id: "Samosa", spriteX: 357, spriteY: 307 },
  { id: "Momo", spriteX: 582, spriteY: 307 },
  { id: "Parotta", spriteX: 812, spriteY: 307 },
  { id: "Pakoda", spriteX: 1040, spriteY: 307 },
  { id: "Rolls", spriteX: 1266, spriteY: 307 },
  { id: "Pav Bhaji", spriteX: 1492, spriteY: 307 }
];

export function getFoodDiscoveryCategory(item: CustomerMenuItem, restaurant: CustomerRestaurant): FoodDiscoveryCategory | null {
  if (item.discoveryCategory) {
    return item.discoveryCategory;
  }

  const value = `${item.name} ${item.category} ${restaurant.cuisine} ${restaurant.category}`.toLowerCase();

  if (includesAny(value, ["biryani", "dum rice"])) return "Biryani";
  if (includesAny(value, ["pizza", "margherita"])) return "Pizza";
  if (includesAny(value, ["cake", "red velvet", "tres leches"])) return "Cake";
  if (includesAny(value, ["hakka", "schezwan", "chinese", "manchurian"])) return "Chinese";
  if (includesAny(value, ["burger", "smash patty"])) return "Burger";
  if (includesAny(value, ["shawarma", "falafel wrap"])) return "Shawarma";
  if (includesAny(value, ["samosa"])) return "Samosa";
  if (includesAny(value, ["momo", "dumpling"])) return "Momo";
  if (includesAny(value, ["parotta", "malabar paratha"])) return "Parotta";
  if (includesAny(value, ["pakoda", "pakora", "fritter"])) return "Pakoda";
  if (includesAny(value, ["kathi roll", "frankie", "filled roll"])) return "Rolls";
  if (includesAny(value, ["pav bhaji"])) return "Pav Bhaji";
  if (includesAny(value, ["dosa", "idli", "vada", "uttapam", "south indian"])) return "South Indian";
  if (includesAny(value, ["brownie", "waffle", "rasmalai", "dessert", "sweet"])) return "Desserts";

  return null;
}

export function getCategoryFoodItems(restaurants: CustomerRestaurant[], category: FoodDiscoveryCategory) {
  return restaurants.flatMap((restaurant) =>
    restaurant.menu
      .filter((item) => getFoodDiscoveryCategory(item, restaurant) === category)
      .map((item) => ({ item, restaurant }))
  );
}

export function getTimeBasedFoodSuggestion(hour: number) {
  if (hour >= 5 && hour < 11) {
    return {
      eyebrow: "Breakfast near you",
      title: "Start fresh with a South Indian breakfast.",
      description: "Crisp dosas, soft idlis, filter coffee, and comforting morning combinations.",
      category: "South Indian" as const
    };
  }

  if (hour >= 11 && hour < 16) {
    return {
      eyebrow: "Lunch recommendation",
      title: "A slow-cooked biryani fits the afternoon.",
      description: "Explore fragrant dum biryanis and hearty rice meals from kitchens near you.",
      category: "Biryani" as const
    };
  }

  if (hour >= 16 && hour < 19) {
    return {
      eyebrow: "Evening cravings",
      title: "Tea-time deserves something crisp.",
      description: "Samosas, pakodas, and desserts selected for your evening break.",
      category: "Samosa" as const
    };
  }

  if (hour >= 19 && hour < 23) {
    return {
      eyebrow: "Dinner recommendation",
      title: "Make tonight a pizza and rolls night.",
      description: "Comfort food, filling portions, and delivery-friendly dinner favorites.",
      category: "Pizza" as const
    };
  }

  return {
    eyebrow: "Late-night recommendation",
    title: "Keep it easy with burgers and rolls.",
    description: "Reliable late-night favorites from restaurants still accepting orders.",
    category: "Burger" as const
  };
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}
