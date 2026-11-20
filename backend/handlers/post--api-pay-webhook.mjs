// POST /api/pay/webhook
// Verifies Stripe's signature over the raw request body with the owner's
// webhook secret before reading anything, refuses a test/live mode mismatch,
// then processes each event exactly once through ctx.payments.once.

const TOLERANCE_SECONDS = 300;
const SUBSCRIPTION_URL = "https://api.stripe.com/v1/subscriptions/";

function paymentsMode(ctx) {
  return ctx.payments && ctx.payments.mode === "live" ? "live" : "test";
}

function secretKeyName(mode) {
  return mode === "live" ? "PAYMENT_SECRET_KEY" : "PAYMENT_TEST_SECRET_KEY";
}

function webhookSecretName(mode) {
  return mode === "live" ? "PAYMENT_WEBHOOK_SECRET" : "PAYMENT_TEST_WEBHOOK_SECRET";
}

async function hmacHex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const bytes = new Uint8Array(signature);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseSignature(header) {
  const result = { timestamp: null, signatures: [] };
  const parts = header.split(",");
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name === "t") result.timestamp = value;
    else if (name === "v1" && value) result.signatures.push(value);
  }
  return result;
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

function mapStatus(status) {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due" || status === "incomplete") return "past_due";
  return "canceled";
}

async function fetchSubscription(ctx, secretKey, subscriptionId) {
  if (!secretKey || !subscriptionId) return null;
  try {
    const response = await ctx.fetch(SUBSCRIPTION_URL + encodeURIComponent(subscriptionId), {
      method: "GET",
      headers: { authorization: "Bearer " + secretKey }
    });
    const data = await response.json();
    if (!response.ok) return null;
    return data && typeof data === "object" ? data : null;
  } catch (error) {
    return null;
  }
}

async function handleCheckoutComplete(ctx, session, secretKey) {
  const metadata = session.metadata && typeof session.metadata === "object" ? session.metadata : {};
  const plan = typeof metadata.plan === "string" ? metadata.plan : null;
  const orderId =
    typeof metadata.order_id === "string"
      ? metadata.order_id
      : typeof session.client_reference_id === "string"
        ? session.client_reference_id
        : null;
  if (!plan || !orderId) return;

  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) return;

  const email =
    (session.customer_details && session.customer_details.email) ||
    session.customer_email ||
    null;
  const subscriptionId = subscriptionIdOf(session.subscription);
  let periodEnd = null;
  if (subscriptionId) {
    const subscription = await fetchSubscription(ctx, secretKey, subscriptionId);
    if (subscription) periodEnd = unixToIso(subscription.current_period_end);
  }

  await ctx.payments.grant({
    orderId: orderId,
    plan: plan,
    email: email,
    subscriptionId: subscriptionId,
    periodEnd: periodEnd,
    paymentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountMinor: typeof session.amount_total === "number" ? session.amount_total : null,
    currency: typeof session.currency === "string" ? session.currency : null,
    provider: "stripe"
  });
}

async function grantFromSubscription(ctx, subscription) {
  const metadata =
    subscription.metadata && typeof subscription.metadata === "object"
      ? subscription.metadata
      : {};
  const plan = typeof metadata.plan === "string" ? metadata.plan : null;
  const orderId = typeof metadata.order_id === "string" ? metadata.order_id : null;
  if (!plan || !orderId) return;
  await ctx.payments.grant({
    orderId: orderId,
    plan: plan,
    subscriptionId: typeof subscription.id === "string" ? subscription.id : null,
    periodEnd: unixToIso(subscription.current_period_end),
    provider: "stripe"
  });
}

export default async function handler(ctx) {
  const mode = paymentsMode(ctx);
  let secret = await ctx.secrets.get(webhookSecretName(mode));
  if (!secret && mode === "test") secret = await ctx.secrets.get("PAYMENT_WEBHOOK_SECRET");
  if (!secret) return ctx.json({ error: "payments_not_ready" }, 503);

  const raw = typeof ctx.rawBody === "string" ? ctx.rawBody : "";
  if (!raw) return ctx.json({ error: "invalid_payload" }, 400);

  const header = ctx.headers["stripe-signature"];
  if (typeof header !== "string" || !header) {
    return ctx.json({ error: "signature_missing" }, 400);
  }

  const parsed = parseSignature(header);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return ctx.json({ error: "signature_invalid" }, 400);
  }

  const timestamp = Number(parsed.timestamp);
  if (!isFinite(timestamp)) return ctx.json({ error: "signature_invalid" }, 400);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
    return ctx.json({ error: "signature_expired" }, 400);
  }

  const expected = await hmacHex(secret, parsed.timestamp + "." + raw);
  let verified = false;
  for (let i = 0; i < parsed.signatures.length; i += 1) {
    if (safeEqual(parsed.signatures[i], expected)) verified = true;
  }
  if (!verified) return ctx.json({ error: "signature_invalid" }, 400);

  let event = null;
  try {
    event = JSON.parse(raw);
  } catch (error) {
    event = null;
  }
  if (!event || typeof event.id !== "string" || typeof event.type !== "string") {
    return ctx.json({ error: "invalid_payload" }, 400);
  }

  if (mode === "live" && event.livemode !== true) {
    return ctx.json({ error: "mode_mismatch" }, 400);
  }
  if (mode === "test" && event.livemode === true) {
    return ctx.json({ error: "mode_mismatch" }, 400);
  }

  await ctx.payments.once(event.id, event.type, async function () {
    const object = event.data && event.data.object ? event.data.object : null;
    if (!object || typeof object !== "object") return;

    if (event.type === "checkout.session.completed") {
      const secretKey = await ctx.secrets.get(secretKeyName(mode));
      await handleCheckoutComplete(ctx, object, secretKey);
      return;
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const subscriptionId = subscriptionIdOf(object.subscription);
      if (!subscriptionId) return;
      await ctx.payments.subscription({
        subscriptionId: subscriptionId,
        status: "active",
        periodEnd: unixToIso(object.period_end)
      });
      return;
    }

    if (event.type === "invoice.payment_failed") {
      const subscriptionId = subscriptionIdOf(object.subscription);
      if (!subscriptionId) return;
      await ctx.payments.subscription({
        subscriptionId: subscriptionId,
        status: "past_due",
        periodEnd: unixToIso(object.period_end)
      });
      return;
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      if (typeof object.id !== "string") return;
      const status = mapStatus(object.status);
      await ctx.payments.subscription({
        subscriptionId: object.id,
        status: status,
        periodEnd: unixToIso(object.current_period_end)
      });
      if (status === "active" || status === "trialing") {
        await grantFromSubscription(ctx, object);
      }
      return;
    }

    if (event.type === "customer.subscription.deleted") {
      if (typeof object.id !== "string") return;
      await ctx.payments.subscription({
        subscriptionId: object.id,
        status: "canceled",
        periodEnd: unixToIso(object.current_period_end)
      });
      return;
    }

    if (event.type === "charge.refunded") {
      const paymentId =
        typeof object.payment_intent === "string"
          ? object.payment_intent
          : object.payment_intent && typeof object.payment_intent.id === "string"
            ? object.payment_intent.id
            : typeof object.id === "string"
              ? object.id
              : null;
      if (!paymentId) return;
      await ctx.payments.refund({ paymentId: paymentId });
      return;
    }
  });

  return ctx.json({ received: true }, 200);
}
