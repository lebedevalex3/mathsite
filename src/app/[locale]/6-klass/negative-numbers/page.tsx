import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Grade6NegativeNumbersPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Отрицательные числа</h1>
      <p>Материалы по теме находятся в подготовке.</p>
      <p>
        <Link href={`/${locale}`}>Вернуться на главную</Link>
      </p>
    </main>
  );
}
