import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { sendPaymentReceiptEmail } from "@/lib/email";

/**
 * Stripe Webhook Handler
 *
 * CRITICAL App Router considerations:
 * 1. Read raw body using `await request.text()` (DO NOT parse with `request.json()`).
 *    Stripe HMAC-SHA256 signature verification requires the exact, unaltered payload.
 * 2. Verify `stripe-signature` against `STRIPE_WEBHOOK_SECRET`.
 * 3. Handle events idempotently (Stripe retries on non-2xx responses).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or webhook secret configuration" },
      { status: 400 },
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe client not initialized" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook Error] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  // Handle Stripe Event Types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const itemType = session.metadata?.itemType;
      const customerEmail = session.customer_details?.email ?? session.customer_email;
      const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

      console.info(
        `[Stripe Webhook] Checkout completed for user ${userId}: ${itemType} ($${amountTotal})`,
      );

      // Trigger transactional receipt email via Resend/Email service
      if (customerEmail) {
        await sendPaymentReceiptEmail({
          to: customerEmail,
          name: session.metadata?.userName || "Library Member",
          amount: `$${amountTotal.toFixed(2)}`,
          description: `Book Hub ${itemType?.replace(/_/g, " ") ?? "Payment"}`,
          receiptUrl: session.url ?? undefined,
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.warn(
        `[Stripe Webhook] Payment failed for PaymentIntent: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message}`,
      );
      break;
    }

    default:
      console.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
