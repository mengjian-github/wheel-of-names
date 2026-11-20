"use client";

import { CtaRow, FaqList, PageFrame, PageHead, SectionList, type PageProps } from "./PageBits";

/** The comparison page: the answer first, then the one comparison table the
 *  copy carries (rendered once, inside its own section), then the rows it
 *  explains. */
export default function VsPickerwheelPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about the comparison" />
      </div>
    </PageFrame>
  );
}
