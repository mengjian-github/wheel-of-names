"use client";

import FairnessAuditTool from "./wheel/FairnessAuditTool";
import {
  CtaRow,
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

/** The fairness page answers one question with evidence: the audit tool runs
 *  the visitor's own list thousands of times and reports the counts. */
export default function FairnessPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <FairnessAuditTool />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about randomness" />
      </div>
    </PageFrame>
  );
}
