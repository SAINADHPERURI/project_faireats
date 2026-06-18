export type RestaurantOperatingStatus = "OPEN" | "CLOSED";

export const defaultRestaurantId = "urban-tandoor";
export const restaurantOperatingStatusChangedEvent = "faireats:restaurant-operating-status-changed";

const restaurantOperatingStatusStorageKey = "faireats:restaurant-operating-statuses";

type RestaurantOperatingStatusMap = Record<string, RestaurantOperatingStatus>;

function isRestaurantOperatingStatus(value: unknown): value is RestaurantOperatingStatus {
  return value === "OPEN" || value === "CLOSED";
}

export function getRestaurantOperatingStatuses(): RestaurantOperatingStatusMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(restaurantOperatingStatusStorageKey);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsedValue).filter(([, value]) => isRestaurantOperatingStatus(value))) as RestaurantOperatingStatusMap;
  } catch {
    return {};
  }
}

export function getRestaurantOperatingStatus(restaurantId: string): RestaurantOperatingStatus {
  return getRestaurantOperatingStatuses()[restaurantId] ?? "OPEN";
}

export function setRestaurantOperatingStatus(restaurantId: string, status: RestaurantOperatingStatus) {
  if (typeof window === "undefined") {
    return;
  }

  const nextStatuses = {
    ...getRestaurantOperatingStatuses(),
    [restaurantId]: status
  };

  window.localStorage.setItem(restaurantOperatingStatusStorageKey, JSON.stringify(nextStatuses));
  window.dispatchEvent(
    new CustomEvent(restaurantOperatingStatusChangedEvent, {
      detail: {
        restaurantId,
        status
      }
    })
  );
}
