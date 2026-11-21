"use client";

import {
  CtaRow,
  DataTable,
  FaqList,
  PageFrame,
  PageHead,
  SectionBody,
  SectionList,
  getSection,
  type PageProps,
} from "./PageBits";

/**
 * The comparison page: the answer and the deciding table sit side by side on
 * the first screen, so the visitor compares the six deciding rows before
 * scrolling; the rows the table explains follow below, in the copy's order.
 */
export default function VsPickerwheelPage({ route, content, config }: PageProps) {
  const answer = getSection(content, "answer");
  const differences = getSection(content, "differences");
  const table = differences?.table;
  const rest = { ...content, sections: content.sections.filter((s) => s.id !== "answer" && s.id !== "differences") };
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} />
      <div className="wn-page-body">
        <div className={`wn-vs-top${table ? " has-table" : ""}`}>
          {answer ? (
            <section className="wn-section" id={answer.id}>
              <h2>{answer.title}</h2>
              <SectionBody section={answer} />
            </section>
          ) : null}
          {differences ? (
            <section className="wn-section" id={differences.id}>
              <h2>{differences.title}</h2>
              <SectionBody section={differences} />
              {table ? <DataTable table={table} /> : null}
            </section>
          ) : null}
        </div>
        <SectionList content={rest} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about the comparison" />
      </div>
    </PageFrame>
  );
}
