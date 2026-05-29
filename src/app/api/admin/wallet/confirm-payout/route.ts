import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, historyId } = body;

    if (!adminId || !historyId) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Interdit." }, { status: 403 });
    }

    // On récupère la ligne de l'historique de retrait
    const historyEntry = await prisma.transactionHistory.findUnique({
      where: { id: historyId }
    });

    if (!historyEntry) {
      return NextResponse.json({ error: "Écriture comptable introuvable." }, { status: 404 });
    }

    // 🔒 SCELLAGE DE SÉCURITÉ JSON : On passe le payoutStatus de PENDING à SUCCESS
    const currentMeta = (historyEntry.metadata as any) || {};
    const updatedMetadata = {
      ...currentMeta,
      payoutStatus: "SUCCESS", // Marqué comme payé définitivement !
      validatedAt: new Date().toISOString()
    };

    await prisma.transactionHistory.update({
      where: { id: historyId },
      data: { metadata: updatedMetadata }
    });

    return NextResponse.json({ message: "Ordre de paiement clôturé avec succès." }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
