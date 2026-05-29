import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId"); // 🔒 ON CAPTURE L'USER CONNECTÉ

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Paramètres manquants pour la vérification de sécurité." },
        { status: 400 }
      );
    }

    // 🕵️‍♂️ 1. RECHERCHE PRISMA SIMPLE ET SANS RISQUE DE CONFLIT DE RELATION
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id },
      include: {
        seller: { select: { name: true } },
        buyer: { select: { name: true } },
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Ce séquestre n'existe pas ou a été supprimé." },
        { status: 404 }
      );
    }

    // 🚨 2. LE BOUCLIER SÉCURITÉ DE KAURIPAY
    const isSeller = transaction.sellerId === userId;
    const isBuyer = transaction.buyerId === userId;

    if (!isSeller && !isBuyer) {
      console.error(`⚠️ ALERTE SÉCURITÉ : L'utilisateur ${userId} a tenté d'espionner le deal ${id}`);
      return NextResponse.json(
        { error: "Accès refusé. Vous n'êtes ni l'acheteur ni le vendeur de cette transaction." },
        { status: 403 }
      );
    }

    // 🔒 3. RECHERCHE DE SÉCURITÉ DE LA RAISON DU LITIGE TOTALEMENT ISOLÉE
    // Cela ne passe plus par le include de la transaction, donc Prisma ne peut plus jamais crasher ici
    let dbDisputeReason: string | null = null;

    try {
      // On cherche de manière autonome dans la table de l'historique
      // Si la table porte un autre nom dans ton schéma (ex: history), le catch intercepte sans faire planter l'API
      const historyEntry = await (prisma as any).transactionHistory.findFirst({
        where: {
          transactionId: id,
          type: "litige_ouvert"
        },
        orderBy: { createdAt: "desc" }
      });

      if (historyEntry && historyEntry.metadata) {
        const metadata = typeof historyEntry.metadata === "string" 
          ? JSON.parse(historyEntry.metadata) 
          : historyEntry.metadata;
        dbDisputeReason = metadata?.reportedReason || null;
      }
    } catch (historyError) {
      // En cas de problème de nom de table dans l'historique, le catch étouffe l'erreur discrètement
      console.warn("⚠️ Note : Impossible de lire le motif dans l'historique, valeur par défaut appliquée.");
    }

    // 4. Renvoi des données si l'utilisateur est légitime
    return NextResponse.json({
      deal: {
        id: transaction.id,
        ref: transaction.ref,
        description: transaction.description || "Achat Sécurisé",
        amountFcfa: transaction.amountFcfa,
        feeFcfa: transaction.feeFcfa,
        totalFcfa: transaction.totalFcfa,
        status: transaction.status,
        sellerId: transaction.sellerId,
        buyerId: transaction.buyerId || "",
        buyerPhone: transaction.buyerPhone,
        sellerName: transaction.seller?.name || "Vendeur Kauri",
        buyerName: transaction.buyer?.name || "Acheteur Invité",
        trackingNumber: transaction.trackingNumber,
        trackingUrl: transaction.trackingUrl,
        updatedAt: transaction.updatedAt.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        dbDisputeReason: dbDisputeReason 
      }
    });

  } catch (error: any) {
    console.error("❌ ERREUR_GET_BY_ID_API :", error);
    return NextResponse.json(
      { error: "Erreur technique lors du contrôle de sécurité." },
      { status: 500 }
    );
  }
}
