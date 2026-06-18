import type { CustomerMenuItem, CustomerRestaurant } from "@/features/customer/types";

export interface FoodMedia {
  src: string;
  alt: string;
  tone: string;
}

const foodMedia = {
  indian: {
    src: "/images/foods/indian.jpg",
    alt: "Indian curry, rice, and flatbread",
    tone: "from-orange-950/80"
  },
  japanese: {
    src: "/images/foods/japanese.jpg",
    alt: "Japanese sushi, ramen, and rice dishes",
    tone: "from-rose-950/80"
  },
  vegan: {
    src: "/images/foods/vegan.jpg",
    alt: "Colorful vegan grain bowls",
    tone: "from-emerald-950/80"
  },
  southIndian: {
    src: "/images/foods/south-indian.jpg",
    alt: "South Indian breakfast with idli and chutneys",
    tone: "from-amber-950/80"
  },
  burger: {
    src: "/images/foods/burger.jpg",
    alt: "Restaurant-style burger and fries",
    tone: "from-red-950/80"
  },
  dessert: {
    src: "/images/foods/dessert.jpg",
    alt: "Restaurant dessert with chocolate and ice cream",
    tone: "from-fuchsia-950/80"
  },
  beverage: {
    src: "/images/foods/beverage.jpg",
    alt: "Iced matcha beverage",
    tone: "from-lime-950/80"
  },
  noodles: {
    src: "/images/foods/noodles.jpg",
    alt: "Freshly prepared noodle bowl",
    tone: "from-yellow-950/80"
  },
  spread: {
    src: "/images/foods/food-spread.jpg",
    alt: "A table filled with freshly prepared food",
    tone: "from-stone-950/80"
  }
} satisfies Record<string, FoodMedia>;

const fallbackMedia = [foodMedia.spread, foodMedia.indian, foodMedia.japanese, foodMedia.vegan, foodMedia.burger, foodMedia.noodles];

export function getFoodMedia(item: Pick<CustomerMenuItem, "name" | "category">): FoodMedia {
  const value = `${item.name} ${item.category}`.toLowerCase();

  if (matches(value, ["latte", "coffee", "smoothie", "soda", "beverage", "shake"])) {
    return foodMedia.beverage;
  }

  if (matches(value, ["brownie", "velvet", "waffle", "rasmalai", "cake", "dessert", "chocolate", "nutella"])) {
    return foodMedia.dessert;
  }

  if (matches(value, ["burger", "fries", "smash", "peri peri", "pizza", "margherita"])) {
    return foodMedia.burger;
  }

  if (matches(value, ["dosa", "idli", "vada", "uttapam", "podi", "parotta"])) {
    return foodMedia.southIndian;
  }

  if (matches(value, ["sushi", "nigiri", "ramen", "miso", "salmon", "momo", "dumpling"])) {
    return foodMedia.japanese;
  }

  if (matches(value, ["buddha", "millet", "tofu", "jackfruit", "salad", "vegan", "plant based", "shawarma", "kathi roll", "falafel"])) {
    return foodMedia.vegan;
  }

  if (matches(value, ["paneer", "biryani", "tikka", "butter chicken", "dum", "masala", "rice bowl", "samosa", "pakoda", "pav bhaji"])) {
    return foodMedia.indian;
  }

  if (matches(value, ["noodle", "pasta", "pho", "wok", "hakka", "chinese"])) {
    return foodMedia.noodles;
  }

  return fallbackMedia[stableIndex(item.name, fallbackMedia.length)] ?? foodMedia.spread;
}

export function getRestaurantFoodMedia(restaurant: Pick<CustomerRestaurant, "name" | "cuisine" | "menu">): FoodMedia {
  const featuredItem = restaurant.menu.find((item) => item.isPopular) ?? restaurant.menu[0];

  if (featuredItem) {
    return getFoodMedia(featuredItem);
  }

  return getFoodMedia({ name: restaurant.name, category: restaurant.cuisine });
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function stableIndex(value: string, length: number) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % length;
}
