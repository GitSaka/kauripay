import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", process.env.FEDAPAY_SECRET_KEY || "kauri_salt")
    .update(password)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "Informations manquantes pour la création." }, { status: 400 });
    }

    const finalPhone = phone.trim();
    const passwordHash = hashPassword(password);

    // 💾 TRANSACTION ATOMIQUE DE RATTRAPAGE COMPTABLE
    const finalUser = await prisma.$transaction(async (tx) => {
      
      // A. Création de l'utilisateur
      const newUser = await tx.user.create({
        data: {
          phone: finalPhone,
          name: name || `Acheteur Kauri`,
          passwordHash: passwordHash,
          kycStatus: "unverified",
          role: "USER"
        }
      });

      // B. Création de son portefeuille financier
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balanceFcfa: 0,
          escrowFcfa: 0
        }
      });

      // C. 🔒 LE BOUCLIER DE LIASON RÉTROACTIVE : Attache tous les deals orphelins à son ID
      await tx.escrowTransaction.updateMany({
        where: { 
          buyerPhone: finalPhone,
          buyerId: null 
        },
        data: { 
          buyerId: newUser.id 
        }
      });

      return newUser;
    });

    return NextResponse.json({
      message: "Espace client sécurisé et transactions associées avec succès.",
      user: { id: finalUser.id, phone: finalUser.phone, name: finalUser.name }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ ERREUR_REGISTER_ASSIST_API :", error);
    return NextResponse.json({ error: "Impossible de finaliser l'inscription assistée." }, { status: 500 });
  }
}
