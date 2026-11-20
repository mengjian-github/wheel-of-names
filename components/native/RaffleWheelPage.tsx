"use client";

import RaffleTool from "./wheel/RaffleTool";
import {
  CtaRow,
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

/** Raffle wheel: one list in, an ordered podium out. The tool carries the
 *  page; the sections under it explain order, records and limits. */
export default function RaffleWheelPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <RaffleTool />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about drawing several winners" />
      </div>
    </PageFrame>
  );
}
