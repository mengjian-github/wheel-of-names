"use client";

import NameWheelTool from "./wheel/NameWheelTool";
import {
  FaqList,
  PageFrame,
  PageHead,
  richText,
  SectionList,
  type PageProps,
} from "./PageBits";

/**
 * Home: the headline and the wheel are the first screen. The approved lede sits
 * directly under the tool rather than above it, so the tool stays in sight; no
 * call to action is repeated here, because the wheel is the action.
 */
export default function HomePage({ route, content, config }: PageProps) {
  return (
    <PageFrame route={route} config={config} className="wn-home">
      <PageHead content={content} showLede={false} />
      <NameWheelTool />
      <div className="wn-home-lede wn-lede">{richText(content.heroText)}</div>
      <div className="wn-page-body">
        <SectionList content={content} />
        <FaqList content={content} />
      </div>
    </PageFrame>
  );
}
