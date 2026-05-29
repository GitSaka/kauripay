import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, targetUserId } = body;

    // 1. Contrôle de sécurité strict
    if (!adminId || !targetUserId) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    // 2. Vérification des super-pouvoirs de l'exécuteur
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé. Réservé à l'administrateur." }, { status: 403 });
    }

    // 3. TRANSACTION ATOMIQUE : Mise à jour du statut + envoi d'une alerte push au vendeur
    await prisma.$transaction(async (tx) => {
      
      // A. On bascule le statut KYC en mode vérifié au ras du sol
      await tx.user.update({
        where: { id: targetUserId },
        data: { kycStatus: "verified" }
      });

      // B. On dépose une notification de félicitations sur le Dashboard du vendeur Yao
      await tx.notification.create({
        data: {
          userId: targetUserId,
          type: NotificationType.MESSAGE, // Aligné sur ton enum
          title: "Compte Marchand Certifié ! 🛡️✨",
          message: "Félicitations, votre identité a été validée avec succès par l'équipe KauriPay. Vos demandes de retraits Mobile Money sont désormais actives et instantanées !",
          link: "/dashboard"
        }
      });
    });

    return NextResponse.json({ message: "Le statut KYC a été scellé sur 'verified' avec succès." }, { status: 200 });

  } catch (error) {
    console.error("❌ ERREUR_API_ADMIN_VERIFY_KYC :", error);
    return NextResponse.json({ error: "Une erreur technique est survenue." }, { status: 500 });
  }
}

