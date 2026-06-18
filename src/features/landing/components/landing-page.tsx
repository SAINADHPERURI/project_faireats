"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { m, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowRight,
  Bike,
  Check,
  ChevronDown,
  HeartHandshake,
  ShoppingBag,
  Star,
  Store,
  Utensils
} from "lucide-react";

import { ContactButton } from "@/components/contact-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appRoutes } from "@/config/routes";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Experience", href: "#experience" },
  { label: "Roles", href: "#roles" },
  { label: "Workflow", href: "#workflow" },
  { label: "FAQ", href: "#faq" }
];

const serviceWords = [
  "FAIR DELIVERY",
  "LOCAL RESTAURANTS",
  "LIVE TRACKING",
  "CLEAR PAYOUTS",
  "SMART ROUTING",
  "HUMAN SUPPORT"
];

const metrics = [
  { value: 28, suffix: " min", label: "average delivery window" },
  { value: 94, suffix: "%", label: "restaurant payout visibility" },
  { value: 4.9, suffix: "/5", label: "modeled customer trust" },
  { value: 3, suffix: "", label: "connected marketplace roles" }
];

const roles: Array<{
  id: "customer" | "restaurant" | "delivery";
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  route: Route;
  facts: string[];
}> = [
  {
    id: "customer",
    label: "01 / Customer",
    title: "Discovery that starts with appetite.",
    description: "Photo-led menus, useful filters, transparent fees, favorites, wishlist, checkout, and a live order timeline in one calm experience.",
    image: "/images/foods/food-spread.jpg",
    imageAlt: "A table filled with freshly prepared food",
    icon: ShoppingBag,
    route: appRoutes.customer.dashboard,
    facts: ["Dynamic delivery fees", "Food recommendations", "Live status tracking"]
  },
  {
    id: "restaurant",
    label: "02 / Restaurant",
    title: "A kitchen command center, not another inbox.",
    description: "Manage menu availability, accept orders, control store status, monitor revenue, and understand demand without losing operational focus.",
    image: "/images/foods/indian.jpg",
    imageAlt: "Indian curry, rice, and flatbread ready for service",
    icon: Store,
    route: appRoutes.restaurant.dashboard,
    facts: ["Menu and store controls", "Order operations", "Revenue intelligence"]
  },
  {
    id: "delivery",
    label: "03 / Delivery",
    title: "Every route, earning, and handoff in view.",
    description: "A mobile-first workspace for assigned orders, pickup, proof of delivery, verified profiles, activity history, and earnings analytics.",
    image: "/images/foods/burger.jpg",
    imageAlt: "Fresh burger prepared for delivery",
    icon: Bike,
    route: appRoutes.delivery.dashboard,
    facts: ["Verified partner profiles", "Pickup to delivery flow", "Earnings analytics"]
  }
];

const workflow = [
  {
    number: "001",
    title: "Choose",
    subtitle: "food & restaurant",
    description: "Search by dish, cuisine, rating, category, distance, or what is trending near you."
  },
  {
    number: "002",
    title: "Confirm",
    subtitle: "price & delivery",
    description: "See item totals, distance-based delivery fees, taxes, offers, and your complete order before payment."
  },
  {
    number: "003",
    title: "Prepare",
    subtitle: "kitchen & courier",
    description: "Restaurants accept and prepare while FairEats assigns the right verified delivery partner."
  },
  {
    number: "004",
    title: "Follow",
    subtitle: "pickup & arrival",
    description: "Notifications and a shared live timeline keep every role aligned until the order is delivered."
  }
];

const testimonials = [
  {
    quote: "The interface makes a complex multi-sided marketplace feel understandable in seconds.",
    name: "Maya Chen",
    role: "Product reviewer"
  },
  {
    quote: "It balances consumer polish with the operational depth expected from a serious full-stack platform.",
    name: "Rohan Mehta",
    role: "Engineering mentor"
  },
  {
    quote: "Every role has a point of view. It feels designed as one connected product rather than four separate demos.",
    name: "Amelia Grant",
    role: "Product lead"
  }
];

const faqs = [
  {
    question: "What makes FairEats different?",
    answer: "FairEats treats customers, restaurants, and delivery partners as equal parts of one transparent order system."
  },
  {
    question: "Is the platform connected to a real backend?",
    answer: "Yes. FairEats uses Supabase authentication, PostgreSQL data architecture, protected role routes, and typed database clients."
  },
  {
    question: "Does it work on mobile?",
    answer: "The customer ordering and delivery partner experiences are responsive, with controls and layouts designed for repeated mobile use."
  },
  {
    question: "Can contact details be changed later?",
    answer: "Yes. Email and phone are centralized in one configuration file and will update everywhere as soon as the final details are provided."
  }
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <Hero />
      <ServiceMarquee />
      <ExperienceStatement />
      <RoleExperience />
      <Metrics />
      <Workflow />
      <Proof />
      <FAQ />
      <ContactSection />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[86svh] overflow-hidden border-b bg-foreground text-white">
      <Image
        src="/images/foods/food-spread.jpg"
        alt="A table filled with meals available through FairEats"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/58" />

      <header className="relative z-20 mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-white/35 bg-white/10 backdrop-blur">
            <Utensils className="h-5 w-5" />
          </span>
          FairEats
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-xs uppercase text-white/75 lg:flex" aria-label="Landing navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="sm:hidden">
            <ContactButton iconOnly className="border-white/35 bg-white/10 text-white hover:bg-white hover:text-foreground" />
          </div>
          <div className="hidden sm:block">
            <ContactButton className="border-white/35 bg-white/10 text-white hover:bg-white hover:text-foreground" />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button asChild size="sm" className="bg-white text-foreground hover:bg-white/85">
            <Link href={appRoutes.signIn}>Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(86svh-82px)] w-full max-w-[1500px] flex-col justify-between px-5 pb-8 pt-20 sm:px-8 sm:pt-24">
        <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-5xl">
          <p className="font-mono text-xs uppercase text-white/75">Food delivery / Reconsidered</p>
          <h1 className="mt-6 text-7xl font-bold leading-[0.88] tracking-normal sm:text-8xl lg:text-9xl">FairEats</h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-white/85 sm:text-2xl">
            A food marketplace built to feel fair for the people ordering, preparing, delivering, and operating it.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-[#FFFDF6] text-[#201A17] hover:bg-[#F3E7D6]">
              <Link href={appRoutes.customer.dashboard}>
                Order food
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-black/15 text-white hover:bg-white hover:text-foreground">
              <Link href={appRoutes.signUp}>Join the marketplace</Link>
            </Button>
          </div>
        </m.div>

        <div className="mt-16 flex flex-col justify-between gap-6 border-t border-white/25 pt-5 font-mono text-xs uppercase text-white/70 sm:flex-row sm:items-end">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <span>Supabase powered</span>
            <span>Four role workspaces</span>
            <span>Live order lifecycle</span>
          </div>
          <a href="#experience" className="inline-flex items-center gap-2 text-white transition-opacity hover:opacity-70">
            Explore the system
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ServiceMarquee() {
  const repeatedWords = [...serviceWords, ...serviceWords];

  return (
    <section className="overflow-hidden border-b bg-primary py-4 text-primary-foreground">
      <div className="faireats-marquee-track flex w-max items-center">
        {repeatedWords.map((word, index) => (
          <div key={`${word}-${index}`} className="flex shrink-0 items-center">
            <span className="px-7 font-mono text-xs font-semibold uppercase">{word}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ExperienceStatement() {
  return (
    <section id="experience" className="border-b py-20 sm:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">To be direct / 01</p>
          <h2 className="mt-8 max-w-6xl text-4xl font-bold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
            The way food moves through a city shapes how customers trust it, restaurants earn from it, and partners choose to deliver it.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
          <Reveal>
            <figure className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
              <Image src="/images/foods/indian.jpg" alt="Freshly prepared Indian meal" fill sizes="(min-width: 768px) 65vw, 100vw" className="object-cover" />
              <figcaption className="absolute bottom-4 left-4 rounded-md bg-background px-3 py-2 font-mono text-xs uppercase text-foreground">
                Prepared with context
              </figcaption>
            </figure>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Reveal delay={0.08}>
              <figure className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image src="/images/foods/vegan.jpg" alt="Colorful plant-based meal" fill sizes="(min-width: 768px) 35vw, 50vw" className="object-cover" />
              </figure>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="flex h-full min-h-48 flex-col justify-between rounded-lg border bg-card p-6">
                <HeartHandshake className="h-8 w-8" />
                <div>
                  <p className="text-2xl font-bold">One order.</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Four role experiences synchronized around the same source of truth.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleExperience() {
  const [activeRoleId, setActiveRoleId] = useState<(typeof roles)[number]["id"]>("customer");
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];

  if (!activeRole) {
    return null;
  }

  const ActiveIcon = activeRole.icon;

  return (
    <section id="roles" className="border-b py-20 sm:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Connected workspaces / 02</p>
            <h2 className="mt-6 max-w-xl text-4xl font-bold tracking-normal sm:text-6xl">Designed around who is doing the work.</h2>
            <div className="mt-10 divide-y border-y">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRoleId(role.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 py-5 text-left transition-colors",
                    activeRole.id === role.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="font-mono text-xs uppercase">{role.label}</span>
                  <ArrowRight className={cn("h-4 w-4 transition-transform", activeRole.id === role.id && "translate-x-1")} />
                </button>
              ))}
            </div>
          </div>

          <m.article
            key={activeRole.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-lg border bg-card"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <Image src={activeRole.image} alt={activeRole.imageAlt} fill sizes="(min-width: 1024px) 65vw, 100vw" className="object-cover" />
              <Badge className="absolute left-5 top-5 border-white/30 bg-black/50 text-white backdrop-blur-sm hover:bg-black/50">
                <ActiveIcon className="mr-2 h-4 w-4" />
                {activeRole.label.split("/ ")[1]}
              </Badge>
            </div>
            <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
              <div>
                <h3 className="text-3xl font-bold tracking-normal sm:text-4xl">{activeRole.title}</h3>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{activeRole.description}</p>
                <Button asChild className="mt-7">
                  <Link href={activeRole.route}>
                    Open workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <ul className="divide-y border-y">
                {activeRole.facts.map((fact) => (
                  <li key={fact} className="flex items-center gap-3 py-4 text-sm font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-secondary">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </m.article>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  return (
    <section className="bg-foreground py-16 text-background">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-lg border border-background/20 bg-background/20 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Counter key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    const steps = 36;
    let frame = 0;
    const interval = window.setInterval(() => {
      frame += 1;
      setCurrent(value * Math.min(frame / steps, 1));

      if (frame >= steps) {
        window.clearInterval(interval);
      }
    }, 26);

    return () => window.clearInterval(interval);
  }, [inView, value]);

  return (
    <div ref={ref} className="bg-foreground p-6 sm:p-8">
      <p className="text-4xl font-bold sm:text-5xl">
        {value % 1 === 0 ? Math.round(current) : current.toFixed(1)}
        {suffix}
      </p>
      <p className="mt-4 max-w-40 font-mono text-xs uppercase text-background/65">{label}</p>
    </div>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="border-b py-20 sm:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Order lifecycle / 03</p>
          <h2 className="mt-6 max-w-4xl text-4xl font-bold tracking-normal sm:text-6xl">A clear path from craving to doorstep.</h2>
        </Reveal>

        <div className="mt-14 divide-y border-y">
          {workflow.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.05}>
              <article className="grid gap-5 py-7 sm:grid-cols-[100px_0.8fr_1.2fr] sm:items-start sm:py-9">
                <span className="font-mono text-xs text-muted-foreground">[{step.number}]</span>
                <div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">{step.subtitle}</p>
                </div>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">{step.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="border-b bg-muted py-20 sm:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <Reveal>
            <div>
              <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Others say / 04</p>
              <h2 className="mt-6 text-4xl font-bold tracking-normal sm:text-6xl">Built to hold attention and scrutiny.</h2>
              <div className="mt-8 flex gap-1 text-foreground">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 fill-current" />
                ))}
              </div>
            </div>
          </Reveal>

          <div className="divide-y border-y">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 0.06}>
                <blockquote className="grid gap-6 py-7 sm:grid-cols-[1fr_180px] sm:py-9">
                  <p className="text-xl font-medium leading-8 sm:text-2xl">&ldquo;{testimonial.quote}&rdquo;</p>
                  <footer className="sm:text-right">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">{testimonial.role}</p>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="border-b py-20 sm:py-28">
      <div className="mx-auto grid max-w-[1500px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <Reveal>
          <div>
            <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Questions / 05</p>
            <h2 className="mt-6 text-4xl font-bold tracking-normal sm:text-6xl">A few useful answers.</h2>
          </div>
        </Reveal>

        <div className="divide-y border-y">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-semibold">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="bg-secondary py-20 sm:py-28">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase text-secondary-foreground/65">Contact / 06</p>
              <h2 className="mt-6 max-w-5xl text-5xl font-bold leading-[0.95] tracking-normal sm:text-7xl lg:text-8xl">
                Hungry for a better delivery experience?
              </h2>
            </div>
            <ContactButton variant="default" size="lg" label="Open contact desk" className="shrink-0" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-8 border-b border-background/20 pb-8 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-background/25">
              <Utensils className="h-5 w-5" />
            </span>
            FairEats
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs uppercase text-background/65">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-background">
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 pt-6 font-mono text-xs uppercase text-background/55 sm:flex-row">
          <p>Fair food. Clear systems. Better delivery.</p>
          <p>Built in India / Powered by Next.js & Supabase</p>
        </div>
      </div>
    </footer>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </m.div>
  );
}
