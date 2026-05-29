// config/prisma.ts
import { PrismaClient } from "@prisma/client";

// Déclaration globale pour éviter les fuites de connexions en mode développement (Next.js Hot Reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Si l'instance existe déjà, on la réutilise, sinon on en crée une nouvelle
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
