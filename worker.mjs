// Generated backend Worker for Shipsite WORKER_REQUIRED sites.
//
// Self-contained ES module: no npm imports, so it deploys identically through
// every carrier (owner GitHub wrangler build, direct Cloudflare API upload, and
// the platform bundle). Routing and table definitions are read from the backend
// config JSON injected by engine/src/backend-codegen.ts at build time — the LLM
// contract becomes data, never code, so the security-relevant runtime is
// deterministic and reviewed. The one sanctioned code slot is the handler map
// below: admission-gated, claim-bounded handler modules spliced in at build
// time, which only ever run behind this router's match/auth decisions with the
// restricted ctx (registry-checked db wrapper, allowlisted fetch, declared
// secrets).
//
// Security rules that apply to every response and every SQL statement:
//   - All values reach the database through D1 .bind() parameters.
//   - Table and column identifiers are quoted with identQuote() and are only
//     ever taken from the contract schema, never from request data.
//   - Auth-required contract routes demand a valid shipsite_sessions session
//     (the site's own sign-in: a cookie or a bearer token).
//   - When the deploy has not provisioned a D1 binding (preview, or a static
//     deploy), database routes answer 501 instead of faking success.
//   - A route the contract marks metered spends the site owner's provider
//     key, and runs only inside its caller's allowance ("Metered routes").
//   - A site that sells takes payment in its owner's own provider account
//     through its own handlers, and keeps orders and plans in its own D1
//     ("Payments"); it never calls Shipsite to do so.

const CONFIG = {
  "projectId": "prj_f45e7fee-046",
  "sessionTtlSeconds": 2592000,
  "authEnabled": true,
  "routes": [
    {
      "method": "GET",
      "path": "/api/pay/checkout",
      "auth": false,
      "table": null,
      "action": null
    },
    {
      "method": "GET",
      "path": "/api/pay/return",
      "auth": false,
      "table": null,
      "action": null
    },
    {
      "method": "POST",
      "path": "/api/pay/webhook",
      "auth": false,
      "table": null,
      "action": null
    },
    {
      "method": "GET",
      "path": "/api/pay/portal",
      "auth": true,
      "table": null,
      "action": null
    }
  ],
  "tables": [],
  "externalHosts": [
    "api.waffo.ai",
    "api.stripe.com",
    "api-m.paypal.com",
    "api-m.sandbox.paypal.com",
    "api.lemonsqueezy.com",
    "api.paddle.com",
    "sandbox-api.paddle.com",
    "api.creem.io",
    "test-api.creem.io",
    "accounts.google.com",
    "oauth2.googleapis.com"
  ],
  "secretNames": [
    "SHIPSITE_SIGN_IN_BROKER",
    "SHIPSITE_SIGN_IN_BROKER_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "CREEM_API_KEY",
    "CREEM_WEBHOOK_SECRET"
  ],
  "payments": {
    "currency": "USD",
    "plans": [
      {
        "id": "plus",
        "name": "Plus",
        "priceUsd": 6,
        "billingPeriod": "month",
        "mostPopular": true
      },
      {
        "id": "plus-annual",
        "name": "Plus",
        "priceUsd": 60,
        "billingPeriod": "year",
        "annualOf": "plus"
      },
      {
        "id": "pro",
        "name": "Pro",
        "priceUsd": 12,
        "billingPeriod": "month"
      },
      {
        "id": "pro-annual",
        "name": "Pro",
        "priceUsd": 120,
        "billingPeriod": "year",
        "annualOf": "pro"
      },
      {
        "id": "event-pass",
        "name": "Event Pass",
        "priceUsd": 9,
        "billingPeriod": "none",
        "passDays": 30
      }
    ],
    "ddl": [
      "CREATE TABLE IF NOT EXISTS \"shipsite_pay_events\" (\n  \"id\" TEXT PRIMARY KEY,\n  \"provider\" TEXT NOT NULL,\n  \"type\" TEXT NOT NULL,\n  \"status\" TEXT NOT NULL,\n  \"received_at\" TEXT NOT NULL,\n  \"processed_at\" TEXT\n)",
      "CREATE TABLE IF NOT EXISTS \"shipsite_pay_orders\" (\n  \"id\" TEXT PRIMARY KEY,\n  \"provider\" TEXT NOT NULL,\n  \"mode\" TEXT NOT NULL,\n  \"plan\" TEXT NOT NULL,\n  \"email\" TEXT,\n  \"user_sub\" TEXT,\n  \"subscription_id\" TEXT,\n  \"payment_id\" TEXT,\n  \"status\" TEXT NOT NULL,\n  \"amount_minor\" INTEGER,\n  \"currency\" TEXT,\n  \"created_at\" TEXT NOT NULL,\n  \"updated_at\" TEXT NOT NULL\n)",
      "CREATE INDEX IF NOT EXISTS \"shipsite_pay_orders_payment\" ON \"shipsite_pay_orders\" (\"payment_id\")",
      "CREATE TABLE IF NOT EXISTS \"shipsite_entitlements\" (\n  \"subject\" TEXT PRIMARY KEY,\n  \"user_sub\" TEXT,\n  \"email\" TEXT,\n  \"plan_key\" TEXT NOT NULL,\n  \"status\" TEXT NOT NULL,\n  \"provider\" TEXT NOT NULL,\n  \"mode\" TEXT NOT NULL,\n  \"order_id\" TEXT,\n  \"subscription_id\" TEXT,\n  \"current_period_end\" TEXT,\n  \"updated_at\" TEXT NOT NULL\n)",
      "CREATE INDEX IF NOT EXISTS \"shipsite_entitlements_user\" ON \"shipsite_entitlements\" (\"user_sub\")",
      "CREATE INDEX IF NOT EXISTS \"shipsite_entitlements_email\" ON \"shipsite_entitlements\" (\"email\")",
      "CREATE INDEX IF NOT EXISTS \"shipsite_entitlements_subscription\" ON \"shipsite_entitlements\" (\"subscription_id\")",
      "CREATE INDEX IF NOT EXISTS \"shipsite_entitlements_order\" ON \"shipsite_entitlements\" (\"order_id\")",
      "CREATE TABLE IF NOT EXISTS \"shipsite_pay_state\" (\n  \"key\" TEXT PRIMARY KEY,\n  \"value\" TEXT NOT NULL,\n  \"updated_at\" TEXT NOT NULL\n)"
    ]
  }
};

// Natively authored route handlers (AI Native P3-2). The pinned deterministic
// router stays the trust boundary: build-time codegen splices admitted handler
// modules into this map keyed by the contract route ("GET /api/stats"), and
// handleApi dispatches to a handler only after the route matched and auth
// passed. No handlers means {} — every route keeps today's CRUD/501 semantics.
const HANDLERS = {
  "GET /api/pay/checkout": (() => {
    // spliced from backend/handlers/get--api-pay-checkout.mjs
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

async function handler(ctx) {
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
    return handler;
  })(),
  "GET /api/pay/return": (() => {
    // spliced from backend/handlers/get--api-pay-return.mjs
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

async function handler(ctx) {
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
    return handler;
  })(),
  "POST /api/pay/webhook": (() => {
    // spliced from backend/handlers/post--api-pay-webhook.mjs
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

async function handler(ctx) {
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
    return handler;
  })(),
  "GET /api/pay/portal": (() => {
    // spliced from backend/handlers/get--api-pay-portal.mjs
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

async function handler(ctx) {
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
    return handler;
  })(),
};

// Frozen SQL statement registry. Admission forces every ctx.db call to pass a
// plain string literal; codegen extracts those exact literals here, and the
// runtime db wrapper refuses any statement that is not byte-equal to a
// registry member — dynamic SQL is impossible by construction even if a
// handler was somehow obfuscated past the build-time scan.
const HANDLER_STATEMENTS = new Set([
  "SELECT subscription_id FROM shipsite_entitlements WHERE email = ? AND subscription_id IS NOT NULL AND subscription_id != '' LIMIT 1",
  "SELECT subscription_id FROM shipsite_entitlements WHERE user_sub = ? AND subscription_id IS NOT NULL AND subscription_id != '' LIMIT 1"
]);

// The platform-managed bundle carrier has no Workers Assets binding, so the
// deploy pipeline injects the production dist inline (__SHIPSITE_BUNDLE_FILES__)
// plus the canonical host (__SHIPSITE_CANONICAL__). Owner-delivered Workers use
// env.ASSETS and leave these as undeclared identifiers — the typeof guards read
// them safely, so one template serves every carrier.
const BUNDLE_FILES = typeof __SHIPSITE_BUNDLE_FILES__ !== "undefined" ? __SHIPSITE_BUNDLE_FILES__ : null;
const CANONICAL_ORIGIN = typeof __SHIPSITE_CANONICAL__ !== "undefined" ? __SHIPSITE_CANONICAL__ : null;

const SECURITY = {
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "permissions-policy": "camera=(), microphone=(self), geolocation=()",
};

// huggingface.co refuses a *.workers.dev Referer with a CORS-less 404, so a
// page on workers.dev sends no Referer off its origin; a custom domain keeps
// the default policy. Must stay behavior-identical to referrerPolicyFor in
// worker.mjs, which carries the full note.
export function referrerPolicyFor(requestUrl) {
  let host = "";
  try { host = new URL(requestUrl).hostname.toLowerCase(); } catch { /* unparsable: strictest */ return "same-origin"; }
  return host === "workers.dev" || host.endsWith(".workers.dev") ? "same-origin" : "strict-origin-when-cross-origin";
}

// http -> https once, the asset layer's 307 slash redirect as permanent, and a
// year's cache for Next's hashed build output. Must stay behavior-identical
// to the same functions in worker.mjs, which carries the full note.
export function httpsRedirectFor(requestUrl) {
  let url;
  try { url = new URL(requestUrl); } catch { return null; }
  if (url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || /^[\d.]+$/.test(host) || host.startsWith("[")) return null;
  url.protocol = "https:";
  return url.toString();
}

export function httpsRedirectStatus(method) {
  return method === "GET" || method === "HEAD" ? 301 : 308;
}

export function permanentRedirectStatus(status) {
  return status === 307 ? 308 : status;
}

export function cacheControlFor(pathname, status) {
  return (status === 200 || status === 304) && (pathname.startsWith("/_next/static/") || pathname.startsWith("/__shipsite/static/")) ? "public, max-age=31536000, immutable" : null;
}

function applySecurity(headers, env, url) {
  const preview = env.SHIPSITE_ENVIRONMENT === "preview";
  headers.set(
    "Content-Security-Policy",
    `base-uri 'self'; object-src 'none'; frame-ancestors ${preview ? "https://shipsite.ai https://www.shipsite.ai" : "'none'"}; form-action 'self' https://accounts.google.com https://connect.stripe.com`,
  );
  headers.set("Strict-Transport-Security", SECURITY["strict-transport-security"]);
  headers.set("X-Content-Type-Options", SECURITY["x-content-type-options"]);
  if (!preview) headers.set("X-Frame-Options", "DENY");
  else headers.delete("X-Frame-Options");
  headers.set("Referrer-Policy", referrerPolicyFor(url));
  headers.set("Permissions-Policy", SECURITY["permissions-policy"]);
  if (env.CF_VERSION_METADATA?.id) headers.set("X-Shipsite-Worker-Version", env.CF_VERSION_METADATA.id);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// SQL identifier quoting. Callers only ever pass contract-derived table and
// column names; the quoting is defense-in-depth, not the trust boundary.
function identQuote(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

const randomHex = (bytes) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function matchRoute(method, pathname, routes) {
  const segments = pathname.split("/").filter(Boolean);
  for (const route of routes) {
    if (route.method !== method && route.method !== "ANY") continue;
    const expected = route.path.split("/").filter(Boolean);
    if (expected.length !== segments.length) continue;
    const params = {};
    let matched = true;
    for (let i = 0; i < expected.length; i += 1) {
      const part = expected[i];
      if (part.startsWith(":")) params[part.slice(1)] = decodeURIComponent(segments[i]);
      else if (part !== segments[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sign-in. The site signs its visitors in itself: Google OAuth with the site
// owner's own OAuth client (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, Worker
// secrets on the owner's Cloudflare), sessions in the site's own D1
// (shipsite_sessions, the token stored hashed), carried as an HttpOnly cookie
// or a bearer token. The platform that built the site is never asked who a
// visitor is: a site keeps working whatever happens to that platform (owner
// rule 2026-11-12). The runtime owns these routes:
//   GET  /api/auth/google/start     the Google sign-in address (JSON for a
//                                   fetch, a redirect for a navigation)
//   GET  /api/auth/google/callback  Google's answer: a session, then back
//   GET  /api/auth/me               the signed-in visitor and their plan
//   POST /api/auth/logout           ends the session
//   POST /api/auth/session          retired (410): the platform-token exchange
//
// The platform owner's own sites (and only those: owner decision 2026-11-13)
// sign in through Shipsite's Google client instead of one of their own: the
// deploy sets SHIPSITE_SIGN_IN_BROKER (where sign-in starts) and
// SHIPSITE_SIGN_IN_BROKER_KEY (this site's own key) in place of the Google
// pair. Google then returns the visitor to the broker's one registered
// address, and the broker sends them back to this site's callback with the
// verified identity signed by that key; the session is still this site's,
// in this site's database.

const SESSION_COOKIE = "shipsite_session";
const SESSION_TOKEN_SHAPE = /^[A-Za-z0-9._~+/=-]{16,512}$/;
const OAUTH_COOKIE = "shipsite_oauth";
const OAUTH_STATE_TTL_SECONDS = 600;
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const GOOGLE_TIMEOUT_MS = 10_000;
// The session table the runtime creates itself when a deploy path never
// applied db/schema.sql (the same guard the metering tables use).
const SESSION_DDL = [
  `CREATE TABLE IF NOT EXISTS "shipsite_sessions" ("id" TEXT PRIMARY KEY, "token_hash" TEXT NOT NULL UNIQUE, "user_sub" TEXT NOT NULL, "user_email" TEXT, "expires_at" TEXT NOT NULL, "created_at" TEXT NOT NULL DEFAULT (datetime('now')))`,
];

async function withSessionTable(db, run) {
  try {
    return await run();
  } catch (error) {
    if (!/no such table/i.test(String(error?.message ?? error))) throw error;
    await db.batch(SESSION_DDL.map((statement) => db.prepare(statement)));
    return await run();
  }
}

function readCookie(request, name) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const at = part.indexOf("=");
    if (at > 0 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim();
  }
  return "";
}

function sessionCookie(value, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function oauthCookie(value, maxAgeSeconds) {
  return `${OAUTH_COOKIE}=${value}; Path=/api/auth/google; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

/** The session token a request carries: a bearer token, or the session cookie. */
function sessionToken(request) {
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer) return { token: bearer, cookie: false };
  const value = readCookie(request, SESSION_COOKIE);
  if (value && SESSION_TOKEN_SHAPE.test(value)) return { token: value, cookie: true };
  return null;
}

/** The signed-in visitor, read from the site's own database; null when there is none. */
async function authenticate(env, request) {
  if (!env.DB) return null;
  const found = sessionToken(request);
  if (!found) return null;
  const hash = await sha256Hex(found.token);
  const row = await withSessionTable(env.DB, () => env.DB.prepare(
    "SELECT user_sub, user_email, expires_at FROM shipsite_sessions WHERE token_hash = ?",
  ).bind(hash).first());
  if (!row) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null;
  return { id: String(row.user_sub), email: String(row.user_email ?? "") };
}

// The plan a signed-in visitor is on. Entitlements live in the site's own
// database: shipsite_entitlements, written only by the site's own payment
// handlers through ctx.payments (Payments, below) when the owner's payment
// platform reports a payment, renewal, cancellation or refund. A purchase
// made before signing in is held under the email paid with, which a Google
// sign-in with the same address claims.
async function sitePlan(env, user) {
  if (!env.DB || !user?.id) return "free";
  const email = String(user.email ?? "").trim().toLowerCase();
  try {
    // A one-time pass ends at its current_period_end (payPassEnded); every
    // other row reads as it always did, whatever period end a handler stored.
    const rows = await env.DB.prepare(
      "SELECT plan_key, subscription_id, current_period_end FROM shipsite_entitlements WHERE (user_sub = ? OR (? <> '' AND email = ?)) AND status IN ('active', 'trialing') ORDER BY updated_at DESC LIMIT 5",
    ).bind(String(user.id), email, email).all();
    const row = (rows?.results ?? []).find((entry) => !payPassEnded({ ...entry, plan: entry.plan_key }));
    return typeof row?.plan_key === "string" && row.plan_key ? row.plan_key.slice(0, 80) : "free";
  } catch {
    return "free";
  }
}

function googleClient(env) {
  const id = typeof env.GOOGLE_CLIENT_ID === "string" ? env.GOOGLE_CLIENT_ID.trim() : "";
  const secret = typeof env.GOOGLE_CLIENT_SECRET === "string" ? env.GOOGLE_CLIENT_SECRET.trim() : "";
  return id && secret ? { id, secret } : null;
}

/** Where the platform owner's sites start sign-in, and the key its answer is signed with. */
function signInBroker(env) {
  const raw = typeof env.SHIPSITE_SIGN_IN_BROKER === "string" ? env.SHIPSITE_SIGN_IN_BROKER.trim() : "";
  const key = typeof env.SHIPSITE_SIGN_IN_BROKER_KEY === "string" ? env.SHIPSITE_SIGN_IN_BROKER_KEY.trim() : "";
  if (!raw || !key) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? { url, key } : null;
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The broker's signed answer, checked with this site's key; null if it is not one. */
async function verifyBrokerAssertion(key, assertion, origin, state) {
  const [payload = "", signature = ""] = String(assertion).split(".");
  if (!payload || !signature) return null;
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload))));
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  if (diff !== 0) return null;
  let claims;
  try { claims = JSON.parse(fromBase64Url(payload)); } catch { return null; }
  if (claims?.v !== 1 || claims.aud !== origin || claims.st !== state || !(Number(claims.exp) * 1000 > Date.now())) return null;
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || !claims.email) return null;
  return { sub: claims.sub, email: claims.email };
}

/** A return address on this site only: a path, never another origin. */
function safeReturnPath(raw) {
  const value = String(raw ?? "").slice(0, 512);
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/";
  return value;
}

const base64Url = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
}

function withQuery(path, key, value) {
  const [base, hash = ""] = path.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}

function redirectTo(location, cookies = []) {
  const response = new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
  for (const cookie of cookies) response.headers.append("set-cookie", cookie);
  return response;
}

async function handleGoogleStart(request, env, url) {
  if (!env.DB) {
    return json({ error: "database_not_provisioned", detail: "This deploy has no D1 binding; sign-in is unavailable." }, 501);
  }
  const client = googleClient(env);
  const broker = client ? null : signInBroker(env);
  if (!client && !broker) {
    return json({
      error: "google_auth_not_configured",
      detail: "The site owner has not added this site's Google OAuth client (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) yet.",
    }, 503);
  }
  const state = randomHex(16);
  const nonce = randomHex(16);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
  let authorize;
  if (broker) {
    authorize = new URL(broker.url);
    authorize.searchParams.set("returnTo", `${url.origin}/api/auth/google/callback`);
    authorize.searchParams.set("siteState", state);
  } else {
    authorize = new URL(GOOGLE_AUTHORIZE_URL);
    authorize.searchParams.set("client_id", client.id);
    authorize.searchParams.set("redirect_uri", `${url.origin}/api/auth/google/callback`);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("scope", "openid email profile");
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("nonce", nonce);
    authorize.searchParams.set("prompt", "select_account");
  }
  const cookie = oauthCookie(`${state}.${nonce}.${base64Url(returnTo)}`, OAUTH_STATE_TTL_SECONDS);
  if ((request.headers.get("accept") || "").includes("application/json")) {
    const response = json({ url: authorize.toString() });
    response.headers.append("set-cookie", cookie);
    return response;
  }
  return redirectTo(authorize.toString(), [cookie]);
}

/**
 * Google's answer. The code is exchanged at Google's token endpoint with the
 * owner's client secret over TLS, so the ID token in that direct answer is
 * Google's own (OpenID Connect Core 3.1.3.7); its issuer, audience, expiry,
 * nonce and verified email are still checked before a session is made.
 */
async function handleGoogleCallback(request, env, url) {
  const [state = "", nonce = "", encodedReturn = ""] = readCookie(request, OAUTH_COOKIE).split(".");
  let returnTo = "/";
  try { returnTo = safeReturnPath(fromBase64Url(encodedReturn)); } catch { returnTo = "/"; }
  const clearOauth = oauthCookie("", 0);
  const fail = (code) => {
    console.warn("sign_in_failed", JSON.stringify({ code }));
    return redirectTo(withQuery(returnTo, "sign_in_error", code), [clearOauth]);
  };
  const client = googleClient(env);
  const broker = client ? null : signInBroker(env);
  if (!env.DB || (!client && !broker)) return fail("not_configured");
  if (broker) {
    if (url.searchParams.get("shipsite_broker_error")) return fail("cancelled");
    if (!state || !nonce) return fail("state_mismatch");
    const identity = await verifyBrokerAssertion(broker.key, url.searchParams.get("shipsite_assertion") || "", url.origin, state);
    if (!identity) return fail("assertion_invalid");
    return startSession(env, returnTo, clearOauth, identity.sub, identity.email);
  }
  if (url.searchParams.get("error")) return fail("cancelled");
  const code = url.searchParams.get("code") || "";
  if (!state || !nonce || !code || url.searchParams.get("state") !== state) return fail("state_mismatch");
  let tokens;
  try {
    const exchanged = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        code,
        client_id: client.id,
        client_secret: client.secret,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });
    if (!exchanged.ok) return fail(`token_${exchanged.status}`);
    tokens = await exchanged.json();
  } catch {
    return fail("token_unreachable");
  }
  let claims;
  try {
    claims = JSON.parse(fromBase64Url(String(tokens?.id_token ?? "").split(".")[1] ?? ""));
  } catch {
    return fail("id_token_unreadable");
  }
  const audience = Array.isArray(claims?.aud) ? claims.aud : [claims?.aud];
  const verified = claims?.email_verified === true || claims?.email_verified === "true";
  if (!GOOGLE_ISSUERS.has(claims?.iss) || !audience.includes(client.id) || !(Number(claims?.exp) * 1000 > Date.now())
    || claims?.nonce !== nonce || typeof claims?.sub !== "string" || !claims.sub || !verified) {
    return fail("id_token_invalid");
  }
  return startSession(env, returnTo, clearOauth, claims.sub, claims.email);
}

/** A session for a visitor Google vouched for, in this site's own database. */
async function startSession(env, returnTo, clearOauth, sub, email) {
  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + CONFIG.sessionTtlSeconds * 1000).toISOString();
  const hash = await sha256Hex(token);
  await withSessionTable(env.DB, () => env.DB.prepare(
    "INSERT INTO shipsite_sessions (id, token_hash, user_sub, user_email, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(`sess_${randomHex(8)}`, hash, `google:${sub}`.slice(0, 200), String(email ?? "").slice(0, 320), expiresAt, new Date().toISOString()).run());
  return redirectTo(withQuery(returnTo, "signed_in", "1"), [clearOauth, sessionCookie(token, CONFIG.sessionTtlSeconds)]);
}

async function handleMe(request, env) {
  const session = await authenticate(env, request);
  if (!session) {
    const response = json({ error: "unauthorized" }, 401);
    if (sessionToken(request)?.cookie) response.headers.append("set-cookie", sessionCookie("", 0));
    return response;
  }
  const plan = await sitePlan(env, session);
  return json({ authenticated: true, user: session, plan: METER ? meterTier(plan).id : plan });
}

async function handleLogout(request, env) {
  const found = sessionToken(request);
  if (found && env.DB) {
    const hash = await sha256Hex(found.token);
    await withSessionTable(env.DB, () => env.DB.prepare("DELETE FROM shipsite_sessions WHERE token_hash = ?").bind(hash).run());
  }
  const response = json({ ok: true });
  response.headers.append("set-cookie", sessionCookie("", 0));
  return response;
}

// ---------------------------------------------------------------------------
// The signed-in visitor's own JSON documents (window.shipsite.store on the
// page) and the contact form, both kept in the site's own database. A
// collection named pro-<name> needs a paid plan.
const STORE_DDL = [
  `CREATE TABLE IF NOT EXISTS "shipsite_user_documents" ("user_sub" TEXT NOT NULL, "collection" TEXT NOT NULL, "doc_id" TEXT NOT NULL, "data" TEXT NOT NULL, "updated_at" TEXT NOT NULL, PRIMARY KEY ("user_sub", "collection", "doc_id"))`,
  `CREATE TABLE IF NOT EXISTS "shipsite_contact_messages" ("id" TEXT PRIMARY KEY, "path" TEXT, "payload" TEXT NOT NULL, "created_at" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "shipsite_contact_counts" ("period" TEXT NOT NULL, "bucket" TEXT NOT NULL, "count" INTEGER NOT NULL, PRIMARY KEY ("period", "bucket"))`,
];
const STORE_NAME = /^[A-Za-z0-9_-]{1,64}$/;
const STORE_DOCUMENT_MAX_BYTES = 32 * 1024;
const STORE_DOCUMENTS_PER_VISITOR = 200;
const CONTACT_MAX_BYTES = 8 * 1024;
// A classroom, a school or an office shares one address, so the per-visitor
// ceiling has to fit several people, not one: the timing and hidden-field
// gates are what stop a script, not this counter.
const CONTACT_PER_VISITOR_HOURLY = 20;
const CONTACT_PER_SITE_DAILY = 500;

async function withStoreTables(db, run) {
  try {
    return await run();
  } catch (error) {
    if (!/no such table/i.test(String(error?.message ?? error))) throw error;
    await db.batch(STORE_DDL.map((statement) => db.prepare(statement)));
    return await run();
  }
}

async function handleStore(request, env, segments, method) {
  if (!env.DB) return json({ error: "database_not_provisioned", detail: "This deploy has no D1 binding; saved documents are unavailable." }, 501);
  const user = await authenticate(env, request);
  if (!user) return json({ error: "sign_in_required" }, 401);
  const [collection = "", id = ""] = segments;
  if (!STORE_NAME.test(collection) || (id && !STORE_NAME.test(id)) || segments.length > 2) return json({ error: "invalid_store_path" }, 400);
  if (collection.startsWith("pro-") && (await sitePlan(env, user)) === "free") return json({ error: "paid_plan_required" }, 402);
  const db = env.DB;
  // Read once, outside the table guard: a retry after the tables are created
  // would find the body already consumed.
  const body = method === "POST" ? await readJson(request) : null;
  return withStoreTables(db, async () => {
    if (method === "GET" && !id) {
      const rows = await db.prepare(
        "SELECT doc_id, data, updated_at FROM shipsite_user_documents WHERE user_sub = ? AND collection = ? ORDER BY updated_at DESC LIMIT ?",
      ).bind(user.id, collection, STORE_DOCUMENTS_PER_VISITOR).all();
      const documents = (rows.results ?? []).map((row) => {
        let data = null;
        try { data = JSON.parse(row.data); } catch { data = null; }
        return { id: row.doc_id, data, updatedAt: row.updated_at };
      });
      return json({ documents });
    }
    if (method === "POST" && id) {
      const data = JSON.stringify(body?.data ?? null);
      if (new TextEncoder().encode(data).byteLength > STORE_DOCUMENT_MAX_BYTES) return json({ error: "document_too_large" }, 413);
      const count = await db.prepare("SELECT COUNT(*) AS n FROM shipsite_user_documents WHERE user_sub = ?").bind(user.id).first();
      const existing = await db.prepare("SELECT 1 AS found FROM shipsite_user_documents WHERE user_sub = ? AND collection = ? AND doc_id = ?").bind(user.id, collection, id).first();
      if (!existing && Number(count?.n ?? 0) >= STORE_DOCUMENTS_PER_VISITOR) return json({ error: "document_limit_reached" }, 409);
      const at = new Date().toISOString();
      await db.prepare(
        "INSERT INTO shipsite_user_documents (user_sub, collection, doc_id, data, updated_at) VALUES (?, ?, ?, ?, ?) "
        + "ON CONFLICT (user_sub, collection, doc_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      ).bind(user.id, collection, id, data, at).run();
      return json({ ok: true, id, updatedAt: at });
    }
    if (method === "DELETE" && id) {
      await db.prepare("DELETE FROM shipsite_user_documents WHERE user_sub = ? AND collection = ? AND doc_id = ?").bind(user.id, collection, id).run();
      return json({ ok: true });
    }
    return json({ error: "method_not_allowed" }, 405);
  });
}

// A contact form sent as a plain form post (before the page's script ran, or
// without it) gets the same handling and a page that says what happened to
// the message, with a link back to the page it came from.
async function handleContact(request, env) {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (!type.includes("application/x-www-form-urlencoded")) return handleContactJson(request, env);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > CONTACT_MAX_BYTES) return json({ error: "payload_too_large" }, 413);
  let back = "/";
  try {
    const referer = new URL(request.headers.get("referer") || "");
    if (referer.origin === new URL(request.url).origin) back = referer.pathname;
  } catch { back = "/"; }
  const answer = await handleContactJson(new Request(request.url, {
    method: "POST",
    headers: { "content-type": "application/json", "sec-fetch-site": request.headers.get("sec-fetch-site") || "", "cf-connecting-ip": request.headers.get("cf-connecting-ip") || "" },
    body: JSON.stringify({ ...Object.fromEntries(new URLSearchParams(text)), path: back }),
  }), env);
  const sent = answer.status === 201;
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${sent ? "Message sent" : "Message not sent"}</title></head><body><main><h1>${sent ? "Message sent" : "Message not sent"}</h1><p>${sent ? "Your message is with the site owner." : "Your message was not sent. Go back and try again."}</p><p><a href="${escape(back)}">Back</a></p></main></body></html>`;
  return new Response(page, { status: sent ? 201 : answer.status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

async function handleContactJson(request, env) {
  if (!env.DB) return json({ error: "database_not_provisioned", detail: "This deploy has no D1 binding; the contact form is unavailable." }, 501);
  if ((request.headers.get("sec-fetch-site") || "").toLowerCase() === "cross-site") return json({ error: "cross_origin_refused" }, 403);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > CONTACT_MAX_BYTES) return json({ error: "payload_too_large" }, 413);
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_json" }, 400);
  // A form sent within a second of the page loading, or with the hidden
  // "website" field filled, is a bot's. It is refused, never answered as
  // sent: the page tells a person the truth about their message.
  if (Number.isFinite(Number(body.loadedAt)) && Date.now() - Number(body.loadedAt) < 1_200) return json({ error: "sent_too_fast" }, 400);
  if (typeof body.website === "string" && body.website.trim()) return json({ error: "rejected" }, 400);
  const fields = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "loadedAt" || key === "path" || key === "website" || !/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(key)) continue;
    if (typeof value === "string" && value.trim()) fields[key] = value.trim().slice(0, 4000);
  }
  // A name and an address alone say nothing for the owner to read.
  if (!Object.keys(fields).some((key) => key !== "name" && key !== "email")) return json({ error: "empty_message" }, 400);
  if (typeof fields.email === "string" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) return json({ error: "invalid_email" }, 400);
  if (!(await contactAllowed(request, env, new Date()))) return json({ error: "too_many_messages" }, 429);
  // The message is stored before the answer says so: a 201 means the row is
  // in the site's own database, where the owner's Studio inbox reads it.
  const id = `msg_${randomHex(8)}`;
  const createdAt = new Date().toISOString();
  await withStoreTables(env.DB, () => env.DB.prepare(
    "INSERT INTO shipsite_contact_messages (id, path, payload, created_at) VALUES (?, ?, ?, ?)",
  ).bind(id, typeof body.path === "string" ? body.path.slice(0, 200) : null, JSON.stringify(fields), createdAt).run());
  return json({ ok: true, id, stored: true, createdAt }, 201);
}

// The contact form is a public endpoint and every message is a write in the
// owner's own database (and a line in their Studio inbox), so a script
// posting in a loop is held to a handful of messages per visitor an hour and
// a ceiling per site a day. Counters only: a visitor is a hash of their
// address bucket and the hour, and rows older than two days are dropped.
// A preview is the owner's and QA's, so only the site's ceiling applies there.
async function contactAllowed(request, env, now) {
  const hour = now.toISOString().slice(0, 13);
  const day = hour.slice(0, 10);
  const counters = [{ period: day, bucket: "site", limit: CONTACT_PER_SITE_DAILY }];
  if (env.SHIPSITE_ENVIRONMENT !== "preview") {
    const visitor = (await sha256Hex(`${CONFIG.projectId}:${hour}:${meterClientBucket(request)}`)).slice(0, 32);
    counters.push({ period: hour, bucket: visitor, limit: CONTACT_PER_VISITOR_HOURLY });
  }
  const results = await withStoreTables(env.DB, () => env.DB.batch(counters.map(({ period, bucket }) => env.DB.prepare(
    `INSERT INTO shipsite_contact_counts (period, bucket, count) VALUES (?, ?, 1)
      ON CONFLICT (period, bucket) DO UPDATE SET count = count + 1 RETURNING count`,
  ).bind(period, bucket))));
  const counts = results.map((result) => Number(result?.results?.[0]?.count ?? 0));
  if (counts[0] === 1) {
    const cutoff = new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
    await env.DB.prepare("DELETE FROM shipsite_contact_counts WHERE period < ?").bind(cutoff).run().catch(() => null);
  }
  return counters.every((counter, index) => counts[index] <= counter.limit);
}

function primaryKeyOf(table) {
  const found = table.columns.find((column) => column.primaryKey);
  return (found ?? table.columns[0] ?? { name: "id" }).name;
}

// A contract item route may name its param after the resource
// ("/api/v1/conversions/:conversion_id") while the table's primary key is
// "id". The CRUD shape only ever binds a single item param, so when the param
// map does not contain the primary key by name, the sole captured param IS the
// primary key value. Ambiguity (0 or 2+ params) stays a missing key.
function primaryKeyParam(params, primaryKey) {
  if (primaryKey in params) return params[primaryKey];
  const values = Object.values(params);
  return values.length === 1 ? values[0] : undefined;
}

function toColumnValue(column, value) {
  if (column.type === "INTEGER") return Number(value);
  if (column.type === "REAL") return Number(value);
  return String(value);
}

// Only columns the contract schema names are writable; the primary key and any
// column absent from the body are skipped. Body keys never reach SQL.
function writableColumns(table, primaryKey, body) {
  return table.columns
    .filter((column) => column.name !== primaryKey && body[column.name] !== undefined && body[column.name] !== null)
    .map((column) => ({ name: column.name, value: toColumnValue(column, body[column.name]) }));
}

async function handleCrud(env, request, matched) {
  const { route, params } = matched;
  if (!route.table) {
    return json({ error: "route_not_implemented", detail: "This route has no mapped data-store table to read or write." }, 501);
  }
  const table = CONFIG.tables.find((candidate) => candidate.name === route.table);
  if (!table) {
    return json({ error: "table_schema_missing", detail: `No schema was generated for table ${route.table}; its contract schema was under-specified.` }, 501);
  }
  const primaryKey = primaryKeyOf(table);

  if (route.action === "list") {
    const requested = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 500) : 100;
    const rows = await env.DB.prepare(
      `SELECT * FROM ${identQuote(route.table)} ORDER BY ${identQuote(primaryKey)} DESC LIMIT ?`,
    ).bind(limit).all();
    return json({ data: rows.results ?? [] });
  }

  if (route.action === "get") {
    const keyValue = primaryKeyParam(params, primaryKey);
    if (keyValue === undefined) return json({ error: "missing_primary_key" }, 400);
    const row = await env.DB.prepare(`SELECT * FROM ${identQuote(route.table)} WHERE ${identQuote(primaryKey)} = ?`)
      .bind(keyValue).first();
    if (!row) return json({ error: "not_found" }, 404);
    return json({ data: row });
  }

  if (route.action === "create") {
    const body = await readJson(request);
    const columns = writableColumns(table, primaryKey, body ?? {});
    if (!columns.length) return json({ error: "invalid_body", detail: "No writable columns matched the request body." }, 400);
    const sql = `INSERT INTO ${identQuote(route.table)} (${columns.map((column) => identQuote(column.name)).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    const result = await env.DB.prepare(sql).bind(...columns.map((column) => column.value)).run();
    return json({ ok: true, id: result.meta?.last_row_id ?? null }, 201);
  }

  if (route.action === "update") {
    const body = await readJson(request);
    const keyValue = primaryKeyParam(params, primaryKey);
    if (keyValue === undefined) return json({ error: "missing_primary_key" }, 400);
    const columns = writableColumns(table, primaryKey, body ?? {});
    if (!columns.length) return json({ error: "invalid_body", detail: "No writable columns matched the request body." }, 400);
    const sql = `UPDATE ${identQuote(route.table)} SET ${columns.map((column) => `${identQuote(column.name)} = ?`).join(", ")} WHERE ${identQuote(primaryKey)} = ?`;
    const result = await env.DB.prepare(sql).bind(...columns.map((column) => column.value), keyValue).run();
    if (!result.meta?.changes) return json({ error: "not_found" }, 404);
    return json({ ok: true, changes: result.meta.changes });
  }

  if (route.action === "delete") {
    const keyValue = primaryKeyParam(params, primaryKey);
    if (keyValue === undefined) return json({ error: "missing_primary_key" }, 400);
    const result = await env.DB.prepare(`DELETE FROM ${identQuote(route.table)} WHERE ${identQuote(primaryKey)} = ?`)
      .bind(keyValue).run();
    if (!result.meta?.changes) return json({ error: "not_found" }, 404);
    return json({ ok: true, changes: result.meta.changes });
  }

  return json({ error: "route_not_implemented" }, 501);
}

// ---------------------------------------------------------------------------
// Natively authored handler runtime (P3-2). A handler only ever sees the
// restricted ctx below: the db wrapper closes over env.DB and enforces the
// frozen statement registry, ctx.fetch resolves the URL and exact-matches the
// contract's external hosts (IP literals refused), and ctx.secrets exposes
// only contract-declared names that the deploy actually bound. env, tokens,
// and platform origin never reach handler code.

const HANDLER_TIMEOUT_MS = 10_000;
const HANDLER_MAX_RESPONSE_BYTES = 1_000_000;

function handlerFault(code, message) {
  const error = new Error(message || code);
  error.handlerCode = code;
  return error;
}

function handlerDb(env) {
  const prepare = (sql) => {
    if (typeof sql !== "string" || !HANDLER_STATEMENTS.has(sql)) {
      throw handlerFault("handler_sql_unregistered", "SQL statement is not in the frozen handler statement registry");
    }
    // The metering counters are the runtime's own: a handler neither reads
    // nor rewrites what its callers have used.
    if (/shipsite_meter_/i.test(sql)) throw handlerFault("handler_sql_reserved_table", "shipsite_meter_ tables belong to the runtime");
    // Orders and plans are written through ctx.payments, which keeps a
    // refunded order from granting again and each provider event to once.
    if (/shipsite_pay_|shipsite_entitlements/i.test(sql) && !/^\s*select\b/i.test(sql)) throw handlerFault("handler_sql_reserved_table", "write shipsite_pay_ and shipsite_entitlements through ctx.payments");
    if (!env.DB) throw handlerFault("handler_db_unavailable", "no D1 binding on this deploy");
    return env.DB.prepare(sql);
  };
  return {
    async query(sql, params = []) {
      const result = await prepare(sql).bind(...params).all();
      return result.results ?? [];
    },
    async first(sql, params = []) {
      return await prepare(sql).bind(...params).first();
    },
    async run(sql, params = []) {
      const result = await prepare(sql).bind(...params).run();
      return { changes: result.meta?.changes ?? 0, lastRowId: result.meta?.last_row_id ?? null };
    },
  };
}

// Hostname shapes that can smuggle a non-DNS destination past an allowlist:
// IPv4 literals and bracketed IPv6 literals are always refused.
const HANDLER_IP_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[[^\]]*\])$/;

// A declared secret named *_BASE_URL is an endpoint the site owner chose (a
// relay or another provider speaking the same API, e.g. an OpenAI-compatible
// gateway). Its https host joins the contract allowlist for that site only;
// IP literals and non-https values are never admitted.
function ownerEndpointHosts(env) {
  const names = Array.isArray(CONFIG.secretNames) ? CONFIG.secretNames : [];
  const hosts = [];
  for (const name of names) {
    if (!/_BASE_URL$/.test(name)) continue;
    const value = env && typeof env[name] === "string" ? env[name].trim() : "";
    if (!value) continue;
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      if (url.protocol === "https:" && !HANDLER_IP_HOST.test(host)) hosts.push(host);
    } catch { /* an unparseable endpoint adds nothing */ }
  }
  return hosts;
}

function handlerFetch(input, init, env) {
  let target;
  try {
    target = new URL(String(input));
  } catch {
    throw handlerFault("handler_fetch_invalid_url", "ctx.fetch needs an absolute https URL");
  }
  const allowed = [...(Array.isArray(CONFIG.externalHosts) ? CONFIG.externalHosts : []), ...ownerEndpointHosts(env)];
  const host = target.hostname.toLowerCase();
  if (target.protocol !== "https:" || HANDLER_IP_HOST.test(host) || !allowed.includes(host)) {
    throw handlerFault("handler_fetch_host_not_allowed", `host "${host}" is not in the contract external_hosts allowlist`);
  }
  return fetch(target.toString(), init);
}

// The declared API keys a tool runs on (shared/site-api-catalog.ts
// isOwnerToolKey: *_API_KEY / *_API_TOKEN, not payment, webhook or sign-in
// credentials) that this Worker has no value for.
function ownerToolKeysMissing(env) {
  const names = Array.isArray(CONFIG.secretNames) ? CONFIG.secretNames : [];
  return names.filter((name) => /_API_(?:KEY|TOKEN)$/.test(name)
    && !/^(?:BILLING|PAYMENT|STRIPE|PAYPAL|CREEM|WAFFO|PADDLE|LEMONSQUEEZY|GOOGLE_CLIENT)_/.test(name)
    && !(env && typeof env[name] === "string" && env[name]));
}

function handlerSecrets(env, missing) {
  const names = Array.isArray(CONFIG.secretNames) ? CONFIG.secretNames : [];
  return {
    get(name) {
      // A selling site's payment handlers read the owner's payment keys,
      // whatever the provider names them (PAYMENT_*, PAYMENT_TEST_*).
      const payment = PAY && /^PAYMENT_[A-Z0-9_]{1,60}$/.test(String(name));
      if (!names.includes(name) && !payment) return null;
      const value = env[name];
      if (typeof value === "string" && value) return value;
      // A declared key the site owner has not added yet.
      missing?.add(name);
      return null;
    },
  };
}

// A handler that asked for a declared key the owner has not added and then
// failed is a tool that is not connected yet, whatever its own error said:
// Lyric Generator's route answered 503 "configuration_error: LLM secrets are
// not bound", so its page showed that line and QA sent the frontend to fix a
// key only the owner can add (2026-11-05). One answer for every site.
function ownerKeyMissing(missing) {
  return json({
    error: "api_key_missing",
    detail: "This tool isn't connected yet — the site owner still needs to add an API key.",
    missing: [...missing],
  }, 503);
}

async function runHandler(handler, request, env, url, matched, session) {
  const routeKey = `${matched.route.method} ${matched.route.path}`;
  const missingSecrets = new Set();
  try {
    const method = request.method.toUpperCase();
    // The raw body and headers too: a payment webhook's signature is over
    // the exact bytes the provider sent, in a header it names.
    const rawBody = method === "GET" || method === "HEAD" ? null : await request.text();
    let body = null;
    try { body = rawBody ? JSON.parse(rawBody) : null; } catch { body = null; }
    const ctx = {
      method,
      path: url.pathname,
      origin: url.origin,
      params: matched.params,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries([...request.headers].filter(([name]) => name !== "authorization" && name !== "cookie")),
      rawBody,
      body,
      session,
      db: handlerDb(env),
      fetch: (input, init) => handlerFetch(input, init, env),
      json,
      secrets: handlerSecrets(env, missingSecrets),
      // Orders, plans and provider events in the site's own D1 (Payments, below).
      payments: paymentsContext(env),
      // What this caller has left on the site's metered routes, read without
      // spending a unit (meterPeek, below); null on a backend with no metered
      // route.
      allowance: () => meterPeek(request, env),
      config: {
        projectId: CONFIG.projectId,
        route: { method: matched.route.method, path: matched.route.path, auth: matched.route.auth },
      },
    };
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(handlerFault("handler_timeout", `handler exceeded ${HANDLER_TIMEOUT_MS}ms`)), HANDLER_TIMEOUT_MS);
    });
    let result;
    try {
      result = await Promise.race([Promise.resolve(handler(ctx)), timeout]);
    } finally {
      clearTimeout(timer);
    }
    const response = result instanceof Response ? result : json(result ?? { ok: true });
    if (response.status >= 500 && missingSecrets.size) return ownerKeyMissing(missingSecrets);
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > HANDLER_MAX_RESPONSE_BYTES) {
      throw handlerFault("handler_response_too_large", `response exceeds ${HANDLER_MAX_RESPONSE_BYTES} bytes`);
    }
    return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    const code = error?.handlerCode ?? "";
    if (missingSecrets.size && code !== "handler_db_unavailable") return ownerKeyMissing(missingSecrets);
    if (code === "handler_db_unavailable") {
      // Same honest semantics the CRUD executor keeps: no D1 binding means
      // 501, not a fake success and not a generic 500.
      return json({ error: "database_not_provisioned", detail: "This deploy has no D1 binding; data routes are unavailable." }, 501);
    }
    console.error("handler_error", JSON.stringify({
      route: routeKey,
      code: code || "exception",
      message: String(error?.message ?? error).slice(0, 300),
    }));
    // An uncoded exception carries its message, so whoever reads the 500
    // (QA, the behaviour probe, the repair agent) sees what broke.
    return json({ error: "handler_error", ...(code ? { detail: code } : { detail: "exception", message: String(error?.message ?? error).slice(0, 300) }) }, 500);
  }
}

const ASSET_CACHE = new Map();

function findInlineAsset(pathname) {
  const candidates = pathname.endsWith("/")
    ? [pathname + "index.html"]
    : [pathname, pathname + ".html", pathname + "/index.html"];
  if (pathname === "/") candidates.unshift("/index.html");
  for (const candidate of candidates) {
    if (BUNDLE_FILES[candidate]) return [candidate, BUNDLE_FILES[candidate]];
  }
  return null;
}

function inlineBytes(encoded) {
  if (ASSET_CACHE.has(encoded)) return ASSET_CACHE.get(encoded);
  const binary = atob(encoded);
  const value = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  ASSET_CACHE.set(encoded, value);
  return value;
}

// Static files come from env.ASSETS when the Worker carries a Workers Assets
// binding (owner delivery), or from the injected inline map (bundle carrier).
async function serveAsset(request, env, url) {
  if (CANONICAL_ORIGIN && url.hostname === `www.${CANONICAL_ORIGIN}`) {
    url.hostname = CANONICAL_ORIGIN;
    return Response.redirect(url.toString(), 308);
  }
  if (BUNDLE_FILES) {
    const found = findInlineAsset(url.pathname);
    if (!found) return new Response("not found", { status: 404 });
    const [path, [contentType, encoded, digest]] = found;
    const immutable = path.startsWith("/_next/static/") || path.startsWith("/__shipsite/static/");
    const headers = new Headers({
      "content-type": contentType,
      "cache-control": immutable
        ? "public, max-age=31536000, immutable"
        : contentType.startsWith("text/html")
          ? "public, max-age=0, s-maxage=300, must-revalidate"
          : "public, max-age=3600",
      "etag": `"${digest}"`,
    });
    if (request.method === "HEAD") return new Response(null, { headers });
    if (request.method !== "GET") return new Response("method not allowed", { status: 405 });
    return new Response(inlineBytes(encoded), { headers });
  }
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response("not found", { status: 404 });
}

// ---------------------------------------------------------------------------
// Metered routes. A route the contract marks `metered` spends one unit of the
// site owner's own provider key on every successful call, so it never runs
// without a limit (owner rule 2026-11-11: site owners are individuals and
// must profit; Lyric Generator's two LLM routes shipped with nothing between
// a visitor and the owner's key). CONFIG.metering is absent on every backend
// without a metered route, and none of this runs there.
//
//   anonymous caller  anonymousDailyAllowance units per UTC day per client,
//                     then 401 login_required
//   signed-in caller  their tier's unitsPerMonth per UTC month (the free tier
//                     unless the site's entitlements say a paid plan is
//                     active), then
//                     402 quota_exhausted
//   free use, summed  siteDailyCap units per UTC day across anonymous callers
//                     and the free tier, then 429 site_daily_cap. A caller on
//                     a plan that is being paid for is outside it: the plan's
//                     monthly allowance bounds them and its price covers
//                     them (owner decision 2026-11-11)
//
// A unit is taken before the route runs and given back when the route does
// not answer 2xx: a provider error or a validation error spends nothing, and
// a burst of parallel calls still cannot pass a limit. The counters live in
// the site's own D1 (shipsite_meter_usage, from db/schema.sql) and are as
// consistent as D1 is; a day is a UTC calendar day and a month a UTC calendar
// month, so a counter rolls over by its period key and old rows are deleted.
// When a counter cannot be read or written the call is refused with 503: the
// doubt goes to the owner's money, not to the caller.
//
// A client is the CF-Connecting-IP (an IPv6 /64), hashed with a salt this
// site's database holds and the UTC day, so no address is stored and a hash
// links nothing across days or sites. A signed-in caller is a session the
// site's own sign-in issued (the shipsite_session cookie or a bearer token),
// read from the site's own database together with the plan (sitePlan) on
// every call, so someone who just paid is on the new plan at once.

const METER = CONFIG.metering || null;
// A preview is where the owner and QA try the tool before launch. Its
// anonymous allowance is the published one: a raised preview floor made the
// page's allowance line read "30 of 30 left" beside copy that promised 3, QA
// called the mismatch a defect, and Lyric Generator's own worker.mjs took the
// floor out, after which every QA visit of the day shared 3 units and the tool
// could not be verified at all (2026-11-14). Instead, on a preview only, a
// QA visit names itself (x-shipsite-qa-visit) and is counted as its own
// anonymous client with the same published allowance: QA meets the limits a
// visitor meets, one visit cannot spend another's units, and free use stays
// under the site's daily cap like any anonymous use.
const METER_QA_VISIT_HEADER = "x-shipsite-qa-visit";
const METER_MEMORY = { usage: new Map(), state: new Map() };
let meterSalt = "";
let meterPrunedDay = "";

function meterClock(nowMs) {
  const now = new Date(nowMs);
  const iso = now.toISOString();
  const nextDayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return {
    iso,
    day: iso.slice(0, 10),
    month: iso.slice(0, 7),
    nextDayMs,
    dayResetsAt: new Date(nextDayMs).toISOString(),
    monthResetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
    previousDay: new Date(nextDayMs - 2 * 86_400_000).toISOString().slice(0, 10),
    previousMonth: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7),
  };
}

function meterD1Store(db) {
  // A deploy path that never applied db/schema.sql leaves no counter table;
  // the runtime creates its own two tables and asks again, once.
  const guarded = async (run) => {
    try {
      return await run();
    } catch (error) {
      if (!/no such table/i.test(String(error?.message ?? error))) throw error;
      await db.batch(METER.ddl.map((statement) => db.prepare(statement)));
      return await run();
    }
  };
  const key = (entry) => [entry.scope, entry.subject, entry.period];
  return {
    usage: (entries) => guarded(async () => {
      const results = await db.batch(entries.map((entry) => db.prepare(
        "SELECT units FROM shipsite_meter_usage WHERE scope = ? AND subject = ? AND period = ?",
      ).bind(...key(entry))));
      return results.map((result) => Number(result.results?.[0]?.units ?? 0));
    }),
    // One statement per counter: the row is created at 1 or raised by 1 only
    // while it is under its limit, so two calls racing for the last unit
    // cannot both take it.
    reserve: (entries, at) => guarded(async () => {
      const results = await db.batch(entries.map((entry) => db.prepare(
        "INSERT INTO shipsite_meter_usage (scope, subject, period, units, updated_at) VALUES (?, ?, ?, 1, ?) "
        + "ON CONFLICT (scope, subject, period) DO UPDATE SET units = units + 1, updated_at = excluded.updated_at "
        + "WHERE shipsite_meter_usage.units < ?",
      ).bind(...key(entry), at, entry.limit)));
      return results.map((result) => Number(result.meta?.changes ?? 0) > 0);
    }),
    release: (entries, at) => guarded(() => db.batch(entries.map((entry) => db.prepare(
      "UPDATE shipsite_meter_usage SET units = MAX(units - 1, 0), updated_at = ? WHERE scope = ? AND subject = ? AND period = ?",
    ).bind(at, ...key(entry))))),
    getState: (name) => guarded(() => db.prepare("SELECT value FROM shipsite_meter_state WHERE key = ?").bind(name).first()),
    addState: (name, value, at) => guarded(() => db.prepare(
      "INSERT OR IGNORE INTO shipsite_meter_state (key, value, updated_at) VALUES (?, ?, ?)",
    ).bind(name, value, at).run()),
    putState: (name, value, at) => guarded(() => db.prepare(
      "INSERT INTO shipsite_meter_state (key, value, updated_at) VALUES (?, ?, ?) "
      + "ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    ).bind(name, value, at).run()),
    deleteState: (name) => guarded(() => db.prepare("DELETE FROM shipsite_meter_state WHERE key = ?").bind(name).run()),
    prune: (beforeDay, beforeMonth, sessionsBefore) => guarded(() => db.batch([
      db.prepare("DELETE FROM shipsite_meter_usage WHERE (scope <> 'user' AND period < ?) OR (scope = 'user' AND period < ?)").bind(beforeDay, beforeMonth),
      db.prepare("DELETE FROM shipsite_meter_state WHERE key LIKE 'session:%' AND updated_at < ?").bind(sessionsBefore),
    ])),
  };
}

function meterMemoryStore() {
  const key = (entry) => `${entry.scope}|${entry.subject}|${entry.period}`;
  const { usage, state } = METER_MEMORY;
  return {
    async usage(entries) { return entries.map((entry) => usage.get(key(entry)) ?? 0); },
    async reserve(entries) {
      return entries.map((entry) => {
        const used = usage.get(key(entry)) ?? 0;
        if (used >= entry.limit) return false;
        usage.set(key(entry), used + 1);
        return true;
      });
    },
    async release(entries) { for (const entry of entries) usage.set(key(entry), Math.max(0, (usage.get(key(entry)) ?? 0) - 1)); },
    async getState(name) { return state.has(name) ? { value: state.get(name) } : null; },
    async addState(name, value) { if (!state.has(name)) state.set(name, value); },
    async putState(name, value) { state.set(name, value); },
    async deleteState(name) { state.delete(name); },
    async prune(beforeDay, beforeMonth) {
      for (const name of [...usage.keys()]) {
        const [scope, , period] = name.split("|");
        if (period < (scope === "user" ? beforeMonth : beforeDay)) usage.delete(name);
      }
    },
  };
}

// The counters' home. A production deploy without a D1 binding has nowhere
// to count, and a metered route is then refused, not run unlimited. A preview
// deploy carries no D1 binding by design (the header's 501 rule), so its
// counters live in this isolate's memory: the same limits, forgotten when
// the isolate is recycled — a limit that lets the owner and QA try the tool,
// on a deploy that is not the launched site.
function meterStore(env) {
  if (env.DB) return meterD1Store(env.DB);
  if (env.SHIPSITE_ENVIRONMENT === "preview") return meterMemoryStore();
  return null;
}

// A caller on a plan that is being paid for: the site's entitlement names a
// tier with a price.
function meterPaid(entry) {
  return entry.scope === "user" && meterTier(entry.plan).priceUsd > 0;
}

function meterSiteCap(env) {
  // METERED_SITE_DAILY_CAP on the Worker replaces the contract-derived cap.
  const override = Number(env.METERED_SITE_DAILY_CAP);
  return Number.isInteger(override) && override > 0 ? override : METER.siteDailyCap;
}

// The plan the site's entitlements name is a pricing-contract tier id; anything else
// (no plan, an unknown key) is the free tier, tiers[0].
function meterTier(plan) {
  const wanted = String(plan ?? "").toLowerCase();
  return METER.tiers.find((tier) => tier.id.toLowerCase() === wanted) ?? METER.tiers[0];
}

function meterClientBucket(request) {
  const ip = (request.headers.get("cf-connecting-ip") || "").trim().toLowerCase();
  if (!ip) return "unknown";
  if (!ip.includes(":")) return ip;
  // One IPv6 visitor holds a whole /64: count the prefix, not the address.
  const [head, tail] = ip.split("::");
  const groups = head.split(":").filter(Boolean);
  if (tail !== undefined) {
    const rest = tail.split(":").filter(Boolean);
    while (groups.length + rest.length < 8) groups.push("0");
    groups.push(...rest);
  }
  return groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "")).join(":");
}

// The QA visit a preview request names (METER_QA_VISIT_HEADER), or "".
function meterQaVisit(request) {
  const value = (request.headers.get(METER_QA_VISIT_HEADER) || "").trim();
  return /^[\w.:-]{1,120}$/.test(value) ? value : "";
}

async function meterIpSalt(store, at) {
  if (meterSalt) return meterSalt;
  const name = `ip_salt:${CONFIG.projectId}`;
  let row = await store.getState(name);
  if (!row?.value) {
    await store.addState(name, randomHex(16), at);
    row = await store.getState(name);
  }
  if (!row?.value) throw new Error("meter_salt_unavailable");
  meterSalt = String(row.value);
  return meterSalt;
}

// Who is calling: a session the site's own sign-in issued, with the plan the
// site's entitlements name, or nobody. A session cookie the database no
// longer knows (signed out, expired) is cleared, so the next call is plainly
// anonymous.
async function meterCaller(request, env) {
  const found = sessionToken(request);
  if (!found) return { user: null };
  const user = await authenticate(env, request);
  if (!user) return { user: null, clearCookie: found.cookie };
  return { user, plan: await sitePlan(env, user) };
}

async function meterEntry(request, env, route, store, caller, clock) {
  if (caller.user) {
    const tier = meterTier(caller.plan);
    return { scope: "user", subject: caller.user.id, period: clock.month, limit: tier.unitsPerMonth, plan: tier.id, window: "month", resetsAt: clock.monthResetsAt };
  }
  const salt = await meterIpSalt(store, clock.iso);
  const qaVisit = env.SHIPSITE_ENVIRONMENT === "preview" ? meterQaVisit(request) : "";
  const client = qaVisit ? `qa:${qaVisit}` : meterClientBucket(request);
  const subject = await sha256Hex(`${salt}:${clock.day}:${client}`);
  // A route the contract also marks auth-required gives an anonymous caller nothing.
  const limit = route.auth ? 0 : METER.anonymousDailyAllowance;
  return { scope: "anon", subject, period: clock.day, limit, plan: "anonymous", window: "day", resetsAt: clock.dayResetsAt };
}

function meterAllowance(entry, used) {
  return {
    unit: METER.unit,
    plan: entry.plan,
    limit: entry.limit,
    used: Math.min(Math.max(used, 0), entry.limit),
    remaining: Math.max(0, entry.limit - used),
    period: entry.window,
    resets_at: entry.resetsAt,
  };
}

function meterExhausted(entry, used) {
  const allowance = meterAllowance(entry, used);
  if (entry.scope === "anon") {
    const free = METER.tiers[0];
    return json({
      error: "login_required",
      detail: entry.limit > 0
        ? `Today's free allowance of ${entry.limit} is used. Sign in to keep going.`
        : "Sign in to use this tool.",
      allowance,
      sign_in: { tier: free.id, limit: free.unitsPerMonth, period: "month" },
    }, 401);
  }
  // The cheapest tier that allows more than the caller's own.
  const next = METER.tiers.find((tier) => tier.unitsPerMonth > entry.limit) ?? null;
  return json({
    error: "quota_exhausted",
    detail: next
      ? `This month's allowance of ${entry.limit} on the ${meterTier(entry.plan).name} plan is used. The ${next.name} plan allows ${next.unitsPerMonth} a month.`
      : `This month's allowance of ${entry.limit} on the ${meterTier(entry.plan).name} plan is used. It starts again on the 1st (UTC).`,
    allowance,
    upgrade: next ? { tier: next.id, name: next.name, price_usd: next.priceUsd, limit: next.unitsPerMonth, period: "month" } : null,
  }, 402);
}

function meterSiteCapped(clock, nowMs) {
  const seconds = Math.max(1, Math.ceil((clock.nextDayMs - nowMs) / 1000));
  // The cap is on free use, so a paid plan is the way through it today.
  const paid = METER.tiers.find((tier) => tier.priceUsd > 0) ?? null;
  const response = json({
    error: "site_daily_cap",
    detail: paid
      ? `Today's free use of this tool is used up for all visitors. It opens again at 00:00 UTC; the ${paid.name} plan keeps working today.`
      : "Today's free use of this tool is used up for all visitors. It opens again at 00:00 UTC.",
    resets_at: clock.dayResetsAt,
    retry_after_seconds: seconds,
    upgrade: paid ? { tier: paid.id, name: paid.name, price_usd: paid.priceUsd, limit: paid.unitsPerMonth, period: "month" } : null,
  }, 429);
  response.headers.set("retry-after", String(seconds));
  return response;
}

function meterUnavailable(route, error) {
  console.error("meter_error", JSON.stringify({
    route: `${route.method} ${route.path}`,
    message: String(error?.message ?? error).slice(0, 300),
  }));
  return json({
    error: "quota_unavailable",
    detail: "We couldn't check your allowance just now, so this request was not run. Please try again in a moment.",
  }, 503);
}

// What a caller has left, read from the same counters the metered routes
// spend and without spending: a route that reports the allowance answers
// from here. Vocal Remover's GET /api/allowance handler could not read the
// counters (they are the runtime's own) and answered a hard-coded 0 used on
// every call (2026-11-12). Throws as the metered routes' own check would
// refuse (meterUnavailable): no counter is no answer, never a made-up one.
async function meterPeek(request, env) {
  if (!METER) return null;
  const store = meterStore(env);
  if (!store) throw new Error("no D1 binding on this deploy");
  const clock = meterClock(Date.now());
  const caller = await payMeterCaller(request, env, await meterCaller(request, env));
  // An anonymous caller is allowed what the metered routes open to it allow.
  const open = CONFIG.routes.some((route) => route.metered && !route.auth);
  const entry = await meterEntry(request, env, { auth: !open }, store, caller, clock);
  const [used] = await store.usage([entry]);
  return { ...meterAllowance(entry, used), signed_in: Boolean(caller.user) };
}

// Decide whether this call may run, and take its unit if it may.
async function meterAdmit(request, env, route) {
  // Another site's page cannot spend this site's allowance through a
  // visitor's browser. A request that names no fetch site (curl, a probe, an
  // old browser) is judged by the limits alone.
  if ((request.headers.get("sec-fetch-site") || "").toLowerCase() === "cross-site") {
    return { refusal: json({ error: "cross_origin_refused", detail: "This tool runs from its own site only." }, 403) };
  }
  const store = meterStore(env);
  if (!store) return { refusal: meterUnavailable(route, "no D1 binding on this deploy") };
  const nowMs = Date.now();
  const clock = meterClock(nowMs);
  let clearCookie = false;
  const refuse = (response) => {
    if (clearCookie) response.headers.append("set-cookie", sessionCookie("", 0));
    return { refusal: response };
  };
  try {
    if (meterPrunedDay !== clock.day) {
      // Once a day per isolate: periods that can no longer be counted against.
      meterPrunedDay = clock.day;
      await store.prune(clock.previousDay, clock.previousMonth, new Date(nowMs - 30 * 86_400_000).toISOString()).catch(() => {});
    }
    const caller = await payMeterCaller(request, env, await meterCaller(request, env));
    const entry = await meterEntry(request, env, route, store, caller, clock);
    const siteCap = { scope: "site", subject: CONFIG.projectId, period: clock.day, limit: meterSiteCap(env) };
    const [used, siteUsed] = await store.usage([entry, siteCap]);
    clearCookie = caller.clearCookie === true;
    // The site's daily cap is a ceiling on free use: a caller on a plan that
    // is being paid for is neither refused by it nor counted toward it.
    const siteEntry = meterPaid(entry) ? null : siteCap;
    if (used >= entry.limit) return refuse(meterExhausted(entry, used));
    if (siteEntry && siteUsed >= siteEntry.limit) return refuse(meterSiteCapped(clock, nowMs));
    const [own, site = true] = await store.reserve(siteEntry ? [entry, siteEntry] : [entry], clock.iso);
    if (!own || !site) {
      // Another call took the last unit first: give back the half that was taken.
      const taken = [own ? entry : null, site && siteEntry ? siteEntry : null].filter(Boolean);
      if (taken.length) await store.release(taken, clock.iso);
      return refuse(own ? meterSiteCapped(clock, nowMs) : meterExhausted(entry, entry.limit));
    }
    return {
      store, entry, siteEntry, clearCookie,
      used: used + 1,
      session: caller.user ? { id: caller.user.id, email: caller.user.email } : null,
    };
  } catch (error) {
    return { refusal: meterUnavailable(route, error) };
  }
}

// After the route answered: a call that did not succeed gives its unit back,
// and every answer says what is left (X-Allowance-* headers).
async function meterSettle(admitted, response) {
  let used = admitted.used;
  if (!response || response.status < 200 || response.status >= 300) {
    try {
      await admitted.store.release([admitted.entry, admitted.siteEntry].filter(Boolean), new Date().toISOString());
      used -= 1;
    } catch (error) {
      // The unit stays spent: the doubt goes to the owner's money.
      console.error("meter_error", JSON.stringify({ release: admitted.entry.scope, message: String(error?.message ?? error).slice(0, 300) }));
    }
  }
  if (!response) return null;
  const allowance = meterAllowance(admitted.entry, used);
  const headers = new Headers(response.headers);
  headers.set("x-allowance-limit", String(allowance.limit));
  headers.set("x-allowance-remaining", String(allowance.remaining));
  headers.set("x-allowance-period", allowance.period);
  headers.set("x-allowance-plan", allowance.plan);
  headers.set("x-allowance-reset", allowance.resets_at);
  if (admitted.clearCookie) headers.append("set-cookie", sessionCookie("", 0));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function meteredRoute(request, env, url, matched, method) {
  const admitted = await meterAdmit(request, env, matched.route);
  if (admitted.refusal) return admitted.refusal;
  let response;
  try {
    response = await dispatchRoute(request, env, url, matched, admitted.session);
  } catch (error) {
    await meterSettle(admitted, null);
    throw error;
  }
  return meterSettle(admitted, response);
}

// ---------------------------------------------------------------------------
// Payments: the plumbing every provider needs, none of a provider's own.
// A site that sells takes the money in its owner's own payment account (any
// provider: Waffo, Stripe, PayPal, ...) and keeps its own record of who holds
// which plan, here in its own D1 (owner decisions 2026-11-12: the platform is
// never the merchant and never holds the money; a generated site has nothing
// to do with Shipsite at run time). CONFIG.payments is the approved pricing
// contract's paid tiers (engine/src/backend-payments.ts); it is absent on a
// backend that sells nothing, and none of this runs there.
//
// The provider integration itself (starting its hosted checkout, verifying
// its webhook signature, reading its events) is the site's own handler code,
// written for the owner's provider from its documentation:
//   GET  /api/pay/checkout?plan=<tier>   handler: start the provider's checkout
//   GET  /api/pay/return                 handler: where the buyer comes back
//   POST /api/pay/webhook                handler: the provider's signed events
// Those handlers read the owner's keys as ctx.secrets (PAYMENT_* names,
// PAYMENT_TEST_* in the provider's test mode, which a preview uses) and record
// what happened through ctx.payments:
//   ctx.payments.mode                        "test" on a preview, "live" in production
//   ctx.payments.plans                       the tiers for sale
//   ctx.payments.plan(id)                    one tier, or null
//   ctx.payments.once(eventId, type, apply)  run apply() once per provider event;
//                                            a replay answers { replayed: true }
//   ctx.payments.order({ id, plan, email, userSub, status, ... })   record a checkout
//   ctx.payments.grant({ orderId, plan, email, userSub, subscriptionId, periodEnd, ... })
//                                            writes shipsite_entitlements, the table
//                                            sitePlan (sign-in, metering) reads
//   ctx.payments.subscription({ subscriptionId, status, periodEnd })  renew / cancel
//   ctx.payments.refund({ orderId | paymentId })   the order's plan ends
//   ctx.payments.paidOrder(orderId)          { email } once the order is paid
//   ctx.payments.buyerCookie({ email } | { orderId })  Set-Cookie value that
//                                            lets a buyer who never signed in keep the plan
// The runtime itself answers:
//   GET  /api/pay/plan     the caller's plan (signed-in user, or buyer cookie)
//   GET  /api/pay/status   whether payment keys are bound, and the last
//                          provider event the site recorded (no secret, no buyer)
// and the metered routes' allowance follows the plan a caller bought here.

const PAY = CONFIG.payments || null;
const PAY_BUYER_COOKIE = "shipsite_buyer";
const PAY_BUYER_COOKIE_DAYS = 400;
const PAY_ACTIVE = new Set(["active", "trialing"]);
const PAY_STATUSES = new Set(["active", "trialing", "past_due", "canceled", "refunded"]);

function payMode(env) {
  return env.SHIPSITE_ENVIRONMENT === "preview" ? "test" : "live";
}

function payPlan(requested) {
  if (!PAY) return null;
  const wanted = String(requested ?? "").trim().toLowerCase();
  if (!wanted) return null;
  return PAY.plans.find((plan) => plan.id.toLowerCase() === wanted || plan.name.toLowerCase() === wanted) ?? null;
}

function payDb(env) {
  if (!env.DB) return null;
  const db = env.DB;
  // A deploy path that never applied db/schema.sql leaves no payment tables;
  // the runtime creates its own and asks again, once.
  return async (run) => {
    try {
      return await run(db);
    } catch (error) {
      if (!/no such table/i.test(String(error?.message ?? error))) throw error;
      await db.batch(PAY.ddl.map((statement) => db.prepare(statement)));
      return await run(db);
    }
  };
}

async function payState(guard, key, create) {
  const row = await guard((db) => db.prepare("SELECT value FROM shipsite_pay_state WHERE key = ?").bind(key).first());
  if (row?.value) return String(row.value);
  if (!create) return "";
  const value = await create();
  await guard((db) => db.prepare("INSERT OR IGNORE INTO shipsite_pay_state (key, value, updated_at) VALUES (?, ?, ?)")
    .bind(key, value, new Date().toISOString()).run());
  const stored = await guard((db) => db.prepare("SELECT value FROM shipsite_pay_state WHERE key = ?").bind(key).first());
  return String(stored?.value ?? "");
}

async function payHmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)))]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function paySameText(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length || !left.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

const payEmail = (value) => {
  const email = String(value ?? "").trim().toLowerCase().slice(0, 320);
  return /^[^\s@]+@[^\s@]+$/.test(email) ? email : "";
};
const payId = (value) => String(value ?? "").trim().slice(0, 200);

function payBase64Url(text) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function payFromBase64Url(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
}

/** A signed cookie naming the buyer by email, or by this site's order id
 *  while the purchase is not confirmed yet. */
async function payBuyerCookie(guard, claim) {
  const value = claim?.email ? { e: payEmail(claim.email) } : { o: payId(claim?.orderId) };
  if (!value.e && !value.o) throw new Error("buyer_cookie_needs_email_or_order");
  const payload = payBase64Url(JSON.stringify({ ...value, x: Date.now() + PAY_BUYER_COOKIE_DAYS * 86_400_000 }));
  const key = await payState(guard, "buyer_cookie_key", async () => randomHex(32));
  return `${PAY_BUYER_COOKIE}=${payload}.${await payHmacHex(key, payload)}; Path=/api; Max-Age=${PAY_BUYER_COOKIE_DAYS * 86_400}; HttpOnly; Secure; SameSite=Lax`;
}

async function payPaidOrder(guard, id) {
  if (!id) return null;
  const row = await guard((db) => db.prepare("SELECT status, email FROM shipsite_pay_orders WHERE id = ?").bind(payId(id)).first());
  return row?.status === "paid" ? { email: payEmail(row.email) } : null;
}

/** The buyer a signed cookie names ({ email }); an order claim whose order is
 *  now paid also returns `upgrade`, a cookie naming the email. */
async function payBuyer(request, guard) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const at = part.indexOf("=");
    if (at < 0 || part.slice(0, at).trim() !== PAY_BUYER_COOKIE) continue;
    const [payload, signature] = part.slice(at + 1).trim().split(".");
    if (!payload || !signature || payload.length > 1024) return {};
    const key = await payState(guard, "buyer_cookie_key", null);
    if (!key || !paySameText(await payHmacHex(key, payload), signature)) return {};
    let value;
    try { value = JSON.parse(payFromBase64Url(payload)); } catch { return {}; }
    if (!(Number(value?.x) > Date.now())) return {};
    if (value.e) return { email: payEmail(value.e) };
    const order = typeof value.o === "string" ? await payPaidOrder(guard, value.o) : null;
    return order?.email ? { email: order.email, upgrade: await payBuyerCookie(guard, { email: order.email }) } : {};
  }
  return {};
}

/** The entitlement a buyer holds: their signed-in subject first, then their email. */
async function payEntitlement(guard, who) {
  const subjects = [
    who?.id ? `user:${payId(who.id)}` : "",
    payEmail(who?.email) ? `email:${payEmail(who.email)}` : "",
  ].filter(Boolean);
  for (const subject of subjects) {
    const row = await guard((db) => db.prepare(
      "SELECT plan_key AS plan, status, provider, current_period_end, subscription_id FROM shipsite_entitlements WHERE subject = ?",
    ).bind(subject).first());
    if (row) return row;
  }
  return null;
}

/** A one-time pass whose days are over. Only a plan sold as a pass ends this
 *  way: a subscription ends by its own events, and a one-off that is not a
 *  pass (or a row a handler wrote with a period end before passes existed)
 *  never does. */
function payPassEnded(row) {
  const plan = payPlan(row?.plan);
  return Boolean(plan?.passDays) && !row?.subscription_id && typeof row?.current_period_end === "string" && row.current_period_end !== "" && row.current_period_end <= new Date().toISOString();
}

/** The tier id a caller pays for, or "" when none is active. */
async function payPlanFor(env, who) {
  if (!PAY || !who) return "";
  // A signed-in visitor: the runtime's sitePlan. A buyer known only by the
  // email they paid with (the buyer cookie): that email's entitlement.
  if (who.id) {
    const plan = await sitePlan(env, who);
    return plan && plan !== "free" ? plan : "";
  }
  const guard = payDb(env);
  const row = guard ? await payEntitlement(guard, who) : null;
  return row && PAY_ACTIVE.has(String(row.status)) && !payPassEnded(row) ? String(row.plan) : "";
}

/** A metered caller's plan, raised by what they bought on this site; a buyer
 *  who never signed in is known by the buyer cookie their purchase set. */
async function payMeterCaller(request, env, caller) {
  if (!PAY) return caller;
  try {
    const guard = payDb(env);
    if (!guard) return caller;
    if (caller.user) return caller;
    const buyer = await payBuyer(request, guard);
    if (!buyer.email) return caller;
    const plan = await payPlanFor(env, { email: buyer.email });
    return plan ? { ...caller, user: { id: `buyer:${buyer.email}`, email: buyer.email }, plan, checkedAt: Date.now() } : caller;
  } catch (error) {
    console.error("pay_error", JSON.stringify({ plan: "meter", message: String(error?.message ?? error).slice(0, 300) }));
    return caller;
  }
}

// ----- records, for the site's own payment handlers ---------------------------

async function payGrant(guard, mode, input) {
  const plan = payPlan(input.plan);
  const orderId = payId(input.orderId);
  if (!plan || !orderId) throw new Error("payment_plan_unresolved");
  const email = payEmail(input.email);
  const userSub = payId(input.userSub);
  if (!email && !userSub) throw new Error("payment_buyer_unresolved");
  const at = new Date().toISOString();
  const provider = payId(input.provider) || "owner";
  const subscriptionId = payId(input.subscriptionId) || null;
  // A one-time pass ends passDays after the purchase, whatever the handler
  // passed: counted from the order's first record, so a provider's retry of
  // the same payment (Stripe retries for days) never lengthens it.
  const passDays = !subscriptionId && plan.billingPeriod === "none" && Number.isInteger(plan.passDays) && plan.passDays > 0 ? plan.passDays : 0;
  let periodEnd = input.periodEnd ? String(input.periodEnd).slice(0, 40) : null;
  if (passDays) {
    const prior = await guard((db) => db.prepare("SELECT created_at FROM shipsite_pay_orders WHERE id = ?").bind(orderId).first());
    const bought = Date.parse(String(prior?.created_at ?? ""));
    periodEnd = new Date((Number.isFinite(bought) ? bought : Date.now()) + passDays * 86_400_000).toISOString();
  }
  await guard((db) => db.batch([
    db.prepare(`INSERT INTO shipsite_pay_orders
        (id, provider, mode, plan, email, user_sub, subscription_id, payment_id, status, amount_minor, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET status = CASE WHEN shipsite_pay_orders.status = 'refunded' THEN 'refunded' ELSE 'paid' END,
        plan = excluded.plan, email = COALESCE(excluded.email, shipsite_pay_orders.email),
        user_sub = COALESCE(excluded.user_sub, shipsite_pay_orders.user_sub),
        subscription_id = COALESCE(excluded.subscription_id, shipsite_pay_orders.subscription_id),
        payment_id = COALESCE(excluded.payment_id, shipsite_pay_orders.payment_id),
        amount_minor = COALESCE(excluded.amount_minor, shipsite_pay_orders.amount_minor),
        currency = COALESCE(excluded.currency, shipsite_pay_orders.currency), updated_at = excluded.updated_at`)
      .bind(orderId, provider, mode, plan.id, email || null, userSub || null, subscriptionId, payId(input.paymentId) || null,
        Number.isInteger(input.amountMinor) ? input.amountMinor : null, input.currency ? String(input.currency).toUpperCase().slice(0, 3) : null, at, at),
    // A refunded order never grants again, whichever event arrives last.
    // One row per subject: the signed-in buyer (user_sub, what sitePlan
    // reads first) and the email they paid with, which a later Google
    // sign-in with the same address claims.
    ...[email ? [`email:${email}`, null] : null, userSub ? [`user:${userSub}`, userSub] : null].filter(Boolean).map(([subject, sub]) => db.prepare(`INSERT INTO shipsite_entitlements
        (subject, user_sub, email, plan_key, status, provider, mode, order_id, subscription_id, current_period_end, updated_at)
      SELECT ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM shipsite_pay_orders WHERE id = ? AND status = 'refunded')
      ON CONFLICT (subject) DO UPDATE SET plan_key = excluded.plan_key, status = 'active', provider = excluded.provider,
        email = COALESCE(excluded.email, shipsite_entitlements.email),
        mode = excluded.mode, order_id = excluded.order_id, subscription_id = excluded.subscription_id,
        current_period_end = COALESCE(excluded.current_period_end, shipsite_entitlements.current_period_end),
        updated_at = excluded.updated_at`)
      .bind(subject, sub, email || null, plan.id, provider, mode, orderId, subscriptionId, periodEnd, at, orderId)),
  ]));
  return { plan: plan.id, email };
}

async function paySubscription(guard, input) {
  const subscriptionId = payId(input.subscriptionId);
  const status = input.status ? String(input.status) : null;
  if (!subscriptionId) throw new Error("subscription_id_missing");
  if (status && !PAY_STATUSES.has(status)) throw new Error(`subscription_status_unknown:${status}`);
  const periodEnd = input.periodEnd ? String(input.periodEnd).slice(0, 40) : null;
  const result = await guard((db) => db.prepare(`UPDATE shipsite_entitlements SET status = COALESCE(?, status),
      current_period_end = CASE WHEN ? IS NOT NULL AND (current_period_end IS NULL OR current_period_end < ?) THEN ? ELSE current_period_end END,
      updated_at = ?
    WHERE subscription_id = ? AND status <> 'refunded'`)
    .bind(status, periodEnd, periodEnd, periodEnd, new Date().toISOString(), subscriptionId).run());
  return { matched: Number(result?.meta?.changes ?? 0) };
}

async function payRefund(guard, input) {
  const key = payId(input.orderId) || payId(input.paymentId);
  if (!key) throw new Error("refund_order_missing");
  const order = await guard((db) => db.prepare("SELECT id FROM shipsite_pay_orders WHERE id = ? OR payment_id = ? LIMIT 1").bind(key, key).first());
  if (!order) return { matched: 0 };
  const at = new Date().toISOString();
  await guard((db) => db.batch([
    db.prepare("UPDATE shipsite_pay_orders SET status = 'refunded', updated_at = ? WHERE id = ?").bind(at, order.id),
    db.prepare("UPDATE shipsite_entitlements SET status = 'refunded', updated_at = ? WHERE order_id = ?").bind(at, order.id),
  ]));
  return { matched: 1 };
}

async function payOrder(guard, mode, input) {
  const plan = payPlan(input.plan);
  const id = payId(input.id);
  if (!plan || !id) throw new Error("payment_order_invalid");
  const at = new Date().toISOString();
  await guard((db) => db.prepare(`INSERT INTO shipsite_pay_orders
      (id, provider, mode, plan, email, user_sub, status, amount_minor, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET status = CASE WHEN shipsite_pay_orders.status IN ('paid','refunded') THEN shipsite_pay_orders.status ELSE excluded.status END,
      updated_at = excluded.updated_at`)
    .bind(id, payId(input.provider) || "owner", mode, plan.id, payEmail(input.email) || null, payId(input.userSub) || null,
      ["created", "failed"].includes(input.status) ? input.status : "created", Math.round(plan.priceUsd * 100), PAY.currency, at, at).run());
  return { id };
}

/** Each provider event once: a replay of a processed event changes nothing,
 *  and an event whose work failed stays pending for the provider's retry. */
async function payOnce(guard, eventId, type, apply) {
  const id = payId(eventId);
  if (!id) throw new Error("payment_event_id_missing");
  const seen = await guard((db) => db.prepare("SELECT status FROM shipsite_pay_events WHERE id = ?").bind(id).first());
  if (seen?.status === "processed") return { replayed: true };
  if (!seen) {
    await guard((db) => db.prepare("INSERT OR IGNORE INTO shipsite_pay_events (id, provider, type, status, received_at) VALUES (?, 'owner', ?, 'pending', ?)")
      .bind(id, String(type ?? "unknown").slice(0, 80), new Date().toISOString()).run());
  }
  const result = await apply();
  await guard((db) => db.prepare("UPDATE shipsite_pay_events SET status = 'processed', processed_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run());
  return { replayed: false, result };
}

/** ctx.payments for a handler on a selling backend. */
function paymentsContext(env) {
  if (!PAY) return null;
  const mode = payMode(env);
  const guard = () => {
    const db = payDb(env);
    if (!db) throw handlerFault("handler_db_unavailable", "no D1 binding on this deploy");
    return db;
  };
  return {
    mode,
    currency: PAY.currency,
    plans: PAY.plans.map((plan) => ({ ...plan })),
    plan: (id) => payPlan(id),
    once: (eventId, type, apply) => payOnce(guard(), eventId, type, apply),
    order: (input) => payOrder(guard(), mode, input ?? {}),
    grant: (input) => payGrant(guard(), mode, input ?? {}),
    subscription: (input) => paySubscription(guard(), input ?? {}),
    refund: (input) => payRefund(guard(), input ?? {}),
    paidOrder: (orderId) => payPaidOrder(guard(), orderId),
    buyerCookie: (claim) => payBuyerCookie(guard(), claim ?? {}),
  };
}

// ----- the runtime's own payment routes ----------------------------------------

async function payCaller(request, env) {
  try {
    return await authenticate(env, request);
  } catch {
    return null;
  }
}

async function payPlanRoute(request, env) {
  const guard = payDb(env);
  if (!guard) return json({ plan: "free", paid: false, status: null, currentPeriodEnd: null, signedIn: false });
  const user = await payCaller(request, env);
  let row = user ? await payEntitlement(guard, user) : null;
  let upgrade = null;
  if (!row || !PAY_ACTIVE.has(String(row.status)) || payPassEnded(row)) {
    const buyer = await payBuyer(request, guard);
    upgrade = buyer.upgrade ?? null;
    if (buyer.email) row = (await payEntitlement(guard, { email: buyer.email })) ?? row;
  }
  const active = Boolean(row && PAY_ACTIVE.has(String(row.status)) && !payPassEnded(row));
  const response = json({
    plan: active ? String(row.plan) : "free",
    paid: active,
    status: row ? String(row.status) : null,
    currentPeriodEnd: row?.current_period_end ?? null,
    signedIn: Boolean(user),
  });
  if (upgrade) response.headers.append("set-cookie", upgrade);
  return response;
}

async function payStatus(env) {
  const mode = payMode(env);
  const prefix = mode === "test" ? "PAYMENT_TEST_" : "PAYMENT_";
  // Names only: whether the owner's keys for this mode are bound at all.
  const keys = Object.keys(env).filter((name) => name.startsWith(prefix) && (mode === "test" || !name.startsWith("PAYMENT_TEST_")) && typeof env[name] === "string" && env[name]);
  const guard = payDb(env);
  let last = null;
  let received = 0;
  if (guard) {
    try {
      last = await guard((db) => db.prepare("SELECT type, received_at FROM shipsite_pay_events WHERE status = 'processed' ORDER BY received_at DESC LIMIT 1").first());
      received = Number((await guard((db) => db.prepare("SELECT COUNT(*) AS n FROM shipsite_pay_events WHERE status = 'processed'").first()))?.n ?? 0);
    } catch { /* an unreadable table reads as no event yet */ }
  }
  return json({
    sells: true,
    provider: typeof env.PAYMENT_PROVIDER === "string" && env.PAYMENT_PROVIDER ? env.PAYMENT_PROVIDER.slice(0, 60) : null,
    mode,
    keysBound: keys.length > 0,
    database: Boolean(guard),
    plans: PAY.plans.map((plan) => ({ id: plan.id, name: plan.name, priceUsd: plan.priceUsd, billingPeriod: plan.billingPeriod })),
    webhook: { received, lastType: last?.type ?? null, lastAt: last?.received_at ?? null },
  });
}

/** The two routes the runtime answers itself; every other /api/pay/ route
 *  is the site's own handler. Null when this is not one of them. */
function payRuntimeRoute(request, env, method, path) {
  if (method !== "GET") return null;
  if (path === "/api/pay/plan") return payPlanRoute(request, env);
  if (path === "/api/pay/status") return payStatus(env);
  return null;
}

async function handleApi(request, env, url) {
  const method = request.method.toUpperCase();

  if (method === "GET" && url.pathname === "/api/health") {
    // Ready only when the tools have the owner's keys they run on: Lyric
    // Generator's health said "ready" while its only tool could not answer
    // for want of LLM_API_KEY (2026-11-15). Names only, never a value.
    const missingKeys = ownerToolKeysMissing(env);
    return json(missingKeys.length ? { ok: true, backend: "needs_owner_key", missingKeys } : { ok: true, backend: "ready" });
  }
  const normalizedApiPath = url.pathname.replace(/\/+$/, "") || "/";
  // The caller's plan and the site's payment status (Payments, above); the
  // checkout, webhook, return and portal routes are the site's own handlers.
  if (PAY) {
    const answered = payRuntimeRoute(request, env, method, normalizedApiPath);
    if (answered) return answered;
  }
  // The site's own sign-in. It is the runtime's on every backend that signs
  // visitors in, so an authored handler does not replace it.
  if (CONFIG.authEnabled) {
    if (method === "GET" && normalizedApiPath === "/api/auth/google/start") return handleGoogleStart(request, env, url);
    if (method === "GET" && normalizedApiPath === "/api/auth/google/callback") return handleGoogleCallback(request, env, url);
    if (method === "GET" && normalizedApiPath === "/api/auth/me") return handleMe(request, env);
    if (method === "POST" && normalizedApiPath === "/api/auth/logout") return handleLogout(request, env);
    if (method === "POST" && normalizedApiPath === "/api/auth/session") {
      return json({
        error: "session_exchange_retired",
        detail: "This site signs visitors in itself: start at GET /api/auth/google/start.",
      }, 410);
    }
    if (normalizedApiPath.startsWith("/api/_site/store/")) {
      return handleStore(request, env, normalizedApiPath.slice("/api/_site/store/".length).split("/").map((part) => decodeURIComponent(part)), method);
    }
  } else if (["/api/auth/session", "/api/auth/me", "/api/auth/logout", "/api/auth/google/start", "/api/auth/google/callback"].includes(normalizedApiPath)) {
    // A site without the runtime's sign-in may ship its own auth handlers.
    const authored = HANDLERS[`${method} ${url.pathname}`] || HANDLERS[`${method} ${normalizedApiPath}`];
    if (authored) {
      return runHandler(authored, request, env, url, { route: { method, path: normalizedApiPath, auth: normalizedApiPath === "/api/auth/me" || normalizedApiPath === "/api/auth/logout" }, params: {} }, null);
    }
    return json({ error: "auth_not_configured", detail: "This site has no sign-in." }, 501);
  }
  if (method === "POST" && normalizedApiPath === "/api/_site/contact") return handleContact(request, env);

  const matched = matchRoute(method, url.pathname, CONFIG.routes);
  if (!matched) return json({ error: "route_not_found" }, 404);
  // A metered route's caller is decided by its allowance, signed in or not:
  // the limits above stand where the auth check stands for other routes.
  if (METER && matched.route.metered) return meteredRoute(request, env, url, matched, method);
  if (matched.route.auth && !CONFIG.authEnabled) {
    return json({ error: "auth_not_configured", detail: "This route demands auth but the contract declared no auth_methods." }, 501);
  }
  let session = null;
  if (matched.route.auth) {
    session = await authenticate(env, request);
    if (!session) return json({ error: "unauthorized" }, 401);
    // A handler on a selling site sees the plan the caller bought here.
    if (PAY) session = { ...session, plan: await sitePlan(env, session) };
  }
  return dispatchRoute(request, env, url, matched, session);
}

async function dispatchRoute(request, env, url, matched, session) {
  // Natively authored handler dispatch: a spliced handler upgrades this exact
  // contract route from CRUD/501 to a real implementation. Everything the
  // router already decided (match, auth) stays decided; a route without a
  // handler keeps today's semantics untouched, including the honest 501s.
  const handler = HANDLERS[`${matched.route.method} ${matched.route.path}`];
  if (handler) {
    // A crash answers as a crash: status and message reach the browser, the
    // behaviour probe, QA and the repair agent. An empty read in its place
    // (the old "no detail on a GET 500 → { items: [] }" rewrite) hid a
    // crashing /api/pay/checkout from every one of them (Beat Maker,
    // 2026-11-14), and a route that cannot answer is not an empty list.
    return runHandler(handler, request, env, url, matched, session);
  }
  if (!env.DB) {
    return json({ error: "database_not_provisioned", detail: "This deploy has no D1 binding; data routes are unavailable." }, 501);
  }
  return handleCrud(env, request, matched);
}

export default {
  async fetch(request, env) {
    const secureUrl = httpsRedirectFor(request.url);
    if (secureUrl) return new Response(null, { status: httpsRedirectStatus(request.method), headers: { Location: secureUrl, "Cache-Control": "public, max-age=3600" } });
    const url = new URL(request.url);
    const api = url.pathname.startsWith("/api/");
    const response = api
      ? await handleApi(request, env, url)
      : await serveAsset(request, env, url);
    const headers = new Headers(response.headers);
    applySecurity(headers, env, url);
    const cacheControl = api ? null : cacheControlFor(url.pathname, response.status);
    if (cacheControl) headers.set("Cache-Control", cacheControl);
    const status = api ? response.status : permanentRedirectStatus(response.status);
    return new Response(response.body, { status, statusText: status === response.status ? response.statusText : "Permanent Redirect", headers });
  },
};
