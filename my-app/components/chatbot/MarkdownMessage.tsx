import type { ReactNode } from "react";

/**
 * Lightweight Markdown renderer for chatbot replies.
 *
 * Supports the subset Claude typically uses in chat:
 *   - **bold** / __bold__
 *   - *italic* / _italic_
 *   - `inline code`
 *   - # headings
 *   - "-", "*", "•" bullet lists and "1." numbered lists
 *   - paragraphs separated by blank lines
 *
 * Everything is rendered as React elements (never raw HTML), so model output
 * can't inject markup or scripts.
 */

// Order matters: bold before italic so "**x**" isn't read as two italics.
const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-xs dark:bg-zinc-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const last = blocks[blocks.length - 1];

    if (!line.trim() || RULE.test(line)) {
      // Blank line or horizontal rule ends the current block.
      blocks.push({ type: "paragraph", lines: [] });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered) {
      if (last?.type === "ol") last.items.push(numbered[1]);
      else blocks.push({ type: "ol", items: [numbered[1]] });
      continue;
    }

    if (last?.type === "paragraph") last.lines.push(line);
    else blocks.push({ type: "paragraph", lines: [line] });
  }

  // Drop empty paragraphs created by blank lines.
  return blocks.filter((b) => b.type !== "paragraph" || b.lines.length > 0);
}

export default function MarkdownMessage({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2">
      {blocks.map((block, b) => {
        const key = `b${b}`;
        switch (block.type) {
          case "heading":
            return (
              <p key={key} className="font-semibold">
                {renderInline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5">
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key}>
                {block.lines.map((line, i) => (
                  <span key={`${key}-${i}`}>
                    {i > 0 && <br />}
                    {renderInline(line, `${key}-${i}`)}
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
