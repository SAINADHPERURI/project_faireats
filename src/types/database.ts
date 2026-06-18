import type { UserRole } from "@/types/auth";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type OrderStatus =
  | "PENDING"
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "READY_FOR_PICKUP"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
export type DeliveryPartnerStatus = "AVAILABLE" | "BUSY" | "OFFLINE" | "SUSPENDED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type NotificationType = "ORDER" | "DELIVERY" | "PAYMENT" | "PROMOTION" | "SYSTEM";
export type AnalyticsEntityType = "USER" | "RESTAURANT" | "MENU_ITEM" | "ORDER" | "DELIVERY_PARTNER" | "PLATFORM";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type UserInsert = {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  status?: UserStatus;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type UserUpdate = Partial<Omit<UserInsert, "id" | "created_at">>;

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  description: string | null;
  cuisine_type: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json;
  commission_rate_bps: number;
  min_order_cents: number;
  delivery_fee_cents: number;
  average_prep_time_minutes: number;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  is_verified: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type RestaurantInsert = {
  id?: string;
  owner_id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  description?: string | null;
  cuisine_type?: string;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: Json;
  commission_rate_bps?: number;
  min_order_cents?: number;
  delivery_fee_cents?: number;
  average_prep_time_minutes?: number;
  rating_avg?: number;
  rating_count?: number;
  is_active?: boolean;
  is_verified?: boolean;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type RestaurantUpdate = Partial<Omit<RestaurantInsert, "id" | "owner_id" | "created_at">>;

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  calories: number | null;
  dietary_tags: string[];
  sort_order: number;
  is_available: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type MenuItemInsert = {
  id?: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string;
  price_cents: number;
  currency?: string;
  image_url?: string | null;
  calories?: number | null;
  dietary_tags?: string[];
  sort_order?: number;
  is_available?: boolean;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type MenuItemUpdate = Partial<Omit<MenuItemInsert, "id" | "restaurant_id" | "created_at">>;

export interface DeliveryPartner {
  id: string;
  user_id: string;
  status: DeliveryPartnerStatus;
  vehicle_type: string;
  vehicle_number: string | null;
  license_number: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  rating_avg: number;
  rating_count: number;
  completed_deliveries: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type DeliveryPartnerInsert = {
  id?: string;
  user_id: string;
  status?: DeliveryPartnerStatus;
  vehicle_type: string;
  vehicle_number?: string | null;
  license_number?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  rating_avg?: number;
  rating_count?: number;
  completed_deliveries?: number;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type DeliveryPartnerUpdate = Partial<Omit<DeliveryPartnerInsert, "id" | "user_id" | "created_at">>;

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  subtotal_cents: number;
  tax_cents: number;
  delivery_fee_cents: number;
  discount_cents: number;
  tip_cents: number;
  total_cents: number;
  currency: string;
  delivery_address_line1: string | null;
  delivery_address_line2: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_postal_code: string | null;
  delivery_country: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_notes: string | null;
  restaurant_notes: string | null;
  placed_at: string | null;
  accepted_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = {
  id?: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id?: string | null;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: string | null;
  subtotal_cents?: number;
  tax_cents?: number;
  delivery_fee_cents?: number;
  discount_cents?: number;
  tip_cents?: number;
  total_cents: number;
  currency?: string;
  delivery_address_line1?: string | null;
  delivery_address_line2?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_postal_code?: string | null;
  delivery_country?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  customer_notes?: string | null;
  restaurant_notes?: string | null;
  placed_at?: string | null;
  accepted_at?: string | null;
  ready_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type OrderUpdate = Partial<Omit<OrderInsert, "id" | "customer_id" | "restaurant_id" | "created_at">>;

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  restaurant_id: string;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  special_instructions: string | null;
  metadata: Json;
  created_at: string;
}

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  menu_item_id?: string | null;
  restaurant_id: string;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  special_instructions?: string | null;
  metadata?: Json;
  created_at?: string;
};

export type OrderItemUpdate = Partial<Omit<OrderItemInsert, "id" | "order_id" | "created_at">>;

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id: string | null;
  rating: number;
  delivery_rating: number | null;
  comment: string | null;
  status: ReviewStatus;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type ReviewInsert = {
  id?: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id?: string | null;
  rating: number;
  delivery_rating?: number | null;
  comment?: string | null;
  status?: ReviewStatus;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

export type ReviewUpdate = Partial<Omit<ReviewInsert, "id" | "order_id" | "customer_id" | "restaurant_id" | "created_at">>;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
}

export type NotificationInsert = {
  id?: string;
  user_id: string;
  type?: NotificationType;
  title: string;
  body: string;
  payload?: Json;
  read_at?: string | null;
  created_at?: string;
};

export type NotificationUpdate = Partial<Omit<NotificationInsert, "id" | "user_id" | "created_at">>;

export interface Favorite {
  id: string;
  customer_id: string;
  restaurant_id: string;
  created_at: string;
}

export type FavoriteInsert = {
  id?: string;
  customer_id: string;
  restaurant_id: string;
  created_at?: string;
};

export type FavoriteUpdate = Partial<Omit<FavoriteInsert, "id" | "customer_id" | "restaurant_id" | "created_at">>;

export interface Analytics {
  id: string;
  entity_type: AnalyticsEntityType;
  event_name: string;
  actor_id: string | null;
  restaurant_id: string | null;
  order_id: string | null;
  delivery_partner_id: string | null;
  metric_value: number | null;
  properties: Json;
  occurred_at: string;
  created_at: string;
}

export type AnalyticsInsert = {
  id?: string;
  entity_type?: AnalyticsEntityType;
  event_name: string;
  actor_id?: string | null;
  restaurant_id?: string | null;
  order_id?: string | null;
  delivery_partner_id?: string | null;
  metric_value?: number | null;
  properties?: Json;
  occurred_at?: string;
  created_at?: string;
};

export type AnalyticsUpdate = Partial<Omit<AnalyticsInsert, "id" | "created_at">>;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User & Record<string, unknown>;
        Insert: UserInsert & Record<string, unknown>;
        Update: UserUpdate & Record<string, unknown>;
        Relationships: [];
      };
      profiles: {
        Row: Pick<User, "id" | "email" | "full_name" | "role" | "created_at" | "updated_at"> & Record<string, unknown>;
        Insert: Pick<UserInsert, "id" | "email"> &
          Partial<Pick<UserInsert, "full_name" | "role" | "created_at" | "updated_at">> &
          Record<string, unknown>;
        Update: Partial<Pick<UserInsert, "email" | "full_name" | "updated_at">> & Record<string, unknown>;
        Relationships: [];
      };
      restaurants: {
        Row: Restaurant & Record<string, unknown>;
        Insert: RestaurantInsert & Record<string, unknown>;
        Update: RestaurantUpdate & Record<string, unknown>;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItem & Record<string, unknown>;
        Insert: MenuItemInsert & Record<string, unknown>;
        Update: MenuItemUpdate & Record<string, unknown>;
        Relationships: [];
      };
      delivery_partners: {
        Row: DeliveryPartner & Record<string, unknown>;
        Insert: DeliveryPartnerInsert & Record<string, unknown>;
        Update: DeliveryPartnerUpdate & Record<string, unknown>;
        Relationships: [];
      };
      orders: {
        Row: Order & Record<string, unknown>;
        Insert: OrderInsert & Record<string, unknown>;
        Update: OrderUpdate & Record<string, unknown>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem & Record<string, unknown>;
        Insert: OrderItemInsert & Record<string, unknown>;
        Update: OrderItemUpdate & Record<string, unknown>;
        Relationships: [];
      };
      reviews: {
        Row: Review & Record<string, unknown>;
        Insert: ReviewInsert & Record<string, unknown>;
        Update: ReviewUpdate & Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: Notification & Record<string, unknown>;
        Insert: NotificationInsert & Record<string, unknown>;
        Update: NotificationUpdate & Record<string, unknown>;
        Relationships: [];
      };
      favorites: {
        Row: Favorite & Record<string, unknown>;
        Insert: FavoriteInsert & Record<string, unknown>;
        Update: FavoriteUpdate & Record<string, unknown>;
        Relationships: [];
      };
      analytics: {
        Row: Analytics & Record<string, unknown>;
        Insert: AnalyticsInsert & Record<string, unknown>;
        Update: AnalyticsUpdate & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      delivery_partner_status: DeliveryPartnerStatus;
      review_status: ReviewStatus;
      notification_type: NotificationType;
      analytics_entity_type: AnalyticsEntityType;
    };
    CompositeTypes: Record<string, never>;
  };
}
