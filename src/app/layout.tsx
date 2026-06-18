import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FairEats",
    template: "%s | FairEats"
  },
  description: "A fair, role-aware food delivery platform for customers, restaurants, couriers, and admins."
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
