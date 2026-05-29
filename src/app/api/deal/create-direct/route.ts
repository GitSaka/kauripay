import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus } from "@prisma/client";

// Simulation de l'appel API vers ton agrégateur béninois (FedaPay / KkiaPay)
async function appelerPasserelleMobileMoney(payload: { total: number; phone: string; ref: string }) {
  // Ici s'injectera le fetch réel vers l'API de ton choix pour déclencher le Push USSD MTN/Moov
  return {
    payUrl: `/payment/mock-gateway?ref=${payload.ref}&total=${payload.total}&phone=${payload.phone.replace("+229", "")}`
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyerId, sellerPhone, amountFcfa, description } = body;

    // 1. Contrôles de surface rigoureux côté serveur
    if (!buyerId || !sellerPhone || !amountFcfa || !description) {
      return NextResponse.json(
        { error: "Toutes les informations (vendeur, montant, description) sont obligatoires." },
        { status: 400 }
      );
    }

    // 2. Sécurité : Vérification stricte que l'acheteur connecté existe réellement
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Action non autorisée. Compte acheteur introuvable." },
        { status: 401 }
      );
    }

    const cleanSellerPhone = sellerPhone.replace(/\s/g, "");
    const parsedAmount = parseInt(amountFcfa, 10);

    if (isNaN(parsedAmount) || parsedAmount < 500) {
      return NextResponse.json(
        { error: "Le montant saisi doit être un chiffre valide (Minimum 500 F CFA)." },
        { status: 400 }
      );
    }

    // Sécurité anti-fraude locale : Interdiction de s'envoyer de l'argent à soi-même
    if (buyer.phone === cleanSellerPhone) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas sécuriser un paiement vers votre propre numéro WhatsApp." },
        { status: 400 }
      );
    }

    // 3. Calcul de la commission KauriPay (3% avec un plancher à 500F)
    const rawFee = Math.round(parsedAmount * 0.03);
    const feeFcfa = rawFee < 500 ? 500 : rawFee;
    const totalFcfa = parsedAmount + feeFcfa;

    // Génération d'une référence unique métier courte (ex: KRP-728193)
    const randomRef = `KRP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Recherche de Yao (le vendeur) pour lier son ID s'il possède déjà un compte
    const existingSeller = await prisma.user.findUnique({
      where: { phone: cleanSellerPhone },
    });

    // 5. Exécution unifiée au sein d'une transaction Prisma atomique
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Création de la ligne officielle d'Escrow à l'état PENDING_PAYMENT
      const deal = await tx.escrowTransaction.create({
        data: {
          ref: randomRef,
          sellerId: existingSeller ? existingSeller.id : "ACCOUNT_ATTENTE_TECHNIQUE", // Gestion de l'onboarding futur
          buyerId: buyer.id,
          buyerPhone: buyer.phone,
          amountFcfa: parsedAmount,
          feeFcfa,
          totalFcfa,
          status: TransactionStatus.PENDING_PAYMENT, // Reste bloqué ici tant que le code PIN n'est pas tapé
          description: description.trim(),
        },
      });

      // B. Journalisation comptable immédiate de l'initiative acheteur
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "direct_initiated",
          amountFcfa: parsedAmount,
          metadata: {
            initiatedByBuyerId: buyer.id,
            sellerTargetPhone: cleanSellerPhone,
            calculatedFee: feeFcfa,
            sellerHasAccount: !!existingSeller,
          },
        },
      });

      return deal;
    });

    // 6. Déclenchement automatique de la passerelle de paiement Mobile Money
    const gatewayResponse = await appelerPasserelleMobileMoney({
      total: totalFcfa,
      phone: buyer.phone,
      ref: result.ref
    });

    // 7. Renvoi de l'URL de redirection immédiate pour le téléphone de Koffi
    return NextResponse.json(
      {
        message: "Paiement direct initialisé. Redirection...",
        paymentUrl: gatewayResponse.payUrl,
        ref: result.ref,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ ERREUR_CREATE_DIRECT_API :", error);
    return NextResponse.json(
      { error: "Impossible d'initier le paiement direct sécurisé." },
      { status: 500 }
    );
  }
}
