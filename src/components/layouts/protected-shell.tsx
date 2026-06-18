import Link from "next/link";
import type { PropsWithChildren } from "react";
import { LogOut, Utensils } from "lucide-react";

import { ContactButton } from "@/components/contact-panel";
import { RoleShellHeading, RoleShellNavigation } from "@/components/layouts/role-shell-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRoleHome } from "@/config/roles";
import { signOutAction } from "@/features/auth/lib/actions";
import type { UserRole } from "@/types/auth";

interface ProtectedShellProps extends PropsWithChildren {
  role: UserRole;
  title: string;
  description: string;
}

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  RESTAURANT: "Restaurant",
  DELIVERY: "Delivery",
  ADMIN: "Admin"
};

export function ProtectedShell({ children, role, title, description }: ProtectedShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={getRoleHome(role)} className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Utensils className="h-4 w-4" />
            </span>
            FairEats
          </Link>
          <div className="order-3 flex w-full items-center gap-2 overflow-x-auto sm:order-none sm:w-auto">
            <RoleShellNavigation role={role} />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{roleLabels[role]}</Badge>
            <div className="md:hidden">
              <ContactButton iconOnly />
            </div>
            <div className="hidden md:block">
              <ContactButton />
            </div>
            <ThemeToggle />
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <section className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8">
        <RoleShellHeading role={role} dashboardTitle={title} dashboardDescription={description} />
        {children}
      </section>
    </main>
  );
}
