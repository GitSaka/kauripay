import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs"; // ✅ Universel et compatible Vercel Cloud
import { prisma } from "../../../config/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🔒 AJOUT DE ISSIGNUP : Permet d'aiguiller strictement la logique selon l'écran du client
    const { phone, name, password, isSignUp } = body;

    // 1. Validation de sécurité stricte des données de base
    if (!phone || !password) {
      return NextResponse.json(
        { error: "Le numéro WhatsApp et le mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    // 🔒 STANDARDIZATION +229 FINTECH TRÈS STRICTE POUR L'AFRIQUE DE L'OUEST
    const basePhone = phone.replace(/\s/g, "");
    const formattedPhone = basePhone.startsWith("+229") ? basePhone : `+229${basePhone.replace("+", "")}`;

    // 2. Vérification immédiate de l'existence de l'utilisateur avec le numéro standardisé
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    // =========================================================================
    // 🔵 ACTION A : CAS DE L'INSCRIPTION (L'utilisateur veut créer un compte)
    // =========================================================================
    if (isSignUp) {
      // 🛡️ SÉCURITÉ : Si le numéro existe déjà, on refuse l'inscription proprement !
      if (existingUser) {
        return NextResponse.json(
          { error: "Ce numéro WhatsApp possède déjà un compte KauriPay. Veuillez vous connecter." },
          { status: 409 } // 409 Conflict
        );
      }

      // Validation du champ nom obligatoire à l'inscription
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Un nom complet valide est requis pour la création de votre compte." },
          { status: 400 }
        );
      }

      // Chiffrement du mot de passe
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // TRANSACTION ATOMIQUE COMPTABLE ET LOGIQUE DE RATTRAPAGE ACHETEUR
      const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            phone: formattedPhone,
            name: name.trim(),
            passwordHash,
            kycStatus: "unverified",
          },
        });

        await tx.wallet.create({
          data: {
            userId: user.id,
            balanceFcfa: 0,
            escrowFcfa: 0,
          },
        });

        // Le bouclier de liaison rétroactive immédiate pour l'acheteur invité
        await tx.escrowTransaction.updateMany({
          where: {
            buyerPhone: formattedPhone,
            buyerId: null 
          },
          data: {
            buyerId: user.id
          }
        });

        return user;
      });

      // SCELLAGE DE LA SESSION SERVEUR AU COMPTE (INSCRIPTION)
      const response = NextResponse.json(
        {
          message: "Compte créé et synchronisé avec succès.",
          user: { id: newUser.id, phone: newUser.phone, name: newUser.name },
        },
        { status: 201 }
      );

      response.cookies.set("kauripay_session_id", newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    // =========================================================================
    // 🟢 ACTION B : CAS DE LA CONNEXION (L'utilisateur veut s'identifier)
    // =========================================================================
    else {
      // 🛡️ SÉCURITÉ : Si le numéro n'existe pas dans le système, message clair !
      if (!existingUser) {
        return NextResponse.json(
          { error: "Aucun compte KauriPay n'est rattaché à ce numéro WhatsApp. Veuillez créer un compte." },
          { status: 404 } // 404 Not Found
        );
      }

      // Validation du mot de passe avec le hash unifié de bcryptjs
      const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Mot de passe incorrect. Veuillez réessayer." },
          { status: 401 }
        );
      }

      // SCELLAGE DE LA SESSION SERVEUR AU COMPTE (CONNEXION)
      const response = NextResponse.json({
        message: "Connexion réussie.",
        user: { id: existingUser.id, phone: existingUser.phone, name: existingUser.name },
      });

      response.cookies.set("kauripay_session_id", existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

  } catch (error) {
    console.error("❌ ERREUR_AUTH_API :", error);
    return NextResponse.json(
      { error: "Une erreur technique interne est survenue sur le serveur." },
      { status: 500 }
    );
  }
}
