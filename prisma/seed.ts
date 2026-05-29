import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Lancement du script de Seed KauriPay...");

  // 1. Chiffrement du mot de passe de l'administrateur
  // Remplace "SuperSecretAdminPass123" par le mot de passe de ton choix
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("AdminPass123", salt);

  // 2. Création ou mise à jour du compte ADMIN suprême
  // Remplace par ton vrai numéro WhatsApp béninois (+229...)
  const adminUser = await prisma.user.upsert({
    where: { phone: "+2290100000000" },
    update: {},
    create: {
      phone: "+2290100000000",
      name: "Admin KauriPay",
      passwordHash: passwordHash,
      kycStatus: "verified",
      role: "ADMIN", // 🔒 SCELLAGE DU RÔLE ADMIN DIRECT
      rating: 5.0,
    },
  });

  // 3. Création automatique du portefeuille rattaché à l'Admin
  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      balanceFcfa: 0,
      escrowFcfa: 0,
    },
  });

  console.log(`✅ Compte ADMIN créé avec succès ! ID: ${adminUser.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
