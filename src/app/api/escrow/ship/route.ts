import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, trackingNumber } = body;
    console.log(body)
    // 1. Contrôle de surface strict sur les données reçues
    if (!id || !userId || !trackingNumber) {
      return NextResponse.json(
        { error: "Données manquantes pour valider l'expédition du colis." },
        { status: 400 }
      );
    }

    // 2. Chargement du deal en cours depuis ta base Neon Cloud
    const deal = await prisma.escrowTransaction.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Cette transaction n'existe pas ou a été annulée." },
        { status: 404 }
      );
    }

    // 🚨 3. LE BOUCLIER DE RÔLE : Seul le vendeur enregistré a le droit d'expédier !
    if (deal.sellerId !== userId) {
      console.error(`🚨 FRAUDE REJETÉE : L'utilisateur ${userId} a tenté d'expédier le deal ${deal.ref}`);
      return NextResponse.json(
        { error: "Action non autorisée. Seul le vendeur officiel de ce séquestre peut valider l'expédition." },
        { status: 403 } // 🔒 403 Forbidden (Interdit)
      );
    }

    // Sécurité d'état : On ne peut expédier que si l'argent est déjà bien bloqué au chaud
    if (deal.status !== TransactionStatus.FUNDS_SECURED) {
      return NextResponse.json(
        { error: "Impossible d'expédier : l'acheteur n'a pas encore sécurisé les fonds dans le coffre-fort." },
        { status: 400 }
      );
    }

    // 4. TRANSACTION ATOMIQUE PRISMA POUR METTRE À JOUR LE STATUT ET ALERTER
    const updatedDeal = await prisma.$transaction(async (tx) => {
      
      // A. Passage du séquestre en mode Transit (IN_DELIVERY)
      const updated = await tx.escrowTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.IN_DELIVERY,
          
          trackingNumber: trackingNumber.trim(),

          trackingUrl: body.trackingUrl ? body.trackingUrl.trim() : null,
        },
      });

      // B. Alerte instantanée pour l'acheteur (Koffi) s'il possède déjà son compte
      if (deal.buyerId) {
        await tx.notification.create({
          data: {
            userId: deal.buyerId,
            transactionId: deal.id,
            type: NotificationType.PAYMENT_RECEIVED,
            title: "Votre colis a été expédié ! 🚚",
            message: `Le bordereau de transport a été enregistré : ${trackingNumber.trim()}. Suivez l'arrivée du bus à la gare.`,
            link: `/deal/${deal.id}`,
          },
        });
      }

      // C. Inscription historique immuable dans le grand livre comptable (Append-Only)
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "colis_expedie",
          amountFcfa: deal.amountFcfa,
          metadata: {
            confirmedBySellerId: userId,
            registeredTracking: trackingNumber.trim(),
            timestamp: new Date().toISOString()
          },
        },
      });

      return updated;
    });

    // 5. Renvoi des données fraîches au Frontend pour illuminer le jalon 3
    return NextResponse.json({
      message: "Bordereau logistique enregistré. Le colis est officiellement en route.",
      deal: {
        id: updatedDeal.id,
        ref: updatedDeal.ref,
        description: updatedDeal.description,
        amountFcfa: updatedDeal.amountFcfa,
        feeFcfa: updatedDeal.feeFcfa,
        totalFcfa: updatedDeal.totalFcfa,
        status: updatedDeal.status,
        sellerId: updatedDeal.sellerId,
        buyerId: updatedDeal.buyerId || "",
        buyerPhone: updatedDeal.buyerPhone,
        trackingNumber: updatedDeal.trackingNumber,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ ERREUR_API_ESCROW_SHIP :", error);
    return NextResponse.json(
      { error: "Défaut technique interne lors de la validation du bordereau de transport." },
      { status: 500 }
    );
  }
}
