import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🔒 ROUTES STRATÉGIQUES ÉTANCHES
const AUTH_ROUTE = "/auth";
const DEFAULT_PRIVATE_REDIRECT = "/dashboard";
const PRIVATE_ROUTE_PREFIX = "/dashboard";

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  
  // 🕵️‍♂️ Extraction du cookie de session serveur (HTTP-Only)
  const hasSession = cookies.has("kauripay_session_id");
  
  const isTargetingPrivate = nextUrl.pathname.startsWith(PRIVATE_ROUTE_PREFIX);
  const isTargetingAuth = nextUrl.pathname === AUTH_ROUTE;

  // 🛡️ BARRAGE 1 : Tentative d'intrusion anonyme dans la zone privée
  if (isTargetingPrivate && !hasSession) {
    console.warn(`🚨 REFUS MIDDLEWARE : Accès anonyme bloqué sur ${nextUrl.pathname}. Expulsion vers /auth`);
    
    // Protection financière : On mémorise la page demandée pour y revenir après connexion (ex: un deal précis)
    const loginUrl = new URL(AUTH_ROUTE, request.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // 🛡️ BARRAGE 2 : Un utilisateur déjà connecté tente de revenir sur /auth
  if (isTargetingAuth && hasSession) {
    // Inutile de le laisser se reconnecter ou s'inscrire, on le renvoie bosser sur son Dashboard
    const dashboardUrl = new URL(DEFAULT_PRIVATE_REDIRECT, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Autorisation accordée, le douanier s'efface
  return NextResponse.next();
}

// 🎯 MATCHER STRICT : Protection chirurgicale des routes applicatives
// On protège /auth et tout le sous-dossier /dashboard (création, suivi, wallet...)
// On ignore volontairement les fichiers statiques, images, manifest.json et les fichiers internes de Next.js pour préserver la vitesse
export const config = {
  matcher: [
    "/auth",
    "/dashboard/:path*"
  ],
};
