/**
 * Conversion Markdown léger ↔ HTML pour le corps des sections de la page
 * /tuto. Volontairement limité : paragraphes, listes à puces (« - »),
 * listes numérotées (« 1. »), **gras**, _italique_.
 *
 * `markdownToHtml` n'émet que des balises connues et échappe tout le texte :
 * la sortie peut être injectée via `dangerouslySetInnerHTML` sans risque.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineToHtml(text: string): string {
  let out = esc(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^\w*])_([^_]+)_(?=[^\w]|$)/g, "$1<em>$2</em>");
  return out;
}

export function markdownToHtml(md: string): string {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    blocks.push(
      `<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${list.tag}>`,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const step = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list && list.tag !== "ul") flush();
      (list ??= { tag: "ul", items: [] }).items.push(inlineToHtml(bullet[1]));
    } else if (step) {
      if (list && list.tag !== "ol") flush();
      (list ??= { tag: "ol", items: [] }).items.push(inlineToHtml(step[1]));
    } else {
      flush();
      blocks.push(`<p>${inlineToHtml(line)}</p>`);
    }
  }
  flush();
  return blocks.join("");
}

/**
 * Sérialise le contenu d'un élément `contentEditable` vers notre Markdown
 * léger. À n'appeler que côté navigateur (dépend du DOM).
 */
export function htmlToMarkdown(root: HTMLElement): string {
  const inline = (node: Node): string => {
    let s = "";
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        s += n.textContent ?? "";
        return;
      }
      if (!(n instanceof HTMLElement)) return;
      const tag = n.tagName.toLowerCase();
      if (tag === "br") s += "\n";
      else if (tag === "strong" || tag === "b") s += `**${inline(n).trim()}**`;
      else if (tag === "em" || tag === "i") s += `_${inline(n).trim()}_`;
      else s += inline(n);
    });
    return s;
  };

  const blocks: string[] = [];
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = (n.textContent ?? "").trim();
      if (t) blocks.push(t);
      return;
    }
    if (!(n instanceof HTMLElement)) return;
    const tag = n.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      n.querySelectorAll(":scope > li").forEach((li, i) => {
        const prefix = tag === "ul" ? "- " : `${i + 1}. `;
        const text = inline(li).replace(/\s*\n\s*/g, " ").trim();
        if (text) items.push(prefix + text);
      });
      if (items.length) blocks.push(items.join("\n"));
    } else if (tag !== "br") {
      const parts = inline(n)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length) blocks.push(parts.join("\n"));
    }
  });
  return blocks.join("\n\n").trim();
}
