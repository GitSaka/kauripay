import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, reason } = body;

    // 1. Contrôle de surface strict sur les données reçues
    if (!id || !userId || !reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Le motif écrit de la réclamation ou du litige est obligatoire pour bloquer le dossier." },
        { status: 400 }
      );
    }

    // 2. Chargement de la transaction depuis ta base Neon Cloud
    const deal = await prisma.escrowTransaction.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Cette transaction n'existe pas ou a été annulée." },
        { status: 404 }
      );
    }

    // 🚨 3. LE BOUCLIER DE RÔLE BILATÉRAL : L'utilisateur connecté fait-il partie du deal ?
    const isBuyer = deal.buyerId === userId;
    const isSeller = deal.sellerId === userId;

    if (!isBuyer && !isSeller) {
      console.error(`🚨 TENTATIVE D'INTRUSION REJETÉE : L'utilisateur ${userId} a tenté de geler le deal ${deal.ref}`);
      return NextResponse.json(
        { error: "Action non autorisée. Vous n'avez pas les droits de gestion sur ce séquestre." },
        { status: 403 } // 🔒 403 Forbidden
      );
    }

    // Sécurité d'état : On ne peut bloquer un deal que si le colis est actuellement en route (IN_DELIVERY)
    if (deal.status !== TransactionStatus.IN_DELIVERY) {
      return NextResponse.json(
        { error: "Action impossible : un litige ou une réclamation ne peut être ouvert que si le colis est en transit." },
        { status: 400 }
      );
    }

    // 4. TRANSACTION FINANCIÈRE ATOMIQUE PRISMA POUR METTRE LES FCFA SOUS SCELLÉS
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Étape logique : Passage immédiat du statut à DISPUTED (Fonds gelés de manière neutre)
      const updatedDeal = await tx.escrowTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.DISPUTED,
        },
      });

      // B. Calcul de la cible de la notification (Si l'acheteur bloque, on alerte le vendeur, et vice-versa)
      const targetUserId = isBuyer ? deal.sellerId : (deal.buyerId || "");
      
      if (targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            transactionId: deal.id,
            type: NotificationType.DISPUTE_OPENED, // Aligné sur tes enums réels Prisma
            title: isBuyer ? "Alerte : Litige ouvert par l'acheteur ⚠️" : "Alerte : Réclamation ouverte par le vendeur ⚠️",
            message: `La transaction a été suspendue. Motif : "${reason.trim()}". L'argent est bloqué en attente d'arbitrage.`,
            link: `/dashboard/deal/${deal.id}`,
          },
        });
      }

      // C. Inscription historique immuable dans le grand livre comptable (Append-Only)
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "litige_ouvert",
          amountFcfa: deal.amountFcfa,
          metadata: {
            initiatedByUserId: userId,
            userRole: isBuyer ? "BUYER" : "SELLER",
            reportedReason: reason.trim(),
            frozenAmount: deal.amountFcfa,
            timestamp: new Date().toISOString()
          },
        },
      });

      return updatedDeal;
    });

    // 5. Renvoi du deal fraîchement mis sous scellés pour actualiser l'écran des deux côtés
    return NextResponse.json({
      message: "Incident enregistré avec succès. Les fonds sont gelés de manière sécurisée.",
      deal: {
        id: result.id,
        ref: result.ref,
        description: result.description,
        amountFcfa: result.amountFcfa,
        feeFcfa: result.feeFcfa,
        totalFcfa: result.totalFcfa,
        status: result.status,
        sellerId: result.sellerId,
        buyerId: result.buyerId || "",
        buyerPhone: result.buyerPhone,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ ERREUR_API_ESCROW_DISPUTE :", error);
    return NextResponse.json(
      { error: "Défaut technique interne lors de la mise sous scellés de la transaction." },
      { status: 500 }
    );
  }
}
