interface CompatItem {
  title: string;
  note?: string;
}

export default function CompatList({
  ok,
  no,
}: {
  ok: CompatItem[];
  no: CompatItem[];
}) {
  return (
    <div className="compat-grid">
      <div className="compat-card ok">
        <h4>✅ Compatible</h4>
        <ul>
          {ok.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              {item.note && <span className="note"> — {item.note}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="compat-card no">
        <h4>❌ Non compatible</h4>
        <ul>
          {no.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              {item.note && <span className="note"> — {item.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
