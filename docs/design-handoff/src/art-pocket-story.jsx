// Pocket Garden — Story & Mechanics screens
//
// Builds on the story: hostile exoplanet, plants→potions for survival,
// accounting-puzzle gated progression, radiation-mutated species with
// stat effects, tiny moments of wonder.
//
// Four new screens shown as a flow row:
//   01  SURVIVAL HUD       — the garden, plus air/suit/health
//   02  POTION CRAFTING    — combine plant essences into medicine
//   03  ACCOUNTING RIDDLE  — FASB/ASC puzzle gating a new seed
//   04  CODEX · MUTATION   — earth plant → radiation-mutated form + stats
// Plus a fifth bonus screen: WONDER · METEOR SHOWER (night).
//
// Same palette and sprite system as art-pocket.jsx — references the
// PLANT_*, PixSprite, AnimatedBlob, Plant globals declared there.

// CSS for story screens
if (typeof document !== 'undefined' && !document.getElementById('pocket-story-css')) {
  const s = document.createElement('style');
  s.id = 'pocket-story-css';
  s.textContent = `
    .ps-screen { width: 248px; height: 156px; background: #1a0a3e; border-radius: 6px;
      box-shadow: inset 0 0 0 3px #5a4630, inset 0 0 0 5px #1a0a3e, 0 18px 30px rgba(0,0,0,0.5);
      position: relative; overflow: hidden; }
    .ps-screen svg { display: block; image-rendering: pixelated; }
    .ps-scan { position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px);
      mix-blend-mode: multiply; opacity: 0.5; }
    .ps-glare { position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%); }

    /* SURVIVAL: pulsing air alert */
    .ps-alert { animation: ps-alert 0.9s steps(2) infinite; }
    @keyframes ps-alert { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.25; } }
    /* shrinking air bar */
    .ps-air-bar { animation: ps-air-bar 8s linear infinite; transform-origin: left center; transform-box: fill-box; }
    @keyframes ps-air-bar {
      0%   { transform: scaleX(1);   fill: #a8c862; }
      50%  { transform: scaleX(0.45); fill: #f5cf5e; }
      85%  { transform: scaleX(0.2);  fill: #e07598; }
      100% { transform: scaleX(0.05); fill: #e07598; }
    }
    /* HP heart pulses */
    .ps-hp { animation: ps-hp 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes ps-hp { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

    /* CRAFTING: potion bubbles + swirl */
    .ps-bubble1 { animation: ps-bubble 1.6s ease-out infinite; }
    .ps-bubble2 { animation: ps-bubble 2.2s ease-out infinite; animation-delay: -.6s; }
    .ps-bubble3 { animation: ps-bubble 1.8s ease-out infinite; animation-delay: -1s; }
    @keyframes ps-bubble {
      0%   { transform: translateY(8px); opacity: 0; }
      30%  { opacity: 1; }
      100% { transform: translateY(-10px); opacity: 0; }
    }
    .ps-swirl { animation: ps-swirl 3s linear infinite; transform-origin: center; transform-box: fill-box; }
    @keyframes ps-swirl { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* RIDDLE: cursor on selected answer */
    .ps-ans-cursor { animation: ps-ans-cursor 0.7s steps(2) infinite; }
    @keyframes ps-ans-cursor { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.4; } }

    /* CODEX: arrow pulse mutation */
    .ps-mutate { animation: ps-mutate 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    @keyframes ps-mutate {
      0%,100% { transform: scale(1); filter: brightness(1); }
      50%     { transform: scale(1.05); filter: brightness(1.3); }
    }

    /* METEOR streaks */
    .ps-meteor1 { animation: ps-meteor 2.4s linear infinite; }
    .ps-meteor2 { animation: ps-meteor 3.6s linear infinite; animation-delay: -1.4s; }
    .ps-meteor3 { animation: ps-meteor 2.8s linear infinite; animation-delay: -0.8s; }
    @keyframes ps-meteor {
      0%   { transform: translate(0, 0); opacity: 0; }
      8%   { opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translate(-90px, 60px); opacity: 0; }
    }
    /* firefly drift */
    .ps-firefly { animation: ps-firefly 4s ease-in-out infinite; }
    @keyframes ps-firefly {
      0%,100% { transform: translate(0,0); opacity: 0.3; }
      50%     { transform: translate(8px, -6px); opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

// ============================================================
// 01 · SURVIVAL HUD — garden view with air/suit/health
// ============================================================
function ScreenSurvival() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#10052e'}}>
      {/* toxic sky (sickly green-purple) */}
      <defs>
        <linearGradient id="tox-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3a4e"/>
          <stop offset="100%" stopColor="#3a5e5a"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="58" fill="url(#tox-sky)"/>
      {/* drifting toxic clouds */}
      <PixSprite x={20} y={22} pattern={`
        ..llll..
        .llgllll.
        llgggggll
        .llgglll.
      `}/>
      <PixSprite x={120} y={14} pattern={`
        ...lll...
        ..llggl..
        .lggglll.
        ..llgl...
      `}/>

      <rect x="0" y="58" width="192" height="58" className="pp-primary"/>
      <rect x="0" y="58" width="192" height="2" className="pp-mid"/>

      {/* a few plants and the blob in a hazmat suit (orange tint) */}
      <Plant x={6} y={56} pattern={PLANT_BELL} swayClass="pp-sway"/>
      <Plant x={42} y={56} pattern={PLANT_FERN} swayClass="pp-sway2"/>
      <Plant x={150} y={56} pattern={PLANT_THORN} swayClass="pp-sway"/>
      <Plant x={6} y={80} pattern={PLANT_POD} swayClass="pp-sway3"/>
      <Plant x={150} y={80} pattern={PLANT_ORB} swayClass="pp-sway"/>

      {/* blob with helmet bubble + suit */}
      <g transform="translate(88, 70)">
        {/* suit body (warm-tint) */}
        <PixSprite pattern={`
          ....yyyyyy....
          ..yyyyyyyyyyo.
          .yyyyyyyyyyyyo
          oyyyooyyooyyyo
          oyyyooyyooyyyo
          oyyyyyyyyyyyyo
          oyyyyooooyyyyo
          .oyyyyyyyyyyo.
          ..oyyrrrryyo..
          ...oyyrryyo...
        `}/>
        {/* helmet bubble */}
        <PixSprite x={3} y={-4} pattern={`
          ..llllll..
          .lllllllll
          llllllllllo
          ollllllllllo
          .oolllllloo.
          ...oooooo...
        `}/>
        {/* face inside helmet (eyes only) */}
        <rect x="6" y="0" width="2" height="2" className="pp-ink"/>
        <rect x="10" y="0" width="2" height="2" className="pp-ink"/>
      </g>

      {/* === SURVIVAL HUD === */}
      {/* AIR bar (top-left) — animates depleting */}
      <g>
        <rect x="2" y="2" width="74" height="7" fill="#10052e" stroke="#c5d4ff" strokeWidth="0.5"/>
        <text x="4" y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" fill="#c5d4ff">AIR</text>
        <rect x="18" y="3.5" width="56" height="4" fill="#3a2570"/>
        <rect x="18" y="3.5" width="56" height="4" className="ps-air-bar"/>
      </g>
      {/* SUIT integrity */}
      <g>
        <rect x="2" y="11" width="74" height="7" fill="#10052e" stroke="#c5d4ff" strokeWidth="0.5"/>
        <text x="4" y="16.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" fill="#c5d4ff">SUIT</text>
        <rect x="20" y="12.5" width="54" height="4" fill="#3a2570"/>
        <rect x="20" y="12.5" width="38" height="4" fill="#8acfff"/>
      </g>
      {/* HEALTH hearts */}
      <g>
        <rect x="2" y="20" width="74" height="7" fill="#10052e" stroke="#c5d4ff" strokeWidth="0.5"/>
        <text x="4" y="25.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" fill="#c5d4ff">HP</text>
        {[16, 26, 36, 46, 56].map((x, i) => (
          <g key={i} className={i === 0 ? 'ps-hp' : ''}>
            <PixSprite x={x} y={20} pattern={
              i < 3 ? `.r.r.\nrrrrr\nrrrrr\n.rrr.\n..r..` : `.o.o.\nooooo\nooooo\n.ooo.\n..o..`
            }/>
          </g>
        ))}
      </g>

      {/* blinking warning sticker top right */}
      <g className="ps-alert" transform="translate(140, 2)">
        <rect x="0" y="0" width="50" height="9" fill="#e07598" stroke="#1a0a3e" strokeWidth="0.5"/>
        <text x="3" y="6" fontFamily="'JetBrains Mono', monospace" fontSize="4" fontWeight="700" fill="#1a0a3e">⚠ AIR LOW</text>
      </g>

      {/* prompt bottom */}
      <rect x="2" y="106" width="188" height="9" fill="#10052e" stroke="#c5d4ff" strokeWidth="0.5"/>
      <text x="6" y="112.4" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#c5d4ff">brew <tspan fill="#a8c862">oxalis</tspan> potion · </text>
      <text x="84" y="112.4" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#f5cf5e">A</text>
      <text x="90" y="112.4" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#c5d4ff">craft  </text>
      <text x="118" y="112.4" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#f5cf5e">X</text>
      <text x="124" y="112.4" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#c5d4ff">retreat to bunker</text>
    </svg>
  );
}

// ============================================================
// 02 · POTION CRAFTING
// ============================================================
function ScreenCraft() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#1a0a3e'}}>
      {/* bunker interior — striped wall */}
      <rect x="0" y="0" width="192" height="116" fill="#3a2570"/>
      {Array.from({length: 16}).map((_, i) => (
        <rect key={i} x={i * 12} y="0" width="1" height="80" fill="#5a3e9e" opacity="0.4"/>
      ))}
      {/* shelf bottom */}
      <rect x="0" y="78" width="192" height="3" fill="#8a6e4a"/>
      <rect x="0" y="81" width="192" height="35" fill="#1a0a3e"/>

      {/* === RECIPE BOOK LEFT === */}
      <g transform="translate(4, 8)">
        <rect x="0" y="0" width="64" height="64" fill="#f4e9c8" stroke="#1a0a3e" strokeWidth="1"/>
        <rect x="31" y="0" width="2" height="64" fill="#c08560" opacity="0.5"/>
        <text x="32" y="8" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="6.5" fill="#1a0a3e">recipe</text>
        {/* recipe icons */}
        <g transform="translate(10, 18)">
          <PixSprite pattern={PLANT_BELL} w={0.55} h={0.55}/>
        </g>
        <text x="22" y="26" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#1a0a3e">+</text>
        <g transform="translate(28, 18)">
          <PixSprite pattern={PLANT_FERN} w={0.55} h={0.55}/>
        </g>
        <text x="42" y="26" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#1a0a3e">+</text>
        <g transform="translate(46, 18)">
          <PixSprite pattern={PLANT_ORB} w={0.55} h={0.55}/>
        </g>
        {/* = potion */}
        <text x="32" y="40" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#1a0a3e">=</text>
        <g transform="translate(28, 42)">
          <PixSprite pattern={`
            .l.
            lwl
            wwl
            .l.
          `}/>
        </g>
        <text x="32" y="60" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="7.5" fill="#1a0a3e">oxalis brew</text>
      </g>

      {/* === CAULDRON CENTER === */}
      <g transform="translate(108, 60)">
        {/* cauldron body */}
        <PixSprite x={-22} y={-12} pattern={`
          ..oooooooooooo..
          .ollllllllllllo.
          ollwwwwwwwwwwwlo
          olwwwwwwwwwwwwlo
          .olwwwwwwwwwwlo.
          ..ololllllolo...
        `}/>
        {/* legs */}
        <rect x="-16" y="-2" width="2" height="6" className="pp-ink"/>
        <rect x="14" y="-2" width="2" height="6" className="pp-ink"/>
        {/* potion surface swirl (animated) */}
        <g className="ps-swirl" transform="translate(0, -8)">
          <rect x="-6" y="-1" width="12" height="2" className="pp-warm" opacity="0.7"/>
          <rect x="-1" y="-6" width="2" height="12" className="pp-warm" opacity="0.4"/>
        </g>
        {/* bubbles */}
        <g className="ps-bubble1"><rect x="-6" y="-10" width="2" height="2" className="pp-light"/></g>
        <g className="ps-bubble2"><rect x="2" y="-10" width="2" height="2" className="pp-light"/></g>
        <g className="ps-bubble3"><rect x="8" y="-10" width="1" height="1" className="pp-light"/></g>
        {/* steam */}
        <PixSprite x={-2} y={-22} pattern={`
          .l..
          lll.
          .lll
          .l..
        `}/>
        {/* heat */}
        <PixSprite x={-12} y={4} pattern={`
          .y..y..y..y.y.y.
          y..y..y..y.y.y..
          .y..y..y..y.y.y.
        `}/>
      </g>

      {/* === INGREDIENT SLOTS RIGHT === */}
      <g transform="translate(160, 14)">
        <text x="0" y="0" fontFamily="'JetBrains Mono', monospace" fontSize="3.4" letterSpacing="0.2em" fill="#c5d4ff">IN</text>
        {[PLANT_BELL, PLANT_FERN, PLANT_ORB].map((p, i) => (
          <g key={i} transform={`translate(0, ${6 + i * 20})`}>
            <rect x="0" y="0" width="18" height="18" fill="#1a0a3e" stroke="#f5cf5e" strokeWidth="0.5"/>
            <g transform="translate(2, 2)">
              <PixSprite pattern={p} w={0.75} h={0.75}/>
            </g>
            <text x="-2" y="22" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#c5d4ff">×{i + 1}</text>
          </g>
        ))}
      </g>

      {/* output slot — pulsing */}
      <g transform="translate(20, 92)">
        <text x="0" y="-2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" letterSpacing="0.2em" fill="#f5cf5e">RESULT</text>
        <rect x="0" y="0" width="22" height="22" fill="#1a0a3e" stroke="#f5cf5e" strokeWidth="0.6"/>
        <g transform="translate(11, 11)" className="ps-mutate">
          <PixSprite x={-5} y={-7} pattern={`
            ..l..
            .lwl.
            lwwwl
            lwwwl
            lwwwl
            .lll.
          `}/>
        </g>
        <text x="28" y="6" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#f4e9c8">Oxalis Brew</text>
        <text x="28" y="14" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#c5d4ff">+12 air for 4h</text>
        <text x="28" y="20" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#a8c862">heals lung scarring</text>
      </g>

      {/* brew button */}
      <g transform="translate(130, 96)">
        <rect x="0" y="0" width="56" height="14" fill="#f5cf5e" stroke="#1a0a3e" strokeWidth="0.8"/>
        <text x="28" y="9.6" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5" fontWeight="700" fill="#1a0a3e">A · BREW</text>
      </g>
    </svg>
  );
}

// ============================================================
// 03 · ACCOUNTING RIDDLE
// ============================================================
function ScreenRiddle() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#10052e'}}>
      {/* a glowing terminal/altar */}
      <rect x="0" y="0" width="192" height="116" fill="#1a0a3e"/>
      {/* starfield bg */}
      {[
        [12, 14], [40, 8], [68, 18], [92, 6], [122, 14], [156, 10], [178, 20],
        [20, 28], [80, 32], [140, 36], [186, 32],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" className={`pp-light pp-twinkle${(i % 3) + 1}`}/>
      ))}

      {/* terminal frame */}
      <g transform="translate(96, 50)">
        <rect x="-86" y="-44" width="172" height="88" fill="#0c0420" stroke="#5e3aa8" strokeWidth="0.6"/>
        <rect x="-86" y="-44" width="172" height="88" fill="none" stroke="#c5d4ff" strokeWidth="0.3" strokeDasharray="2 2"/>
        {/* corner pixels */}
        {[[-86, -44], [85, -44], [-86, 43], [85, 43]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="2" height="2" fill="#f5cf5e"/>
        ))}

        {/* header */}
        <text x="-82" y="-37" fontFamily="'JetBrains Mono', monospace" fontSize="3.4" letterSpacing="0.22em" fill="#f5cf5e">▶ ACCOUNT-RIDDLE · TIER 3</text>
        <text x="84" y="-37" textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="3.4" fill="#5e3aa8">SEED LOCK</text>

        {/* riddle text */}
        <text x="-80" y="-26" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="5.5" fill="#c5d4ff">When does revenue from a</text>
        <text x="-80" y="-19" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="5.5" fill="#c5d4ff">multi-period contract get</text>
        <text x="-80" y="-12" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="5.5" fill="#c5d4ff">recognized under ASC 606?</text>

        {/* answer choices */}
        {[
          {k: 'A', t: 'When cash is received'},
          {k: 'B', t: 'As performance obligations are satisfied', correct: true},
          {k: 'C', t: 'At contract signing'},
          {k: 'D', t: 'When invoice is sent'},
        ].map((a, i) => (
          <g key={i} transform={`translate(-80, ${-4 + i * 9})`}>
            {a.correct && (
              <g className="ps-ans-cursor">
                <rect x="-2" y="-5" width="164" height="8" fill="#f5cf5e" opacity="0.18"/>
                <text x="-2" y="1" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#f5cf5e">▶</text>
              </g>
            )}
            <text x="6" y="1" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#f5cf5e">{a.k}</text>
            <text x="14" y="1" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#c5d4ff">{a.t}</text>
          </g>
        ))}

        {/* reward preview bottom right */}
        <g transform="translate(58, 32)">
          <rect x="-22" y="-12" width="44" height="14" fill="#3a2570" stroke="#f5cf5e" strokeWidth="0.4"/>
          <text x="-20" y="-3" fontFamily="'JetBrains Mono', monospace" fontSize="3" letterSpacing="0.2em" fill="#f5cf5e">UNLOCK</text>
          <g transform="translate(-10, -2)">
            <PixSprite x={-3} y={-3} pattern={`
              ..y..
              .yyy.
              yyyyy
              .yyy.
              ..y..
            `}/>
          </g>
          <text x="0" y="-1" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="6" fill="#f4e9c8">starseed</text>
        </g>
      </g>

      {/* footer hint */}
      <text x="6" y="112" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" fill="#5e3aa8">
        <tspan fill="#f5cf5e">A</tspan> confirm  <tspan fill="#f5cf5e">↑↓</tspan> choose  <tspan fill="#e07598">REF</tspan> ASC 606 · § Step 5
      </text>
    </svg>
  );
}

// ============================================================
// 04 · CODEX MUTATION CARD
// ============================================================
function ScreenCodex() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#1a0a3e'}}>
      {/* card bg */}
      <rect x="2" y="2" width="188" height="112" fill="#f4e9c8" stroke="#1a0a3e" strokeWidth="0.8"/>
      <rect x="6" y="6" width="180" height="104" fill="none" stroke="#5e3aa8" strokeWidth="0.4" strokeDasharray="2 2"/>

      {/* header strip */}
      <rect x="2" y="2" width="188" height="14" fill="#5e3aa8"/>
      <text x="6" y="11.5" fontFamily="'JetBrains Mono', monospace" fontSize="4.4" letterSpacing="0.24em" fill="#f4e9c8">SPECIMEN · TOMATO-VI</text>
      <text x="186" y="11.5" textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="4" fill="#f5cf5e">RAD-TIER III</text>

      {/* LEFT: earth form */}
      <g transform="translate(40, 50)">
        <text x="0" y="-22" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" letterSpacing="0.18em" fill="#5e3aa8">EARTH</text>
        {/* earth tomato sketch — a small red plant */}
        <PixSprite x={-10} y={-16} pattern={`
          ..r..r..
          .rrr.rrr.
          rrrrrrrrr
          .rrrrrrr.
          ..rrrrr..
          ...p.....
          ...p.....
          ..pg.....
          .pggGg...
          oGGgGgGo.
        `}/>
        <text x="0" y="22" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="6" fill="#1a0a3e">Solanum</text>
        <text x="0" y="29" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#5e3aa8">unmodified</text>
      </g>

      {/* arrow with radiation symbol */}
      <g transform="translate(96, 50)" className="ps-mutate">
        <text x="0" y="-12" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="#f5cf5e">☢</text>
        <path d="M -8 0 L 8 0" stroke="#1a0a3e" strokeWidth="1.5" fill="none"/>
        <path d="M 4 -4 L 10 0 L 4 4" stroke="#1a0a3e" strokeWidth="1.5" fill="none"/>
        <text x="0" y="14" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3.2" letterSpacing="0.16em" fill="#5e3aa8">SOL 47</text>
      </g>

      {/* RIGHT: mutated form */}
      <g transform="translate(150, 50)">
        <text x="0" y="-22" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" letterSpacing="0.18em" fill="#5e3aa8">MUTATED</text>
        {/* sparkles around it */}
        <rect x="-16" y="-12" width="1" height="1" className="pp-accent pp-twinkle1"/>
        <rect x="14" y="-8" width="1" height="1" className="pp-accent pp-twinkle2"/>
        <rect x="-10" y="14" width="1" height="1" className="pp-warm pp-twinkle3"/>
        {/* mutated form — larger, glowing */}
        <g className="ps-mutate">
          <PixSprite x={-12} y={-18} pattern={`
            ..r..r..r...
            .rrrrrrrrrr.
            rryyrrrryyrr
            ryyyyrryyyyyr
            .ryyyyyyyyyr.
            ..rrrrrrrrr..
            ....pp.......
            ...ppp.......
            ..ppg.gp.....
            .ppggGgg.....
            oGGgGgGgGo...
          `}/>
        </g>
        <text x="0" y="22" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="6" fill="#1a0a3e">Sol. luxia</text>
        <text x="0" y="29" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#e07598">"sun-fruit"</text>
      </g>

      {/* STATS panel bottom */}
      <rect x="6" y="86" width="180" height="22" fill="#5e3aa8"/>
      <text x="10" y="93" fontFamily="'JetBrains Mono', monospace" fontSize="3.4" letterSpacing="0.22em" fill="#f5cf5e">EFFECTS WHEN EATEN</text>

      {[
        {k: 'STR', v: '+5', c: '#e07598'},
        {k: 'HP',  v: '+12', c: '#a8c862'},
        {k: 'ENRG', v: '+8', c: '#f5cf5e'},
        {k: 'SHLT', v: '+1', c: '#8acfff'},
      ].map((s, i) => (
        <g key={i} transform={`translate(${10 + i * 44}, 100)`}>
          <text x="0" y="0" fontFamily="'JetBrains Mono', monospace" fontSize="3" letterSpacing="0.16em" fill="#c5d4ff">{s.k}</text>
          <text x="16" y="0" fontFamily="'JetBrains Mono', monospace" fontSize="5" fontWeight="700" fill={s.c}>{s.v}</text>
        </g>
      ))}

      {/* page indicator */}
      <text x="186" y="113" textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#5e3aa8">07 / 24</text>
    </svg>
  );
}

// ============================================================
// 05 · WONDER · METEOR SHOWER (night moment)
// ============================================================
function ScreenWonder() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#0a0420'}}>
      {/* deep night sky */}
      <defs>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0420"/>
          <stop offset="100%" stopColor="#2a1a5e"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="74" fill="url(#night-sky)"/>

      {/* dense stars */}
      {Array.from({length: 36}).map((_, i) => {
        const x = (i * 27) % 192 + ((i * 7) % 5);
        const y = ((i * 13) % 70);
        const t = (i % 3) + 1;
        return <rect key={i} x={x} y={y} width="1" height="1" className={`pp-light pp-twinkle${t}`}/>;
      })}

      {/* meteor streaks (top-right to bottom-left) */}
      {[
        {x: 170, y: 4, cls: 'ps-meteor1'},
        {x: 184, y: 18, cls: 'ps-meteor2'},
        {x: 160, y: 30, cls: 'ps-meteor3'},
      ].map((m, i) => (
        <g key={i} transform={`translate(${m.x}, ${m.y})`}>
          <g className={m.cls}>
            <rect x="0" y="0" width="2" height="2" fill="#f5cf5e"/>
            <rect x="4" y="4" width="1" height="1" fill="#f5cf5e" opacity="0.8"/>
            <rect x="8" y="8" width="1" height="1" fill="#f5cf5e" opacity="0.6"/>
            <rect x="12" y="12" width="1" height="1" fill="#f5cf5e" opacity="0.3"/>
            <rect x="16" y="16" width="1" height="1" fill="#f5cf5e" opacity="0.15"/>
          </g>
        </g>
      ))}

      {/* mountain silhouette */}
      <PixSprite x={0} y={66} pattern={`
        ..............................pppp...........................ppppp.................................ppp.....................................ppp..................ppppp...........
        ..........................pppppppppp........................ppppppppp.............................ppppppp..................................ppppppp............ppppppppppp........
        .....................pppppppppppppppppp.................pppppppppppppppppp....................pppppppppppppp...........................ppppppppppppppp....ppppppppppppppppppp....
      `}/>

      {/* ground */}
      <rect x="0" y="74" width="192" height="42" fill="#1a0a3e"/>
      <rect x="0" y="74" width="192" height="1" fill="#5e3aa8"/>

      {/* fireflies — drifting pixel dots */}
      {[
        {x: 30, y: 92, d: '0s'},
        {x: 80, y: 86, d: '-0.6s'},
        {x: 120, y: 96, d: '-1.4s'},
        {x: 150, y: 88, d: '-2.2s'},
        {x: 60, y: 100, d: '-1s'},
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x}, ${f.y})`} className="ps-firefly" style={{animationDelay: f.d}}>
          <rect x="0" y="0" width="1" height="1" fill="#f5cf5e"/>
          <rect x="-1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.4"/>
          <rect x="0" y="-1" width="1" height="1" fill="#f5cf5e" opacity="0.4"/>
        </g>
      ))}

      {/* blob looking up — head tilted */}
      <g transform="translate(96, 86)">
        <PixSprite x={-7} y={0} pattern={`
          ..bbbbb..
          .bllllbo.
          bllbblblo
          bllooblbo
          bllllllbo
          .obllblbo
          ..obbboo.
          ...obboo.
          ...oboo..
        `}/>
        {/* eyes look up */}
        <rect x="-2" y="3" width="1" height="2" className="pp-ink"/>
        <rect x="2" y="3" width="1" height="2" className="pp-ink"/>
      </g>

      {/* wonder caption */}
      <g transform="translate(96, 24)">
        <rect x="-44" y="-7" width="88" height="11" fill="#0a0420" stroke="#f5cf5e" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#f5cf5e">✦ a meteor shower ✦</text>
      </g>

      {/* small subtitle */}
      <text x="96" y="44" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="6.5" fill="#c5d4ff">stop and look up.</text>

      {/* corner key */}
      <text x="4" y="112" fontFamily="'JetBrains Mono', monospace" fontSize="3" fill="#5e3aa8">no input · just watch</text>
    </svg>
  );
}

// ============================================================
// Main artboard — story flow
// ============================================================
function ArtPocketStory() {
  const cards = [
    {label: '01 · SURVIVAL', sub: 'Hostile air. Watch your suit, your lungs, your heart.', Comp: ScreenSurvival, badge: 'core loop'},
    {label: '02 · CRAFTING', sub: 'Combine mutated plant essences. The cauldron decides if you live.', Comp: ScreenCraft, badge: 'medicine'},
    {label: '03 · RIDDLE',   sub: 'New seeds are locked behind FASB / ASC / IRS puzzles. Earn your harvest.', Comp: ScreenRiddle, badge: 'progression'},
    {label: '04 · CODEX',    sub: 'Earth plants, radiation-bent. Each mutation grants stat effects.', Comp: ScreenCodex, badge: 'knowledge'},
    {label: '05 · WONDER',   sub: 'Pause for the meteor shower. No HUD. No input. Just sky.', Comp: ScreenWonder, badge: 'moment'},
  ];

  return (
    <div className="art-frame" style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 70% 60% at 50% 35%, #4a3a8a 0%, #2a1a55 60%, #1a0a3e 100%)',
      fontFamily: '"JetBrains Mono", monospace',
      padding: '32px 24px 28px',
      overflow: 'hidden',
      color: '#f4e9c8',
    }}>
      {/* faint backdrop pattern */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.06) 0, transparent 50%), radial-gradient(circle at 86% 76%, rgba(245,207,94,0.05) 0, transparent 60%)',
      }}/>

      {/* Title */}
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14}}>
        <div>
          <div style={{fontSize: 11, letterSpacing: '0.32em', color: '#c5d4ff', fontWeight: 600}}>POCKET GARDEN · v1.0</div>
          <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 34, color: '#f4e9c8', lineHeight: 1.0, marginTop: 4}}>
            Survival, riddles & wonder
          </div>
          <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 14, color: '#c5d4ff', opacity: 0.85, marginTop: 6, maxWidth: 760, lineHeight: 1.4}}>
            The world is trying to kill you — even the air. Grow earth plants twisted by radiation, brew them into potions, and unlock new species by solving accounting puzzles. At night, a meteor shower reminds you why you stayed.
          </div>
        </div>
        <div style={{textAlign: 'right', fontSize: 10, letterSpacing: '0.2em', color: '#c5d4ff', opacity: 0.7, lineHeight: 1.6}}>
          5 SCREENS<br/>
          <span style={{color: '#e07598'}}>★</span> hostile · gated · awe
        </div>
      </div>

      {/* 5 screen cards */}
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 12, marginTop: 14}}>
        {cards.map((c, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 244}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between'}}>
              <div style={{fontSize: 10, letterSpacing: '0.26em', color: '#f4e9c8'}}>{c.label}</div>
              <div style={{fontSize: 8, padding: '2px 6px', background: '#f5cf5e', color: '#1a0a3e', letterSpacing: '0.16em', borderRadius: 2}}>{c.badge}</div>
            </div>
            <div className="ps-screen">
              <c.Comp/>
              <div className="ps-scan"/>
              <div className="ps-glare"/>
            </div>
            <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 12, color: '#c5d4ff', textAlign: 'center', lineHeight: 1.35, maxWidth: 230}}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* bottom legend */}
      <div style={{position: 'absolute', left: 24, right: 24, bottom: 16, display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', color: '#c5d4ff', opacity: 0.7}}>
        <div>↳ each screen returns to the GARDEN core loop</div>
        <div>WONDER moments interrupt anything · once per sol-night</div>
      </div>
    </div>
  );
}

window.ArtPocketStory = ArtPocketStory;
