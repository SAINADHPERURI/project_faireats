"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, X } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { contactDetails } from "@/config/contact";
import { cn } from "@/lib/utils";

export function ContactButton({
  className,
  variant = "outline",
  size = "sm",
  label = "Contact us",
  iconOnly = false
}: {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
  iconOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      <Button type="button" variant={variant} size={iconOnly ? "icon" : size} className={className} onClick={() => setIsOpen(true)}>
        <MessageCircle className={cn("h-4 w-4", !iconOnly && "mr-2")} />
        {iconOnly ? <span className="sr-only">{label}</span> : label}
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <m.div
            className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            <m.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l bg-background"
            >
              <div className="flex items-center justify-between border-b px-6 py-5">
                <p className="font-mono text-xs font-semibold uppercase">FairEats / Contact</p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-md border bg-card transition-colors hover:bg-muted"
                  aria-label="Close contact panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-12 p-6 sm:p-10">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Let&apos;s talk</p>
                  <h2 id="contact-title" className="mt-5 text-4xl font-bold tracking-normal sm:text-6xl">
                    Food, partnerships, or support.
                  </h2>
                  <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
                    Contact the FairEats team for customer support, restaurant partnerships, delivery opportunities, or general questions.
                  </p>
                </div>

                <div className="divide-y border-y">
                  <ContactRow icon={Mail} label="Email" value={contactDetails.email ?? "Email address coming soon"} href={contactDetails.email ? `mailto:${contactDetails.email}` : null} />
                  <ContactRow icon={Phone} label="Phone" value={contactDetails.phone ?? "Phone number coming soon"} href={contactDetails.phone ? `tel:${contactDetails.phone}` : null} />
                  <ContactRow icon={MapPin} label="Region" value={contactDetails.location} href={null} />
                </div>

                <div className="border-t pt-5">
                  <p className="font-mono text-xs uppercase text-muted-foreground">Support hours</p>
                  <p className="mt-2 text-sm font-medium">{contactDetails.supportHours}</p>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                    </span>
                    <p className="text-sm text-muted-foreground">Our support team is ready to help during the hours listed above.</p>
                  </div>
                </div>
              </div>
            </m.section>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string | null;
}) {
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-muted">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs uppercase text-muted-foreground">{label}</span>
        <span className="mt-1 block truncate font-medium">{value}</span>
      </span>
      {href ? <ArrowUpRight className="h-5 w-5 shrink-0" /> : null}
    </>
  );

  return href ? (
    <a href={href} className="flex items-center gap-4 py-5 transition-colors hover:text-primary">
      {content}
    </a>
  ) : (
    <div className={cn("flex items-center gap-4 py-5", !href && "text-muted-foreground")}>{content}</div>
  );
}
