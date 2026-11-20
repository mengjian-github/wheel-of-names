// GET /api/pay/return?session_id=...
// Where Stripe sends the buyer back. Confirms the Checkout session with
// Stripe, grants the plan through ctx.payments, sets the buyer cookie and
// redirects to the site.

const SESSION_URL = "https://api.stripe.com/v1/checkout/sessions/";

function paymentsMode(ctx) {
  return ctx.payments && ctx.payments.mode === "live" ? "live" : "test";
}

function secretKeyName(mode) {
  return mode === "live" ? "PAYMENT_SECRET_KEY" : "PAYMENT_TEST_SECRET_KEY";
}

function redirectTo(location, cookie) {
  const headers = { location: location };
  if (cookie) headers["set-cookie"] = cookie;
  return new Response(null, { status: 303, headers: headers });
}

function unixToIso(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

function subscriptionIdOf(value) {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}

export default async function handler(ctx) {
  const sessionId = typeof ctx.query.session_id === "string" ? ctx.query.session_id.trim() : "";
  if (!/^[A-Za-z0-9_]{6,180}$/.test(sessionId)) {
    return redirectTo("/?checkout=pending", null);
  }
  if (!ctx.payments) return redirectTo("/?checkout=pending", null);

  const mode = paymentsMode(ctx);
  const secretKey = await ctx.secrets.get(secretKeyName(mode));
  if (!secretKey) return redirectTo("/?checkout=pending", null);

  let data = null;
  try {
    const response = await ctx.fetch(SESSION_URL + encodeURIComponent(sessionId) + "?expand[]=subscription", {
      method: "GET",
      headers: { authorization: "Bearer " + secretKey }
    });
    data = await response.json();
    if (!response.ok) data = null;
  } catch (error) {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return redirectTo("/?checkout=pending", null);
  }

  const metadata = data.metadata && typeof data.metadata === "object" ? data.metadata : {};
  const planId = typeof metadata.plan === "string" ? metadata.plan : null;
  const orderId =
    typeof metadata.order_id === "string"
      ? metadata.order_id
      : typeof data.client_reference_id === "string"
        ? data.client_reference_id
        : null;
  const email =
    (data.customer_details && data.customer_details.email) || data.customer_email || null;

  const complete =
    data.status === "complete" &&
    (data.payment_status === "paid" || data.payment_status === "no_payment_required");
  const plans = Array.isArray(ctx.payments.plans) ? ctx.payments.plans : [];
  const knownPlan = planId
    ? plans.find(function (candidate) {
        return candidate && candidate.id === planId;
      })
    : null;

  if (!complete || !knownPlan) {
    let pendingCookie = null;
    if (orderId) pendingCookie = await ctx.payments.buyerCookie({ orderId: orderId });
    return redirectTo("/?checkout=pending", pendingCookie);
  }

  const subscriptionId = subscriptionIdOf(data.subscription);
  let periodEnd = null;
  if (data.subscription && typeof data.subscription === "object") {
    periodEnd = unixToIso(data.subscription.current_period_end);
  }
  const paymentId = typeof data.payment_intent === "string" ? data.payment_intent : null;

  if (orderId) {
    await ctx.payments.grant({
      orderId: orderId,
      plan: knownPlan.id,
      email: email,
      subscriptionId: subscriptionId,
      periodEnd: periodEnd,
      paymentId: paymentId,
      amountMinor: typeof data.amount_total === "number" ? data.amount_total : null,
      currency: typeof data.currency === "string" ? data.currency : null,
      provider: "stripe"
    });
  }

  const cookie = email ? await ctx.payments.buyerCookie({ email: email }) : null;
  return redirectTo("/?checkout=success", cookie);
}
