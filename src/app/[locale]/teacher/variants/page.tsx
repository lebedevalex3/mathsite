import { cookies } from "next/headers";

import { TeacherVariantsPageClient } from "@/src/components/ui/TeacherVariantsPageClient";
import { getAuthenticatedUserFromCookie } from "@/src/lib/auth/provider";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TeacherVariantsPage({ params }: PageProps) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const user = await getAuthenticatedUserFromCookie(cookieStore);

  return (
    <TeacherVariantsPageClient
      locale={locale}
      initialRole={user?.role ?? "student"}
    />
  );
}
