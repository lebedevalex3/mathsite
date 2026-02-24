import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

export default function TeacherVariantDetailLoading() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-8 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-36 animate-pulse rounded bg-slate-200" />
        </div>
      </section>

      {[0, 1].map((index) => (
        <SurfaceCard key={index} className="p-6">
          <div className="h-6 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-20 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </SurfaceCard>
      ))}
    </main>
  );
}

