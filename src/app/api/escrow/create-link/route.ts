import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerId, buyerPhone, amountFcfa, description } = body;

    // 1. Contrôles de surface rigoureux côté serveur
    if (!sellerId || !buyerPhone || !amountFcfa || !description) {
      return NextResponse.json(
        { error: "Toutes les informations (téléphone, montant, description) sont obligatoires." },
        { status: 400 }
      );
    }

    // 2. Vérification de sécurité : Est-ce que Yao (le vendeur connecté) existe ?
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Action non autorisée. Compte vendeur introuvable." },
        { status: 401 }
      );
    }

    const cleanBuyerPhone = buyerPhone.replace(/\s/g, "");
    const parsedAmount = parseInt(amountFcfa, 10);

    if (isNaN(parsedAmount) || parsedAmount < 500) {
      return NextResponse.json(
        { error: "Le montant saisi doit être un chiffre valide (Minimum 500 F CFA)." },
        { status: 400 }
      );
    }

    // Sécurité anti-fraude locale : Interdiction d'émettre un lien vers soi-même
    if (seller.phone === cleanBuyerPhone) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas créer un lien de paiement pour votre propre numéro WhatsApp." },
        { status: 400 }
      );
    }

    // 3. Calcul de la commission KauriPay (3% avec plancher à 500F - Règle Mur n°3)
    const rawFee = Math.round(parsedAmount * 0.03);
    const feeFcfa = rawFee < 500 ? 500 : rawFee;
    const totalFcfa = parsedAmount + feeFcfa;

    // Génération d'une référence unique métier courte et propre (ex: KRP-847293)
    const randomRef = `KRP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Recherche de Koffi (l'acheteur) pour lier son ID s'il possède déjà un compte
    const existingBuyer = await prisma.user.findUnique({
      where: { phone: cleanBuyerPhone },
    });

    // 5. Exécution unifiée au sein d'une transaction Prisma atomique
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Création de la ligne officielle d'Escrow à l'état initial PENDING_PAYMENT
      const deal = await tx.escrowTransaction.create({
        data: {
          ref: randomRef,
          sellerId: seller.id,
          buyerPhone: cleanBuyerPhone,
          buyerId: existingBuyer ? existingBuyer.id : null, // Nullable si Koffi n'est pas encore inscrit
          amountFcfa: parsedAmount,
          feeFcfa,
          totalFcfa,
          status: TransactionStatus.PENDING_PAYMENT,
          description: description.trim(),
        },
      });

      // B. Si l'acheteur est déjà inscrit, on lui pousse une notification dans son application
      if (existingBuyer) {
        await tx.notification.create({
          data: {
            userId: existingBuyer.id,
            transactionId: deal.id,
            type: NotificationType.TRANSACTION_CREATED,
            title: "Nouveau lien de paiement reçu",
            message: `${seller.name} vous invite à sécuriser un paiement de ${parsedAmount.toLocaleString("fr-FR")} F CFA pour : ${description.trim()}.`,
            link: `/deal/${deal.id}`,
          },
        });
      }

      // C. Journalisation comptable immédiate de la création de la demande (Append-Only)
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "link_created",
          amountFcfa: parsedAmount,
          metadata: {
            initiatedBySellerId: seller.id,
            buyerTargetPhone: cleanBuyerPhone,
            calculatedFee: feeFcfa,
            buyerHasAccount: !!existingBuyer,
          },
        },
      });

      return deal;
    });

    // 6. Renvoi des informations de succès pour générer le bouton de partage WhatsApp
    return NextResponse.json(
      {
        message: "Lien de paiement généré avec succès.",
        ref: result.ref,
        dealId: result.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ ERREUR_CREATE_LINK_API :", error);
    return NextResponse.json(
      { error: "Une erreur technique est survenue lors de la création du lien de paiement." },
      { status: 500 }
    );
  }
}
