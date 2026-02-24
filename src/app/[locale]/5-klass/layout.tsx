import { Grade5Sidebar } from "@/src/components/site/Grade5Sidebar";
import { getGrade5Topics } from "@/src/lib/nav/grade5";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function Grade5Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const topics = getGrade5Topics(locale);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <Grade5Sidebar locale={locale} topics={topics} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

