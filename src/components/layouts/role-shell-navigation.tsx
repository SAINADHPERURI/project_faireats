"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRoleHome, getRoleProfileRoute } from "@/config/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const profileCopy: Record<Exclude<UserRole, "ADMIN">, { title: string; description: string }> = {
  CUSTOMER: {
    title: "Customer profile",
    description: "Manage delivery details, food preferences, contact information, and your FairEats avatar."
  },
  RESTAURANT: {
    title: "Restaurant profile",
    description: "Manage outlet identity, owner details, cuisine information, and restaurant contact details."
  },
  DELIVERY: {
    title: "Delivery partner profile",
    description: "Manage identity verification, license, Aadhaar, vehicle details, contact number, and profile photo."
  }
};

export function RoleShellNavigation({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const dashboardHref = getRoleHome(role);
  const profileHref = role === "ADMIN" ? null : getRoleProfileRoute(role);

  return (
    <nav className="flex items-center gap-2" aria-label={`${role.toLowerCase()} workspace navigation`}>
      <Button asChild variant={pathname === dashboardHref ? "secondary" : "outline"} size="sm">
        <Link href={dashboardHref}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      {profileHref ? (
        <Button asChild variant={pathname === profileHref ? "secondary" : "outline"} size="sm">
          <Link href={profileHref}>
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </Button>
      ) : null}
    </nav>
  );
}

export function RoleShellHeading({
  role,
  dashboardTitle,
  dashboardDescription
}: {
  role: UserRole;
  dashboardTitle: string;
  dashboardDescription: string;
}) {
  const pathname = usePathname();
  const profileHref = role === "ADMIN" ? null : getRoleProfileRoute(role);
  const isProfile = profileHref === pathname;
  const copy = role === "ADMIN" ? null : profileCopy[role];

  return (
    <div className="mb-8 max-w-4xl space-y-3 border-b pb-7">
      <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">
        {isProfile ? "Account settings / Profile" : `${role.toLowerCase()} workspace / Dashboard`}
      </p>
      <h1 className="text-4xl font-bold leading-none tracking-normal sm:text-5xl">{isProfile && copy ? copy.title : dashboardTitle}</h1>
      <p className={cn("text-muted-foreground", isProfile && "max-w-2xl")}>
        {isProfile && copy ? copy.description : dashboardDescription}
      </p>
    </div>
  );
}
