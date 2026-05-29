import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { TransactionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    // 1. Double verrouillage de sécurité strict à l'entrée
    if (!adminId) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès strictement interdit." }, { status: 403 });
    }

    // 2. Scan de la section 1 : Tous les litiges actifs (DISPUTED)
    const activeDisputes = await prisma.escrowTransaction.findMany({
      where: { status: TransactionStatus.DISPUTED },
      include: {
        seller: { select: { name: true, phone: true } },
        buyer: { select: { name: true, phone: true } },
        dispute: true
      },
      orderBy: { updatedAt: "desc" }
    });

    // 3. Scan de la section 2 : Les demandes de retraits d'argent en cours (type withdrawal)
    const pendingWithdrawals = await prisma.transactionHistory.findMany({
      where: { type: "withdrawal" },
      include: {
        transaction: {
          select: {
            seller: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Filtrage chirurgical pour isoler uniquement les retraits marqués 'PENDING' dans le JSON metadata
    const formattedWithdrawals = pendingWithdrawals
      .map((w) => {
        const meta = w.metadata as any;
        return {
          id: w.id,
          amount: w.amountFcfa,
          phone: meta?.momoDestination || "Inconnu",
          status: meta?.payoutStatus || "PENDING",
          merchantName: w.transaction?.seller?.name || "Commerçant Kauri",
          date: w.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        };
      })
      

    // 4. Scan de la section 3 : Registre complet des marchands de la plateforme
    const platformUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        kycStatus: true,
        role: true,
        totalSales: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    // 5. Renvoi du Payload global pour alimenter l'interface multi-écrans
    return NextResponse.json({
      disputes: activeDisputes,
      withdrawals: formattedWithdrawals,
      users: platformUsers
    }, { status: 200 });

  } catch (error) {
    console.error("❌ ERREUR_API_ADMIN_OVERVIEW :", error);
    return NextResponse.json({ error: "Panne technique lors de la lecture du grand livre." }, { status: 500 });
  }
}
