"use client";

import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { MotionProvider } from "@/components/providers/motion-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/features/auth/context/auth-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ReactQueryProvider>
        <AuthProvider>
          <MotionProvider>{children}</MotionProvider>
        </AuthProvider>
      </ReactQueryProvider>
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
