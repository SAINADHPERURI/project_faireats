"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  ArrowLeft,
  ArrowRight,
  Bike,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  Flame,
  Heart,
  History,
  Home,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Trash2,
  User
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerDashboardData } from "@/features/customer/hooks/use-customer-dashboard-data";
import {
  foodDiscoveryCategories,
  getCategoryFoodItems,
  getTimeBasedFoodSuggestion
} from "@/features/customer/lib/food-discovery";
import { getFoodMedia, getRestaurantFoodMedia } from "@/features/customer/lib/food-media";
import { LiveActivityFeed } from "@/features/marketplace/components/live-activity-feed";
import { NotificationCenter } from "@/features/marketplace/components/notification-center";
import { getFrequentlyOrderedTogether, getTopRestaurants, getTrendingFoods } from "@/features/marketplace/lib/recommendations";
import {
  calculateDynamicDeliveryFee,
  createMarketplaceOrder,
  getMarketplaceOrders,
  getMarketplacePreferences,
  marketplaceChangedEvent,
  parseDistanceKm,
  seedMarketplaceOrders,
  setMarketplacePreferences
} from "@/features/marketplace/lib/workflow";
import type { MarketplaceOrder } from "@/features/marketplace/types";
import {
  getRestaurantOperatingStatuses,
  restaurantOperatingStatusChangedEvent,
  type RestaurantOperatingStatus
} from "@/features/restaurant/lib/restaurant-operating-status";
import type {
  CustomerDashboardView,
  CustomerMenuItem,
  CustomerOrder,
  CustomerProfile,
  CustomerRestaurant,
  FoodDiscoveryCategory,
  OrderStatus
} from "@/features/customer/types";
import { cn } from "@/lib/utils";

interface CartLine {
  item: CustomerMenuItem;
  restaurant: CustomerRestaurant;
  quantity: number;
}

interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  deliveryDistanceKm: number;
  platformFee: number;
  tax: number;
  total: number;
}

type RatingFilter = "all" | "4.0" | "4.5";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const viewItems: Array<{ id: CustomerDashboardView; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "restaurants", label: "Restaurants", icon: Store },
  { id: "checkout", label: "Cart", icon: ShoppingCart },
  { id: "orders", label: "Orders", icon: History },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "profile", label: "Profile", icon: User }
];

const orderFlow: Array<{ status: OrderStatus; label: string }> = [
  { status: "PLACED", label: "Placed" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
  { status: "ASSIGNED", label: "Assigned" },
  { status: "PICKED_UP", label: "Picked up" },
  { status: "DELIVERED", label: "Delivered" }
];

const ratingFilters: Array<{ value: RatingFilter; label: string }> = [
  { value: "all", label: "All ratings" },
  { value: "4.0", label: "4.0+" },
  { value: "4.5", label: "4.5+" }
];

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getStatusIndex(status: OrderStatus) {
  return orderFlow.findIndex((step) => step.status === status);
}

export function CustomerDashboard() {
  const { data, isLoading } = useCustomerDashboardData();
  const [activeView, setActiveView] = useState<CustomerDashboardView>("home");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("urban-tandoor");
  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [menuCategory, setMenuCategory] = useState("All");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [wishlistItemIds, setWishlistItemIds] = useState<string[]>([]);
  const [workflowOrders, setWorkflowOrders] = useState<MarketplaceOrder[]>([]);
  const [operatingStatusOverrides, setOperatingStatusOverrides] = useState<Record<string, RestaurantOperatingStatus>>({});

  useEffect(() => {
    function syncOperatingStatuses() {
      setOperatingStatusOverrides(getRestaurantOperatingStatuses());
    }

    syncOperatingStatuses();
    window.addEventListener("storage", syncOperatingStatuses);
    window.addEventListener(restaurantOperatingStatusChangedEvent, syncOperatingStatuses);

    return () => {
      window.removeEventListener("storage", syncOperatingStatuses);
      window.removeEventListener(restaurantOperatingStatusChangedEvent, syncOperatingStatuses);
    };
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    const dashboardData = data;
    seedMarketplaceOrders(
      dashboardData.orders.map((order) => customerOrderToMarketplaceOrder(order, dashboardData.restaurants, dashboardData.profile.fullName))
    );

    function syncMarketplaceState() {
      const preferences = getMarketplacePreferences();
      const defaultFavoriteIds = dashboardData.restaurants.filter((restaurant) => restaurant.isFavorite).map((restaurant) => restaurant.id);
      const favoriteIds = preferences.favoriteRestaurantIds.length > 0 ? preferences.favoriteRestaurantIds : defaultFavoriteIds;

      setWorkflowOrders(getMarketplaceOrders());
      setWishlistItemIds(preferences.wishlistItemIds);
      setFavoriteOverrides(Object.fromEntries(favoriteIds.map((restaurantId) => [restaurantId, true])));
    }

    syncMarketplaceState();
    window.addEventListener("storage", syncMarketplaceState);
    window.addEventListener(marketplaceChangedEvent, syncMarketplaceState);

    return () => {
      window.removeEventListener("storage", syncMarketplaceState);
      window.removeEventListener(marketplaceChangedEvent, syncMarketplaceState);
    };
  }, [data]);

  if (isLoading || !data) {
    return <CustomerDashboardSkeleton />;
  }

  const customerProfile = data.profile;
  const restaurants = data.restaurants.map((restaurant) => ({
    ...restaurant,
    isOpen: (operatingStatusOverrides[restaurant.id] ?? (restaurant.isOpen ? "OPEN" : "CLOSED")) === "OPEN"
  }));

  if (restaurants.length === 0) {
    return <EmptyState icon={Store} title="No restaurants available" description="FairEats partners will appear here when your marketplace data is ready." />;
  }

  const firstRestaurant = restaurants[0];

  if (!firstRestaurant) {
    return <EmptyState icon={Store} title="No restaurants available" description="FairEats partners will appear here when your marketplace data is ready." />;
  }

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? firstRestaurant;

  const cuisines = ["All", ...Array.from(new Set(restaurants.map((restaurant) => restaurant.cuisine)))];
  const categories = ["All", ...Array.from(new Set(restaurants.map((restaurant) => restaurant.category)))];
  const menuCategories = ["All", ...Array.from(new Set(selectedRestaurant.menu.map((item) => item.category)))];

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [restaurant.name, restaurant.cuisine, restaurant.category, restaurant.address, ...restaurant.tags].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );
    const matchesCuisine = cuisineFilter === "All" || restaurant.cuisine === cuisineFilter;
    const matchesCategory = categoryFilter === "All" || restaurant.category === categoryFilter;
    const matchesRating = ratingFilter === "all" || restaurant.rating >= Number(ratingFilter);

    return matchesSearch && matchesCuisine && matchesCategory && matchesRating;
  });

  const customerOrders = mergeCustomerOrders(data.orders, workflowOrders);
  const activeOrders = customerOrders.filter((order) => order.status !== "DELIVERED");
  const activeOrder = activeOrders[0] ?? customerOrders[0];
  const favoriteRestaurants = restaurants.filter((restaurant) => favoriteOverrides[restaurant.id] ?? restaurant.isFavorite);
  const trendingFoods = getTrendingFoods(restaurants, workflowOrders);
  const topRestaurants = getTopRestaurants(restaurants, workflowOrders);
  const selectedMenuItems = selectedRestaurant.menu.filter((item) => menuCategory === "All" || item.category === menuCategory);

  const cartLines: CartLine[] = [];
  for (const restaurant of restaurants) {
    for (const item of restaurant.menu) {
      const quantity = cartItems[item.id] ?? 0;
      if (quantity > 0) {
        cartLines.push({ item, restaurant, quantity });
      }
    }
  }

  const subtotal = cartLines.reduce((total, line) => total + line.item.price * line.quantity, 0);
  const cartSourceRestaurant = cartLines[0]?.restaurant;
  const deliveryDistanceKm = cartSourceRestaurant ? parseDistanceKm(cartSourceRestaurant.distance) : 0;
  const deliveryFee = cartLines.length === 0 ? 0 : calculateDynamicDeliveryFee(deliveryDistanceKm);
  const platformFee = cartLines.length === 0 ? 0 : 12;
  const tax = Math.round(subtotal * 0.05);
  const cartSummary: CartSummary = {
    subtotal,
    deliveryFee,
    deliveryDistanceKm,
    platformFee,
    tax,
    total: subtotal + deliveryFee + platformFee + tax
  };
  const frequentlyTogether = getFrequentlyOrderedTogether(
    restaurants,
    cartLines.map((line) => line.item.id)
  );
  const wishlistItems = restaurants.flatMap((restaurant) =>
    restaurant.menu.filter((item) => wishlistItemIds.includes(item.id)).map((item) => ({ item, restaurant }))
  );
  const cartHasUnavailableRestaurant = cartLines.some((line) => !line.restaurant.isOpen);

  function isFavorite(restaurant: CustomerRestaurant) {
    return favoriteOverrides[restaurant.id] ?? restaurant.isFavorite;
  }

  function openRestaurant(restaurantId: string) {
    setSelectedRestaurantId(restaurantId);
    setMenuCategory("All");
    setActiveView("restaurants");
  }

  function toggleFavorite(restaurant: CustomerRestaurant) {
    const nextValue = !isFavorite(restaurant);
    const preferences = getMarketplacePreferences();
    const favoriteRestaurantIds = nextValue
      ? Array.from(new Set([...preferences.favoriteRestaurantIds, restaurant.id]))
      : preferences.favoriteRestaurantIds.filter((restaurantId) => restaurantId !== restaurant.id);

    setMarketplacePreferences({ ...preferences, favoriteRestaurantIds });
    setFavoriteOverrides((current) => ({
      ...current,
      [restaurant.id]: nextValue
    }));
  }

  function isWishlisted(itemId: string) {
    return wishlistItemIds.includes(itemId);
  }

  function toggleWishlist(itemId: string) {
    const preferences = getMarketplacePreferences();
    const wishlistItemIds = preferences.wishlistItemIds.includes(itemId)
      ? preferences.wishlistItemIds.filter((id) => id !== itemId)
      : [...preferences.wishlistItemIds, itemId];

    setMarketplacePreferences({ ...preferences, wishlistItemIds });
    setWishlistItemIds(wishlistItemIds);
  }

  function addItem(item: CustomerMenuItem, restaurant: CustomerRestaurant) {
    if (!restaurant.isOpen) {
      toast.error(`${restaurant.name} is currently unavailable.`);
      return;
    }

    setCartItems((current) => {
      const hasDifferentRestaurantItem = Object.entries(current).some(([itemId, quantity]) => {
        if (quantity <= 0) {
          return false;
        }

        return !restaurant.menu.some((menuItem) => menuItem.id === itemId);
      });

      if (hasDifferentRestaurantItem) {
        return { [item.id]: 1 };
      }

      return {
        ...current,
        [item.id]: (current[item.id] ?? 0) + 1
      };
    });
  }

  function updateCartQuantity(itemId: string, delta: number) {
    setCartItems((current) => {
      const next = { ...current };
      const nextQuantity = (next[itemId] ?? 0) + delta;

      if (nextQuantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = nextQuantity;
      }

      return next;
    });
  }

  function clearCart() {
    setCartItems({});
  }

  function placeOrder() {
    const restaurant = cartLines[0]?.restaurant;

    if (!restaurant || cartLines.length === 0) {
      toast.error("Add items before placing an order.");
      return;
    }

    const order = createMarketplaceOrder({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      customerName: customerProfile.fullName,
      deliveryPartnerName: "Assigning soon",
      address: customerProfile.defaultAddress,
      distanceKm: cartSummary.deliveryDistanceKm,
      eta: restaurant.eta,
      subtotal: cartSummary.subtotal,
      deliveryFee: cartSummary.deliveryFee,
      platformFee: cartSummary.platformFee,
      tax: cartSummary.tax,
      total: cartSummary.total,
      items: cartLines.map((line) => ({
        id: line.item.id,
        name: line.item.name,
        quantity: line.quantity,
        price: line.item.price
      }))
    });

    setWorkflowOrders(getMarketplaceOrders());
    clearCart();
    setActiveView("orders");
    toast.success(`${order.id} placed. Restaurant received the order.`);
  }

  return (
    <div className="space-y-6">
      <ViewSwitcher activeView={activeView} onChange={setActiveView} cartCount={cartLines.reduce((total, line) => total + line.quantity, 0)} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <m.div key={activeView} {...fadeInUp} className="min-w-0 space-y-6">
          {activeView === "home" ? (
            <HomeView
              profile={data.profile}
              restaurants={restaurants}
              activeOrder={activeOrder}
              activeOrderCount={activeOrders.length}
              favoriteCount={favoriteRestaurants.length}
              trendingRestaurants={topRestaurants.map((entry) => entry.restaurant)}
              popularItems={trendingFoods.map((entry) => ({ item: entry.item, restaurant: entry.restaurant }))}
              onOpenRestaurant={openRestaurant}
              onAddItem={addItem}
              onViewOrders={() => setActiveView("orders")}
            />
          ) : null}

          {activeView === "restaurants" ? (
            <RestaurantsView
              restaurants={filteredRestaurants}
              allRestaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              selectedMenuItems={selectedMenuItems}
              cuisines={cuisines}
              categories={categories}
              menuCategories={menuCategories}
              searchTerm={searchTerm}
              cuisineFilter={cuisineFilter}
              categoryFilter={categoryFilter}
              ratingFilter={ratingFilter}
              menuCategory={menuCategory}
              isFavorite={isFavorite}
              onSearchChange={setSearchTerm}
              onCuisineChange={setCuisineFilter}
              onCategoryChange={setCategoryFilter}
              onRatingChange={setRatingFilter}
              onMenuCategoryChange={setMenuCategory}
              onSelectRestaurant={openRestaurant}
              onToggleFavorite={toggleFavorite}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
              onAddItem={addItem}
            />
          ) : null}

          {activeView === "checkout" ? (
            <CheckoutView
              profile={data.profile}
              cartLines={cartLines}
              cartSummary={cartSummary}
              hasUnavailableRestaurant={cartHasUnavailableRestaurant}
              frequentlyTogether={frequentlyTogether}
              onAddRecommended={addItem}
              onClearCart={clearCart}
              onPlaceOrder={placeOrder}
            />
          ) : null}

          {activeView === "orders" ? <OrdersView orders={customerOrders} /> : null}

          {activeView === "favorites" ? (
            <FavoritesView
              favoriteRestaurants={favoriteRestaurants}
              wishlistItems={wishlistItems}
              isFavorite={isFavorite}
              onOpenRestaurant={openRestaurant}
              onToggleFavorite={toggleFavorite}
              onAddItem={addItem}
              onToggleWishlist={toggleWishlist}
            />
          ) : null}

          {activeView === "profile" ? <ProfileView profile={data.profile} /> : null}
        </m.div>

        <div className="space-y-6">
          <CartPanel
            cartLines={cartLines}
            cartSummary={cartSummary}
            hasUnavailableRestaurant={cartHasUnavailableRestaurant}
            onUpdateQuantity={updateCartQuantity}
            onCheckout={() => setActiveView("checkout")}
            onClearCart={clearCart}
          />
          <NotificationCenter role="CUSTOMER" compact />
          <LiveActivityFeed limit={4} />
        </div>
      </div>
    </div>
  );
}

function ViewSwitcher({
  activeView,
  cartCount,
  onChange
}: {
  activeView: CustomerDashboardView;
  cartCount: number;
  onChange: (view: CustomerDashboardView) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 shadow-sm" aria-label="Customer dashboard">
      {viewItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.id === "checkout" && cartCount > 0 ? (
              <span
                className={cn(
                  "ml-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px]",
                  isActive ? "bg-white/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {cartCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function HomeView({
  profile,
  restaurants,
  activeOrder,
  activeOrderCount,
  favoriteCount,
  trendingRestaurants,
  popularItems,
  onOpenRestaurant,
  onAddItem,
  onViewOrders
}: {
  profile: CustomerProfile;
  restaurants: CustomerRestaurant[];
  activeOrder: CustomerOrder | undefined;
  activeOrderCount: number;
  favoriteCount: number;
  trendingRestaurants: CustomerRestaurant[];
  popularItems: Array<{ item: CustomerMenuItem; restaurant: CustomerRestaurant }>;
  onOpenRestaurant: (restaurantId: string) => void;
  onAddItem: (item: CustomerMenuItem, restaurant: CustomerRestaurant) => void;
  onViewOrders: () => void;
}) {
  const [currentHour] = useState(() => new Date().getHours());
  const timeSuggestion = getTimeBasedFoodSuggestion(currentHour);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<FoodDiscoveryCategory>(timeSuggestion.category);
  const categoryItems = getCategoryFoodItems(restaurants, selectedFoodCategory);
  const metrics = [
    { label: "Open restaurants", value: restaurants.filter((restaurant) => restaurant.isOpen).length.toString(), detail: "Live near you", icon: Store },
    { label: "Active orders", value: activeOrderCount.toString(), detail: "Tracked in real time", icon: PackageCheck },
    { label: "Favorites", value: favoriteCount.toString(), detail: "Saved partners", icon: Heart },
    { label: "Fairness credits", value: formatCurrency(profile.fairnessCredits), detail: "Ready to use", icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6">
      <TimeAwareFoodHero
        profile={profile}
        suggestion={timeSuggestion}
        items={getCategoryFoodItems(restaurants, timeSuggestion.category)}
        onChooseCategory={setSelectedFoodCategory}
        onOpenRestaurant={onOpenRestaurant}
      />

      <FoodCategoryBrowser
        selectedCategory={selectedFoodCategory}
        items={categoryItems}
        onSelectCategory={setSelectedFoodCategory}
        onAddItem={onAddItem}
        onOpenRestaurant={onOpenRestaurant}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricTile key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1fr)]">
        <Card className="overflow-hidden border-primary/20 bg-card">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Good afternoon, {profile.fullName.split(" ")[0]}</CardTitle>
                <CardDescription>{profile.defaultAddress}</CardDescription>
              </div>
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {profile.loyaltyPoints.toLocaleString("en-IN")} points
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {["Transparent pricing", "Priority support", "RLS secured"].map((label) => (
                <div key={label} className="rounded-lg border bg-background p-3 text-sm font-medium">
                  {label}
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Recommended dinner window</p>
                  <p className="mt-1 text-sm text-muted-foreground">Fastest delivery demand is predicted between 7:15 PM and 8:00 PM.</p>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    onOpenRestaurant(
                      trendingRestaurants.find((restaurant) => restaurant.isOpen)?.id ?? restaurants.find((restaurant) => restaurant.isOpen)?.id ?? restaurants[0]?.id ?? "urban-tandoor"
                    )
                  }
                >
                  Browse picks
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeOrder ? <ActiveOrderPanel order={activeOrder} onViewOrders={onViewOrders} /> : null}
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Trending restaurants"
          title="High rated partners near you"
          description="Restaurants with strong customer ratings, low cancellation rates, and fair courier handoff times."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trendingRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={restaurant.isFavorite}
              onSelect={() => onOpenRestaurant(restaurant.id)}
              onToggleFavorite={() => undefined}
              compact
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Quick add" title="Popular menu items" description="High-repeat items from restaurants currently accepting orders." />
        <div className="grid gap-3 md:grid-cols-2">
          {popularItems.slice(0, 6).map(({ item, restaurant }) => (
            <MenuItemRow key={item.id} item={item} restaurant={restaurant} quantity={0} onAdd={() => onAddItem(item, restaurant)} onUpdateQuantity={() => undefined} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TimeAwareFoodHero({
  profile,
  suggestion,
  items,
  onChooseCategory,
  onOpenRestaurant
}: {
  profile: CustomerProfile;
  suggestion: ReturnType<typeof getTimeBasedFoodSuggestion>;
  items: Array<{ item: CustomerMenuItem; restaurant: CustomerRestaurant }>;
  onChooseCategory: (category: FoodDiscoveryCategory) => void;
  onOpenRestaurant: (restaurantId: string) => void;
}) {
  const featured = items.find(({ restaurant }) => restaurant.isOpen) ?? items[0];
  const media = featured ? getFoodMedia(featured.item) : getFoodMedia({ name: suggestion.category, category: suggestion.category });
  const firstName = profile.fullName.split(" ")[0] ?? "there";

  return (
    <section className="relative min-h-[330px] overflow-hidden rounded-lg border bg-foreground text-white">
      <Image
        src={media.src}
        alt={featured ? `${featured.item.name} from ${featured.restaurant.name}` : suggestion.category}
        fill
        priority
        sizes="(min-width: 1280px) 70vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex min-h-[330px] flex-col justify-between p-6 sm:p-8">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-white/70">{suggestion.eyebrow}</p>
          <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-[0.98] tracking-normal sm:text-5xl">
            {firstName}, {suggestion.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 sm:text-base">{suggestion.description}</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="button" className="bg-white text-foreground hover:bg-white/85" onClick={() => onChooseCategory(suggestion.category)}>
            Explore {suggestion.category}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {featured ? (
            <Button
              type="button"
              variant="outline"
              className="border-white/40 bg-black/15 text-white hover:bg-white hover:text-foreground"
              onClick={() => onOpenRestaurant(featured.restaurant.id)}
            >
              {featured.restaurant.name}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FoodCategoryBrowser({
  selectedCategory,
  items,
  onSelectCategory,
  onAddItem,
  onOpenRestaurant
}: {
  selectedCategory: FoodDiscoveryCategory;
  items: Array<{ item: CustomerMenuItem; restaurant: CustomerRestaurant }>;
  onSelectCategory: (category: FoodDiscoveryCategory) => void;
  onAddItem: (item: CustomerMenuItem, restaurant: CustomerRestaurant) => void;
  onOpenRestaurant: (restaurantId: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function selectCategory(category: FoodDiscoveryCategory) {
    onSelectCategory(category);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
  }

  function moveRail(direction: number) {
    railRef.current?.scrollBy({ left: direction * 620, behavior: "smooth" });
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Explore by appetite</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">Order our best food options</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a category to see matching dishes from every FairEats restaurant.</p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <IconButton label="Previous food categories" onClick={() => moveRail(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
          <IconButton label="Next food categories" onClick={() => moveRail(1)}>
            <ArrowRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div ref={railRef} className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
        {foodDiscoveryCategories.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => selectCategory(category.id)}
              className={cn(
                "group w-[174px] shrink-0 snap-start rounded-lg border p-2 text-center transition-all",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:-translate-y-1 hover:border-foreground/35"
              )}
            >
              <span
                aria-hidden="true"
                className="mx-auto block h-[146px] w-[158px] rounded-md bg-[#FFFDF6] bg-no-repeat"
                style={{
                  backgroundImage: "url('/images/foods/category-atlas.png')",
                  backgroundPosition: `-${category.spriteX}px -${category.spriteY}px`,
                  backgroundSize: "1748px 551px"
                }}
              />
              <span className="mt-3 block min-h-10 text-sm font-semibold">{category.id}</span>
            </button>
          );
        })}
      </div>

      <div ref={resultsRef} className="border-t pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Selected / {selectedCategory}</p>
            <h3 className="mt-2 text-2xl font-bold">{items.length} dishes across FairEats</h3>
          </div>
          <Badge variant="secondary">{new Set(items.map(({ restaurant }) => restaurant.id)).size} restaurants</Badge>
        </div>

        {items.length > 0 ? (
          <div className="mt-5 grid gap-4 2xl:grid-cols-2">
            {items.map(({ item, restaurant }) => (
              <div key={item.id} className="min-w-0">
                <MenuItemRow
                  item={item}
                  restaurant={restaurant}
                  quantity={0}
                  onAdd={() => onAddItem(item, restaurant)}
                  onUpdateQuantity={() => undefined}
                />
                <button type="button" onClick={() => onOpenRestaurant(restaurant.id)} className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  View all from {restaurant.name}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} title={`No ${selectedCategory} dishes available`} description="Try another category while restaurants update their menus." compact />
        )}
      </div>
    </section>
  );
}

function RestaurantsView({
  restaurants,
  allRestaurants,
  selectedRestaurant,
  selectedMenuItems,
  cuisines,
  categories,
  menuCategories,
  searchTerm,
  cuisineFilter,
  categoryFilter,
  ratingFilter,
  menuCategory,
  isFavorite,
  onSearchChange,
  onCuisineChange,
  onCategoryChange,
  onRatingChange,
  onMenuCategoryChange,
  onSelectRestaurant,
  onToggleFavorite,
  isWishlisted,
  onToggleWishlist,
  onAddItem
}: {
  restaurants: CustomerRestaurant[];
  allRestaurants: CustomerRestaurant[];
  selectedRestaurant: CustomerRestaurant;
  selectedMenuItems: CustomerMenuItem[];
  cuisines: string[];
  categories: string[];
  menuCategories: string[];
  searchTerm: string;
  cuisineFilter: string;
  categoryFilter: string;
  ratingFilter: RatingFilter;
  menuCategory: string;
  isFavorite: (restaurant: CustomerRestaurant) => boolean;
  onSearchChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRatingChange: (value: RatingFilter) => void;
  onMenuCategoryChange: (value: string) => void;
  onSelectRestaurant: (restaurantId: string) => void;
  onToggleFavorite: (restaurant: CustomerRestaurant) => void;
  isWishlisted: (itemId: string) => boolean;
  onToggleWishlist: (itemId: string) => void;
  onAddItem: (item: CustomerMenuItem, restaurant: CustomerRestaurant) => void;
}) {
  return (
    <div className="space-y-6">
      <FilterToolbar
        searchTerm={searchTerm}
        cuisines={cuisines}
        categories={categories}
        cuisineFilter={cuisineFilter}
        categoryFilter={categoryFilter}
        ratingFilter={ratingFilter}
        onSearchChange={onSearchChange}
        onCuisineChange={onCuisineChange}
        onCategoryChange={onCategoryChange}
        onRatingChange={onRatingChange}
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow={`${restaurants.length} of ${allRestaurants.length} partners`}
            title="Restaurant listing"
            description="Search by restaurant, cuisine, location, or delivery category."
          />
          {restaurants.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={isFavorite(restaurant)}
                  isSelected={restaurant.id === selectedRestaurant.id}
                  onSelect={() => onSelectRestaurant(restaurant.id)}
                  onToggleFavorite={() => onToggleFavorite(restaurant)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="No restaurants match" description="Try another cuisine, category, or rating filter." />
          )}
        </div>

        <RestaurantDetail
          restaurant={selectedRestaurant}
          menuItems={selectedMenuItems}
          menuCategories={menuCategories}
          activeMenuCategory={menuCategory}
          isFavorite={isFavorite(selectedRestaurant)}
          onMenuCategoryChange={onMenuCategoryChange}
          onToggleFavorite={() => onToggleFavorite(selectedRestaurant)}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAddItem={(item) => onAddItem(item, selectedRestaurant)}
        />
      </section>
    </div>
  );
}

function FilterToolbar({
  searchTerm,
  cuisines,
  categories,
  cuisineFilter,
  categoryFilter,
  ratingFilter,
  onSearchChange,
  onCuisineChange,
  onCategoryChange,
  onRatingChange
}: {
  searchTerm: string;
  cuisines: string[];
  categories: string[];
  cuisineFilter: string;
  categoryFilter: string;
  ratingFilter: RatingFilter;
  onSearchChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRatingChange: (value: RatingFilter) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Browse restaurants
            </CardTitle>
            <CardDescription>Live demo data with search, cuisine, category, and rating filters.</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Flame className="h-3.5 w-3.5 text-secondary" />
            Trending ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 pl-9"
            placeholder="Search restaurants, cuisine, location..."
          />
        </div>

        <FilterPillGroup label="Cuisine" values={cuisines} activeValue={cuisineFilter} onChange={onCuisineChange} />
        <FilterPillGroup label="Category" values={categories} activeValue={categoryFilter} onChange={onCategoryChange} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase text-muted-foreground">Ratings</span>
          {ratingFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onRatingChange(filter.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                ratingFilter === filter.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterPillGroup({ label, values, activeValue, onChange }: { label: string; values: string[]; activeValue: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            activeValue === value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function RestaurantCard({
  restaurant,
  isFavorite,
  isSelected = false,
  compact = false,
  onSelect,
  onToggleFavorite
}: {
  restaurant: CustomerRestaurant;
  isFavorite: boolean;
  isSelected?: boolean;
  compact?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const media = getRestaurantFoodMedia(restaurant);

  return (
    <m.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors",
          isSelected && "border-primary bg-primary/5",
          !restaurant.isOpen && "bg-muted/40"
        )}
      >
        <button type="button" onClick={onSelect} className="group relative block aspect-[16/8] w-full overflow-hidden bg-muted text-left">
          <Image
            src={media.src}
            alt={`Popular food from ${restaurant.name}`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-105", !restaurant.isOpen && "grayscale")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-lg font-bold">{restaurant.name}</p>
            <p className="mt-1 text-sm text-white/80">{restaurant.cuisine} · {restaurant.distance}</p>
          </div>
        </button>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold">{restaurant.name}</h3>
                {restaurant.isTrending ? (
                  <Badge className="gap-1 bg-secondary text-secondary-foreground">
                    <Flame className="h-3 w-3" />
                    Hot
                  </Badge>
                ) : null}
                <Badge className={cn(restaurant.isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {restaurant.isOpen ? "Open" : "Unavailable"}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{restaurant.description}</p>
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors",
                isFavorite ? "border-rose-200 bg-rose-50 text-rose-600" : "bg-background text-muted-foreground hover:text-foreground"
              )}
              aria-label={isFavorite ? `Remove ${restaurant.name} from favorites` : `Add ${restaurant.name} to favorites`}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <InfoChip icon={Star} label={restaurant.rating.toFixed(1)} strong />
            <InfoChip icon={Clock3} label={restaurant.isOpen ? restaurant.eta : "Unavailable"} />
            <InfoChip icon={Bike} label={restaurant.deliveryFee === 0 ? "Free" : formatCurrency(restaurant.deliveryFee)} />
            <InfoChip icon={ShieldCheck} label={`${restaurant.fairnessScore}% fair`} />
          </div>

          {!compact ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {[restaurant.cuisine, restaurant.priceLevel, ...restaurant.tags.slice(0, 2)].map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </m.div>
  );
}

function RestaurantDetail({
  restaurant,
  menuItems,
  menuCategories,
  activeMenuCategory,
  isFavorite,
  onMenuCategoryChange,
  onToggleFavorite,
  isWishlisted,
  onToggleWishlist,
  onAddItem
}: {
  restaurant: CustomerRestaurant;
  menuItems: CustomerMenuItem[];
  menuCategories: string[];
  activeMenuCategory: string;
  isFavorite: boolean;
  onMenuCategoryChange: (category: string) => void;
  onToggleFavorite: () => void;
  isWishlisted: (itemId: string) => boolean;
  onToggleWishlist: (itemId: string) => void;
  onAddItem: (item: CustomerMenuItem) => void;
}) {
  const restaurantMedia = getRestaurantFoodMedia(restaurant);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/5] min-h-44 overflow-hidden bg-muted">
        <Image
          src={restaurantMedia.src}
          alt={`Featured dishes from ${restaurant.name}`}
          fill
          sizes="(min-width: 1280px) 65vw, 100vw"
          className={cn("object-cover", !restaurant.isOpen && "grayscale")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5 text-white">
          <p className="text-2xl font-bold">{restaurant.name}</p>
          <p className="mt-1 text-sm text-white/80">{restaurant.cuisine} · {restaurant.category} · {restaurant.distance}</p>
        </div>
      </div>
      <CardHeader className="border-b bg-primary/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Badge className="w-fit gap-1 bg-primary text-primary-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {restaurant.fairnessScore}% fairness score
            </Badge>
            <Badge className={cn("w-fit", restaurant.isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {restaurant.isOpen ? "Accepting orders" : "Currently unavailable"}
            </Badge>
            <div>
              <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
              <CardDescription className="mt-1">{restaurant.description}</CardDescription>
            </div>
          </div>
          <Button type="button" variant={isFavorite ? "secondary" : "outline"} onClick={onToggleFavorite}>
            <Heart className={cn("mr-2 h-4 w-4", isFavorite && "fill-current")} />
            Favorite
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile icon={Star} label="Rating" value={`${restaurant.rating.toFixed(1)} (${restaurant.reviewCount.toLocaleString("en-IN")})`} />
          <InfoTile icon={Clock3} label="Delivery" value={restaurant.isOpen ? restaurant.eta : "Unavailable"} />
          <InfoTile icon={Bike} label="Fee" value={formatCurrency(restaurant.deliveryFee)} />
          <InfoTile icon={MapPin} label="Distance" value={restaurant.distance} />
        </div>

        {!restaurant.isOpen ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="font-semibold text-destructive">This restaurant is currently unavailable.</p>
            <p className="mt-1 text-sm text-muted-foreground">You can browse the menu, but ordering is disabled until the restaurant opens again.</p>
          </div>
        ) : null}

        <div className="rounded-lg border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{restaurant.promotion}</p>
              <p className="mt-1 text-sm text-muted-foreground">{restaurant.address}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <BadgePercent className="h-3.5 w-3.5" />
              Fair deal
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {menuCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onMenuCategoryChange(category)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                activeMenuCategory === category ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {menuItems.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              restaurant={restaurant}
              quantity={0}
              isWishlisted={isWishlisted(item.id)}
              onAdd={() => onAddItem(item)}
              onUpdateQuantity={() => undefined}
              onToggleWishlist={() => onToggleWishlist(item.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MenuItemRow({
  item,
  restaurant,
  quantity,
  isWishlisted = false,
  onAdd,
  onUpdateQuantity,
  onToggleWishlist
}: {
  item: CustomerMenuItem;
  restaurant: CustomerRestaurant;
  quantity: number;
  isWishlisted?: boolean;
  onAdd: () => void;
  onUpdateQuantity: (delta: number) => void;
  onToggleWishlist?: () => void;
}) {
  const canOrder = restaurant.isOpen;
  const media = getFoodMedia(item);

  return (
    <m.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        "grid overflow-hidden rounded-lg border bg-card shadow-sm sm:grid-cols-[132px_minmax(0,1fr)_auto]",
        !canOrder && "bg-muted/40"
      )}
    >
      <div className="relative aspect-[16/9] min-h-28 overflow-hidden bg-muted sm:aspect-auto sm:h-full">
        <Image
          src={media.src}
          alt={`${item.name} from ${restaurant.name}`}
          fill
          sizes="(min-width: 640px) 132px, 100vw"
          className={cn("object-cover transition-transform duration-500 hover:scale-105", !canOrder && "grayscale")}
        />
        <Badge className="absolute bottom-2 left-2 border-white/30 bg-black/55 text-white backdrop-blur-sm hover:bg-black/55">{item.category}</Badge>
      </div>

      <div className="min-w-0 space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("h-3 w-3 rounded-sm border", item.isVeg ? "border-success bg-success" : "border-destructive bg-destructive")} />
          <h4 className="font-semibold">{item.name}</h4>
          {item.isPopular ? <Badge variant="secondary">Bestseller</Badge> : null}
          <Badge variant="outline">{restaurant.name}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-secondary" />
            {item.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {item.prepTime}
          </span>
          <span>{item.calories} kcal</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t p-4 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0">
        <div className="flex items-center gap-2">
          {onToggleWishlist ? (
            <IconButton label={isWishlisted ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`} onClick={onToggleWishlist}>
              <Bookmark className={cn("h-4 w-4", isWishlisted && "fill-current text-primary")} />
            </IconButton>
          ) : null}
          <p className="text-lg font-bold">{formatCurrency(item.price)}</p>
        </div>
        {quantity > 0 ? (
          <div className="flex items-center gap-2 rounded-md border bg-background p-1">
            <IconButton label={`Remove one ${item.name}`} onClick={() => onUpdateQuantity(-1)}>
              <Minus className="h-4 w-4" />
            </IconButton>
            <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
            <IconButton label={`Add one ${item.name}`} onClick={() => onUpdateQuantity(1)}>
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        ) : (
          <Button type="button" size="sm" onClick={onAdd} disabled={!canOrder}>
            <Plus className="mr-2 h-4 w-4" />
            {canOrder ? "Add" : "Unavailable"}
          </Button>
        )}
      </div>
    </m.div>
  );
}

function CartPanel({
  cartLines,
  cartSummary,
  hasUnavailableRestaurant,
  onUpdateQuantity,
  onCheckout,
  onClearCart
}: {
  cartLines: CartLine[];
  cartSummary: CartSummary;
  hasUnavailableRestaurant: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}) {
  return (
    <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart
              </CardTitle>
              <CardDescription>{cartLines.length > 0 ? `${cartLines.length} item type${cartLines.length === 1 ? "" : "s"} selected` : "Ready for your next order"}</CardDescription>
            </div>
            {cartLines.length > 0 ? (
              <IconButton label="Clear cart" onClick={onClearCart}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {cartLines.length > 0 ? (
            <>
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.item.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image src={getFoodMedia(line.item).src} alt="" fill sizes="48px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{line.item.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{line.restaurant.name}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(line.item.price * line.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{formatCurrency(line.item.price)} each</p>
                      <div className="flex items-center gap-2">
                        <IconButton label={`Remove one ${line.item.name}`} onClick={() => onUpdateQuantity(line.item.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </IconButton>
                        <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                        <IconButton label={`Add one ${line.item.name}`} onClick={() => onUpdateQuantity(line.item.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PriceSummary cartSummary={cartSummary} />
              {hasUnavailableRestaurant ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  One restaurant in this cart is currently unavailable.
                </div>
              ) : null}
              <Button type="button" className="w-full" onClick={onCheckout} disabled={hasUnavailableRestaurant}>
                {hasUnavailableRestaurant ? "Checkout unavailable" : "Go to checkout"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <EmptyState icon={ShoppingBag} title="Cart is empty" description="Add items from a restaurant to prepare checkout." compact />
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function CheckoutView({
  profile,
  cartLines,
  cartSummary,
  hasUnavailableRestaurant,
  frequentlyTogether,
  onAddRecommended,
  onClearCart,
  onPlaceOrder
}: {
  profile: CustomerProfile;
  cartLines: CartLine[];
  cartSummary: CartSummary;
  hasUnavailableRestaurant: boolean;
  frequentlyTogether: Array<{ item: CustomerMenuItem; restaurant: CustomerRestaurant; confidence: number }>;
  onAddRecommended: (item: CustomerMenuItem, restaurant: CustomerRestaurant) => void;
  onClearCart: () => void;
  onPlaceOrder: () => void;
}) {
  if (cartLines.length === 0) {
    return <EmptyState icon={ShoppingCart} title="Checkout is waiting" description="Your cart is empty. Browse restaurants and add a meal to continue." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>Confirm delivery details, payment method, and fair-fee breakdown.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Deliver to</p>
                <p className="mt-1 text-sm text-muted-foreground">{profile.defaultAddress}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {profile.paymentMethods.slice(0, 2).map((method) => (
              <label key={method} className="flex items-center gap-3 rounded-lg border bg-background p-4">
                <input type="radio" name="payment-method" defaultChecked={method === profile.paymentMethods[0]} className="h-4 w-4 accent-primary" />
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{method}</span>
              </label>
            ))}
          </div>

          <div className="rounded-lg border bg-primary/5 p-4">
            <p className="font-semibold">Order flow preview</p>
            <OrderTimeline status="PLACED" />
          </div>

          {hasUnavailableRestaurant ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">A restaurant in your cart is currently unavailable.</p>
              <p className="mt-1 text-sm text-muted-foreground">Remove unavailable items or wait until the restaurant opens again.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
          <CardDescription>{cartLines[0]?.restaurant.name ?? "FairEats partner"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {cartLines.map((line) => (
              <div key={line.item.id} className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3 text-sm">
                <div className="flex min-w-0 gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={getFoodMedia(line.item).src} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold">{line.item.name}</p>
                    <p className="mt-1 text-muted-foreground">Qty {line.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(line.item.price * line.quantity)}</p>
              </div>
            ))}
          </div>
          <PriceSummary cartSummary={cartSummary} />
          {frequentlyTogether.length > 0 ? (
            <div className="rounded-lg border bg-background p-3">
              <p className="font-semibold">Frequently ordered together</p>
              <div className="mt-3 space-y-2">
                {frequentlyTogether.map(({ item, restaurant, confidence }) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border bg-card p-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={getFoodMedia(item).src} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{confidence}% match · {restaurant.name}</p>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => onAddRecommended(item, restaurant)}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Button type="button" onClick={onPlaceOrder} disabled={hasUnavailableRestaurant}>
              {hasUnavailableRestaurant ? "Order unavailable" : "Place demo order"}
              <PackageCheck className="ml-2 h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={onClearCart}>
              Clear cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersView({ orders }: { orders: CustomerOrder[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Order history" title="Track every order stage" description="Placed, accepted, preparing, ready, picked up, and delivered states are mapped for customers." />
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{order.restaurantName}</CardTitle>
                  <CardDescription>
                    {order.id} • {order.placedAt} • {order.items.join(", ")}
                  </CardDescription>
                </div>
                <Badge variant={order.status === "DELIVERED" ? "secondary" : "default"}>{order.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {order.items.map((itemName) => (
                  <div key={itemName} className="flex min-w-48 items-center gap-3 rounded-lg border bg-background p-2">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={getFoodMedia({ name: itemName, category: "" }).src} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">{itemName}</p>
                  </div>
                ))}
              </div>
              <OrderTimeline status={order.status} />
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <InfoTile icon={Bike} label="Courier" value={order.deliveryPartner} />
                <InfoTile icon={Clock3} label="ETA" value={order.eta} />
                <InfoTile icon={CreditCard} label="Total" value={formatCurrency(order.total)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FavoritesView({
  favoriteRestaurants,
  wishlistItems,
  isFavorite,
  onOpenRestaurant,
  onToggleFavorite,
  onAddItem,
  onToggleWishlist
}: {
  favoriteRestaurants: CustomerRestaurant[];
  wishlistItems: Array<{ item: CustomerMenuItem; restaurant: CustomerRestaurant }>;
  isFavorite: (restaurant: CustomerRestaurant) => boolean;
  onOpenRestaurant: (restaurantId: string) => void;
  onToggleFavorite: (restaurant: CustomerRestaurant) => void;
  onAddItem: (item: CustomerMenuItem, restaurant: CustomerRestaurant) => void;
  onToggleWishlist: (itemId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Favorites" title="Saved restaurants" description="Your quickest path back to trusted kitchens and repeat orders." />
      {favoriteRestaurants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favoriteRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={isFavorite(restaurant)}
              onSelect={() => onOpenRestaurant(restaurant.id)}
              onToggleFavorite={() => onToggleFavorite(restaurant)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={Heart} title="No favorites yet" description="Save restaurants from the listing to build your personal shortlist." />
      )}

      <section className="space-y-4">
        <SectionHeader eyebrow="Wishlist" title="Foods saved for later" description="Wishlist items are separate from restaurant favorites for faster repeat ordering." />
        {wishlistItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {wishlistItems.map(({ item, restaurant }) => (
              <MenuItemRow
                key={item.id}
                item={item}
                restaurant={restaurant}
                quantity={0}
                isWishlisted
                onAdd={() => onAddItem(item, restaurant)}
                onUpdateQuantity={() => undefined}
                onToggleWishlist={() => onToggleWishlist(item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={Bookmark} title="No wishlist items yet" description="Save foods from restaurant menus to build a food wishlist." compact />
        )}
      </section>
    </div>
  );
}

function ProfileView({ profile }: { profile: CustomerProfile }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Customer identity, preferences, addresses, and payment readiness.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoTile icon={User} label="Name" value={profile.fullName} />
          <InfoTile icon={CreditCard} label="Email" value={profile.email} />
          <InfoTile icon={MapPin} label="Default address" value={profile.defaultAddress} />
          <InfoTile icon={ShieldCheck} label="Fairness credits" value={formatCurrency(profile.fairnessCredits)} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Saved addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.savedAddresses.map((address) => (
              <div key={address} className="rounded-lg border bg-background p-3 text-sm font-medium">
                {address}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dietary preferences</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.dietaryPreferences.map((preference) => (
              <Badge key={preference} variant="outline">
                {preference}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActiveOrderPanel({ order, onViewOrders }: { order: CustomerOrder; onViewOrders: () => void }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Active order</CardTitle>
            <CardDescription>
              {order.restaurantName} • {order.id}
            </CardDescription>
          </div>
          <Badge>{order.eta}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <OrderTimeline status={order.status} />
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm font-semibold">Courier partner</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.deliveryPartner} is assigned for {order.address}.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onViewOrders}>
          View order history
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  const activeIndex = getStatusIndex(status);

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {orderFlow.map((step, index) => {
        const isComplete = index <= activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <div key={step.status} className="flex items-center gap-2 md:flex-col md:items-start">
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-md border",
                isComplete ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                isCurrent && "ring-2 ring-primary/20"
              )}
            >
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </span>
            <span className={cn("text-xs font-semibold", isComplete ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MetricTile({
  metric,
  index
}: {
  metric: {
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
  };
  index: number;
}) {
  const Icon = metric.icon;

  return (
    <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </CardContent>
      </Card>
    </m.div>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-normal text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-normal">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, strong = false }: { icon: LucideIcon; label: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", strong ? "text-secondary" : "text-muted-foreground")} />
      <span className="truncate text-xs font-semibold">{label}</span>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function PriceSummary({ cartSummary }: { cartSummary: CartSummary }) {
  const rows = [
    ["Subtotal", cartSummary.subtotal],
    ["Delivery fee", cartSummary.deliveryFee],
    ["Platform fee", cartSummary.platformFee],
    ["Taxes", cartSummary.tax]
  ] as const;

  return (
    <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>{label === "Delivery fee" ? `${label} (${cartSummary.deliveryDistanceKm.toFixed(1)} km)` : label}</span>
          <span>{value === 0 && label === "Delivery fee" ? "Free" : formatCurrency(value)}</span>
        </div>
      ))}
      <div className="border-t pt-2">
        <div className="flex items-center justify-between gap-3 font-bold">
          <span>Total</span>
          <span>{formatCurrency(cartSummary.total)}</span>
        </div>
      </div>
    </div>
  );
}

function customerOrderToMarketplaceOrder(order: CustomerOrder, restaurants: CustomerRestaurant[], customerName: string): MarketplaceOrder {
  const restaurant = restaurants.find((item) => item.name === order.restaurantName) ?? restaurants[0];
  const distanceKm = restaurant ? parseDistanceKm(restaurant.distance) : 3;
  const deliveryFee = calculateDynamicDeliveryFee(distanceKm);
  const subtotal = Math.max(0, order.total - deliveryFee - 12);
  const createdAt = new Date().toISOString();

  return {
    id: order.id,
    restaurantId: restaurant?.id ?? "urban-tandoor",
    restaurantName: order.restaurantName,
    customerName,
    deliveryPartnerName: order.deliveryPartner,
    address: order.address,
    distanceKm,
    eta: order.eta,
    subtotal,
    deliveryFee,
    platformFee: 12,
    tax: Math.max(0, order.total - subtotal - deliveryFee - 12),
    total: order.total,
    status: order.status,
    items: order.items.map((itemName, index) => ({
      id: `${order.id}-${index}`,
      name: itemName,
      quantity: 1,
      price: Math.round(subtotal / Math.max(order.items.length, 1))
    })),
    placedAt: order.placedAt,
    updatedAt: createdAt,
    timeline: [
      {
        id: `${order.id}-seed`,
        orderId: order.id,
        status: order.status,
        title: `${order.id} ${order.status.toLowerCase()}`,
        description: `${order.id} is ${order.status.toLowerCase()} at ${order.restaurantName}.`,
        createdAt
      }
    ]
  };
}

function mergeCustomerOrders(seedOrders: CustomerOrder[], workflowOrders: MarketplaceOrder[]): CustomerOrder[] {
  const workflowCustomerOrders: CustomerOrder[] = workflowOrders.map((order) => ({
    id: order.id,
    restaurantName: order.restaurantName,
    placedAt: order.placedAt,
    eta: order.eta,
    status: order.status === "REJECTED" ? "PLACED" : order.status,
    total: order.total,
    items: order.items.map((item) => `${item.quantity}x ${item.name}`),
    deliveryPartner: order.deliveryPartnerName,
    address: order.address
  }));
  const workflowIds = new Set(workflowCustomerOrders.map((order) => order.id));

  return [...workflowCustomerOrders, ...seedOrders.filter((order) => !workflowIds.has(order.id))];
}

function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid place-items-center rounded-lg border bg-card text-center shadow-sm", compact ? "min-h-48 p-5" : "min-h-72 p-8")}>
      <div className="max-w-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CustomerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-hidden rounded-lg border bg-card p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-32 shrink-0" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
