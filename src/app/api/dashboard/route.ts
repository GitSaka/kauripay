import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentification requise. Identifiant introuvable." },
        { status: 401 }
      );
    }

    // 2. Requête atomique parallèle complète pour charger le tableau de bord
    const [wallet, user, transactions, unreadNotificationsCount] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId },
      }),

      // Récupération des données d'identité pour le numéro de retrait
      prisma.user.findUnique({
        where: { id: userId },
        select: { kycStatus: true, phone: true }
      }),

      // 🔓 LOGIQUE LIBÉRÉE : Suppression de "take: 5" pour remonter l'intégralité de la base Neon
      prisma.escrowTransaction.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          buyer: { select: { name: true, phone: true } },
          seller: { select: { name: true, phone: true } }
        }
      }),

      prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    ]);

        // 🕵️‍♂️ RECHERCHE RELATIONNELLE INDESTRUCTIBLE :
   
         // 🕵️‍♂️ Extraction relationnelle : On prend l'historique lié aux transactions de ce vendeur
    const rawWithdrawals = await prisma.transactionHistory.findMany({
      where: {
        type: "withdrawal", // 🔒 ALIGNÉ SUR TON SCHEMA
        transaction: {
          sellerId: userId
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const withdrawals = rawWithdrawals.map((w) => {
      const meta = w.metadata as any;
      return {
        id: w.id,
        amount: w.amountFcfa,
        phone: meta?.momoDestination || "MoMo",
        status: meta?.payoutStatus || "PENDING",
        date: w.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      };
    });


    if (!wallet) {
      return NextResponse.json(
        { error: "Portefeuille financier introuvable pour cet utilisateur." },
        { status: 404 }
      );
    }

    // 3. Renvoi des données nettoyées et synchronisées avec le Frontend
    return NextResponse.json({
      wallet: {
        balanceFcfa: wallet.balanceFcfa,
        escrowFcfa: wallet.escrowFcfa,
      },
      user: {
        kycStatus: user?.kycStatus || "unverified",
        phone: user?.phone || "",
      },
      transactions: transactions.map((tx: any) => ({
        id: tx.id,
        ref: tx.ref,
        amount: tx.amountFcfa,
        status: tx.status,
        // 🔒 SYNCHRONISATION : Remplacement de productName par description pour le Frontend
        description: tx.description || "Achat Sécurisé",
        role: tx.buyerId === userId ? "BUYER" : "SELLER",
        // Blindage contre les valeurs nulles si l'acheteur invité n'a pas encore de compte
        partnerName: tx.buyerId === userId 
          ? (tx.seller?.name || "Vendeur Kauri") 
          : (tx.buyer?.name || tx.buyerPhone),
        date: tx.createdAt,
      })),
      withdrawals: withdrawals,
      unreadNotificationsCount
    });

  } catch (error) {
    console.error("❌ ERREUR_DASHBOARD_API :", error);
    return NextResponse.json(
      { error: "Impossible de charger les données du tableau de bord." },
      { status: 500 }
    );
  }
}
