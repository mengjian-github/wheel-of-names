"use client";

import NameWheelTool from "./wheel/NameWheelTool";
import {
  CtaRow,
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  type PageProps,
} from "./PageBits";

export default function RandomNamePickerPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <NameWheelTool />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions about picking a name at random" />
      </div>
    </PageFrame>
  );
}
