export function SectionTitle({
  id,
  kicker,
  title,
}: {
  id: string;
  kicker: string;
  title: string;
}) {
  return (
    <>
      <span className="docs-kicker">{kicker}</span>
      <h2>
        {title}
        <a href={`#${id}`} className="docs-anchor" aria-label="Lien vers cette section">
          #
        </a>
      </h2>
    </>
  );
}
