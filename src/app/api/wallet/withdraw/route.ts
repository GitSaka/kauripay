import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amountFcfa, destinationPhone } = body;

    if (!userId || !amountFcfa || amountFcfa <= 0 || !destinationPhone) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const userWallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { user: { select: { kycStatus: true, phone: true } } }
    });

    if (!userWallet || userWallet.user?.kycStatus !== "verified") {
      return NextResponse.json({ error: "Compte non vérifié (KYC)." }, { status: 403 });
    }

    if (userWallet.balanceFcfa < amountFcfa) {
      return NextResponse.json({ error: "Solde insuffisant." }, { status: 400 });
    }

    // Extraction du dernier deal pour satisfaire la clé étrangère obligatoire de ton schéma
    const lastSellerDeal = await prisma.escrowTransaction.findFirst({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });

    if (!lastSellerDeal) {
      return NextResponse.json({ error: "Aucun deal trouvé pour lier le virement." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Débit direct du solde
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balanceFcfa: { decrement: amountFcfa } }
      });

      // Écriture comptable scellée sur ton vrai enum 'withdrawal'
      const historyEntry = await tx.transactionHistory.create({
        data: {
          transactionId: lastSellerDeal.id,
          type: "withdrawal", // 🔒 ALIGNÉ SUR TON SCHEMA
          amountFcfa: amountFcfa,
          metadata: {
            withdrawnByUserId: userId,
            momoDestination: destinationPhone.trim(),
            payoutStatus: "PENDING",
            timestamp: new Date().toISOString()
          }
        }
      });

      // Création de la notification
      await tx.notification.create({
        data: {
          userId,
          type: "RELEASED", // Aligné sur ton enum NotificationType
          title: "Demande de virement reçue 💸",
          message: `Votre retrait de ${amountFcfa.toLocaleString("fr-FR")} F CFA vers ${destinationPhone} est en cours.`,
          link: "/dashboard"
        }
      });

      return { updatedWallet, historyEntry };
    });

    return NextResponse.json({
      message: "Succès",
      balanceFcfa: result.updatedWallet.balanceFcfa,
      historyId: result.historyEntry.id
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
