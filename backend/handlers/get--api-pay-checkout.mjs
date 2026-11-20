// GET /api/pay/checkout?plan=<tier id>
// Starts a Stripe hosted Checkout session for the requested tier in the
// current mode and redirects the browser to it. Prices come from the
// owner's provider catalog (<tier id> -> Stripe price id); nothing is
// hard-coded.

const CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";

function paymentsMode(ctx) {
  return ctx.payments && ctx.payments.mode === "live" ? "live" : "test";
}

function secretKeyName(mode) {
  return mode === "live" ? "PAYMENT_SECRET_KEY" : "PAYMENT_TEST_SECRET_KEY";
}

function catalogName(mode) {
  return mode === "live" ? "PAYMENT_CATALOG" : "PAYMENT_TEST_CATALOG";
}

async function readJsonBody(response) {
  try {
    const data = await response.json();
    return data && typeof data === "object" ? data : null;
  } catch (error) {
    return null;
  }
}

function newOrderId() {
  return "ord_" + crypto.randomUUID().replace(/-/g, "");
}

export default async function handler(ctx) {
  const planId = typeof ctx.query.plan === "string" ? ctx.query.plan.trim() : "";
  if (!planId) return ctx.json({ error: "invalid_plan" }, 400);

  const plans = ctx.payments && Array.isArray(ctx.payments.plans) ? ctx.payments.plans : [];
  const plan = plans.find(function (candidate) {
    return candidate && candidate.id === planId;
  });
  if (!plan) return ctx.json({ error: "unknown_plan" }, 404);

  const mode = paymentsMode(ctx);
  const secretKey = await ctx.secrets.get(secretKeyName(mode));
  if (!secretKey) return ctx.json({ error: "payments_not_ready" }, 503);

  const catalogRaw = await ctx.secrets.get(catalogName(mode));
  if (!catalogRaw) return ctx.json({ error: "payments_not_ready" }, 503);

  let catalog = null;
  try {
    catalog = JSON.parse(catalogRaw);
  } catch (error) {
    catalog = null;
  }
  const priceId = catalog && typeof catalog === "object" ? catalog[planId] : null;
  if (!priceId || typeof priceId !== "string") {
    return ctx.json({ error: "payments_not_ready" }, 503);
  }

  const email = ctx.session && ctx.session.email ? ctx.session.email : null;
  const userSub = ctx.session && ctx.session.id ? ctx.session.id : null;

  const fallbackOrderId = newOrderId();
  const created = await ctx.payments.order({
    id: fallbackOrderId,
    plan: planId,
    email: email,
    userSub: userSub
  });
  let orderId = fallbackOrderId;
  if (typeof created === "string" && created) orderId = created;
  else if (created && typeof created.id === "string" && created.id) orderId = created.id;

  const oneTime = plan.billingPeriod === "none" || typeof plan.passDays === "number";

  const form = new URLSearchParams();
  form.set("mode", oneTime ? "payment" : "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", ctx.origin + "/api/pay/return?session_id={CHECKOUT_SESSION_ID}");
  form.set("cancel_url", ctx.origin + "/pricing");
  form.set("client_reference_id", orderId);
  form.set("metadata[order_id]", orderId);
  form.set("metadata[plan]", planId);
  form.set("metadata[mode]", mode);
  if (oneTime) {
    form.set("payment_intent_data[metadata][order_id]", orderId);
    form.set("payment_intent_data[metadata][plan]", planId);
  } else {
    form.set("subscription_data[metadata][order_id]", orderId);
    form.set("subscription_data[metadata][plan]", planId);
  }
  if (email) form.set("customer_email", email);

  let data = null;
  try {
    const response = await ctx.fetch(CHECKOUT_URL, {
      method: "POST",
      headers: {
        authorization: "Bearer " + secretKey,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
    data = await readJsonBody(response);
    if (!response.ok) data = null;
  } catch (error) {
    data = null;
  }

  if (!data || typeof data.url !== "string") {
    return ctx.json({ error: "checkout_failed" }, 502);
  }

  return new Response(null, { status: 303, headers: { location: data.url } });
}
