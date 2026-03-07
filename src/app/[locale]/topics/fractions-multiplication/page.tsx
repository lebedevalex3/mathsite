import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FractionsMultiplicationRedirectPage({ params }: PageProps) {
  await params;
  redirect("/ru/materialy/5-klass/umnozhenie-obyknovennyh-drobej");
}
