import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function normalizeDatabaseUrl(value) {
  if (!value) return "";

  const trimmed = String(value).trim();

  // Handles accidental values like: psql 'postgresql://...'
  const psqlMatch = trimmed.match(/(postgres(?:ql)?:\/\/[^\s'"`]+)/i);
  const extracted = psqlMatch ? psqlMatch[1] : trimmed;

  // Strip wrapping quotes if present
  const unquoted = extracted.replace(/^['"`]|['"`]$/g, "").trim();

  return unquoted;
}

const runtimeDatabaseUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL || process.env.DIRECT_URL
);

// Keep Prisma internals aligned with a normalized URL when possible.
if (runtimeDatabaseUrl) {
  process.env.DATABASE_URL = runtimeDatabaseUrl;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: runtimeDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
