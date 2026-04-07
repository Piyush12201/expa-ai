import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
const runtimeDatabaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!runtimeDatabaseUrl) {
  throw new Error("Missing database connection string. Set DATABASE_URL or DIRECT_URL.");
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
