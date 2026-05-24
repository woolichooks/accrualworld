// Pocket Garden — Wonder Moments
//
// Five animated night/sky moments where gameplay pauses to let you
// just watch. Same handheld-screen frame and pixel art system.
//
// 01 · TWIN-SUN ECLIPSE   — one sun crosses the other, a crescent of shadow
// 02 · ALIEN AURORA        — waving ribbons of color across the night sky
// 03 · BIOLUM RAIN         — glowing drops fall in vertical lines
// 04 · FIREFLY DANCE       — dense swarm gathers around the blob
// 05 · GLASS-MOSS BLOOM    — at midnight the crystals refract starlight

if (typeof document !== 'undefined' && !document.getElementById('wonder-css')) {
  const s = document.createElement('style');
  s.id = 'wonder-css';
  s.textContent = `
    .pw-screen { width: 244px; height: 154px; background: #0a0420; border-radius: 6px;
      box-shadow: inset 0 0 0 3px #5a4630, inset 0 0 0 5px #1a0a3e, 0 18px 30px rgba(0,0,0,0.5);
      position: relative; overflow: hidden; }
    .pw-screen svg { display: block; image-rendering: pixelated; }
    .pw-scan { position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px);
      mix-blend-mode: multiply; opacity: 0.5; }
    .pw-glare { position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%); }

    /* ECLIPSE — two suns slowly cross. The smaller sun moves over the big one. */
    .pw-eclipse-small {
      transform-box: fill-box; transform-origin: 50% 50%;
      animation: pw-eclipse-small 12s ease-in-out infinite;
    }
    @keyframes pw-eclipse-small {
      0%   { transform: translate(-50px, 10px); }
      45%  { transform: translate(0px, 0px); }
      55%  { transform: translate(0px, 0px); }
      100% { transform: translate(50px, -10px); }
    }
    .pw-eclipse-shadow {
      animation: pw-eclipse-shadow 12s ease-in-out infinite;
    }
    @keyframes pw-eclipse-shadow {
      0%, 35%, 65%, 100% { opacity: 0; }
      45%, 55%           { opacity: 1; }
    }
    .pw-eclipse-corona {
      transform-box: fill-box; transform-origin: 50% 50%;
      animation: pw-corona 12s ease-in-out infinite;
    }
    @keyframes pw-corona {
      0%, 35%, 65%, 100% { transform: scale(1); opacity: 0; }
      45%, 55%           { transform: scale(1.5); opacity: 0.7; }
    }

    /* AURORA — waving color bands across sky */
    .pw-aurora-1, .pw-aurora-2, .pw-aurora-3 {
      transform-box: fill-box; transform-origin: 50% 50%;
      animation: pw-aurora 6s ease-in-out infinite;
    }
    .pw-aurora-2 { animation-duration: 7s; animation-delay: -1.6s; }
    .pw-aurora-3 { animation-duration: 5.5s; animation-delay: -3s; }
    @keyframes pw-aurora {
      0%,100% { transform: translateX(-4px) scaleY(1); opacity: 0.7; }
      50%     { transform: translateX(4px)  scaleY(1.1); opacity: 1; }
    }

    /* BIOLUMINESCENT RAIN — vertical glowing streaks fall and fade */
    .pw-rain {
      animation: pw-rain 1.8s linear infinite;
    }
    @keyframes pw-rain {
      0%   { transform: translateY(-14px); opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: translateY(60px); opacity: 0; }
    }
    /* ripple at ground level */
    .pw-ripple {
      animation: pw-ripple 1.8s linear infinite;
      transform-origin: center; transform-box: fill-box;
    }
    @keyframes pw-ripple {
      0%, 80% { transform: scale(0.4); opacity: 0; }
      85%     { transform: scale(0.8); opacity: 1; }
      100%    { transform: scale(1.4); opacity: 0; }
    }

    /* FIREFLIES — many drifting, breathing */
    .pw-fly-a { animation: pw-fly-a 5s ease-in-out infinite; }
    .pw-fly-b { animation: pw-fly-b 6.4s ease-in-out infinite; }
    .pw-fly-c { animation: pw-fly-c 7.2s ease-in-out infinite; }
    .pw-fly-d { animation: pw-fly-d 4.6s ease-in-out infinite; }
    @keyframes pw-fly-a {
      0%,100% { transform: translate(0,0);   opacity: 0.4; }
      50%     { transform: translate(10px,-8px); opacity: 1; }
    }
    @keyframes pw-fly-b {
      0%,100% { transform: translate(0,0);   opacity: 0.5; }
      50%     { transform: translate(-12px,-6px); opacity: 1; }
    }
    @keyframes pw-fly-c {
      0%,100% { transform: translate(0,0);   opacity: 0.3; }
      50%     { transform: translate(6px,-12px); opacity: 1; }
    }
    @keyframes pw-fly-d {
      0%,100% { transform: translate(0,0);   opacity: 0.6; }
      50%     { transform: translate(-8px,-10px); opacity: 1; }
    }

    /* GLASS-MOSS BLOOM — crystals pulse light through prismatic colors */
    .pw-crystal {
      animation: pw-crystal 4s ease-in-out infinite;
      transform-box: fill-box; transform-origin: 50% 100%;
    }
    .pw-cr-2 { animation-delay: -1s; }
    .pw-cr-3 { animation-delay: -2s; }
    .pw-cr-4 { animation-delay: -2.6s; }
    @keyframes pw-crystal {
      0%,100% { filter: brightness(0.8) hue-rotate(0deg); transform: scaleY(1); }
      25%     { filter: brightness(1.5) hue-rotate(60deg); transform: scaleY(1.05); }
      50%     { filter: brightness(1.3) hue-rotate(180deg); transform: scaleY(1); }
      75%     { filter: brightness(1.5) hue-rotate(280deg); transform: scaleY(1.05); }
    }
    .pw-prism-beam {
      animation: pw-prism-beam 4s ease-in-out infinite;
      transform-box: fill-box; transform-origin: 50% 100%;
    }
    @keyframes pw-prism-beam {
      0%,100% { opacity: 0.2; transform: scaleY(0.7); }
      50%     { opacity: 0.85; transform: scaleY(1.0); }
    }

    /* shared caption box (subtle fade) */
    .pw-caption {
      animation: pw-caption 4s ease-in-out infinite;
    }
    @keyframes pw-caption {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.65; }
    }
  `;
  document.head.appendChild(s);
}

// ============================================================
// 01 · TWIN-SUN ECLIPSE
// ============================================================
function WonderEclipse() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#2a1a5e'}}>
      {/* sky gradient */}
      <defs>
        <linearGradient id="ecl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a3e"/>
          <stop offset="60%" stopColor="#5e3aa8"/>
          <stop offset="100%" stopColor="#e07598"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="78" fill="url(#ecl-sky)"/>

      {/* stars appear during full eclipse */}
      {[
        [10, 12], [40, 8], [70, 18], [108, 14], [148, 8], [176, 16],
        [22, 30], [82, 32], [136, 28], [168, 38],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" className={`pp-light pp-twinkle${(i % 3) + 1}`}/>
      ))}

      {/* large sun (static, center) */}
      <g transform="translate(96, 34)">
        {/* corona that pulses during eclipse */}
        <g className="pw-eclipse-corona">
          <ellipse cx="0" cy="0" rx="22" ry="22" fill="#f5cf5e" opacity="0.4"/>
          <ellipse cx="0" cy="0" rx="18" ry="18" fill="#fff8d6" opacity="0.5"/>
        </g>
        {/* sun disc */}
        <rect x="-4" y="-7" width="8" height="2" fill="#f5cf5e"/>
        <rect x="-7" y="-5" width="14" height="10" fill="#f5cf5e"/>
        <rect x="-4" y="5" width="8" height="2" fill="#f5cf5e"/>
        {/* glow rays */}
        <rect x="-11" y="-1" width="2" height="2" fill="#f5cf5e" opacity="0.7"/>
        <rect x="9" y="-1" width="2" height="2" fill="#f5cf5e" opacity="0.7"/>
        <rect x="-1" y="-12" width="2" height="2" fill="#f5cf5e" opacity="0.7"/>
        <rect x="-1" y="10" width="2" height="2" fill="#f5cf5e" opacity="0.7"/>
      </g>

      {/* SMALL sun crosses */}
      <g transform="translate(96, 34)" className="pw-eclipse-small">
        <rect x="-3" y="-5" width="6" height="1" fill="#e07598"/>
        <rect x="-5" y="-4" width="10" height="8" fill="#e07598"/>
        <rect x="-3" y="4" width="6" height="1" fill="#e07598"/>
      </g>

      {/* shadow crescent during full alignment */}
      <g transform="translate(96, 34)" className="pw-eclipse-shadow">
        <ellipse cx="0" cy="0" rx="9" ry="9" fill="#1a0a3e"/>
        {/* a tiny ring of fire pixels */}
        <rect x="-9" y="-1" width="2" height="2" fill="#f5cf5e"/>
        <rect x="7" y="-1" width="2" height="2" fill="#f5cf5e"/>
        <rect x="-1" y="-9" width="2" height="2" fill="#f5cf5e"/>
        <rect x="-1" y="7" width="2" height="2" fill="#f5cf5e"/>
      </g>

      {/* mountains + ground */}
      <PixSprite x={0} y={68} pattern={`
        ...ppp..............ppppp..................pppp....................ppppp................ppp...............ppppp...................pppp.................pppp....................
        .ppppppp..........ppppppppp...............ppppppp.................ppppppppp............ppppppp...........ppppppppp...............pppppppp............pppppppp..................
        pppppppppp....pppppppppppppppp........ppppppppppppppp............ppppppppppppppp.....pppppppppppppp...ppppppppppppppppppp....ppppppppppppppppppp.ppppppppppppppppp..............
      `}/>
      <rect x="0" y="78" width="192" height="38" fill="#1a0a3e"/>

      {/* blob silhouette looking up */}
      <g transform="translate(96, 88)">
        <PixSprite x={-6} y={0} pattern={`
          ..ooooo..
          .oolllo..
          oolllooo.
          olllooooo
          ollllllo.
          .ollllo..
          ..ooooo..
        `}/>
      </g>

      {/* caption */}
      <g transform="translate(96, 14)" className="pw-caption">
        <rect x="-48" y="-7" width="96" height="11" fill="#0a0420" stroke="#f5cf5e" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#f5cf5e">✦ a twin eclipse ✦</text>
      </g>
      <text x="96" y="62" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="6.5" fill="#c5d4ff">the smaller crosses the great.</text>
    </svg>
  );
}

// ============================================================
// 02 · ALIEN AURORA
// ============================================================
function WonderAurora() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#0a0420'}}>
      <defs>
        <linearGradient id="aur-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0420"/>
          <stop offset="100%" stopColor="#1a1855"/>
        </linearGradient>
        {/* aurora gradient bands */}
        <linearGradient id="aur-1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#a8c862" stopOpacity="0"/>
          <stop offset="20%"  stopColor="#a8c862" stopOpacity="0.7"/>
          <stop offset="50%"  stopColor="#7fc862" stopOpacity="0.95"/>
          <stop offset="80%"  stopColor="#a8c862" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#a8c862" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="aur-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#e07598" stopOpacity="0"/>
          <stop offset="30%"  stopColor="#e07598" stopOpacity="0.6"/>
          <stop offset="70%"  stopColor="#b25a8c" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#e07598" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="aur-3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8acfff" stopOpacity="0"/>
          <stop offset="40%"  stopColor="#8acfff" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#8acfff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="192" height="78" fill="url(#aur-sky)"/>

      {/* stars */}
      {Array.from({length: 24}).map((_, i) => {
        const x = (i * 31) % 192 + (i % 4);
        const y = (i * 11) % 60;
        return <rect key={i} x={x} y={y} width="1" height="1" fill="#fff8d6" opacity="0.7" className={`pp-twinkle${(i % 3) + 1}`}/>;
      })}

      {/* aurora ribbons — multiple wavy paths */}
      <g className="pw-aurora-1">
        <path d="M -10 24 Q 48 14 96 28 T 200 24 L 200 36 Q 144 30 96 40 T -10 36 Z" fill="url(#aur-1)"/>
      </g>
      <g className="pw-aurora-2">
        <path d="M -10 36 Q 56 24 100 38 T 200 36 L 200 50 Q 144 42 100 52 T -10 50 Z" fill="url(#aur-2)"/>
      </g>
      <g className="pw-aurora-3">
        <path d="M -10 14 Q 60 6 110 20 T 200 16 L 200 24 Q 130 18 100 30 T -10 26 Z" fill="url(#aur-3)"/>
      </g>

      {/* extra ribbons of vertical pixel streaks for texture */}
      {[20, 50, 76, 110, 140, 168].map((x, i) => (
        <g key={i} className={`pw-aurora-${(i % 3) + 1}`}>
          <rect x={x} y="20" width="1" height="22" fill="#c4f49a" opacity="0.4"/>
          <rect x={x + 1} y="22" width="1" height="18" fill="#c4f49a" opacity="0.25"/>
        </g>
      ))}

      {/* mountains + ground */}
      <PixSprite x={0} y={68} pattern={`
        ...ppp..............ppppp..................pppp....................ppppp................ppp...............ppppp...................pppp.................pppp....................
        .ppppppp..........ppppppppp...............ppppppp.................ppppppppp............ppppppp...........ppppppppp...............pppppppp............pppppppp..................
        pppppppppp....pppppppppppppppp........ppppppppppppppp............ppppppppppppppp.....pppppppppppppp...ppppppppppppppppppp....ppppppppppppppppppp.ppppppppppppppppp..............
      `}/>
      <rect x="0" y="78" width="192" height="38" fill="#1a0a3e"/>

      {/* lake reflecting aurora */}
      <rect x="20" y="92" width="152" height="14" fill="#1a1855" opacity="0.8"/>
      <rect x="22" y="93" width="148" height="1" fill="#c4f49a" opacity="0.4"/>
      <rect x="40" y="95" width="60" height="1" fill="#e07598" opacity="0.3"/>
      <rect x="60" y="98" width="80" height="1" fill="#8acfff" opacity="0.3"/>

      {/* two blobs huddled by the lake */}
      <g transform="translate(80, 86)">
        <PixSprite pattern={`
          ..ooo..
          .ollloo
          ollloob
          olloobb
          olllllb
          .olllo.
          ..ooo..
        `}/>
      </g>
      <g transform="translate(96, 88)">
        <PixSprite pattern={`
          ..oooo.
          .olllo.
          olllllo
          olllllb
          olllbbb
          .ollll.
          ..ooo..
        `}/>
      </g>

      {/* caption */}
      <g transform="translate(96, 12)" className="pw-caption">
        <rect x="-50" y="-7" width="100" height="11" fill="#0a0420" stroke="#a8c862" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#a8c862">✦ an alien aurora ✦</text>
      </g>
      <text x="96" y="60" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="6.5" fill="#c5d4ff">the sky is breathing.</text>
    </svg>
  );
}

// ============================================================
// 03 · BIOLUMINESCENT RAIN
// ============================================================
function WonderRain() {
  // grid of rain columns; each animates independently via offset
  const cols = [10, 22, 34, 46, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166, 178];
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#0a0420'}}>
      <defs>
        <linearGradient id="rain-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0420"/>
          <stop offset="100%" stopColor="#1a1855"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="78" fill="url(#rain-sky)"/>

      {/* stars hidden behind clouds */}
      {[[20, 6], [60, 12], [110, 4], [150, 14], [180, 8]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill="#c5d4ff" opacity="0.5" className={`pp-twinkle${(i % 3) + 1}`}/>
      ))}

      {/* low cloud band */}
      <g opacity="0.6">
        <rect x="0" y="14" width="192" height="6" fill="#1a1855"/>
        <rect x="0" y="20" width="192" height="3" fill="#3a2570"/>
      </g>

      {/* rain streaks — staggered animation delays for waterfall effect */}
      {cols.map((x, i) => (
        <g key={i} className="pw-rain" style={{animationDelay: `${-(i * 0.13) % 1.8}s`}}>
          <rect x={x} y="20" width="1" height="6" fill="#a8c4ff"/>
          <rect x={x} y="26" width="1" height="3" fill="#a8c4ff" opacity="0.6"/>
          <rect x={x - 1} y="22" width="1" height="2" fill="#a8c4ff" opacity="0.4"/>
        </g>
      ))}

      {/* secondary set for density */}
      {[16, 38, 64, 88, 116, 144, 172].map((x, i) => (
        <g key={`b-${i}`} className="pw-rain" style={{animationDelay: `${-(i * 0.27) % 1.8}s`}}>
          <rect x={x} y="20" width="1" height="8" fill="#e9a8ff"/>
          <rect x={x} y="28" width="1" height="2" fill="#e9a8ff" opacity="0.5"/>
        </g>
      ))}

      {/* ground */}
      <rect x="0" y="78" width="192" height="38" fill="#1a0a3e"/>
      <rect x="0" y="78" width="192" height="1" fill="#5e3aa8"/>

      {/* ripples on the ground where drops land */}
      {[24, 56, 88, 116, 156].map((x, i) => (
        <g key={`r-${i}`} transform={`translate(${x}, 86)`} className="pw-ripple" style={{animationDelay: `${-(i * 0.4) % 1.8}s`}}>
          <ellipse cx="0" cy="0" rx="6" ry="2" fill="none" stroke="#a8c4ff" strokeWidth="0.6"/>
          <ellipse cx="0" cy="0" rx="3" ry="1" fill="none" stroke="#a8c4ff" strokeWidth="0.4"/>
        </g>
      ))}

      {/* blob with umbrella made of jelly-cap */}
      <g transform="translate(96, 88)">
        {/* umbrella stem */}
        <rect x="0" y="-12" width="1" height="14" fill="#1a0a3e"/>
        {/* jelly-cap umbrella */}
        <PixSprite x={-10} y={-22} pattern={`
          ..ooooooo..
          .orrrrrrro.
          orrrrrrrrrr
          orrlllllrrr
          .oorrrrroo.
          ...ooooo...
        `}/>
        {/* blob */}
        <PixSprite x={-5} y={0} pattern={`
          ..oooo.
          .ollll.
          ollllbo
          ollbloo
          ollllbo
          .oolloo
          ..ooo..
        `}/>
      </g>

      {/* glowing puddle reflecting */}
      <ellipse cx="60" cy="100" rx="16" ry="3" fill="#a8c4ff" opacity="0.4"/>
      <ellipse cx="60" cy="100" rx="10" ry="2" fill="#e9a8ff" opacity="0.3"/>
      <ellipse cx="140" cy="104" rx="14" ry="2.5" fill="#a8c4ff" opacity="0.3"/>

      {/* caption */}
      <g transform="translate(96, 10)" className="pw-caption">
        <rect x="-58" y="-7" width="116" height="11" fill="#0a0420" stroke="#e9a8ff" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#e9a8ff">✦ bioluminescent rain ✦</text>
      </g>
    </svg>
  );
}

// ============================================================
// 04 · FIREFLY DANCE
// ============================================================
function WonderFireflies() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#0a0420'}}>
      <defs>
        <linearGradient id="fly-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0420"/>
          <stop offset="100%" stopColor="#2a1a5e"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="78" fill="url(#fly-sky)"/>

      {/* faint stars */}
      {Array.from({length: 12}).map((_, i) => {
        const x = (i * 31) % 192;
        const y = (i * 7) % 60;
        return <rect key={i} x={x} y={y} width="1" height="1" fill="#c5d4ff" opacity="0.4" className={`pp-twinkle${(i % 3) + 1}`}/>;
      })}

      {/* moon */}
      <g transform="translate(160, 18)">
        <rect x="-3" y="-3" width="6" height="1" fill="#fff8d6"/>
        <rect x="-4" y="-2" width="8" height="4" fill="#fff8d6"/>
        <rect x="-3" y="2" width="6" height="1" fill="#fff8d6"/>
        <rect x="-2" y="-2" width="3" height="3" fill="#1a1855" opacity="0.6"/>
      </g>

      {/* trees silhouettes */}
      {[
        {x: 14, h: 24},
        {x: 32, h: 18},
        {x: 168, h: 22},
        {x: 184, h: 18},
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x}, ${78 - t.h})`}>
          <rect x="-1" y="0" width="2" height={t.h} fill="#1a0a3e"/>
          <ellipse cx="0" cy="0" rx="6" ry="6" fill="#1a0a3e"/>
          <ellipse cx="-2" cy="-2" rx="4" ry="4" fill="#1a0a3e"/>
        </g>
      ))}

      {/* ground */}
      <rect x="0" y="78" width="192" height="38" fill="#1a0a3e"/>
      <rect x="0" y="78" width="192" height="1" fill="#5e3aa8"/>

      {/* grass tufts */}
      {[18, 50, 72, 122, 158, 178].map((x, i) => (
        <g key={i} transform={`translate(${x}, 80)`}>
          <rect x="0" y="0" width="1" height="3" fill="#5e3aa8"/>
          <rect x="-1" y="1" width="1" height="2" fill="#5e3aa8"/>
          <rect x="2" y="1" width="1" height="2" fill="#5e3aa8"/>
        </g>
      ))}

      {/* MANY fireflies — random positions with one of 4 drift animations */}
      {Array.from({length: 28}).map((_, i) => {
        const x = 18 + (i * 13.7) % 156;
        const y = 30 + (i * 9.3) % 60;
        const cls = ['pw-fly-a', 'pw-fly-b', 'pw-fly-c', 'pw-fly-d'][i % 4];
        const delay = (i * 0.31) % 5;
        return (
          <g key={i} transform={`translate(${x}, ${y})`} className={cls} style={{animationDelay: `-${delay}s`}}>
            <rect x="0" y="0" width="1" height="1" fill="#f5cf5e"/>
            <rect x="-1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.5"/>
            <rect x="0" y="-1" width="1" height="1" fill="#f5cf5e" opacity="0.5"/>
            <rect x="1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.5"/>
            <rect x="0" y="1" width="1" height="1" fill="#f5cf5e" opacity="0.5"/>
            {/* halo */}
            <rect x="-2" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.18"/>
            <rect x="2" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.18"/>
          </g>
        );
      })}

      {/* blob in the middle, arms out, fireflies circling */}
      <g transform="translate(96, 88)">
        <PixSprite x={-7} y={-2} pattern={`
          ..bbbbb..
          .blllllb.
          bllbllblb
          bllooblbb
          blllllllb
          bllolllbb
          .bllllllb
          ..bbbblb.
          ...obbo..
          ....oo...
        `}/>
        {/* outstretched arms */}
        <rect x="-10" y="2" width="3" height="1" fill="#1a0a3e"/>
        <rect x="-12" y="3" width="2" height="1" fill="#1a0a3e"/>
        <rect x="8" y="2" width="3" height="1" fill="#1a0a3e"/>
        <rect x="10" y="3" width="2" height="1" fill="#1a0a3e"/>
      </g>

      {/* close fireflies on hands */}
      <g transform="translate(82, 90)" className="pw-fly-b">
        <rect x="0" y="0" width="1" height="1" fill="#f5cf5e"/>
        <rect x="-1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.6"/>
        <rect x="1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.6"/>
      </g>
      <g transform="translate(112, 90)" className="pw-fly-a">
        <rect x="0" y="0" width="1" height="1" fill="#f5cf5e"/>
        <rect x="-1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.6"/>
        <rect x="1" y="0" width="1" height="1" fill="#f5cf5e" opacity="0.6"/>
      </g>

      <g transform="translate(96, 12)" className="pw-caption">
        <rect x="-48" y="-7" width="96" height="11" fill="#0a0420" stroke="#f5cf5e" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#f5cf5e">✦ a firefly swarm ✦</text>
      </g>
      <text x="96" y="62" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="6.5" fill="#c5d4ff">they remember the shape of you.</text>
    </svg>
  );
}

// ============================================================
// 05 · GLASS-MOSS BLOOM
// ============================================================
function WonderCrystal() {
  return (
    <svg viewBox="0 0 192 116" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      className="pal-dawn" style={{display: 'block', backgroundColor: '#0a0420'}}>
      <defs>
        <linearGradient id="cr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0420"/>
          <stop offset="100%" stopColor="#1a1855"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="192" height="78" fill="url(#cr-sky)"/>

      {/* stars */}
      {Array.from({length: 18}).map((_, i) => {
        const x = (i * 23) % 192;
        const y = (i * 9) % 60;
        return <rect key={i} x={x} y={y} width="1" height="1" fill="#c5d4ff" opacity="0.8" className={`pp-twinkle${(i % 3) + 1}`}/>;
      })}

      {/* mountains */}
      <PixSprite x={0} y={68} pattern={`
        ...ppp..............ppppp..................pppp....................ppppp................ppp...............ppppp...................pppp.................pppp....................
        .ppppppp..........ppppppppp...............ppppppp.................ppppppppp............ppppppp...........ppppppppp...............pppppppp............pppppppp..................
        pppppppppp....pppppppppppppppp........ppppppppppppppp............ppppppppppppppp.....pppppppppppppp...ppppppppppppppppppp....ppppppppppppppppppp.ppppppppppppppppp..............
      `}/>

      {/* ground */}
      <rect x="0" y="78" width="192" height="38" fill="#1a0a3e"/>
      <rect x="0" y="78" width="192" height="1" fill="#5e3aa8"/>

      {/* prismatic beams above each crystal patch */}
      {[24, 60, 96, 132, 168].map((x, i) => {
        const cls = ['pw-crystal', 'pw-cr-2', 'pw-cr-3', 'pw-cr-4', 'pw-crystal'][i];
        return (
          <g key={`beam-${i}`} transform={`translate(${x}, 82)`}>
            <g className={`pw-prism-beam ${cls}`}>
              <rect x="-4" y="-40" width="1" height="40" fill="#e07598" opacity="0.7"/>
              <rect x="-2" y="-44" width="1" height="44" fill="#f5cf5e" opacity="0.7"/>
              <rect x="0" y="-46" width="1" height="46" fill="#a8c862" opacity="0.7"/>
              <rect x="2" y="-44" width="1" height="44" fill="#8acfff" opacity="0.7"/>
              <rect x="4" y="-40" width="1" height="40" fill="#e9a8ff" opacity="0.7"/>
            </g>
          </g>
        );
      })}

      {/* crystal clusters along the ground */}
      {[24, 60, 96, 132, 168].map((x, i) => {
        const cls = ['', 'pw-cr-2', 'pw-cr-3', 'pw-cr-4', ''][i];
        return (
          <g key={i} transform={`translate(${x - 8}, 78)`} className={`pw-crystal ${cls}`}>
            <PixSprite pattern={PLANT_CRYS}/>
          </g>
        );
      })}

      {/* blob lying down looking up */}
      <g transform="translate(96, 100)">
        <PixSprite x={-10} y={0} pattern={`
          ......................
          ..oooooobbbboooo......
          .ollllllbbbllllloo....
          ollloolbblboolllloo...
          olllllllllllllllllo...
          .ooollllllllllllooo...
          .....oooooooooooo.....
        `}/>
      </g>

      {/* caption */}
      <g transform="translate(96, 12)" className="pw-caption">
        <rect x="-60" y="-7" width="120" height="11" fill="#0a0420" stroke="#e9a8ff" strokeWidth="0.5"/>
        <text x="0" y="1" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontStyle="italic" fontSize="7" fill="#e9a8ff">✦ glass-moss midnight ✦</text>
      </g>
      <text x="96" y="60" textAnchor="middle" fontFamily="'Caveat', cursive" fontSize="6.5" fill="#c5d4ff">they only bloom for starlight.</text>
    </svg>
  );
}

// ============================================================
// Main artboard
// ============================================================
function ArtPocketWonders() {
  const wonders = [
    {label: '01 · ECLIPSE',  sub: 'The smaller sun threads itself through the great one.',  Comp: WonderEclipse,  tag: '~ 4× per sol-year'},
    {label: '02 · AURORA',   sub: 'Ribbons breathe over the lake. Two blobs sit and watch.', Comp: WonderAurora,   tag: 'after solar storms'},
    {label: '03 · BIOLUM RAIN', sub: 'Glowing drops. The jelly-cap makes a perfect umbrella.', Comp: WonderRain,     tag: 'wet season only'},
    {label: '04 · FIREFLIES', sub: 'A swarm gathers when you stand still. They remember.',   Comp: WonderFireflies, tag: 'warm nights'},
    {label: '05 · CRYSTALS', sub: 'Glass-moss refracts starlight into beams of every hue.',  Comp: WonderCrystal,  tag: 'midnight, full dark'},
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
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.06) 0, transparent 50%), radial-gradient(circle at 86% 76%, rgba(245,207,94,0.05) 0, transparent 60%)',
      }}/>

      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14}}>
        <div>
          <div style={{fontSize: 11, letterSpacing: '0.32em', color: '#c5d4ff', fontWeight: 600}}>POCKET GARDEN · WONDER LOG</div>
          <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 34, color: '#f4e9c8', lineHeight: 1.0, marginTop: 4}}>
            Tiny moments worth surviving for
          </div>
          <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 14, color: '#c5d4ff', opacity: 0.85, marginTop: 6, maxWidth: 760, lineHeight: 1.4}}>
            Every wonder interrupts gameplay with no HUD, no input — the planet shows you something. Hold the moment until it passes. Logged in your journal afterward.
          </div>
        </div>
        <div style={{textAlign: 'right', fontSize: 10, letterSpacing: '0.2em', color: '#c5d4ff', opacity: 0.7, lineHeight: 1.6}}>
          5 WONDERS · 0 BUTTONS<br/>
          <span style={{color: '#f5cf5e'}}>✦</span> pause · breathe · keep going
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 12, marginTop: 14}}>
        {wonders.map((w, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 244}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between'}}>
              <div style={{fontSize: 10, letterSpacing: '0.26em', color: '#f4e9c8'}}>{w.label}</div>
              <div style={{fontSize: 8, padding: '2px 6px', background: 'transparent', color: '#f5cf5e', letterSpacing: '0.16em', borderRadius: 2, border: '1px solid #f5cf5e'}}>{w.tag}</div>
            </div>
            <div className="pw-screen">
              <w.Comp/>
              <div className="pw-scan"/>
              <div className="pw-glare"/>
            </div>
            <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 12, color: '#c5d4ff', textAlign: 'center', lineHeight: 1.35, maxWidth: 230}}>
              {w.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 24, right: 24, bottom: 16, display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', color: '#c5d4ff', opacity: 0.7}}>
        <div>↻ each plays once per sol-night · then logged · then never the same again</div>
        <div>more rumored: twin-moon rise · ghost-wind · the singing canyon</div>
      </div>
    </div>
  );
}

window.ArtPocketWonders = ArtPocketWonders;
