import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function isClosedConnectionError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    code === "P1017" ||
    message.includes("postgresql connection") ||
    message.includes("kind: closed") ||
    message.includes("server has closed the connection")
  );
}

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

const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: runtimeDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (!prismaClient.__retryMiddlewareInstalled) {
  prismaClient.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      if (!isClosedConnectionError(error)) {
        throw error;
      }

      try {
        await prismaClient.$disconnect();
      } catch {
        // Ignore disconnect failures during retry path.
      }

      await prismaClient.$connect();
      return next(params);
    }
  });

  Object.defineProperty(prismaClient, "__retryMiddlewareInstalled", {
    value: true,
    enumerable: false,
    writable: false,
  });
}

export const prisma = prismaClient;

export default prismaClient;

if (process.env.NODE_ENV !== "production") {
  prisma
    .$connect()
    .catch(() => {
      // Keep startup resilient; request-time middleware handles retry.
    });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
