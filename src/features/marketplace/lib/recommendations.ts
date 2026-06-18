import type { CustomerRestaurant } from "@/features/customer/types";
import type { MarketplaceOrder } from "@/features/marketplace/types";

export function getTrendingFoods(restaurants: CustomerRestaurant[], orders: MarketplaceOrder[]) {
  const orderCounts = countOrderedItems(orders);

  return restaurants
    .flatMap((restaurant) =>
      restaurant.menu.map((item) => ({
        item,
        restaurant,
        orderCount: (orderCounts.get(item.name) ?? 0) + (item.isPopular ? 18 : 4)
      }))
    )
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 8);
}

export function getTopRestaurants(restaurants: CustomerRestaurant[], orders: MarketplaceOrder[]) {
  const restaurantOrderCounts = orders.reduce((counts, order) => {
    counts.set(order.restaurantId, (counts.get(order.restaurantId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return restaurants
    .map((restaurant) => ({
      restaurant,
      score: restaurant.rating * 25 + (restaurantOrderCounts.get(restaurant.id) ?? 0) * 8 + restaurant.reviewCount / 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function getFrequentlyOrderedTogether(restaurants: CustomerRestaurant[], itemIds: string[]) {
  const selectedNames = new Set(
    restaurants.flatMap((restaurant) => restaurant.menu.filter((item) => itemIds.includes(item.id)).map((item) => item.name))
  );
  const selectedRestaurant = restaurants.find((restaurant) => restaurant.menu.some((item) => itemIds.includes(item.id))) ?? restaurants[0];

  if (!selectedRestaurant) {
    return [];
  }

  return selectedRestaurant.menu
    .filter((item) => !itemIds.includes(item.id))
    .map((item) => ({
      item,
      restaurant: selectedRestaurant,
      confidence: item.category === "Beverages" || item.category === "Sides" ? 92 : selectedNames.size > 0 ? 78 : 64
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function countOrderedItems(orders: MarketplaceOrder[]) {
  return orders.reduce((counts, order) => {
    for (const item of order.items) {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
    }

    return counts;
  }, new Map<string, number>());
}
