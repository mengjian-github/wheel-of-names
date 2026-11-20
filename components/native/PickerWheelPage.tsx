"use client";

import WeightedWheelTool from "./wheel/WeightedWheelTool";
import {
  CtaRow,
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

/** Picker wheel with weights: the tool first, because the visitor came to see
 *  how a weight turns into a chance, then the rules behind the numbers. */
export default function PickerWheelPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <WeightedWheelTool />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about weights" />
      </div>
    </PageFrame>
  );
}
