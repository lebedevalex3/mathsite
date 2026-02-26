"use client";

import { useRouter } from "next/navigation";

type MobileSubtopicSelectItem = {
  id: string;
  title: string;
  href: string;
};

type MobileSubtopicSelectProps = {
  locale: string;
  label?: string;
  value: string;
  items: MobileSubtopicSelectItem[];
};

export function MobileSubtopicSelect({
  locale,
  label,
  value,
  items,
}: MobileSubtopicSelectProps) {
  const router = useRouter();

  const localizedLabel =
    label ??
    (locale === "ru"
      ? "Подтема"
      : locale === "de"
        ? "Unterthema"
        : "Subtopic");

  return (
    <div className="lg:hidden">
      <label htmlFor="subtopic-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {localizedLabel}
      </label>
      <div className="relative">
        <select
          id="subtopic-select"
          aria-label={localizedLabel}
          value={value}
          onChange={(event) => {
            const href = event.target.value;
            if (!href) return;
            router.push(href);
          }}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-500"
        >
          {items.map((item) => (
            <option key={item.id} value={item.href}>
              {item.title}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-slate-500"
        >
          ▾
        </span>
      </div>
    </div>
  );
}

