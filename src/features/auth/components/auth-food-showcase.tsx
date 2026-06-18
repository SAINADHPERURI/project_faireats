"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock3, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getFoodMedia } from "@/features/customer/lib/food-media";
import { cn } from "@/lib/utils";

const featuredFoods = [
  { name: "Paneer Tikka Rice Bowl", category: "Indian", restaurant: "Urban Tandoor", eta: "24 min", rating: "4.8" },
  { name: "Avocado Crunch Roll", category: "Sushi", restaurant: "Sushi Harbor", eta: "28 min", rating: "4.7" },
  { name: "Millet Buddha Bowl", category: "Healthy", restaurant: "Vegan Valley", eta: "22 min", rating: "4.9" },
  { name: "Ghee Podi Dosa", category: "South Indian", restaurant: "Dosa Lane", eta: "19 min", rating: "4.8" },
  { name: "Classic Veg Smash Burger", category: "Burger", restaurant: "Burger Foundry", eta: "26 min", rating: "4.6" },
  { name: "Dark Chocolate Brownie", category: "Dessert", restaurant: "Sweet Circuit", eta: "18 min", rating: "4.9" }
];

export function AuthFoodShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFood = featuredFoods[activeIndex] ?? featuredFoods[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredFoods.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, []);

  if (!activeFood) {
    return null;
  }

  const media = getFoodMedia(activeFood);

  function move(direction: number) {
    setActiveIndex((current) => (current + direction + featuredFoods.length) % featuredFoods.length);
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="relative aspect-[16/8.5] overflow-hidden rounded-lg border bg-muted shadow-lg">
        <AnimatePresence mode="wait">
          <m.div
            key={activeFood.name}
            initial={{ opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
            className="absolute inset-0"
          >
            <Image src={media.src} alt={`${activeFood.name} from ${activeFood.restaurant}`} fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
            <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent", media.tone)} />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <Badge className="mb-3 border-white/30 bg-black/35 text-white backdrop-blur-sm hover:bg-black/35">Popular near you</Badge>
              <p className="text-2xl font-bold">{activeFood.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
                <span>{activeFood.restaurant}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                  {activeFood.rating}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {activeFood.eta}
                </span>
              </div>
            </div>
          </m.div>
        </AnimatePresence>

        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Previous featured food" className="grid h-9 w-9 place-items-center rounded-md border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next featured food" className="grid h-9 w-9 place-items-center rounded-md border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {featuredFoods.map((food, index) => {
          const itemMedia = getFoodMedia(food);

          return (
            <button
              key={food.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${food.name}`}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-all",
                index === activeIndex ? "border-primary opacity-100" : "border-transparent opacity-65 hover:opacity-100"
              )}
            >
              <Image src={itemMedia.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
