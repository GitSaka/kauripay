import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY!;
const FEDAPAY_API_URL = "https://sandbox-api.fedapay.com/v1";

export async function POST(req: NextRequest) {
  try {
    const { ref, phone } = await req.json();

    if (!ref || !phone) {
      return NextResponse.json({ error: "ref et phone requis" }, { status: 400 });
    }

    // 1. Récupère la transaction escrow
    const tx = await prisma.escrowTransaction.findUnique({ where: { ref } });

    if (!tx || tx.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "Transaction invalide ou déjà traitée" }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\s/g, "").replace("+229", "");

    // 2. Crée la transaction FedaPay en mode lien
    const createRes = await fetch(`${FEDAPAY_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FEDAPAY_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(Number(tx.totalFcfa)), // Forcer un entier strict absolu
        currency: { iso: "XOF" },
        description: `Séquestre KauriPay ${tx.ref}`,
        callback_url: `${process.env.NEXT_PUBLIC_NGROK_URL}/api/payment/webhook`, // Ton URL d'origine inchangée
        customer: {
          firstname: "Client",
          email: `test+${ref}@kauri.com`,
          phone_number: { number: cleanPhone, country: "BJ" }
        }
      })
    });

    const createData = await createRes.json();

    // Extraction sécurisée de l'ID FedaPay
    const fedapayId = createData?.transaction?.id || createData?.["v1/transaction"]?.id || createData?.v1_transaction?.id;

    if (!createRes.ok || !fedapayId) {
      console.error("FedaPay create error:", createData);
      return NextResponse.json({ error: createData.message || "FedaPay refuse d'initialiser la transaction." }, { status: 400 });
    }

    // 3. Génère le lien de paiement (Token de redirection)
    const tokenRes = await fetch(`${FEDAPAY_API_URL}/transactions/${fedapayId}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FEDAPAY_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    const tokenData = await tokenRes.json();

    // Extraction sécurisée de l'URL du jeton FedaPay
    const generatedPaymentUrl = tokenData?.url || tokenData?.["v1/token"]?.url || tokenData?.v1_token?.url || tokenData?.token?.url;

    if (!tokenRes.ok || !generatedPaymentUrl) {
      console.error("FedaPay token error:", tokenData);
      return NextResponse.json({ error: "Impossible de générer le lien de facturation." }, { status: 400 });
    }

    // 4. 🔒 CORRECTIONS COMPTABLES ET ALIGNEMENT PRISMA
    // Suppression complète du champ inconnu fedapayId pour éliminer l'erreur de validation
    await prisma.escrowTransaction.update({
      where: { id: tx.id },
      data: { 
        buyerPhone: `+229${cleanPhone}`
      }
    });

    // Sauvegarde en toute sécurité de l'identifiant FedaPay dans ton journal d'historique (metadata)
    await prisma.transactionHistory.create({
      data: {
        transactionId: tx.id,
        type: "payment_link_created",
        amountFcfa: Number(tx.totalFcfa),
        metadata: { 
          fedapay_id: String(fedapayId), 
          payment_url: generatedPaymentUrl 
        }
      }
    });

    // 5. Renvoie juste le lien, pas de redirection
    return NextResponse.json({
      status: "requires_action",
      ref: tx.ref,
      payment_url: generatedPaymentUrl,
      message: "Ouvre ce lien pour payer"
    });

  } catch (err: any) {
    console.error("❌ CRASH_INTERNE_SERVEUR :", err);
    return NextResponse.json({ error: `Erreur serveur réelle : ${err.message}` }, { status: 500 });
  }
}
