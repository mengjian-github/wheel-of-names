// GET /api/pay/portal
// The signed-in buyer manages their subscription in Stripe's billing portal.
// The buyer's subscription is found in shipsite_entitlements by their user
// sub (or, after a claim by email), then the Stripe customer is resolved.

const SUBSCRIPTION_URL = "https://api.stripe.com/v1/subscriptions/";
const PORTAL_URL = "https://api.stripe.com/v1/billing_portal/sessions";

function paymentsMode(ctx) {
  return ctx.payments && ctx.payments.mode === "live" ? "live" : "test";
}

function secretKeyName(mode) {
  return mode === "live" ? "PAYMENT_SECRET_KEY" : "PAYMENT_TEST_SECRET_KEY";
}

export default async function handler(ctx) {
  if (!ctx.session) return ctx.json({ error: "unauthorized" }, 401);
  if (!ctx.payments) return ctx.json({ error: "payments_not_ready" }, 503);

  const mode = paymentsMode(ctx);
  const secretKey = await ctx.secrets.get(secretKeyName(mode));
  if (!secretKey) return ctx.json({ error: "payments_not_ready" }, 503);

  let entitlement = await ctx.db.first(
    "SELECT subscription_id FROM shipsite_entitlements WHERE user_sub = ? AND subscription_id IS NOT NULL AND subscription_id != '' LIMIT 1",
    [ctx.session.id]
  );
  if (!entitlement && ctx.session.email) {
    entitlement = await ctx.db.first(
      "SELECT subscription_id FROM shipsite_entitlements WHERE email = ? AND subscription_id IS NOT NULL AND subscription_id != '' LIMIT 1",
      [ctx.session.email]
    );
  }
  const subscriptionId =
    entitlement && typeof entitlement.subscription_id === "string"
      ? entitlement.subscription_id
      : null;
  if (!subscriptionId) return ctx.json({ error: "portal_unavailable" }, 404);

  let subscription = null;
  try {
    const response = await ctx.fetch(SUBSCRIPTION_URL + encodeURIComponent(subscriptionId), {
      method: "GET",
      headers: { authorization: "Bearer " + secretKey }
    });
    subscription = await response.json();
    if (!response.ok) subscription = null;
  } catch (error) {
    subscription = null;
  }

  const customerId =
    subscription && typeof subscription.customer === "string"
      ? subscription.customer
      : subscription && subscription.customer && typeof subscription.customer.id === "string"
        ? subscription.customer.id
        : null;
  if (!customerId) return ctx.json({ error: "portal_unavailable" }, 404);

  const form = new URLSearchParams();
  form.set("customer", customerId);
  form.set("return_url", ctx.origin + "/");

  let session = null;
  try {
    const response = await ctx.fetch(PORTAL_URL, {
      method: "POST",
      headers: {
        authorization: "Bearer " + secretKey,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
    session = await response.json();
    if (!response.ok) session = null;
  } catch (error) {
    session = null;
  }

  if (!session || typeof session.url !== "string") {
    return ctx.json({ error: "portal_unavailable" }, 404);
  }

  return ctx.json({ url: session.url }, 200);
}
