"use client";

import {
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

/** Shared shell for the four policy documents: a contents column that stays
 *  put while the document scrolls, then the copy in its approved order. */
export default function LegalPage({
  route,
  content,
  config,
}: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <div className="wn-page-body wn-legal-body">
        <nav className="wn-toc" aria-label="Contents">
          <ul>
            {content.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="wn-legal">
          <SectionList content={content} />
        </article>
      </div>
      <div className="wn-page-body">
        <FaqList content={content} title="Questions about this policy" />
      </div>
    </PageFrame>
  );
}
