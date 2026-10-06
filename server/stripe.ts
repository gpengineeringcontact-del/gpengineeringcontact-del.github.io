import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";
import { getDb } from "./queries/connection.js";
import { env } from "./lib/env.js";
import { authenticateRequest } from "./auth.js";
import { sendPurchaseConfirmationEmail } from "./lib/email.js";

const PRICE_CENTS = 2500;

function stripeHeaders() {
  return {
    Authorization: `Bearer ${env.stripeSecretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function ensureStripeConfigured() {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe ist noch nicht konfiguriert. STRIPE_SECRET_KEY fehlt.");
  }
}

export async function createCheckoutSession(request: Request) {
  ensureStripeConfigured();
  const user = await authenticateRequest(request.headers);
  if (!user) {
    return new Response(JSON.stringify({ error: "Anmeldung erforderlich." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  if (user.membershipStatus === "active") {
    return Response.json({ url: `${env.appUrl}/?payment=already-active` });
  }

  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][product_data][name]": "Wyfare Zugang",
    "line_items[0][price_data][product_data][description]": "Einmaliger Zugang zur Wyfare Community",
    "line_items[0][price_data][unit_amount]": String(PRICE_CENTS),
    "line_items[0][quantity]": "1",
    "metadata[userId]": String(user.id),
    "metadata[unionId]": user.unionId,
    client_reference_id: String(user.id),
    customer_email: user.email ?? "",
    success_url: `${env.appUrl}/?payment=success`,
    cancel_url: `${env.appUrl}/?payment=cancelled`,
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: stripeHeaders(),
    body,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Stripe Checkout konnte nicht erstellt werden (${response.status}): ${detail}`);
  }
  const session = (await response.json()) as { url?: string };
  if (!session.url) throw new Error("Stripe hat keine Checkout-URL geliefert.");
  return Response.json({ url: session.url });
}

function verifyStripeSignature(payload: string, signature: string) {
  if (!env.stripeWebhookSecret) return false;
  const parts = signature.split(",").reduce<Record<string, string[]>>((all, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (all[key] ??= []).push(value);
    return all;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", env.stripeWebhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return signatures.some((value) => {
    const actual = Buffer.from(value, "hex");
    const wanted = Buffer.from(expected, "hex");
    return actual.length === wanted.length && timingSafeEqual(actual, wanted);
  });
}

export async function handleStripeWebhook(request: Request) {
  if (!env.stripeWebhookSecret) {
    return new Response("Stripe Webhook ist nicht konfiguriert.", { status: 503 });
  }
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature)) {
    return new Response("Ungültige Stripe-Signatur.", { status: 400 });
  }
  const event = JSON.parse(payload) as {
    type?: string;
    data?: { object?: {
      payment_status?: string;
      metadata?: { userId?: string };
      customer?: string | null;
      id?: string;
    } };
  };
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const userId = Number(session?.metadata?.userId);
    if (session?.payment_status === "paid" && Number.isInteger(userId) && userId > 0) {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user || (user.membershipStatus === "active" && user.purchaseConfirmationSentAt)) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { "content-type": "application/json" },
        });
      }
      await db.update(users).set({
        membershipStatus: "active",
        membershipPlan: "premium",
        stripeCustomerId: session.customer ?? null,
        stripeCheckoutSessionId: session.id ?? null,
      }).where(eq(users.id, userId));
      if (user.email) {
        await sendPurchaseConfirmationEmail(user.email, user.name ?? "Wyfare-Mitglied");
        await db.update(users).set({ purchaseConfirmationSentAt: new Date() }).where(eq(users.id, userId));
      }
    }
  }
  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
  });
}
