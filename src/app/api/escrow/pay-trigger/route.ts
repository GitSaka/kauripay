import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus } from "@prisma/client";

const FEDAPAY_API_URL = "https://sandbox-api.fedapay.com/v1";

export async function POST(req: NextRequest) {
  try {
    // 🔒 ÉVOLUTION LOGIQUE : Extraction de la quantité choisie et de la note tapée par l'acheteur
    const { ref, phone, quantity, note } = await req.json();

    if (!ref || !phone) {
      return NextResponse.json({ error: "ref et phone requis" }, { status: 400 });
    }

    // 1. Récupère la transaction escrow maîtresse en base de données
    const masterTx = await prisma.escrowTransaction.findUnique({ where: { ref } });

    if (!masterTx) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    const cleanPhone = String(phone).replace(/\s/g, "").replace("+229", "");
    const formattedBuyerPhone = `+229${cleanPhone}`;

    // 🚀 LE MOTEUR DE SÉCURITÉ ANTI-FRAUDE : Un vendeur ne peut pas s'acheter son propre produit
    const seller = await prisma.user.findUnique({ where: { id: masterTx.sellerId } });
    if (seller && seller.phone === formattedBuyerPhone) {
      return NextResponse.json(
        { error: "Action interdite. Vous ne pouvez pas effectuer un paiement sur votre propre lien commercial." },
        { status: 400 }
      );
    }

    // Variable pivot qui va stocker le contrat à traiter par FedaPay
    let targetTx = masterTx;

    // =========================================================================
    // 🔒 FLUX DE DUPLICATION INTELLIGENT AVEC QUANTITÉ ET NOTE CLIENT
    // =========================================================================
    if (masterTx.isReusable) {
      // Validation de la quantité côté serveur pour éviter les fraudes à la virgule
      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        return NextResponse.json({ error: "La quantité choisie doit être supérieure ou égale à 1." }, { status: 400 });
      }

      // CALCULS COMPTABLES DYNAMIQUES BASÉS SUR LA QUANTITÉ
      const finalAmountFcfa = masterTx.amountFcfa * parsedQuantity;
      
      // Application de la commission KauriPay (3% avec plancher à 500 F CFA)
      const rawFee = Math.round(finalAmountFcfa * 0.03);
      const finalFeeFcfa = rawFee < 500 ? 500 : rawFee;
      const finalTotalFcfa = finalAmountFcfa + finalFeeFcfa;

      // Fusion propre de la description du produit et de la note de friperie de l'acheteur
      const cleanNote = note && note.trim().length > 0 ? note.trim() : "Aucune précision.";
      const enrichedDescription = `${masterTx.description} (Qté: ${parsedQuantity}) • Note client: ${cleanNote}`;

      // Génération d'une référence enfant unique pour cet acheteur précis
      const childRef = `KRP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Recherche de l'acheteur pour lier son ID s'il possède déjà un compte KauriPay
      const existingBuyer = await prisma.user.findUnique({
        where: { phone: formattedBuyerPhone },
      });

      // Duplication atomique et sécurisée du contrat enfant sur Neon Cloud
      targetTx = await prisma.escrowTransaction.create({
        data: {
          ref: childRef,
          description: enrichedDescription,
          amountFcfa: finalAmountFcfa,
          feeFcfa: finalFeeFcfa,
          totalFcfa: finalTotalFcfa,
          sellerId: masterTx.sellerId,
          buyerPhone: formattedBuyerPhone,
          buyerId: existingBuyer ? existingBuyer.id : null,
          status: TransactionStatus.PENDING_PAYMENT,
          parentId: masterTx.id,
        },
      });
    } else {
      // Si c'est un lien classique unique, on valide simplement son statut d'attente
      if (masterTx.status !== "PENDING_PAYMENT") {
        return NextResponse.json({ error: "Transaction invalide ou déjà traitée" }, { status: 400 });
      }
    }

    // On récupère la clé secrète à l'instant T de l'exécution
    const currentFerapaySecret = process.env.FEDAPAY_SECRET_KEY;
    if (!currentFerapaySecret) {
      return NextResponse.json({ error: "Configuration système FedaPay manquante." }, { status: 500 });
    }

    // 2. Crée la transaction FedaPay en mode lien sur le contrat cible (Enfant recalculé ou Classique)
    const createRes = await fetch(`${FEDAPAY_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentFerapaySecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(Number(targetTx.totalFcfa)),
        currency: { iso: "XOF" },
        description: `Séquestre KauriPay ${targetTx.ref}`,
        callback_url: `${process.env.NEXT_PUBLIC_NGROK_URL}/api/payment/webhook`,
        customer: {
          firstname: "Client",
          email: `test+${targetTx.ref}@kauri.com`,
          phone_number: { number: cleanPhone, country: "BJ" }
        }
      })
    });

    const createData = await createRes.json();

    // Extraction sécurisée multi-format de l'ID de session FedaPay
    const fedapayId = createData?.transaction?.id || createData?.["v1/transaction"]?.id || createData?.v1_transaction?.id;

    if (!createRes.ok || !fedapayId) {
      console.error("FedaPay create error:", createData);
      return NextResponse.json({ error: createData.message || "FedaPay refuse d'initialiser la transaction." }, { status: 400 });
    }

    // 3. Génère le jeton de facturation pour l'iframe de ta capsule
    const tokenRes = await fetch(`${FEDAPAY_API_URL}/transactions/${fedapayId}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentFerapaySecret}`,
        "Content-Type": "application/json"
      }
    });

    const tokenData = await tokenRes.json();

    // Extraction sécurisée de l'URL du jeton d'affichage de la facture
    const generatedPaymentUrl = tokenData?.url || tokenData?.["v1/token"]?.url || tokenData?.v1_token?.url || tokenData?.token?.url;

    if (!tokenRes.ok || !generatedPaymentUrl) {
      console.error("FedaPay token error:", tokenData);
      return NextResponse.json({ error: "Impossible de générer le lien de facturation." }, { status: 400 });
    }

    // 4. Mettre à jour le numéro d'appel de l'acheteur si c'est un lien classique
    if (!masterTx.isReusable) {
      await prisma.escrowTransaction.update({
        where: { id: targetTx.id },
        data: { 
          buyerPhone: formattedBuyerPhone
        }
      });
    }

    // 5. Journalisation comptable immuable de l'envoi de la facture Mobile Money
    await prisma.transactionHistory.create({
      data: {
        transactionId: targetTx.id,
        type: "payment_link_created",
        amountFcfa: Number(targetTx.totalFcfa),
        metadata: { 
          fedapay_id: String(fedapayId), 
          payment_url: generatedPaymentUrl,
          isDerivedFromReusable: masterTx.isReusable,
          parentRef: masterTx.isReusable ? masterTx.ref : null,
          userSelectedQuantity: masterTx.isReusable ? quantity : 1
        }
      }
    });

    // 6. Renvoi de la charge utile pour alimenter ton Iframe et déclencher le Polling
    return NextResponse.json({
      status: "requires_action",
      ref: targetTx.ref, // Crucial : Renvoie la référence cible (Enfant recalculé)
      payment_url: generatedPaymentUrl,
      message: "Ouvre ce lien pour payer"
    });

  } catch (err: any) {
    console.error("❌ CRASH_INTERNE_SERVEUR :", err);
    return NextResponse.json({ error: `Erreur serveur réelle : ${err.message}` }, { status: 500 });
  }
}
