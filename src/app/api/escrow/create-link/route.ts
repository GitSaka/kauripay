import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus, NotificationType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🔒 EXTRACTION DU RÔLE : Permet de savoir qui de Koffi ou Yao crée le lien
    const { sellerId, buyerPhone, amountFcfa, description, isReusable, role } = body;

    const isLinkPermanent = isReusable === true;
    const isBuyerInitiated = role === "BUYER";

    // 1. Contrôles de surface adaptés selon la nature de l'initiateur
    if (!sellerId || (!isLinkPermanent && !buyerPhone) || !amountFcfa || !description) {
      return NextResponse.json(
        { error: "Toutes les informations (montant, description) sont obligatoires." },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amountFcfa, 10);
    if (isNaN(parsedAmount) || parsedAmount < 500) {
      return NextResponse.json(
        { error: "Le montant saisi doit être un chiffre valide (Minimum 500 F CFA)." },
        { status: 400 }
      );
    }

    // Nettoyage initial du numéro du partenaire
    const cleanPartnerPhone = buyerPhone ? buyerPhone.replace(/\s/g, "") : "MULTIPLE";

    // Variables pivots pour stocker les vrais IDs à injecter en base de données
    let finalSellerId = "";
    let finalBuyerId: string | null = null;
    let finalBuyerPhone = "MULTIPLE";
    let notificationTargetId: string | null = null;
    let sellerNameForNotification = "";

    // =========================================================================
    // 🔀 LOGIQUE HYBRIDE DE CONFIGURATION DES RÔLES EN BASE DE DONNÉES
    // =========================================================================
    if (isBuyerInitiated) {
      // SCÉNARIO A : L'acheteur connecté crée le deal en tapant le numéro du vendeur
      const buyerUser = await prisma.user.findUnique({ where: { id: sellerId } }); // sellerId contient l'id de la session
      if (!buyerUser) {
        return NextResponse.json({ error: "Session acheteur introuvable." }, { status: 401 });
      }

      // On va chercher le vrai vendeur dans la base via son numéro WhatsApp
      const targetSeller = await prisma.user.findUnique({ where: { phone: cleanPartnerPhone } });
      if (!targetSeller) {
        return NextResponse.json(
          { error: "Aucun compte vendeur n'est rattaché à ce numéro WhatsApp. Invitez le vendeur à s'inscrire." },
          { status: 404 }
        );
      }

      // Sécurité anti-fraude locale : Interdiction d'émettre un lien vers soi-même
      if (buyerUser.phone === targetSeller.phone) {
        return NextResponse.json({ error: "Vous ne pouvez pas initier un achat avec votre propre numéro." }, { status: 400 });
      }

      finalSellerId = targetSeller.id;
      finalBuyerId = buyerUser.id;
      finalBuyerPhone = buyerUser.phone;
      notificationTargetId = targetSeller.id; // On va notifier le vendeur Yao
      sellerNameForNotification = buyerUser.name; // C'est le nom de l'acheteur pour le texte

    } else {
      // SCÉNARIO B : Le vendeur crée le lien pour l'acheteur (Ton flux classique d'origine)
      const sellerUser = await prisma.user.findUnique({ where: { id: sellerId } });
      if (!sellerUser) {
        return NextResponse.json({ error: "Compte vendeur introuvable." }, { status: 401 });
      }

      finalSellerId = sellerUser.id;
      sellerNameForNotification = sellerUser.name;

      if (!isLinkPermanent) {
        finalBuyerPhone = cleanPartnerPhone;
        
        if (sellerUser.phone === finalBuyerPhone) {
          return NextResponse.json({ error: "Vous ne pouvez pas émettre un lien pour votre propre numéro." }, { status: 400 });
        }

        const existingBuyer = await prisma.user.findUnique({ where: { phone: finalBuyerPhone } });
        if (existingBuyer) {
          finalBuyerId = existingBuyer.id;
          notificationTargetId = existingBuyer.id; // On va notifier l'acheteur Koffi
        }
      }
    }

    // 3. Calcul de la commission KauriPay (3% avec plancher à 500F)
    const rawFee = Math.round(parsedAmount * 0.03);
    const feeFcfa = rawFee < 500 ? 500 : rawFee;
    const totalFcfa = parsedAmount + feeFcfa;

    const randomRef = `KRP-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. Exécution unifiée au sein d'une transaction Prisma atomique
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Création de la ligne officielle d'Escrow à l'endroit exact !
      const deal = await tx.escrowTransaction.create({
        data: {
          ref: randomRef,
          sellerId: finalSellerId,
          buyerId: finalBuyerId,
          buyerPhone: finalBuyerPhone,
          amountFcfa: parsedAmount,
          feeFcfa,
          totalFcfa,
          status: TransactionStatus.PENDING_PAYMENT,
          description: description.trim(),
          isReusable: isLinkPermanent && !isBuyerInitiated, // Un lien initié par acheteur n'est jamais réutilisable
        },
      });

      // B. Notification automatique du partenaire cible
      if (notificationTargetId) {
        await tx.notification.create({
          data: {
            userId: notificationTargetId,
            transactionId: deal.id,
            type: NotificationType.TRANSACTION_CREATED,
            title: isBuyerInitiated ? "Proposition d'achat reçue 📦" : "Nouveau lien de paiement reçu 🔒",
            message: isBuyerInitiated
              ? `${sellerNameForNotification} souhaite vous acheter un article pour ${parsedAmount.toLocaleString("fr-FR")} F CFA : ${description.trim()}.`
              : `${sellerNameForNotification} vous invite à sécuriser un paiement de ${parsedAmount.toLocaleString("fr-FR")} F CFA pour : ${description.trim()}.`,
            link: `/deal/${deal.id}`,
          },
        });
      }

      // C. Journalisation comptable
      await tx.transactionHistory.create({
        data: {
          transactionId: deal.id,
          type: "link_created",
          amountFcfa: parsedAmount,
          metadata: {
            initiatedByRole: role,
            calculatedFee: feeFcfa,
            isPermanentLink: isLinkPermanent,
          },
        },
      });

      return deal;
    });

    return NextResponse.json(
      {
        message: "Lien généré avec succès.",
        ref: result.ref,
        dealId: result.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ ERREUR_CREATE_LINK_API :", error);
    return NextResponse.json(
      { error: "Une erreur technique est survenue lors de la création du lien." },
      { status: 500 }
    );
  }
}
