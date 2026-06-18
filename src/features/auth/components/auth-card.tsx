"use client";

import Link from "next/link";
import type { PropsWithChildren } from "react";
import { m } from "framer-motion";
import { BadgeCheck, Bike, ChefHat, ShoppingBag, Utensils } from "lucide-react";

import { ContactButton } from "@/components/contact-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { appRoutes } from "@/config/routes";
import { AuthFoodShowcase } from "@/features/auth/components/auth-food-showcase";

interface AuthCardProps extends PropsWithChildren {
  title: string;
  description: string;
  eyebrow: string;
  showFoodShowcase?: boolean;
}

const trustItems = [
  { label: "Customers", icon: ShoppingBag, href: appRoutes.customerSignIn },
  { label: "Restaurants", icon: ChefHat, href: appRoutes.restaurantSignIn },
  { label: "Delivery", icon: Bike, href: appRoutes.deliverySignIn }
];

export function AuthCard({ title, description, eyebrow, showFoodShowcase = false, children }: AuthCardProps) {
  return (
    <main className="relative min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href={appRoutes.home} className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Utensils className="h-4 w-4" />
            </span>
            FairEats
          </Link>
          <div className="flex items-center gap-2">
            <div className="sm:hidden">
              <ContactButton iconOnly />
            </div>
            <div className="hidden sm:block">
              <ContactButton />
            </div>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-screen w-full max-w-[1500px] items-center gap-10 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <m.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 font-mono text-xs font-medium uppercase text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" />
              FairEats secure access
            </div>
            <div className="max-w-2xl space-y-4">
              <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">{eyebrow} / Secure workspace</p>
              <h1 className="text-5xl font-bold leading-[0.95] tracking-normal text-foreground sm:text-7xl">{title}</h1>
              <p className="text-lg text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-3">
            {trustItems.map((item, index) => (
              <m.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="rounded-lg border bg-card"
              >
                <Link href={item.href} className="block p-4 transition-colors hover:bg-muted">
                  <item.icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              </m.div>
            ))}
          </div>

          {showFoodShowcase ? <AuthFoodShowcase /> : null}
        </m.div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-lg border bg-card p-6 shadow-2xl shadow-foreground/5 sm:p-8"
        >
          {children}
        </m.div>
      </section>
    </main>
  );
}
