import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Numéro de téléphone manquant." }, { status: 400 });
    }

    // 🔒 FORMAT INTERNATIONAL STRICT : Enlève les espaces
    let cleanPhone = phone.replace(/\s/g, "");

    // Si le numéro n'a pas le préfixe +229, on lui colle de force pour s'aligner sur ta DB
    if (!cleanPhone.startsWith("+229")) {
      // Si l'utilisateur a écrit "22964...", on ajoute juste le "+"
      if (cleanPhone.startsWith("229")) {
        cleanPhone = `+${cleanPhone}`;
      } else {
        // Si l'utilisateur a écrit "64...", on ajoute "+229"
        cleanPhone = `+229${cleanPhone}`;
      }
    }

    // Vérification stricte et sécurisée dans la table users
    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone.trim() },
      select: { id: true }
    });

    return NextResponse.json({ exists: !!user });

  } catch (error) {
    console.error("❌ ERREUR_CHECK_PHONE_API :", error);
    return NextResponse.json({ error: "Erreur technique interne." }, { status: 500 });
  }
}
