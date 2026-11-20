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

/** Classroom page: the wheel is the cold-calling routine, so the tool sits in
 *  the first screen and the class routine is written under it. */
export default function ClassroomNamePickerPage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} />
      <NameWheelTool />
      <div className="wn-page-body">
        <SectionList content={content} />
        <CtaRow content={content} />
        <FaqList content={content} title="Questions from teachers" />
      </div>
    </PageFrame>
  );
}
