export const appRoutes = {
  home: "/",
  signIn: "/sign-in",
  customerSignIn: "/sign-in/customer",
  restaurantSignIn: "/sign-in/restaurant",
  deliverySignIn: "/sign-in/delivery",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  customer: {
    dashboard: "/customer",
    profile: "/customer/profile"
  },
  restaurant: {
    dashboard: "/restaurant",
    profile: "/restaurant/profile"
  },
  delivery: {
    dashboard: "/delivery",
    profile: "/delivery/profile"
  },
  admin: {
    dashboard: "/admin",
    database: "/admin/database"
  }
} as const;
