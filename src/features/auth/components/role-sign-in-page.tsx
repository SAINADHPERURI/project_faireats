"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Bike, ChefHat, ShoppingBag, Utensils } from "lucide-react";

import { ContactButton } from "@/components/contact-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { appRoutes } from "@/config/routes";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { cn } from "@/lib/utils";
import type { OnboardableUserRole } from "@/types/auth";

const roleLoginConfig: Record<
  OnboardableUserRole,
  {
    label: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    icon: typeof ShoppingBag;
    accent: string;
  }
> = {
  CUSTOMER: {
    label: "Customer",
    title: "Your next favorite meal is closer than you think.",
    description: "Explore every restaurant, discover food by category, save favorites, and follow your order live.",
    image: "/images/foods/food-spread.jpg",
    imageAlt: "A table filled with meals available to FairEats customers",
    icon: ShoppingBag,
    accent: "bg-[#F3E7D6] text-[#201A17]"
  },
  RESTAURANT: {
    label: "Restaurant",
    title: "Run the kitchen. Understand the business.",
    description: "Manage orders, menu availability, store status, revenue, and demand from one focused workspace.",
    image: "/images/foods/indian.jpg",
    imageAlt: "Fresh restaurant dishes prepared for service",
    icon: ChefHat,
    accent: "bg-[#D7BFA6] text-[#201A17]"
  },
  DELIVERY: {
    label: "Delivery partner",
    title: "Own the route from pickup to payout.",
    description: "Review assignments, update delivery stages, monitor earnings, and keep your verified profile current.",
    image: "/images/foods/burger.jpg",
    imageAlt: "Fresh food packaged for a FairEats delivery",
    icon: Bike,
    accent: "bg-[#FFFDF6] text-[#201A17]"
  }
};

const roleRoutes: Array<{ role: OnboardableUserRole; label: string; href: Route; icon: typeof ShoppingBag }> = [
  { role: "CUSTOMER", label: "Customer", href: appRoutes.customerSignIn, icon: ShoppingBag },
  { role: "RESTAURANT", label: "Restaurant", href: appRoutes.restaurantSignIn, icon: ChefHat },
  { role: "DELIVERY", label: "Delivery", href: appRoutes.deliverySignIn, icon: Bike }
];

export function RoleSignInPage({ role }: { role: OnboardableUserRole }) {
  const config = roleLoginConfig[role];
  const Icon = config.icon;

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.18fr)_minmax(440px,0.82fr)]">
        <section className="relative min-h-[330px] overflow-hidden bg-foreground text-white lg:min-h-screen">
          <Image src={config.image} alt={config.imageAlt} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 flex min-h-[330px] flex-col justify-between p-6 sm:p-10 lg:min-h-screen lg:p-12">
            <Link href={appRoutes.home} className="flex w-fit items-center gap-3 text-lg font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-white/35 bg-white/10 backdrop-blur">
                <Utensils className="h-5 w-5" />
              </span>
              FairEats
            </Link>

            <div className="max-w-3xl py-12 lg:py-16">
              <Badge className={cn("mb-6 w-fit border-0", config.accent)}>
                <Icon className="mr-2 h-4 w-4" />
                {config.label} access
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">{config.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{config.description}</p>
            </div>

            <p className="font-mono text-xs uppercase text-white/65">Secure role-aware access / Supabase Auth</p>
          </div>
        </section>

        <section className="relative flex min-h-[650px] flex-col bg-background">
          <header className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-8">
            <Link href={appRoutes.signIn} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All login options
            </Link>
            <div className="flex items-center gap-2">
              <ContactButton iconOnly />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
            <div className="w-full max-w-md">
              <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">{config.label} portal</p>
              <h2 className="mt-4 text-4xl font-bold tracking-normal">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with the account registered for this FairEats workspace.</p>

              <div className="mt-8">
                <SignInForm expectedRole={role} showHeading={false} />
              </div>

              <div className="mt-9 border-t pt-6">
                <p className="font-mono text-xs uppercase text-muted-foreground">Switch workspace</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {roleRoutes.map((item) => {
                    const RoleIcon = item.icon;

                    return (
                      <Link
                        key={item.role}
                        href={item.href}
                        className={cn(
                          "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border p-2 text-center text-xs font-medium transition-colors",
                          item.role === role ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                        )}
                      >
                        <RoleIcon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
