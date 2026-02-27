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
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
});
