import "server-only";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Singleton Stripe client instance.
 * Initialized only when STRIPE_SECRET_KEY is configured.
 */
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: "Book Hub Library",
        version: "1.0.0",
      },
    })
  : null;

export type CheckoutSessionOptions = {
  userId: string;
  userEmail: string;
  userName?: string;
  itemType: "membership_dues" | "book_purchase" | "late_fine_settlement";
  amountInCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Creates a Stripe Checkout Session for payments or subscriptions.
 */
export async function createCheckoutSession(options: CheckoutSessionOptions) {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.",
    );
  }

  const session = await stripe.checkout.sessions.create({
    // payment_method_types: ["card"],
    customer_email: options.userEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: options.description,
            metadata: {
              itemType: options.itemType,
            },
          },
          unit_amount: options.amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      userId: options.userId,
      itemType: options.itemType,
      userName: options.userName ?? "",
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}
