import React, { useState, useEffect, useRef, useCallback } from "react";

interface Card {
  id: number;
  tag: string;
  title: string;
  body: string;
  stat: { value: string; label: string };
  accent: string;
  accentDim: string;
  visual: React.ReactNode;
}

// ─── Visual scenes ────────────────────────────────────────────────────────────

const PrivacyScene = () => (
  <svg width="100%" height="100%" viewBox="0 0 460 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="pg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Grid lines */}
    {[...Array(9)].map((_, i) => (
      <line key={i} x1={i * 57} y1="0" x2={i * 57} y2="180" stroke="#22c55e" strokeOpacity="0.06" strokeWidth="1" />
    ))}
    {[...Array(5)].map((_, i) => (
      <line key={i} x1="0" y1={i * 45} x2="460" y2={i * 45} stroke="#22c55e" strokeOpacity="0.06" strokeWidth="1" />
    ))}
    <rect width="460" height="180" fill="url(#pg)" />
    {/* Floating lock */}
    <g filter="url(#glow)" transform="translate(200,60)">
      <rect x="8" y="28" width="44" height="34" rx="6" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeOpacity="0.9" />
      <path d="M16 28 Q16 8 30 8 Q44 8 44 28" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeOpacity="0.9" />
      <circle cx="30" cy="45" r="4" fill="#22c55e" fillOpacity="0.9" />
      <line x1="30" y1="49" x2="30" y2="55" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.7" />
    </g>
    {/* Orbiting dots */}
    <circle cx="230" cy="90" r="52" fill="none" stroke="#22c55e" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 6">
      <animateTransform attributeName="transform" type="rotate" from="0 230 90" to="360 230 90" dur="12s" repeatCount="indefinite" />
    </circle>
    <circle cx="230" cy="90" r="52" fill="none" stroke="#22c55e" strokeOpacity="0" strokeWidth="0">
      <animateTransform attributeName="transform" type="rotate" from="0 230 90" to="360 230 90" dur="12s" repeatCount="indefinite" />
    </circle>
    <circle r="4" fill="#22c55e" fillOpacity="0.8">
      <animateMotion dur="12s" repeatCount="indefinite" path="M230,38 A52,52 0 1,1 229.99,38" />
    </circle>
    {/* Data streams */}
    {[60, 120, 160, 300, 360, 400].map((x, i) => (
      <g key={i}>
        <text x={x} y={20 + (i % 3) * 55} fontFamily="monospace" fontSize="9" fill="#22c55e" fillOpacity="0.2">
          {["0x9F", "••••", "AES", "256", "KEY", "GCM"][i]}
        </text>
      </g>
    ))}
  </svg>
);

const SecurityScene = () => (
  <svg width="100%" height="100%" viewBox="0 0 460 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="sg" cx="50%" cy="60%" r="45%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
    {[...Array(9)].map((_, i) => (
      <line key={i} x1={i * 57} y1="0" x2={i * 57} y2="180" stroke="#3b82f6" strokeOpacity="0.05" strokeWidth="1" />
    ))}
    <rect width="460" height="180" fill="url(#sg)" />
    {/* Shield */}
    <g transform="translate(196,22)">
      <path d="M34 0 L68 14 L68 50 Q68 82 34 94 Q0 82 0 50 L0 14 Z" fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M34 10 L58 20 L58 50 Q58 73 34 83 Q10 73 10 50 L10 20 Z" fill="#3b82f6" fillOpacity="0.06" />
      <path d="M22 47 L30 55 L46 38" fill="none" stroke="#22c55e" strokeWidth="3" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    {/* Attack particles bouncing off */}
    {[0, 1, 2, 3, 4].map(i => (
      <circle key={i} r="3" fill="#ef4444" fillOpacity="0.7">
        <animateMotion dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.35}s`}
          path={`M${20 + i * 90},${10 + i * 30} L${200 + i * 8},${70 + i * 5}`} />
        <animate attributeName="fillOpacity" values="0;0.8;0" dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.35}s`} />
      </circle>
    ))}
    <text x="20" y="165" fontFamily="monospace" fontSize="8" fill="#3b82f6" fillOpacity="0.3">THREATS BLOCKED: 1,042,891</text>
  </svg>
);

const GeneratorScene = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
  const reels = Array.from({ length: 12 }, (_, i) => chars[(i * 7 + 13) % chars.length]);
  return (
    <svg width="100%" height="100%" viewBox="0 0 460 180" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="gg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[...Array(9)].map((_, i) => (
        <line key={i} x1={i * 57} y1="0" x2={i * 57} y2="180" stroke="#f59e0b" strokeOpacity="0.05" strokeWidth="1" />
      ))}
      <rect width="460" height="180" fill="url(#gg)" />
      {/* Password display bar */}
      <rect x="60" y="65" width="340" height="50" rx="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
      <rect x="60" y="65" width="340" height="50" rx="8" fill="#f59e0b" fillOpacity="0.04" />
      {reels.map((ch, i) => (
        <text key={i} x={83 + i * 24} y="97" fontFamily="monospace" fontSize="15" fontWeight="bold"
          fill={i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#ffffff" : "#22c55e"}
          fillOpacity={i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0.5 : 0.7}>
          {ch}
          <animate attributeName="opacity" values="1;0.2;1" dur={`${0.8 + i * 0.12}s`} repeatCount="indefinite" begin={`${i * 0.07}s`} />
        </text>
      ))}
      <text x="60" y="145" fontFamily="monospace" fontSize="8" fill="#f59e0b" fillOpacity="0.4" letterSpacing="2">ENTROPY: 94.3 BITS · STRENGTH: EXCELLENT</text>
      {/* Strength bar */}
      <rect x="60" y="152" width="340" height="3" rx="1.5" fill="#f59e0b" fillOpacity="0.1" />
      <rect x="60" y="152" width="310" height="3" rx="1.5" fill="#22c55e" fillOpacity="0.7" />
    </svg>
  );
};

const AccessScene = () => (
  <svg width="100%" height="100%" viewBox="0 0 460 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="ag" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
    {[...Array(9)].map((_, i) => (
      <line key={i} x1={i * 57} y1="0" x2={i * 57} y2="180" stroke="#a78bfa" strokeOpacity="0.05" strokeWidth="1" />
    ))}
    <rect width="460" height="180" fill="url(#ag)" />
    {/* Master key */}
    <g transform="translate(195,55)">
      <circle cx="20" cy="20" r="14" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.9" />
      <circle cx="20" cy="20" r="7" fill="#a78bfa" fillOpacity="0.15" />
      <line x1="30" y1="28" x2="50" y2="48" stroke="#a78bfa" strokeWidth="3" strokeOpacity="0.9" strokeLinecap="round" />
      <line x1="42" y1="44" x2="48" y2="38" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
      <line x1="48" y1="50" x2="54" y2="44" stroke="#a78bfa" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
      <animateTransform attributeName="transform" type="rotate" values="-5 230 90;5 230 90;-5 230 90" dur="3s" repeatCount="indefinite" />
    </g>
    {/* Connected devices */}
    {[
      { x: 80, y: 100, label: "Mobile" },
      { x: 160, y: 40, label: "Laptop" },
      { x: 320, y: 40, label: "Tablet" },
      { x: 390, y: 100, label: "Desktop" },
    ].map((d, i) => (
      <g key={i}>
        <line x1={d.x} y1={d.y} x2="230" y2="90" stroke="#a78bfa" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx={d.x} cy={d.y} r="5" fill="#a78bfa" fillOpacity="0.6">
          <animate attributeName="fillOpacity" values="0.3;0.8;0.3" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
        <text x={d.x} y={d.y + 16} textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#a78bfa" fillOpacity="0.5">{d.label}</text>
      </g>
    ))}
  </svg>
);

const ProtectionScene = () => (
  <svg width="100%" height="100%" viewBox="0 0 460 180" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="prg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
    {[...Array(9)].map((_, i) => (
      <line key={i} x1={i * 57} y1="0" x2={i * 57} y2="180" stroke="#f43f5e" strokeOpacity="0.05" strokeWidth="1" />
    ))}
    <rect width="460" height="180" fill="url(#prg)" />
    {/* Radar circles */}
    {[30, 55, 80].map((r, i) => (
      <circle key={i} cx="230" cy="90" r={r} fill="none" stroke="#f43f5e" strokeOpacity={0.15 - i * 0.04} strokeWidth="1" />
    ))}
    {/* Radar sweep */}
    <line x1="230" y1="90" x2="230" y2="10" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 230 90" to="360 230 90" dur="4s" repeatCount="indefinite" />
    </line>
    {/* Threat blips */}
    {[{ cx: 170, cy: 55 }, { cx: 310, cy: 70 }, { cx: 260, cy: 130 }].map((p, i) => (
      <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#ef4444" fillOpacity="0">
        <animate attributeName="fillOpacity" values="0;0.9;0.4;0.9;0" dur={`${3 + i}s`} repeatCount="indefinite" begin={`${i * 1.1}s`} />
        <animate attributeName="r" values="2;5;2" dur={`${3 + i}s`} repeatCount="indefinite" begin={`${i * 1.1}s`} />
      </circle>
    ))}
    <text x="20" y="20" fontFamily="monospace" fontSize="8" fill="#f43f5e" fillOpacity="0.4">● MONITORING ACTIVE</text>
    <text x="20" y="165" fontFamily="monospace" fontSize="8" fill="#22c55e" fillOpacity="0.4">✓ ALL SYSTEMS SECURE</text>
  </svg>
);

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS: Card[] = [
  {
    id: 0,
    tag: "Privacy",
    title: "We never see your passwords",
    body: "Encrypted client-side before it ever leaves your device. Zero-knowledge by design — not policy.",
    stat: { value: "E2E", label: "Encrypted" },
    accent: "#22c55e",
    accentDim: "rgba(34,197,94,0.12)",
    visual: <PrivacyScene />,
  },
  {
    id: 1,
    tag: "Security",
    title: "Breach-proof by architecture",
    body: "Our servers hold nothing readable. A full breach yields zero usable data without your key.",
    stat: { value: "0kb", label: "Exposed Data" },
    accent: "#3b82f6",
    accentDim: "rgba(59,130,246,0.12)",
    visual: <SecurityScene />,
  },
  {
    id: 2,
    tag: "Generator",
    title: "Strong passwords, one click",
    body: "94-bit entropy on demand. Custom rules, no reuse, every account gets a unique fortress.",
    stat: { value: "94bit", label: "Entropy" },
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.12)",
    visual: <GeneratorScene />,
  },
  {
    id: 3,
    tag: "Access",
    title: "One key. Every device.",
    body: "One master password unlocks your vault everywhere — phone, laptop, desktop, seamlessly.",
    stat: { value: "∞", label: "Devices" },
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.12)",
    visual: <AccessScene />,
  },
  {
    id: 4,
    tag: "Protection",
    title: "24/7 active threat radar",
    body: "Behavioral analysis and breach monitoring watches for suspicious activity around the clock.",
    stat: { value: "24/7", label: "Monitoring" },
    accent: "#f43f5e",
    accentDim: "rgba(244,63,94,0.12)",
    visual: <ProtectionScene />,
  },
];

const INTERVAL_MS = 5500;
const TRANSITION_MS = 480;

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  .kv2-wrap {
    width: min(520px, 94vw);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    font-family: 'JetBrains Mono', monospace;
    position: relative;
  }

  /* ── Stage ── */
  .kv2-stage {
    width: 100%;
    position: relative;
    perspective: 1400px;
    perspective-origin: 55% 45%;
  }

  /* Invisible sizer — gives the stage its natural height */
  .kv2-sizer {
    visibility: hidden;
    pointer-events: none;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
  }
  .kv2-sizer .kv2-accent-bar { height: 3px; flex-shrink: 0; }
  .kv2-sizer .kv2-visual      { height: clamp(130px, 30vw, 180px); flex-shrink: 0; }
  .kv2-sizer .kv2-body        { padding: 20px 24px 22px; display: flex; flex-direction: column; gap: 12px; }
  .kv2-sizer .kv2-title       { font-family: 'Syne', sans-serif; font-size: 1.45rem; font-weight: 800; line-height: 1.2; }
  .kv2-sizer .kv2-desc        { font-size: 0.68rem; line-height: 1.8; }
  .kv2-sizer .kv2-footer      { padding-top: 14px; display: flex; }

  /* Ghost stack behind */
  .kv2-ghost {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 20px;
    pointer-events: none;
  }
  .kv2-ghost-1 {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    transform: rotateY(-6deg) translateY(22px) translateZ(-40px) scaleX(0.88);
    opacity: 0.5;
  }
  .kv2-ghost-2 {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    transform: rotateY(-6deg) translateY(11px) translateZ(-20px) scaleX(0.94);
    opacity: 0.7;
  }

  /* ── Slot ── */
  .kv2-slot {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 20px;
    transition:
      transform ${TRANSITION_MS}ms cubic-bezier(0.65, 0, 0.15, 1),
      opacity   ${TRANSITION_MS}ms ease;
    will-change: transform, opacity;
  }
  .kv2-slot[data-pos="visible"] { transform: rotateY(-6deg) translateX(0)    scale(1);    opacity: 1; }
  .kv2-slot[data-pos="right"]   { transform: rotateY(-6deg) translateX(110%)  scale(0.92); opacity: 0; }
  .kv2-slot[data-pos="left"]    { transform: rotateY(-6deg) translateX(-110%) scale(0.92); opacity: 0; }

  /* ── Card shell ── */
  .kv2-card {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateZ(0);
    user-select: none;
    -webkit-user-select: none;
  }

  /* Accent top bar */
  .kv2-accent-bar {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
    transition: background 0.4s ease;
  }

  /* ── Visual panel ── */
  .kv2-visual {
    width: 100%;
    height: clamp(130px, 30vw, 180px);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    background: #050505;
  }

  /* Scanline overlay */
  .kv2-visual::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.18) 3px,
      rgba(0,0,0,0.18) 4px
    );
    pointer-events: none;
    z-index: 2;
  }

  /* Vignette fade into body */
  .kv2-visual::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(to bottom, transparent, #0a0a0a);
    z-index: 3;
    pointer-events: none;
  }

  /* ── Body ── */
  .kv2-body {
    flex: 1;
    padding: 20px 24px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .kv2-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .kv2-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid;
    transition: color 0.4s, background 0.4s, border-color 0.4s;
  }

  .kv2-counter {
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.2);
  }

  .kv2-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.45rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }

  .kv2-desc {
    font-size: 0.68rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.45);
    font-weight: 300;
    letter-spacing: 0.01em;
  }

  /* ── Footer ── */
  .kv2-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .kv2-stat {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .kv2-stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    transition: color 0.4s;
  }

  .kv2-stat-lbl {
    font-size: 0.55rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
  }

  /* Arc progress ring */
  .kv2-ring { width: 36px; height: 36px; flex-shrink: 0; }
  .kv2-ring svg { transform: rotate(-90deg); display: block; }
  .kv2-ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 2; }
  .kv2-ring-fill {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 100.5;
    stroke-dashoffset: 100.5;
    transition: stroke 0.4s;
  }
  .kv2-ring-fill.run {
    animation: kv2-ring-anim linear forwards;
    animation-duration: var(--ring-dur, ${INTERVAL_MS}ms);
  }
  @keyframes kv2-ring-anim {
    from { stroke-dashoffset: 100.5; }
    to   { stroke-dashoffset: 0; }
  }

  /* ── Nav ── */
  .kv2-nav {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .kv2-btn {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 1rem; outline: none;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .kv2-btn:hover {
    border-color: rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.08);
  }

  .kv2-pips { display: flex; gap: 6px; align-items: center; }
  .kv2-pip {
    height: 3px; width: 18px; border-radius: 2px;
    background: rgba(255,255,255,0.1);
    border: none; cursor: pointer; outline: none; padding: 0;
    transition: width 0.2s cubic-bezier(0.34,1.4,0.64,1), background 0.2s;
  }
  .kv2-pip.on { width: 32px; }

  @media (max-width: 420px) {
    .kv2-title { font-size: 1.15rem; }
    .kv2-body  { padding: 14px 16px 18px; }
    .kv2-stat-val { font-size: 1.3rem; }
  }
`;

function useStyles(id: string, css: string) {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, []);
}

// ─── Card face ────────────────────────────────────────────────────────────────

const CardFace: React.FC<{
  card: Card;
  arcKey: number;
  paused: boolean;
  isVisible: boolean;
  index: number;
  total: number;
}> = ({ card, arcKey, paused, isVisible, index, total }) => (
  <div className="kv2-card">
    {/* Accent stripe */}
    <div className="kv2-accent-bar" style={{ background: card.accent }} />

    {/* Scene visual */}
    <div className="kv2-visual">
      {card.visual}
    </div>

    {/* Content */}
    <div className="kv2-body">
      <div className="kv2-header">
        <span
          className="kv2-tag"
          style={{
            color: card.accent,
            background: card.accentDim,
            borderColor: card.accent + "44",
          }}
        >
          {card.tag}
        </span>
        <span className="kv2-counter">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <h3 className="kv2-title">{card.title}</h3>
      <p className="kv2-desc">{card.body}</p>

      <div className="kv2-footer">
        <div className="kv2-stat">
          <span className="kv2-stat-val" style={{ color: card.accent }}>{card.stat.value}</span>
          <span className="kv2-stat-lbl">{card.stat.label}</span>
        </div>

        <div className="kv2-ring">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle className="kv2-ring-track" cx="18" cy="18" r="16" />
            <circle
              key={`${arcKey}-${card.id}`}
              className={`kv2-ring-fill${isVisible && !paused ? " run" : ""}`}
              cx="18" cy="18" r="16"
              style={{
                stroke: card.accent,
                ["--ring-dur" as string]: `${INTERVAL_MS}ms`,
              }}
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

type Pos = "visible" | "right" | "left";
interface Slot { cardIdx: number; pos: Pos; }

const DeckCards: React.FC<{ externalPause?: boolean }> = ({ externalPause = false }) => {
  useStyles("kv2-sty", STYLE);

  const [slots, setSlots] = useState<[Slot, Slot]>([
    { cardIdx: 0, pos: "visible" },
    { cardIdx: 1, pos: "right" },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [arcKey, setArcKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const paused = externalPause;
  const busy = useRef(false);
  const dragStart = useRef<number | null>(null);

  const advance = useCallback((dir: "next" | "prev", force = false) => {
    if (busy.current && !force) return;
    busy.current = true;

    const incoming: Pos = dir === "next" ? "right" : "left";
    const outgoing: Pos = dir === "next" ? "left" : "right";

    setSlots(([a, b]) => {
      const vis = a.pos === "visible" ? 0 : 1;
      const hid = 1 - vis;
      const next: [Slot, Slot] = [{ ...a }, { ...b }];
      const nextIdx = dir === "next"
        ? (next[vis].cardIdx + 1) % CARDS.length
        : (next[vis].cardIdx - 1 + CARDS.length) % CARDS.length;
      next[hid] = { cardIdx: nextIdx, pos: incoming };
      return next;
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      setSlots(([a, b]) => {
        const vis = a.pos === "visible" ? 0 : 1;
        const hid = 1 - vis;
        const next: [Slot, Slot] = [{ ...a }, { ...b }];
        next[vis] = { ...next[vis], pos: outgoing };
        next[hid] = { ...next[hid], pos: "visible" };
        return next;
      });
      setActiveIdx(prev =>
        dir === "next"
          ? (prev + 1) % CARDS.length
          : (prev - 1 + CARDS.length) % CARDS.length
      );
      setArcKey(k => k + 1);
      setTimeout(() => { busy.current = false; }, TRANSITION_MS + 60);
    }));
  }, []);

  const onDragStart = useCallback((clientX: number) => {
    dragStart.current = clientX;
    setDragging(true);
    setDragOffset(0);
  }, []);

  const onDragMove = useCallback((clientX: number) => {
    if (dragStart.current === null) return;
    const raw = clientX - dragStart.current;
    setDragOffset(raw * 0.5);
  }, []);

  const onDragEnd = useCallback((clientX: number) => {
    if (dragStart.current === null) return;
    const delta = clientX - dragStart.current;
    dragStart.current = null;
    setDragging(false);
    setDragOffset(0);
    if (Math.abs(delta) > 50) {
      advance(delta < 0 ? "next" : "prev", true);
    }
  }, [advance]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => advance("next", false), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, advance]);

  const [slotA, slotB] = slots;
  const activeCard = CARDS[activeIdx];

  return (
    <div className="kv2-wrap">
      <div
        className="kv2-stage"
        style={{
          cursor: dragging ? "grabbing" : "grab",
          userSelect: dragging ? "none" : undefined,
        }}
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseMove={e => onDragMove(e.clientX)}
        onMouseUp={e => onDragEnd(e.clientX)}
        onMouseLeave={() => {
          if (dragStart.current !== null) {
            dragStart.current = null;
            setDragging(false);
            setDragOffset(0);
          }
        }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => onDragMove(e.touches[0].clientX)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
      >
        {/* Invisible sizer — dictates stage height naturally */}
        <div className="kv2-sizer" aria-hidden="true">
          <div className="kv2-accent-bar" />
          <div className="kv2-visual" />
          <div className="kv2-body">
            <div style={{ height: "18px" }} />
            <div className="kv2-title">One master password, everything unlocked</div>
            <div className="kv2-desc">One master password unlocks your vault everywhere — phone, laptop, desktop, seamlessly.</div>
            <div className="kv2-footer" style={{ marginTop: "auto" }}><div style={{ height: "36px" }} /></div>
          </div>
        </div>
        <div className="kv2-ghost kv2-ghost-1" />
        <div className="kv2-ghost kv2-ghost-2" />

        {[slotA, slotB].map((slot, i) => {
          const isVis = slot.pos === "visible";
          const offset = isVis && dragging ? dragOffset : 0;
          const tilt = offset * 0.018;
          const isDraggingVis = isVis && dragging;

          return (
            <div
              key={i}
              className="kv2-slot"
              data-pos={slot.pos}
              style={isDraggingVis ? {
                transform: `rotateY(-6deg) translateX(${offset}px) rotateZ(${tilt}deg) scale(1)`,
                transition: "none",
              } : undefined}
            >
              <CardFace
                card={CARDS[slot.cardIdx]}
                arcKey={arcKey}
                paused={paused}
                isVisible={isVis}
                index={slot.cardIdx}
                total={CARDS.length}
              />
            </div>
          );
        })}
      </div>

      <nav className="kv2-nav" aria-label="Feature cards">
        <button className="kv2-btn" onClick={() => advance("prev")} aria-label="Previous">‹</button>
        <div className="kv2-pips">
          {CARDS.map((c, i) => (
            <button
              key={c.id}
              className={`kv2-pip${i === activeIdx ? " on" : ""}`}
              style={i === activeIdx ? { background: activeCard.accent } : {}}
              onClick={() => { if (i !== activeIdx) advance(i > activeIdx ? "next" : "prev"); }}
              aria-label={`Card ${i + 1}`}
              aria-current={i === activeIdx}
            />
          ))}
        </div>
        <button className="kv2-btn" onClick={() => advance("next")} aria-label="Next">›</button>
      </nav>
    </div>
  );
};

export default DeckCards;