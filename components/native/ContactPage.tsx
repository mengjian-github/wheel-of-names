"use client";

import { useState } from "react";
import {
  FaqList,
  PageFrame,
  PageHead,
  SectionList,
  richText,
  type PageProps,
} from "./PageBits";

type SendState = { kind: "idle" | "sending" | "sent" | "error"; message: string };

export default function ContactPage({ route, content, config }: PageProps) {
  const [state, setState] = useState<SendState>({ kind: "idle", message: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ kind: "sending", message: "Sending your message…" });
    try {
      const res = await fetch("/api/_site/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || body.ok === false) {
        setState({
          kind: "error",
          message:
            body.error === "invalid_email" || body.error === "missing_message"
              ? "Add your email address and a message so the reply can reach you."
              : "The message did not go through. Please try again in a moment.",
        });
        return;
      }
      form.reset();
      setState({ kind: "sent", message: "Message received. A reply comes to the email you gave." });
    } catch {
      setState({
        kind: "error",
        message: "The message did not go through. Check your connection and send it again.",
      });
    }
  }

  return (
    <PageFrame route={route} config={config}>
      <PageHead content={content} crumbs={[{ label: "Wheel of Names", href: "/" }]} />
      <div className="wn-page-body wn-contact-page">
        <div className="wn-contact">
          <form className="wn-form" data-shipsite-contact="" method="post" action="/api/_site/contact" onSubmit={onSubmit}>
            <label>
              Your name (optional)
              <input name="name" type="text" autoComplete="name" maxLength={120} />
            </label>
            <label>
              Your email, for the reply
              <input name="email" type="email" autoComplete="email" required maxLength={320} />
            </label>
            <label>
              Message
              <textarea name="message" rows={6} required maxLength={4000} placeholder="What happened, what you were doing, and what you expected." />
            </label>
            <button type="submit" className="wn-btn wn-btn-primary" disabled={state.kind === "sending"}>
              {state.kind === "sending" ? "Sending…" : "Send message"}
            </button>
            <p
              className={`wn-form-status is-${state.kind}`}
              data-shipsite-status=""
              role="status"
              aria-live="polite"
            >
              {state.message}
            </p>
            {config.contactEmail ? (
              <p className="wn-form-alt">
                Or write to <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
              </p>
            ) : null}
          </form>
        </div>
        <SectionList content={content} />
        <FaqList content={content} title="Before you write" />
        {content.sections[0]?.body ? (
          <p className="wn-note">{richText(content.sections[0].body, "contact-note")}</p>
        ) : null}
      </div>
    </PageFrame>
  );
}
