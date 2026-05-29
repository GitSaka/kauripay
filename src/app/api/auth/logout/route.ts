import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Session serveur détruite avec succès." },
      { status: 200 }
    );

    // 🔒 ÉRADICATION SERVEUR : On écrase le cookie en le forçant à expirer immédiatement
    response.cookies.set("kauripay_session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0), // Force l'expiration immédiate (1er janvier 1970)
      maxAge: 0, // Dit au navigateur de détruire le fichier instantanément
    });

    return response;
  } catch (error) {
    console.error("❌ ERREUR_LOGOUT_API :", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion." }, { status: 500 });
  }
}
