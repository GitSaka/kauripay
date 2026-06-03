import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🔒 RECTIFICATION LOGIQUE : On extrait la clé isReusable envoyée par le formulaire du vendeur
    const { sellerId, buyerPhone, amountFcfa, description, isReusable } = body;

    const isLinkPermanent = isReusable === true;

    // 1. Contrôles de surface adaptés selon la nature du lien
    // Si le lien est réutilisable, le numéro de l'acheteur n'est plus obligatoire maintenant
    if (!sellerId || (!isLinkPermanent && !buyerPhone) || !amountFcfa || !description) {
      return NextResponse.json(
        { error: "Toutes les informations (montant, description) sont obligatoires." },
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

    const parsedAmount = parseInt(amountFcfa, 10);
    if (isNaN(parsedAmount) || parsedAmount < 500) {
      return NextResponse.json(
        { error: "Le montant saisi doit être un chiffre valide (Minimum 500 F CFA)." },
        { status: 400 }
      );
    }

    // Traitement du numéro de téléphone de l'acheteur s'il s'agit d'un deal classique unique
    let cleanBuyerPhone = "MULTIPLE";
    if (!isLinkPermanent && buyerPhone) {
      cleanBuyerPhone = buyerPhone.replace(/\s/g, "");
      
      // Sécurité anti-fraude locale : Interdiction d'émettre un lien vers soi-même
      if (seller.phone === cleanBuyerPhone) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas créer un lien de paiement pour votre propre numéro WhatsApp." },
          { status: 400 }
        );
      }
    }

    // 3. Calcul de la commission KauriPay (3% avec plancher à 500F)
    const rawFee = Math.round(parsedAmount * 0.03);
    const feeFcfa = rawFee < 500 ? 500 : rawFee;
    const totalFcfa = parsedAmount + feeFcfa;

    // Génération d'une référence unique métier courte (ex: KRP-847293)
    const randomRef = `KRP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Recherche de Koffi si c'est un lien direct unique
    const existingBuyer = !isLinkPermanent
      ? await prisma.user.findUnique({ where: { phone: cleanBuyerPhone } })
      : null;

    // 5. Exécution unifiée au sein d'une transaction Prisma atomique
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Création de la ligne officielle d'Escrow (Master ou Classique)
      const deal = await tx.escrowTransaction.create({
        data: {
          ref: randomRef,
          sellerId: seller.id,
          buyerPhone: cleanBuyerPhone,
          buyerId: existingBuyer ? existingBuyer.id : null,
          amountFcfa: parsedAmount,
          feeFcfa,
          totalFcfa,
          status: TransactionStatus.PENDING_PAYMENT,
          description: description.trim(),
          // 🔒 LES NOUVELLES COLONNES AJOUTÉES :
          isReusable: isLinkPermanent,
        },
      });

      // B. Si l'acheteur est connu d'avance, on lui pousse une notification
      if (existingBuyer && !isLinkPermanent) {
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

      // C. Journalisation comptable immédiate de la création de la demande
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "link_created",
          amountFcfa: parsedAmount,
          metadata: {
            initiatedBySellerId: seller.id,
            buyerTargetPhone: cleanBuyerPhone,
            calculatedFee: feeFcfa,
            isPermanentLink: isLinkPermanent,
          },
        },
      });

      return deal;
    });

    return NextResponse.json(
      {
        message: isLinkPermanent 
          ? "Lien permanent réutilisable généré avec succès." 
          : "Lien de paiement classique généré avec succès.",
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
