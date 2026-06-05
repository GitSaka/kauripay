import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
// 🔒 UNIFICATION FINTECH : Utilisation stricte de bcryptjs pour le chiffrement
import bcrypt from "bcryptjs"; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, name } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "Informations manquantes pour la création." }, { status: 400 });
    }

    const finalPhone = phone.trim();

    // 🔒 CHIFFREMENT ÉTANCHE : Génération d'un hash bcrypt sécurisé avec un coût algorithmique de 10
    const passwordHash = await bcrypt.hash(password, 10);

    // 💾 TRANSACTION ATOMIQUE DE RATTRAPAGE COMPTABLE
    const finalUser = await prisma.$transaction(async (tx) => {
      
      // A. Création de l'utilisateur avec son hash bcrypt
      const newUser = await tx.user.create({
        data: {
          phone: finalPhone,
          name: name || `Acheteur Kauri`,
          passwordHash: passwordHash, // Stocke le hash universel bcryptjs
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

      // C. 🔒 LE BOUCLIER DE LIAISON RÉTROACTIVE : Attache tous les deals orphelins à son ID
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

    // 🔒 SCELLAGE DE LA SESSION DIRECTE POUR LE MIDDLEWARE (MODIFICATION ICI)
    const response = NextResponse.json({
      message: "Espace client sécurisé et transactions associées avec succès.",
      user: { id: finalUser.id, phone: finalUser.phone, name: finalUser.name }
    }, { status: 201 });

    // Écriture du cookie de session pour ouvrir les portes du Middleware Next.js
    response.cookies.set("kauripay_session_id", finalUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // Maintient la session active pendant 7 jours
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("❌ ERREUR_REGISTER_ASSIST_API :", error);
    return NextResponse.json({ error: "Impossible de finaliser l'inscription assistée." }, { status: 500 });
  }
}
