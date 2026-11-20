"use client";

import {
  CtaRow,
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  SectionBlock,
  DataTable,
  getSection,
  type PageProps,
} from "./PageBits";

/** The comparison page: one table at the top where a visitor comparing the two
 *  tools can read the answer, then the copy that explains each row. */
export default function VsPickerwheelPage({ route, content, config }: PageProps) {
  const differences = getSection(content, "differences");
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} />
      <div className="wn-page-body">
        {differences?.table ? (
          <section className="wn-section wn-vs" id="side-by-side" aria-labelledby="side-by-side-h">
            <h2 id="side-by-side-h">Side by side</h2>
            <DataTable table={differences.table} />
          </section>
        ) : null}
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about the comparison" />
      </div>
    </PageFrame>
  );
}
