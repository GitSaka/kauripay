import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, rating } = body;

    // 1. Contrôle de surface strict sur les données reçues
    if (!id || !userId) {
      return NextResponse.json(
        { error: "Données manquantes pour valider la libération des fonds." },
        { status: 400 }
      );
    }

    // 2. Chargement du deal depuis ta base Neon Cloud
    const deal = await prisma.escrowTransaction.findUnique({
      where: { id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Cette transaction n'existe pas ou a été annulée." },
        { status: 404 }
      );
    }

    // 🚨 3. LE BOUCLIER DE RÔLE : Seul l'acheteur enregistré a le droit de libérer l'argent !
    if (deal.buyerId !== userId) {
      console.error(`🚨 TENTATIVE DE VOL DÉTECTÉE : L'utilisateur ${userId} a tenté de libérer les fonds du deal ${deal.ref}`);
      return NextResponse.json(
        { error: "Action non autorisée. Seul l'acheteur officiel de ce séquestre peut débloquer les fonds au vendeur." },
        { status: 403 } // 🔒 403 Forbidden (Interdit)
      );
    }

    // Sécurité d'état : On ne peut libérer l'argent que si le colis est actuellement en route ou en transit
    if (deal.status !== TransactionStatus.IN_DELIVERY) {
      return NextResponse.json(
        { error: "Action impossible : le colis doit être en cours de livraison pour pouvoir libérer l'argent." },
        { status: 400 }
      );
    }

    // 4. TRANSACTION FINANCIÈRE ATOMIQUE PRISMA (LE COEUR DU SYSTEME)
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Étape financière : On transfère les fonds du coffre-fort vers le solde retirable du vendeur
      // On retire le montant de l'escrow bloqué pour alimenter sa balance disponible
      await tx.wallet.update({
        where: { userId: deal.sellerId },
        data: {
          escrowFcfa: { decrement: deal.amountFcfa }, // Enlève de l'argent bloqué
          balanceFcfa: { increment: deal.amountFcfa }, // Injecte dans son argent retirable
        },
      });

      // B. Étape logique : On passe le statut du deal à RELEASED (Terminé)
      const updatedDeal = await tx.escrowTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.RELEASED,
        },
      });

      // C. Enregistrement de la note de réputation (Étoiles) sur la fiche du vendeur
      // Optionnel : Tu pourras lier cela à un système de moyenne d'étoiles global plus tard
       if (rating) {
        await tx.transactionHistory.create({
          data: {
            transactionId: deal.id,
            type: "release", // 🔒 ALIGNÉ : Respecte ton type String strict
            amountFcfa: deal.amountFcfa,
            metadata: {
              subType: "notation_vendeur", // On glisse la précision dans le JSON pour ta vitrine publique !
              starsGiven: parseInt(rating, 10),
              reviewerId: userId,
            },
          },
        });
      }

      // D. Notification push immédiate pour le vendeur Yao pour lui annoncer son virement
      await tx.notification.create({
        data: {
          userId: deal.sellerId,
          transactionId: deal.id,
          type: NotificationType.RELEASED,
          title: "Argent reçu ! 💰✅",
          message: `L'acheteur a validé la conformité du colis. Un montant de ${deal.amountFcfa.toLocaleString("fr-FR")} F CFA a été versé sur votre solde retirable.`,
          link: `/dashboard`,
        },
      });

      // E. Journalisation historique immuable de clôture comptable (Append-Only)
       await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "release", // 🔒 ALIGNÉ : Évite les conflits de types Prisma
          amountFcfa: deal.amountFcfa,
          metadata: {
            subType: "fonds_liberes",
            approvedByBuyerId: userId,
            transferredToSellerId: deal.sellerId,
            stars: rating || 5,
            timestamp: new Date().toISOString()
          },
        },
      });

      return updatedDeal;
    });

    // 5. Renvoi du deal fraîchement clôturé pour actualiser l'écran
    return NextResponse.json({
      message: "Fonds transférés avec succès. La transaction est définitivement clôturée.",
      deal: {
        id: result.id,
        ref: result.ref,
        description: result.description,
        amountFcfa: result.amountFcfa,
        status: result.status,
        feeFcfa: result.feeFcfa,
        sellerId: result.sellerId,
        buyerId: result.buyerId,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ ERREUR_API_ESCROW_RELEASE :", error);
    return NextResponse.json(
      { error: "Une erreur technique interne est survenue lors de la libération des fonds." },
      { status: 500 }
    );
  }
}
