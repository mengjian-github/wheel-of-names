"use client";

import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import type {
  PageContent,
  PageCta,
  PageSection,
  PageTable,
  Route,
  SiteConfig,
} from "@/lib/content";

export type PageProps = {
  route: Route;
  content: PageContent;
  config: SiteConfig;
};

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Copy bodies carry inline [label](href) links; render them as real anchors
 *  and everything else as text. */
export function richText(text: string, key = "t"): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <a key={`${key}-a${n++}`} href={match[2]}>
        {match[1]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length === 1 ? nodes[0] : nodes;
}

export function PageFrame({
  route,
  config,
  children,
  className = "",
}: {
  route: Route;
  config: SiteConfig;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <a className="wn-skip" href="#main">
        Skip to content
      </a>
      <SiteHeader
        config={config}
        locales={config.locales ?? []}
        currentPath={route.path}
      />
      <main id="main" className={`wn-main ${className}`}>
        {children}
      </main>
      <SiteFooter config={config} />
    </>
  );
}

export function CtaButton({ cta, small = false }: { cta: PageCta; small?: boolean }) {
  const cls = `wn-btn ${cta.primary ? "wn-btn-primary" : "wn-btn-ghost"}${small ? " wn-btn-sm" : ""}`;
  const checkout = cta.action === "checkout";
  return (
    <a
      className={cls}
      href={cta.href}
      data-shipsite-checkout={checkout ? "" : undefined}
      data-product={checkout ? cta.product : undefined}
    >
      {cta.label}
    </a>
  );
}

export function CtaRow({ content, className = "" }: { content: PageContent; className?: string }) {
  if (!content.ctas?.length) return null;
  return (
    <div className={`wn-cta-row ${className}`}>
      {content.ctas.map((cta) => (
        <CtaButton key={cta.label + cta.href} cta={cta} />
      ))}
    </div>
  );
}

export function PageHead({
  content,
  crumbs,
  children,
  showLede = true,
}: {
  content: PageContent;
  crumbs?: { label: string; href: string }[];
  children?: ReactNode;
  showLede?: boolean;
}) {
  return (
    <header className="wn-page-head">
      {crumbs?.length ? (
        <p className="wn-crumbs">
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 ? " / " : null}
              <a href={c.href}>{c.label}</a>
            </span>
          ))}
        </p>
      ) : null}
      <h1>{content.h1}</h1>
      {content.heroText && showLede ? <div className="wn-lede">{richText(content.heroText, "lede")}</div> : null}
      {children}
    </header>
  );
}

export function DataTable({ table }: { table: PageTable }) {
  return (
    <>
      <div className="wn-table-wrap">
        <table className="wn-table">
          {table.caption ? <caption>{table.caption}</caption> : null}
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={`${row.cells[0]}-${i}`}>
                {row.cells.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {richText(cell, `c${i}-${j}`)}
                    </th>
                  ) : (
                    <td key={j} data-label={table.columns[j] ?? ""}>{richText(cell, `c${i}-${j}`)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.lastCheckedAt ? (
        <p className="wn-table-time">
          Checked{" "}
          <time dateTime={table.lastCheckedAt}>
            {new Date(table.lastCheckedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
      ) : null}
    </>
  );
}

export function SectionBody({ section }: { section: PageSection }) {
  return (
    <>
      {section.body ? <p>{richText(section.body, section.id)}</p> : null}
      {section.steps?.length ? (
        <ol className="wn-steps">
          {section.steps.map((step, i) => (
            <li key={step.title + i}>
              <span className="num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{richText(step.body, `${section.id}-s${i}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {section.items?.length ? (
        <ul className="wn-item-list">
          {section.items.map((item, i) => (
            <li className="wn-item" key={item.title + i}>
              <h3>{item.title}</h3>
              <p>{richText(item.body, `${section.id}-i${i}`)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? <DataTable table={section.table} /> : null}
    </>
  );
}

export function SectionBlock({
  section,
  id,
}: {
  section: PageSection;
  id?: string;
}) {
  return (
    <section className="wn-section" id={id ?? section.id} aria-labelledby={`${section.id}-h`}>
      <h2 id={`${section.id}-h`}>{section.title}</h2>
      <SectionBody section={section} />
    </section>
  );
}

/** Sections render in the order the approved copy keeps them in. `ids` only
 *  narrows which of that array a page shows in a given spot. */
export function SectionList({
  content,
  ids,
  exclude,
}: {
  content: PageContent;
  ids?: string[];
  exclude?: string[];
}) {
  const sections = content.sections.filter((s) =>
    ids ? ids.includes(s.id) : exclude ? !exclude.includes(s.id) : true,
  );
  return (
    <>
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </>
  );
}

export function FaqList({ content, title = "Questions" }: { content: PageContent; title?: string }) {
  if (!content.faq?.length) return null;
  return (
    <section className="wn-section" id="faq" aria-labelledby="faq-h">
      <h2 id="faq-h">{title}</h2>
      <div className="wn-faq">
        {content.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <div className="answer">{richText(item.answer, item.question)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function getSection(content: PageContent, id: string): PageSection | undefined {
  return content.sections.find((s) => s.id === id);
}
