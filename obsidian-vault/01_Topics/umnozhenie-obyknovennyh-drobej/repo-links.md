# Repo Links

## Главные файлы темы
- [Task bank JSON](../../../data/tasks/fractions_multiplication.json)
- [Taxonomy](../../../docs/TAXONOMY_FRACTIONS_MULTIPLICATION.md)
- [Topic skills module](../../../src/lib/topics/fractions-multiplication/module-data.ts)
- [Topic metadata](../../../src/lib/topicMeta.ts)
- [Teacher tools catalog](../../../src/lib/teacher-tools/catalog.ts)

## SEO-витрина
- [SEO topic JSON](../../../content/seo/topics/ru/umnozhenie-obyknovennyh-drobej.json)
- [SEO worksheets directory](../../../content/seo/worksheets/ru)
- [SEO topic page route](../../../src/app/[locale]/materialy/5-klass/umnozhenie-obyknovennyh-drobej/page.tsx)
- [SEO worksheet page route](../../../src/app/[locale]/materialy/5-klass/umnozhenie-obyknovennyh-drobej/[worksheetSlug]/page.tsx)

## Production
- [LaTeX sheets workspace](../../../latex-math-sheets)
- [Variants landing](../../../src/components/ui/TeacherVariantsPageClient.tsx)

## Как искать по навыку
- для `s0.reduce` ищите `math.fractions_multiplication.s0_reduce` и `key: "s0.reduce"`
- для `s1.ff` ищите `math.fractions_multiplication.s1_ff` и `key: "s1.ff"`

## Как искать по листу
- по `worksheet_id` ищите JSON в `content/seo/worksheets/ru`
- по `slug` ищите страницу в `src/app/[locale]/materialy/...`
