import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-pulse/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink px-5 py-2.5 text-base font-semibold text-[#05070d] hover:bg-white hover:shadow-[0_0_34px_-6px_rgba(45,212,191,0.65)]",
  outline:
    "rule px-5 py-2.5 text-ink hover:border-pulse/40 hover:bg-white/5 hover:text-white",
  ghost: "px-4 py-2 text-muted hover:text-ink",
};

type ButtonProps = {
  variant?: Variant;
  children: ReactNode;
} & ComponentProps<"button">;

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  variant?: Variant;
  children: ReactNode;
} & ComponentProps<typeof Link>;

export function ButtonLink({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}
