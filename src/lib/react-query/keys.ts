export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const
  },
  restaurants: {
    all: ["restaurants"] as const,
    detail: (restaurantId: string) => ["restaurants", restaurantId] as const
  },
  orders: {
    all: ["orders"] as const,
    detail: (orderId: string) => ["orders", orderId] as const
  },
  deliveryPartners: {
    all: ["delivery-partners"] as const,
    detail: (deliveryPartnerId: string) => ["delivery-partners", deliveryPartnerId] as const
  }
};
