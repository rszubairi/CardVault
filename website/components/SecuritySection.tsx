// Pure server component — all animations via SVG-native <animate> / <animateMotion>
// and CSS @keyframes defined in globals.css. Zero client-side JS required.

// ─── Security feature cards ────────────────────────────────────────────────────

const SECURITY_FEATURES = [
  {
    color: 'indigo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
    badge: 'AES-256-GCM',
    title: 'Encrypted Before Upload',
    desc: 'Contact details — emails, phone numbers, notes — are encrypted on your device using AES-256-GCM before they ever reach our servers. We store ciphertext, not your data.',
  },
  {
    color: 'violet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
    badge: 'PBKDF2 · 100k iterations',
    title: 'Your PIN, Your Key',
    desc: 'A 6-digit PIN you set derives your unique encryption key using PBKDF2 with 100,000 iterations. Your PIN never leaves your device. We have no way to decrypt your contacts — ever.',
  },
  {
    color: 'emerald',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    badge: 'Zero-knowledge server',
    title: 'We Can\'t Read Your Data',
    desc: 'Even if our servers were fully compromised, attackers would find only encrypted blobs — meaningless without your PIN. Your encryption key exists only in your memory and on your device.',
  },
] as const;

// ─── SVG helper: shield path ──────────────────────────────────────────────────
// Shield centered at cx=410, top at cy-90, bottom at cy+90

// ─── Main component ──────────────────────────────────────────────────────────

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="py-28 px-5 sm:px-8 relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
      />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Section header ── */}
      <div className="relative text-center mb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6 tracking-wide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          Military-grade encryption · built in
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-[1.08] tracking-tight">
          Your data.{' '}
          <span className="text-gradient">Your key.</span>
          <br />
          Your control.
        </h2>

        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
          CardVault is the only business card CRM that encrypts your contacts with a personal PIN before
          they ever leave your phone. Not even we can read them.
        </p>
      </div>

      {/* ── Animated encryption flow SVG ── */}
      <div className="relative max-w-5xl mx-auto mb-20">
        <div
          className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #080c14 0%, #0d1022 100%)' }}
        >
          {/* Labels above columns */}
          <div className="flex justify-between px-8 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-widest">
            <span className="text-gray-600 w-40 text-center">Your Device</span>
            <span className="text-indigo-500/70">Encryption Engine</span>
            <span className="text-gray-600 w-40 text-center">CardVault Servers</span>
          </div>

          <svg
            viewBox="0 0 820 340"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            aria-hidden="true"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#0d1117" stopOpacity="0.6"/>
              </linearGradient>

              <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#312e81" stopOpacity="0.1"/>
              </linearGradient>

              <linearGradient id="serverGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#052e16" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#0d1117" stopOpacity="0.5"/>
              </linearGradient>

              <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
              </radialGradient>

              <radialGradient id="glowDot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
              </radialGradient>

              <filter id="glow-sm">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-md">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>

              {/* Particle flow paths – left to shield */}
              <path id="fp-top"  d="M 200,128 C 248,128 298,148 352,162" fill="none"/>
              <path id="fp-mid"  d="M 200,168 C 252,168 302,168 352,172" fill="none"/>
              <path id="fp-bot"  d="M 200,208 C 248,208 298,190 352,182" fill="none"/>

              {/* Particle flow paths – shield to server */}
              <path id="tp-top"  d="M 468,162 C 518,148 568,128 620,128" fill="none"/>
              <path id="tp-mid"  d="M 468,172 C 518,172 568,172 620,172" fill="none"/>
              <path id="tp-bot"  d="M 468,182 C 518,190 568,208 620,208" fill="none"/>
            </defs>

            {/* ── Left panel: Contact card (device) ── */}
            <g style={{ animation: 'sec-float 5s ease-in-out infinite' }}
               transform="translate(0,0)">
              {/* Card shadow glow */}
              <ellipse cx="120" cy="272" rx="70" ry="8" fill="#4f46e5" opacity="0.08"/>

              {/* Card body */}
              <rect x="30" y="60" width="170" height="220" rx="16" fill="url(#cardGrad)"
                stroke="rgba(99,102,241,0.3)" strokeWidth="1"/>

              {/* Card header bar */}
              <rect x="30" y="60" width="170" height="48" rx="16" fill="rgba(99,102,241,0.15)"/>
              <rect x="30" y="88" width="170" height="20" fill="rgba(99,102,241,0.15)"/>

              {/* Avatar */}
              <circle cx="68" cy="84" r="18" fill="#312e81" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
              <text x="68" y="90" textAnchor="middle" fill="#a5b4fc" fontSize="13" fontWeight="700">J</text>

              {/* Name */}
              <text x="96" y="78" fill="#f1f5f9" fontSize="11" fontWeight="600">James Whitfield</text>
              <text x="96" y="93" fill="#94a3b8" fontSize="9">VP of Product · Acme Corp</text>

              {/* Divider */}
              <line x1="50" y1="118" x2="180" y2="118" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>

              {/* Email row */}
              <circle cx="58" cy="137" r="7" fill="rgba(99,102,241,0.2)"/>
              <line x1="52" y1="137" x2="64" y2="137" stroke="#818cf8" strokeWidth="1.2"/>
              <line x1="58" y1="131" x2="58" y2="143" stroke="#818cf8" strokeWidth="1.2"/>
              <text x="74" y="133" fill="#94a3b8" fontSize="7.5">Email</text>
              <text x="74" y="144" fill="#e2e8f0" fontSize="8.5">james@acmecorp.io</text>

              {/* Phone row */}
              <circle cx="58" cy="164" r="7" fill="rgba(99,102,241,0.2)"/>
              <text x="55.5" y="168" fill="#818cf8" fontSize="9">☎</text>
              <text x="74" y="160" fill="#94a3b8" fontSize="7.5">Phone</text>
              <text x="74" y="171" fill="#e2e8f0" fontSize="8.5">+1 (555) 234-5678</text>

              {/* LinkedIn row */}
              <circle cx="58" cy="191" r="7" fill="rgba(10,102,194,0.25)"/>
              <text x="54.5" y="195" fill="#60a5fa" fontSize="9" fontWeight="700">in</text>
              <text x="74" y="187" fill="#94a3b8" fontSize="7.5">LinkedIn</text>
              <text x="74" y="198" fill="#e2e8f0" fontSize="8.5">linkedin.com/in/jwhit</text>

              {/* Meeting notes row */}
              <line x1="50" y1="210" x2="180" y2="210" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>
              <text x="50" y="224" fill="#64748b" fontSize="7.5">Meeting notes</text>
              <rect x="50" y="230" width="130" height="6" rx="3" fill="rgba(148,163,184,0.15)"/>
              <rect x="50" y="240" width="100" height="6" rx="3" fill="rgba(148,163,184,0.10)"/>
              <rect x="50" y="250" width="115" height="6" rx="3" fill="rgba(148,163,184,0.08)"/>

              {/* "Unlocked / readable" badge */}
              <rect x="48" y="264" width="64" height="14" rx="7" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1"/>
              <text x="80" y="274" textAnchor="middle" fill="#a5b4fc" fontSize="7.5" fontWeight="600">READABLE</text>
            </g>

            {/* ── Particle flow: device → shield ── */}
            {/* Top path */}
            {[0, 0.65, 1.3].map((d, i) => (
              <circle key={`lp-top-${i}`} r="3.5" fill="#6366f1" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#fp-top"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}
            {/* Mid path */}
            {[0.2, 0.85, 1.5].map((d, i) => (
              <circle key={`lp-mid-${i}`} r="3.5" fill="#818cf8" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#fp-mid"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}
            {/* Bot path */}
            {[0.4, 1.05].map((d, i) => (
              <circle key={`lp-bot-${i}`} r="3.5" fill="#6366f1" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#fp-bot"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}

            {/* ── Center: Shield + Encryption engine ── */}

            {/* Expanding glow rings */}
            <circle cx="410" cy="170" r="52" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5">
              <animate attributeName="r" values="52;105" dur="2.4s" repeatCount="indefinite" begin="0s"/>
              <animate attributeName="opacity" values="0.55;0" dur="2.4s" repeatCount="indefinite" begin="0s"/>
            </circle>
            <circle cx="410" cy="170" r="52" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1">
              <animate attributeName="r" values="52;105" dur="2.4s" repeatCount="indefinite" begin="0.8s"/>
              <animate attributeName="opacity" values="0.45;0" dur="2.4s" repeatCount="indefinite" begin="0.8s"/>
            </circle>
            <circle cx="410" cy="170" r="52" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1">
              <animate attributeName="r" values="52;105" dur="2.4s" repeatCount="indefinite" begin="1.6s"/>
              <animate attributeName="opacity" values="0.35;0" dur="2.4s" repeatCount="indefinite" begin="1.6s"/>
            </circle>

            {/* Shield fill glow */}
            <ellipse cx="410" cy="185" rx="72" ry="80" fill="url(#shieldGlow)"
              style={{ animation: 'sec-shield-glow 2s ease-in-out infinite' }}/>

            {/* Shield outline */}
            <path
              d="M410,82 C410,82 455,98 476,115 L476,188 Q476,252 410,274 Q344,252 344,188 L344,115 C365,98 410,82 410,82 Z"
              fill="rgba(30,27,75,0.7)"
              stroke="rgba(99,102,241,0.7)"
              strokeWidth="1.5"
              filter="url(#glow-sm)"
            />

            {/* Shield inner highlight line */}
            <path
              d="M410,90 C410,90 448,103 466,118 L466,183 Q466,240 410,260"
              fill="none"
              stroke="rgba(167,139,250,0.2)"
              strokeWidth="1"
            />

            {/* Lock body */}
            <g style={{ animation: 'sec-lock-float 3s ease-in-out infinite' }}>
              {/* Shackle arc */}
              <path
                d="M393,185 L393,172 Q393,156 410,156 Q427,156 427,172 L427,185"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Lock body rect */}
              <rect x="384" y="184" width="52" height="38" rx="8"
                fill="#312e81" stroke="#6366f1" strokeWidth="1.5"/>
              {/* Keyhole circle */}
              <circle cx="410" cy="199" r="5.5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5"/>
              {/* Keyhole stem */}
              <rect x="407.5" y="202" width="5" height="9" rx="2" fill="#1e1b4b"/>

              {/* "AES-256" micro label */}
              <text x="410" y="232" textAnchor="middle" fill="#6366f1" fontSize="7" fontWeight="700"
                letterSpacing="0.5">AES-256-GCM</text>
            </g>

            {/* PIN dots below shield */}
            {[0,1,2,3,4,5].map((i) => (
              <circle key={i}
                cx={370 + i * 16} cy={296} r="5"
                fill="rgba(99,102,241,0.15)"
                stroke="rgba(99,102,241,0.4)"
                strokeWidth="1.2"
                style={{ animation: `sec-pin${i+1} 4.2s ease-in-out infinite` }}
              />
            ))}
            <text x="410" y="316" textAnchor="middle" fill="#475569" fontSize="7.5" fontWeight="500"
              letterSpacing="0.5">YOUR PERSONAL PIN KEY</text>

            {/* ── Particle flow: shield → server ── */}
            {[0, 0.6, 1.2].map((d, i) => (
              <circle key={`rp-top-${i}`} r="3.5" fill="#10b981" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#tp-top"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}
            {[0.25, 0.9, 1.55].map((d, i) => (
              <circle key={`rp-mid-${i}`} r="3.5" fill="#34d399" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#tp-mid"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}
            {[0.5, 1.15].map((d, i) => (
              <circle key={`rp-bot-${i}`} r="3.5" fill="#10b981" filter="url(#glow-sm)">
                <animateMotion dur="2s" repeatCount="indefinite" begin={`${d}s`}>
                  <mpath href="#tp-bot"/>
                </animateMotion>
                <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.15;0.85;1"
                  dur="2s" repeatCount="indefinite" begin={`${d}s`}/>
              </circle>
            ))}

            {/* ── Right panel: Encrypted server storage ── */}
            <g>
              {/* Server glow shadow */}
              <ellipse cx="700" cy="272" rx="65" ry="7" fill="#10b981" opacity="0.06"/>

              {/* Server body */}
              <rect x="622" y="62" width="156" height="218" rx="14"
                fill="url(#serverGrad)" stroke="rgba(16,185,129,0.25)" strokeWidth="1"/>

              {/* Server bays */}
              {[0,1,2,3].map((i) => (
                <g key={i}>
                  <rect x="635" y={78 + i*44} width="130" height="34" rx="6"
                    fill="rgba(5,46,22,0.6)" stroke="rgba(16,185,129,0.15)" strokeWidth="1"/>
                  {/* LED indicator */}
                  <circle cx="648" cy={95 + i*44} r="3.5" fill="#10b981" opacity="0.6">
                    <animate attributeName="opacity" values="0.4;0.9;0.4"
                      dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite"/>
                  </circle>
                  {/* Encrypted data bars */}
                  {[0,1,2].map((j) => (
                    <rect key={j}
                      x={658 + j * 36} y={88 + i*44}
                      width={18 + (j * i * 5) % 22}
                      height="6" rx="2"
                      fill="rgba(52,211,153,0.25)"
                      style={{ animation: `sec-cipher ${1.5 + j * 0.4 + i * 0.2}s ease-in-out infinite` }}
                    />
                  ))}
                  <rect x="658" y={98 + i*44} width="108" height="5" rx="2"
                    fill="rgba(52,211,153,0.12)"
                    style={{ animation: `sec-cipher ${2.1 + i * 0.3}s ease-in-out infinite` }}/>
                </g>
              ))}

              {/* Bottom encrypted label */}
              <rect x="635" y="264" width="130" height="12" rx="4"
                fill="rgba(5,46,22,0.4)" stroke="rgba(16,185,129,0.15)" strokeWidth="1"/>
              <text x="700" y="273.5" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="700"
                letterSpacing="1">CIPHERTEXT ONLY</text>

              {/* Encrypted badge top-right of server */}
              <rect x="692" y="56" width="52" height="14" rx="7"
                fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" strokeWidth="1"/>
              <text x="718" y="66" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="700">ENCRYPTED</text>
            </g>

            {/* ── Arrow labels in flow zone ── */}
            <g fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeDasharray="4 3">
              <line x1="205" y1="170" x2="340" y2="170"/>
            </g>
            <g fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1" strokeDasharray="4 3">
              <line x1="480" y1="170" x2="618" y2="170"/>
            </g>

            {/* Label: "encrypt" in middle of left flow */}
            <text x="272" y="160" textAnchor="middle" fill="rgba(99,102,241,0.5)" fontSize="7.5" fontWeight="600"
              letterSpacing="0.5">ENCRYPT</text>
            {/* Label: "store" in middle of right flow */}
            <text x="548" y="160" textAnchor="middle" fill="rgba(16,185,129,0.5)" fontSize="7.5" fontWeight="600"
              letterSpacing="0.5">STORE</text>

            {/* ── Vertical separator lines ── */}
            <line x1="215" y1="55" x2="215" y2="285"
              stroke="rgba(99,102,241,0.12)" strokeWidth="1" strokeDasharray="6 4"/>
            <line x1="605" y1="55" x2="605" y2="285"
              stroke="rgba(16,185,129,0.12)" strokeWidth="1" strokeDasharray="6 4"/>
          </svg>

          {/* Bottom legend */}
          <div className="flex justify-center gap-8 pb-6 pt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"/>
              Plaintext on-device
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>
              Encrypted in transit &amp; at rest
            </span>
          </div>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {SECURITY_FEATURES.map((f, i) => {
          const accentMap = {
            indigo:  { bg: 'bg-indigo-900/30', border: 'border-indigo-800/40', icon: 'text-indigo-400', badge: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40' },
            violet:  { bg: 'bg-violet-900/30', border: 'border-violet-800/40', icon: 'text-violet-400', badge: 'bg-violet-950/60 text-violet-400 border-violet-800/40' },
            emerald: { bg: 'bg-emerald-900/20', border: 'border-emerald-800/30', icon: 'text-emerald-400', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/30' },
          } as const;
          const a = accentMap[f.color];
          return (
            <div
              key={i}
              className="rounded-2xl border border-white/8 bg-[#0a0e1a] p-7 hover:bg-[#0d1222] transition-colors group"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center ${a.icon} mb-5 group-hover:scale-105 transition-transform`}>
                {f.icon}
              </div>

              {/* Tech badge */}
              <div className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${a.badge} mb-3`}>
                {f.badge}
              </div>

              <h3 className="text-white font-bold text-lg mb-3 group-hover:text-indigo-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── Bottom trust bar ── */}
      <div className="relative max-w-3xl mx-auto mt-16 rounded-2xl border border-white/6 bg-white/2 px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Open to audit</p>
              <p className="text-gray-500 text-xs">Our encryption implementation is open-source and reviewable on GitHub.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 text-center sm:text-right">
            {[
              { label: 'Encryption', value: 'AES-256-GCM' },
              { label: 'Key Derivation', value: 'PBKDF2 SHA-256' },
              { label: 'Iterations', value: '100,000×' },
              { label: 'Stored PIN', value: 'Never' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-gray-600 mb-0.5">{label}</div>
                <div className="text-emerald-400 font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
