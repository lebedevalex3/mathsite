import { cookies } from "next/headers";

import { TeacherVariantsPageClient } from "@/src/components/ui/TeacherVariantsPageClient";
import { getCurrentUserWithRole } from "@/src/lib/variants/auth";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TeacherVariantsPage({ params }: PageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const user = await getCurrentUserWithRole(cookieStore);

  return (
    <TeacherVariantsPageClient
      locale={locale}
      initialRole={user.role}
    />
  );
}
