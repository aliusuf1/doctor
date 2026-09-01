/**
 * Minimal, dependency-free renderer for the lightweight markdown stored in
 * `insights.body_md`. Supports blank-line paragraphs, `## headings`, `- bullets`
 * and `**bold**`. Swap for MDX/react-markdown if articles get richer.
 */
function inline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyBase}-${i}`}>{p}</span>
    ),
  );
}

export function Prose({ md }: { md: string }) {
  const blocks = md.trim().split(/\n{2,}/);
  return (
    <div className="prose-body space-y-4 text-[0.98rem] leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="font-serif text-xl text-ink">
              {block.slice(3)}
            </h2>
          );
        }
        if (/^(-|\*) /.test(block)) {
          const items = block.split("\n").map((l) => l.replace(/^(-|\*) /, ""));
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {items.map((it, j) => (
                <li key={j}>{inline(it, `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block, String(i))}</p>;
      })}
    </div>
  );
}
