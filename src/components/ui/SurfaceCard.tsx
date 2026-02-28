import { forwardRef, type ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(function SurfaceCard(
  { children, className = "" },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_24px_-18px_rgba(11,60,138,0.35)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
});
