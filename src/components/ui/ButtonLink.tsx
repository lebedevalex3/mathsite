import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variantClasses: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary:
    "border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--surface-soft)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-soft)]",
};

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
