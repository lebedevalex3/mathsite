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
    "bg-slate-900 text-white hover:bg-slate-700 border border-slate-900",
  secondary:
    "bg-white text-slate-900 hover:bg-slate-100 border border-slate-300",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
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
