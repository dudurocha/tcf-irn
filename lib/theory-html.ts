// Post-processes the AI-generated theory HTML so conjugation tables lay out
// compactly. Works on cached lessons too, since it runs at render time.
//
// Each <table>, together with a short label paragraph right before it
// (e.g. `<p><em>être</em> :</p>`), becomes a <figure class="conj">. Runs of
// two or more adjacent figures are wrapped in <div class="conj-grid"> so they
// sit side by side.

const TABLE_WITH_LABEL =
  /(?:<p>((?:(?!<\/?p[\s>])[\s\S]){0,120})<\/p>\s*)?(<table[\s\S]*?<\/table>)/gi;

const MAX_LABEL_CHARS = 40;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function layoutConjugationTables(html: string): string {
  const matches = Array.from(html.matchAll(TABLE_WITH_LABEL));
  if (matches.length === 0) return html;

  let out = "";
  let cursor = 0;
  let group: string[] = [];

  const flush = () => {
    if (group.length === 0) return;
    out +=
      group.length > 1
        ? `<div class="conj-grid">${group.join("")}</div>`
        : group[0];
    group = [];
  };

  for (const m of matches) {
    const start = m.index ?? 0;
    const between = html.slice(cursor, start);
    if (between.trim() !== "") {
      flush();
      out += between;
    }

    const [whole, labelHtml, table] = m;
    let figure: string;
    if (labelHtml !== undefined && stripTags(labelHtml).length <= MAX_LABEL_CHARS) {
      const caption = labelHtml.replace(/\s*:\s*$/, "").trim();
      figure = `<figure class="conj"><figcaption>${caption}</figcaption>${table}</figure>`;
    } else {
      // Label too long to be a caption — keep it as a normal paragraph.
      if (labelHtml !== undefined) {
        flush();
        out += whole.slice(0, whole.length - table.length);
      }
      figure = `<figure class="conj">${table}</figure>`;
    }
    group.push(figure);
    cursor = start + whole.length;
  }

  flush();
  return out + html.slice(cursor);
}
