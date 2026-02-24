import { PrismaClient } from "@prisma/client";

declare global {
  var __mathsitePrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__mathsitePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__mathsitePrisma = prisma;
}
