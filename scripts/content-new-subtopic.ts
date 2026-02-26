import { promises as fs } from "node:fs";
import path from "node:path";

import { loadTopicSubtopicIndex } from "../src/lib/content";
import { requireContentTopicConfig } from "../src/lib/content/topic-registry";

type Args = {
  locale: "ru" | "en" | "de";
  topic: string;
  slug: string;
  title: string;
  order: number;
};

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, value);
    i += 1;
  }

  const topic = values.get("topic");
  const localeRaw = values.get("locale") ?? "ru";
  const slug = values.get("slug");
  const title = values.get("title");
  const orderRaw = values.get("order");

  if (!topic || !slug || !title || !orderRaw) {
    throw new Error(
      'Usage: pnpm content:new-subtopic -- --topic proporcii --slug direct-extra --title "..." --order 50 [--locale ru]',
    );
  }

  if (localeRaw !== "ru" && localeRaw !== "en" && localeRaw !== "de") {
    throw new Error(`Invalid --locale "${localeRaw}". Use: ru | en | de`);
  }

  const order = Number(orderRaw);
  if (!Number.isInteger(order) || order <= 0) {
    throw new Error(`Invalid --order value: ${orderRaw}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid --slug "${slug}". Use kebab-case latin letters and digits.`);
  }

  return { locale: localeRaw, topic, slug, title, order };
}

function resolveTopicDir(locale: Args["locale"], topic: string) {
  const config = requireContentTopicConfig(topic);
  return {
    config,
    contentDir: path.join(process.cwd(), "content", locale, config.domain, topic),
    routeDir: path.join(process.cwd(), "src", "app", "[locale]", ...config.routePathSegments),
  };
}

function buildIntro(title: string) {
  return `Подтема про ${title.toLowerCase()}: краткое объяснение, алгоритм и типичные ошибки.`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const existingIndex = await loadTopicSubtopicIndex(args.topic, {
    locale: args.locale,
  });
  const existingOrder = existingIndex.subtopics.find((item) => item.order === args.order);
  if (existingOrder) {
    throw new Error(
      `Order ${args.order} is already used by "${existingOrder.title}" (${existingOrder.slug}). Choose another order (e.g. ${args.order + 5} or ${args.order + 10}).`,
    );
  }
  const existingSlug = existingIndex.subtopics.find((item) => item.slug === args.slug);
  if (existingSlug) {
    throw new Error(`Slug "${args.slug}" is already used by "${existingSlug.title}".`);
  }

  const { config, contentDir, routeDir } = resolveTopicDir(args.locale, args.topic);
  const targetFile = path.join(contentDir, `${args.slug}.mdx`);
  const routePageDir = path.join(routeDir, args.slug);
  const routePageFile = path.join(routePageDir, "page.tsx");

  try {
    await fs.stat(targetFile);
    throw new Error(`File already exists: ${path.relative(process.cwd(), targetFile)}`);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || (error as NodeJS.ErrnoException).code !== "ENOENT") {
      if (error instanceof Error) throw error;
      throw new Error("Failed to check target file");
    }
  }

  const templatePath = path.join(process.cwd(), "templates", "content", "subtopic-page.mdx.template");
  const template = await fs.readFile(templatePath, "utf8");

  const content = template
    .replaceAll("Название подтемы", args.title)
    .replaceAll("your-slug", args.slug)
    .replace("order: 50", `order: ${args.order}`)
    .replace(
      'intro="Короткое описание подтемы для hero-блока."',
      `intro=${JSON.stringify(buildIntro(args.title))}`,
    );

  await fs.mkdir(contentDir, { recursive: true });
  await fs.writeFile(targetFile, content, "utf8");

  let createdRouteWrapper = false;
  try {
    await fs.stat(routePageFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      const routeWrapper = [
        `export { default } from "@/content/${config.defaultLocale}/${config.domain}/${args.topic}/${args.slug}.mdx";`,
        "",
      ].join("\n");
      await fs.mkdir(routePageDir, { recursive: true });
      await fs.writeFile(routePageFile, routeWrapper, "utf8");
      createdRouteWrapper = true;
    } else {
      throw error;
    }
  }

  console.log("Created subtopic MDX:");
  console.log(`- ${path.relative(process.cwd(), targetFile)}`);
  if (createdRouteWrapper) {
    console.log(`- ${path.relative(process.cwd(), routePageFile)} (route wrapper)`);
  } else {
    console.log(`- ${path.relative(process.cwd(), routePageFile)} (route wrapper already exists, kept as-is)`);
  }
  console.log("");
  console.log("Next steps:");
  console.log("1. Review intro text and complete the article content.");
  console.log("2. Ensure heading ids are stable for TOC.");
  console.log("3. Run: pnpm validate:content");
}

main().catch((error) => {
  console.error("Failed to create subtopic MDX.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
