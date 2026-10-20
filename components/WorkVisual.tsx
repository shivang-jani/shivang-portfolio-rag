// Themed, deterministic SVG visuals for each project panel. Deterministic (no
// Math.random) so server and client render identically. If a project has a real
// screenshot, pass `src` and it renders that instead.

type Kind = "voice" | "agents" | "portal" | "social";

export default function WorkVisual({
  kind,
  accent,
  src,
  alt,
}: {
  kind: Kind;
  accent: string;
  src?: string;
  alt?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="panel__img" src={src} alt={alt || ""} />;
  }
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={alt || ""}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`glow-${kind}`} cx="70%" cy="35%" r="75%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.05" />
          <stop offset="100%" stopColor="#090a0e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fade-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor="#6b7686" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="#0b0d13" />
      {/* faint grid */}
      <g stroke="#1b2130" strokeWidth="1">
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="800" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 100} x2="1200" y2={i * 100} />
        ))}
      </g>
      <rect width="1200" height="800" fill={`url(#glow-${kind})`} />

      {kind === "voice" && <Voice accent={accent} />}
      {kind === "agents" && <Agents accent={accent} />}
      {kind === "portal" && <Portal accent={accent} />}
      {kind === "social" && <Social accent={accent} />}
    </svg>
  );
}

function Voice({ accent }: { accent: string }) {
  // Integer-only, no trig — so server and client render identical strings.
  const N = 56;
  const bars = Array.from({ length: N }).map((_, i) => {
    const t = (i * 2) / (N - 1); // 0..2
    const env = 1 - Math.abs(t - 1); // triangle envelope, peaks center
    const seed = ((i * 2654435761) % 1000) / 1000; // deterministic 0..1
    const h = Math.round(30 + env * (0.4 + 0.6 * seed) * 430);
    const x = Math.round(120 + i * 17.5);
    const y = Math.round(400 - h / 2);
    const op = (0.35 + 0.5 * (h / 460)).toFixed(2);
    return { x, y, h, op, key: i };
  });
  return (
    <g>
      <line x1="90" y1="400" x2="1120" y2="400" stroke={accent} strokeOpacity="0.25" />
      {bars.map((b) => (
        <rect key={b.key} x={b.x} y={b.y} width="7" height={b.h} rx="3.5" fill={accent} opacity={b.op} />
      ))}
    </g>
  );
}

function Agents({ accent }: { accent: string }) {
  const nodes = [
    { x: 180, y: 220, r: 26 },
    { x: 180, y: 520, r: 22 },
    { x: 470, y: 370, r: 34 },
    { x: 760, y: 220, r: 24 },
    { x: 760, y: 520, r: 24 },
    { x: 1030, y: 370, r: 30 },
  ];
  const edges = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
  ];
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="2"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 10} fill={accent} opacity="0.08" />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="#0e1320"
            stroke={accent}
            strokeWidth="2.5"
          />
          <circle cx={n.x} cy={n.y} r={n.r / 3} fill={accent} />
        </g>
      ))}
    </g>
  );
}

function Portal({ accent }: { accent: string }) {
  const cards = [0, 1, 2, 3, 4, 5];
  return (
    <g>
      {/* browser frame */}
      <rect x="170" y="150" width="860" height="500" rx="16" fill="#0e1320" stroke="#232b3b" strokeWidth="2" />
      <rect x="170" y="150" width="860" height="52" rx="16" fill="#131a28" />
      <circle cx="202" cy="176" r="6" fill={accent} />
      <circle cx="226" cy="176" r="6" fill="#3a4556" />
      <circle cx="250" cy="176" r="6" fill="#3a4556" />
      <rect x="300" y="166" width="520" height="20" rx="10" fill="#1a2230" />
      {cards.map((c) => {
        const col = c % 3;
        const row = Math.floor(c / 3);
        const x = 210 + col * 272;
        const y = 240 + row * 190;
        return (
          <g key={c}>
            <rect x={x} y={y} width="240" height="160" rx="12" fill="#121a28" stroke="#232b3b" />
            <rect x={x + 20} y={y + 22} width="90" height="14" rx="7" fill={accent} opacity="0.85" />
            <rect x={x + 20} y={y + 54} width="180" height="10" rx="5" fill="#2b3545" />
            <rect x={x + 20} y={y + 74} width="150" height="10" rx="5" fill="#2b3545" />
            <rect x={x + 20} y={y + 112} width="70" height="26" rx="13" fill="none" stroke={accent} strokeWidth="2" />
          </g>
        );
      })}
    </g>
  );
}

function Social({ accent }: { accent: string }) {
  const rows = [0, 1, 2, 3];
  return (
    <g>
      <rect x="360" y="90" width="480" height="640" rx="20" fill="#0e1320" stroke="#232b3b" strokeWidth="2" />
      {rows.map((r) => {
        const y = 150 + r * 150;
        return (
          <g key={r}>
            <circle cx="420" cy={y + 20} r="26" fill="#131a28" stroke={accent} strokeWidth="2" />
            <rect x="466" y={y} width="120" height="14" rx="7" fill={accent} opacity="0.8" />
            <rect x="466" y={y + 28} width="320" height="11" rx="5.5" fill="#2b3545" />
            <rect x="466" y={y + 48} width="260" height="11" rx="5.5" fill="#2b3545" />
            <g stroke="#2b3545" strokeWidth="2" fill="none">
              <path d={`M466 ${y + 84} l10 -10 10 10`} stroke={accent} opacity="0.7" />
              <circle cx="540" cy={y + 80} r="8" />
              <rect x="600" y={y + 72} width="16" height="16" rx="3" />
            </g>
          </g>
        );
      })}
    </g>
  );
}
