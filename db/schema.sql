-- Generated D1 schema by the Shipsite engine (backend-codegen).
-- Source: backend contract data_stores (type=d1). The contract becomes
-- structured data; this SQL is rendered deterministically and reviewed.

-- No d1 store declared in the backend contract; the database holds the sign-in sessions and the payment tables.

-- Engine-owned session table for the site's own sign-in (Google OAuth with
-- the owner's client). Tokens are stored hashed.
CREATE TABLE IF NOT EXISTS "shipsite_sessions" (
  "id" TEXT PRIMARY KEY,
  "token_hash" TEXT NOT NULL UNIQUE,
  "user_sub" TEXT NOT NULL,
  "user_email" TEXT,
  "expires_at" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Engine-owned payment tables: provider events (each processed once), the
-- site's orders and the plan each buyer holds, bought through the site
-- owner's own payment account. Card data never reaches this database.
CREATE TABLE IF NOT EXISTS "shipsite_pay_events" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "received_at" TEXT NOT NULL,
  "processed_at" TEXT
);
CREATE TABLE IF NOT EXISTS "shipsite_pay_orders" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "email" TEXT,
  "user_sub" TEXT,
  "subscription_id" TEXT,
  "payment_id" TEXT,
  "status" TEXT NOT NULL,
  "amount_minor" INTEGER,
  "currency" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "shipsite_pay_orders_payment" ON "shipsite_pay_orders" ("payment_id");
CREATE TABLE IF NOT EXISTS "shipsite_entitlements" (
  "subject" TEXT PRIMARY KEY,
  "user_sub" TEXT,
  "email" TEXT,
  "plan_key" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "order_id" TEXT,
  "subscription_id" TEXT,
  "current_period_end" TEXT,
  "updated_at" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "shipsite_entitlements_user" ON "shipsite_entitlements" ("user_sub");
CREATE INDEX IF NOT EXISTS "shipsite_entitlements_email" ON "shipsite_entitlements" ("email");
CREATE INDEX IF NOT EXISTS "shipsite_entitlements_subscription" ON "shipsite_entitlements" ("subscription_id");
CREATE INDEX IF NOT EXISTS "shipsite_entitlements_order" ON "shipsite_entitlements" ("order_id");
CREATE TABLE IF NOT EXISTS "shipsite_pay_state" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);
