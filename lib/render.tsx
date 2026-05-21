import { Fragment, type ReactNode } from "react";

// Safe inline-markup renderer for model-generated text fields.
// The lesson prompt asks for plain text in most fields but the model still
// emits <strong>/<em> to highlight target forms — pedagogically useful, so we
// allow it. We do NOT use dangerouslySetInnerHTML: this parser only ever
// converts the two allowlisted tags into React elements; anything else stays
// as literal text, so the field can never inject arbitrary HTML.
const INLINE_TAG_RE = /<(strong|em)>([\s\S]*?)<\/\1>/g;

export function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  INLINE_TAG_RE.lastIndex = 0;
  while ((match = INLINE_TAG_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, tag, inner] = match;
    parts.push(
      tag === "strong" ? (
        <strong key={key++}>{inner}</strong>
      ) : (
        <em key={key++}>{inner}</em>
      )
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
