import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function GET(request: Request) {
  try {
    // 1. Extraction de la référence (ex: KRP-847293) depuis l'URL
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { error: "Référence de transaction manquante." },
        { status: 400 }
      );
    }

    // 2. Recherche du deal unique dans la table EscrowTransaction
    const deal = await prisma.escrowTransaction.findUnique({
      where: { ref: ref },
      include: {
        seller: {
          select: {
            name: true, // On récupère le nom du vendeur pour rassurer l'acheteur
          },
        },
      },
    });

    // 3. Sécurité : Si la référence n'existe pas en base de données
    if (!deal) {
      return NextResponse.json(
        { error: "Ce lien de paiement n'existe pas ou a été supprimé." },
        { status: 404 }
      );
    }

    // 4. Renvoi des données nettoyées et structurées pour la page publique
    return NextResponse.json({
      deal: {
        id: deal.id,
        ref: deal.ref,
        description: deal.description,
        amountFcfa: deal.amountFcfa,
        feeFcfa: deal.feeFcfa,
        totalFcfa: deal.totalFcfa,
        status: deal.status,
        sellerName: deal.seller.name,
        buyerPhone: deal.buyerPhone, // Permet de pré-remplir le champ si Yao l'avait saisi
      },
    });

  } catch (error) {
    console.error("❌ ERREUR_GET_LINK_API :", error);
    return NextResponse.json(
      { error: "Une erreur technique est survenue lors de la récupération de la facture." },
      { status: 500 }
    );
  }
}
