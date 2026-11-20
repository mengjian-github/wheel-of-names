"use client";

import {
  CtaRow,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

export default function AboutPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
      </div>
    </PageFrame>
  );
}
