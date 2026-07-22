import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.warn("⚠️ DATABASE_URL is not set in environment variables!");
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return prisma;
}
