import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

// 🕵️‍♂️ 1. GET : Récupérer tous les litiges ouverts pour l'instruction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    // Sécurité de rôle stricte en base
    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès strictement interdit." }, { status: 403 });
    }

    // On charge tous les litiges avec les détails logistiques et les contacts
    const disputes = await prisma.escrowTransaction.findMany({
      where: { status: TransactionStatus.DISPUTED },
      include: {
        seller: { select: { name: true, phone: true } },
        buyer: { select: { name: true, phone: true } },
        dispute: true
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ⚖️ 2. POST : Trancher le conflit (Libérer ou Annuler)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, transactionId, action, resolutionNote } = body;

    if (!adminId || !transactionId || !action) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Interdit." }, { status: 403 });
    }

    const deal = await prisma.escrowTransaction.findUnique({ where: { id: transactionId } });
    if (!deal || deal.status !== TransactionStatus.DISPUTED) {
      return NextResponse.json({ error: "Transaction non éligible à l'arbitrage." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (action === "RESOLVE_SELLER") {
        // 💰 CAS A : L'arbitre donne raison au Vendeur Yao (Le bus est arrivé, l'acheteur triche)
        await tx.wallet.update({
          where: { userId: deal.sellerId },
          data: {
            escrowFcfa: { decrement: deal.amountFcfa },
            balanceFcfa: { increment: deal.amountFcfa }
          }
        });

        const updated = await tx.escrowTransaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.RELEASED, releasedAt: new Date() }
        });

        await tx.dispute.update({
          where: { transactionId },
          data: { status: "RESOLVED_SELLER", resolvedBy: adminId, resolutionNote }
        });

        // Alerte push pour informer le vendeur de son virement forcé
        await tx.notification.create({
          data: {
            userId: deal.sellerId,
            transactionId: deal.id,
            type: NotificationType.RELEASED,
            title: "Litige tranché : Solde débloqué ! ⚖️💰",
            message: `L'arbitrage KauriPay a validé votre livraison. ${deal.amountFcfa.toLocaleString()} F CFA transférés sur votre solde retirable.`,
            link: "/dashboard"
          }
        });

        return updated;

      } else {
        // 📦 CAS B : L'arbitre donne raison à l'Acheteur Koffi (Le colis était vide ou non envoyé)
        // L'argent quitte le séquestre du projet pour retourner dans la balance disponible de l'acheteur
        if (deal.buyerId) {
          await tx.wallet.update({
            where: { userId: deal.buyerId },
            data: {
              balanceFcfa: { increment: deal.totalFcfa } // On rembourse le total (frais inclus)
            }
          });
        }

        const updated = await tx.escrowTransaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.CANCELLED }
        });

        await tx.dispute.update({
          where: { transactionId },
          data: { status: "RESOLVED_BUYER", resolvedBy: adminId, resolutionNote }
        });

        // Alerte push pour informer l'acheteur de son remboursement
        if (deal.buyerId) {
          await tx.notification.create({
            data: {
              userId: deal.buyerId,
              transactionId: deal.id,
              type: NotificationType.MESSAGE,
              title: "Litige tranché : Remboursement validé ⚖️🔄",
              message: `L'arbitrage KauriPay a annulé le deal ${deal.ref}. Vos ${deal.totalFcfa.toLocaleString()} F CFA ont été recrédités sur votre solde.`,
              link: "/dashboard"
            }
          });
        }

        return updated;
      }
    });

    return NextResponse.json({ message: "Arbitrage scellé avec succès.", status: result.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de l'arbitrage." }, { status: 500 });
  }
}
