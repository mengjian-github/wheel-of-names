"use client";

import { useState } from "react";
import {
  DataTable,
  FaqList,
  PageFrame,
  PageHead,
  richText,
  SectionList,
  getSection,
  type PageProps,
} from "./PageBits";

type Period = "month" | "year";

type PlanDef = {
  name: string;
  monthly?: { id: string; price: string; note: string };
  annual?: { id: string; price: string; note: string };
  free?: boolean;
};

const PLANS: PlanDef[] = [
  { name: "Free", free: true },
  {
    name: "Plus",
    monthly: { id: "plus", price: "$6", note: "a month, renews monthly" },
    annual: { id: "plus-annual", price: "$60", note: "a year, $5 a month" },
  },
  {
    name: "Pro",
    monthly: { id: "pro", price: "$12", note: "a month, renews monthly" },
    annual: { id: "pro-annual", price: "$120", note: "a year, $10 a month" },
  },
  {
    name: "Event Pass",
    monthly: { id: "event-pass", price: "$9", note: "once, 30 days of access" },
  },
];

function planName(title: string) {
  return title.split("—")[0].trim();
}

export default function PricingPage({ route, content, config }: PageProps) {
  const [period, setPeriod] = useState<Period>("month");
  const plans = getSection(content, "plans");
  const comparison = getSection(content, "comparison");
  const faqSection = getSection(content, "faq");

  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <div className="wn-page-body">
        {plans ? (
          <section className="wn-section" id="plans" aria-labelledby="plans-h">
            <h2 id="plans-h">{plans.title}</h2>
            {plans.body ? <p>{richText(plans.body, "plans")}</p> : null}
            <div className="wn-billing-toggle" role="group" aria-label="Billing period">
              <button
                type="button"
                aria-pressed={period === "month"}
                className={period === "month" ? "is-on" : ""}
                onClick={() => setPeriod("month")}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={period === "year"}
                className={period === "year" ? "is-on" : ""}
                onClick={() => setPeriod("year")}
              >
                Annual
              </button>
            </div>
            <div className="wn-plans" data-billing={period}>
              {plans.items?.map((item) => {
                const def = PLANS.find((p) => p.name === planName(item.title));
                if (!def) return null;
                const price = period === "year" && def.annual ? def.annual : def.monthly;
                const featured = def.name === "Plus";
                return (
                  <article
                    key={item.title}
                    className={`wn-plan${featured ? " is-featured" : ""}`}
                  >
                    <h3>{def.name}</h3>
                    <p className="wn-price">
                      <span className="amount">{price ? price.price : "$0"}</span>
                      <span className="per">{price ? price.note : "free, forever"}</span>
                    </p>
                    <p className="wn-plan-note">{item.body ? richText(item.body, def.name) : null}</p>
                    {def.free ? (
                      <a className="wn-btn wn-btn-ghost" href="/">
                        Use the free wheel
                      </a>
                    ) : price ? (
                      <a
                        className="wn-btn wn-btn-primary"
                        href={`/api/pay/checkout?plan=${price.id}`}
                        data-shipsite-checkout=""
                        data-product={price.id}
                      >
                        {def.name === "Event Pass" ? "Buy the Event Pass" : `Choose ${def.name}`}
                      </a>
                    ) : null}
                    {def.monthly && def.annual ? (
                      <p className="wn-plan-billing-note">
                        {period === "year"
                          ? "Billed yearly, cancel anytime."
                          : "Billed monthly, cancel anytime. Annual billing costs less."}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {comparison ? (
          <section className="wn-section" id="comparison" aria-labelledby="comparison-h">
            <h2 id="comparison-h">{comparison.title}</h2>
            {comparison.body ? <p>{richText(comparison.body, "comparison")}</p> : null}
            {comparison.table ? (
              <DataTable
                table={{
                  ...comparison.table,
                  columns: ["Plan", ...comparison.table.columns],
                }}
              />
            ) : null}
            {comparison.items?.length ? (
              <ul className="wn-item-list">
                {comparison.items.map((item) => (
                  <li className="wn-item" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{richText(item.body, item.title)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {faqSection ? <SectionList content={content} ids={["faq"]} /> : null}
        <FaqList content={content} title="Questions about billing" />
        <p className="wn-trust">
          Card payments run through the payment processor&apos;s own checkout. The free wheel asks
          for no account and no card.
        </p>
      </div>
    </PageFrame>
  );
}
