import { promises as fs } from "node:fs";
import path from "node:path";

import { parseSubtopicMetaFromMdx } from "../src/lib/content/source-app-routes";
import { requireContentTopicConfig } from "../src/lib/content/topic-registry";

type Args = {
  topic: string;
  locale: "ru" | "en" | "de";
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  const flags = new Set<string>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      flags.add(key);
      continue;
    }

    values.set(key, next);
    i += 1;
  }

  const topic = values.get("topic");
  const localeRaw = values.get("locale") ?? "ru";

  if (!topic) {
    throw new Error(
      "Usage: pnpm content:migrate-topic-stage2c -- --topic <topicSlug> [--locale ru|en|de] [--dry-run]",
    );
  }

  if (localeRaw !== "ru" && localeRaw !== "en" && localeRaw !== "de") {
    throw new Error(`Invalid --locale "${localeRaw}". Use: ru | en | de`);
  }

  return {
    topic,
    locale: localeRaw,
    dryRun: flags.has("dry-run"),
  };
}

function routeTopicDir(topicSlug: string, routePathSegments: string[]) {
  return path.join(process.cwd(), "src", "app", "[locale]", ...routePathSegments);
}

function contentTopicDir(locale: string, domain: string, topicSlug: string) {
  return path.join(process.cwd(), "content", locale, domain, topicSlug);
}

function contentImportPath(locale: string, domain: string, topicSlug: string, slug: string) {
  return `@/content/${locale}/${domain}/${topicSlug}/${slug}.mdx`;
}

function routeTemplateImportPath(routePathSegments: string[]) {
  return `@/src/app/[locale]/${routePathSegments.join("/")}/subtopic-page-template`;
}

function rewriteForContentSource(source: string, routePathSegments: string[]) {
  const targetTemplateImport = routeTemplateImportPath(routePathSegments);
  let rewritten = source;
  let replaced = false;

  const patterns = [
    /from\s+["']\.\.\/subtopic-page-template["']/g,
    /from\s+["']\.\/subtopic-page-template["']/g,
  ];

  for (const pattern of patterns) {
    rewritten = rewritten.replace(pattern, (match) => {
      replaced = true;
      return match.replace(/["'][^"']+["']/, `"${targetTemplateImport}"`);
    });
  }

  if (!replaced && /subtopic-page-template/.test(source)) {
    throw new Error(
      `Could not rewrite subtopic-page-template import automatically. Update imports manually to "${targetTemplateImport}".`,
    );
  }

  return rewritten;
}

type PlannedItem = {
  slug: string;
  title: string;
  routeMdxFile: string;
  contentFile: string;
  routeWrapperFile: string;
};

async function collectTopicSubtopicMdx(routeDir: string, targetContentDir: string): Promise<PlannedItem[]> {
  let entries;
  try {
    entries = await fs.readdir(routeDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      throw new Error(`Route topic directory not found: ${path.relative(process.cwd(), routeDir)}`);
    }
    throw error;
  }

  const items: PlannedItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const routeMdxFile = path.join(routeDir, entry.name, "page.mdx");
    try {
      const stat = await fs.stat(routeMdxFile);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }

    const source = await fs.readFile(routeMdxFile, "utf8");
    const meta = parseSubtopicMetaFromMdx(source, routeMdxFile);
    const slug = meta.slug;

    items.push({
      slug,
      title: meta.title,
      routeMdxFile,
      contentFile: path.join(targetContentDir, `${slug}.mdx`),
      routeWrapperFile: path.join(routeDir, entry.name, "page.tsx"),
    });
  }

  return items;
}

async function fileExists(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = requireContentTopicConfig(args.topic);
  const routeDir = routeTopicDir(args.topic, config.routePathSegments);
  const targetContentDir = contentTopicDir(args.locale, config.domain, args.topic);
  const items = await collectTopicSubtopicMdx(routeDir, targetContentDir);

  if (items.length === 0) {
    console.log("No route-level subtopic page.mdx files found. Nothing to migrate.");
    return;
  }

  console.log(`Stage 2C migration for topic "${args.topic}" (${args.locale}/${config.domain})`);
  console.log(`- Mode: ${args.dryRun ? "dry-run" : "write"}`);
  console.log(`- Route dir: ${path.relative(process.cwd(), routeDir)}`);
  console.log(`- Content dir: ${path.relative(process.cwd(), targetContentDir)}`);
  console.log(`- Subtopics found: ${items.length}`);

  for (const item of items) {
    const routeSource = await fs.readFile(item.routeMdxFile, "utf8");
    const contentSource = rewriteForContentSource(routeSource, config.routePathSegments);
    const wrapperSource = `export { default } from "${contentImportPath(config.defaultLocale, config.domain, args.topic, item.slug)}";\n`;

    const contentExists = await fileExists(item.contentFile);
    const wrapperExists = await fileExists(item.routeWrapperFile);

    console.log("");
    console.log(`• ${item.slug} — ${item.title}`);
    console.log(`  - route mdx: ${path.relative(process.cwd(), item.routeMdxFile)}`);
    console.log(`  - content : ${path.relative(process.cwd(), item.contentFile)}${contentExists ? " (exists)" : ""}`);
    console.log(`  - wrapper : ${path.relative(process.cwd(), item.routeWrapperFile)}${wrapperExists ? " (exists)" : ""}`);

    if (args.dryRun) continue;

    await fs.mkdir(path.dirname(item.contentFile), { recursive: true });
    if (!contentExists) {
      await fs.writeFile(item.contentFile, contentSource, "utf8");
    }
    if (!wrapperExists) {
      await fs.writeFile(item.routeWrapperFile, wrapperSource, "utf8");
    }

    await fs.unlink(item.routeMdxFile);
  }

  if (args.dryRun) {
    console.log("");
    console.log("Dry run complete. Re-run without --dry-run to apply migration.");
    return;
  }

  console.log("");
  console.log("Migration complete.");
  console.log("Next steps:");
  console.log("1. pnpm validate:content");
  console.log("2. pnpm lint && pnpm typecheck && pnpm test");
  console.log("3. pnpm dev (smoke) and verify sidebar/TOC/routes");
}

main().catch((error) => {
  console.error("Failed to migrate topic to Stage 2C.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

