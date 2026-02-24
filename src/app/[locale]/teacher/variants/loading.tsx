import { SurfaceCard } from "@/src/components/ui/SurfaceCard";

export default function TeacherVariantsLoading() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </section>

      <section className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        {[0, 1].map((index) => (
          <SurfaceCard key={index} className="p-4">
            <div className="space-y-3">
              <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            </div>
          </SurfaceCard>
        ))}
      </section>
    </main>
  );
}

