import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/config/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-fedapay-signature");

  const expectedSig = crypto
    .createHmac("sha256", FEDAPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "transaction.approved") {
    const fedapayId = event.data.transaction.id;
    const orderId = event.data.transaction.custom_metadata?.orderId;

    await prisma.escrowTransaction.update({
      where: { id: orderId },
      data: { 
        status: "FUNDS_SECURED",
        fedapayId: fedapayId,
        paidAt: new Date()
      }
    });

    console.log(`Escrow ${orderId} secured`);
  }

  if (event.event === "transaction.declined" || event.event === "transaction.canceled") {
    await prisma.escrowTransaction.update({
      where: { id: event.data.transaction.custom_metadata?.orderId },
      data: { status: "CANCELLED" }
    });
  }

  return NextResponse.json({ received: true });
}