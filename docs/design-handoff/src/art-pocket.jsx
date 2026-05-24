// Pocket Garden — animated handheld variants
//
// Three palette variations of the handheld console mockup. Same game,
// same sprites, animated via CSS (plants sway, blob breathes & blinks,
// watering drips, sparkles dance, screen scanline drifts).
//
// Sprite chars map to PALETTE ROLES rather than hex codes, so the same
// sprite definition renders in every palette. CSS classes own the fills.
//
//   k  ink       | b  mid       | c  cream     | r  warm
//   p  primary   | l  light     | y  accent    | g/G grass / grass-dark
//   s/S soil     | w  water
//
// Three palettes:
//   .pal-dawn   — original cobalt + periwinkle + cream + saffron (cool)
//   .pal-dusk   — rose + lilac + cream + coral (warm sunset)
//   .pal-amber  — limited 4-color amber GameBoy-style (warm monochrome)

// ============================================================
// One-time global CSS for the pocket pieces (palettes + animations)
// ============================================================
if (typeof document !== 'undefined' && !document.getElementById('pocket-css')) {
  const s = document.createElement('style');
  s.id = 'pocket-css';
  s.textContent = `
    /* === palettes === */
    .pal-dawn  { --pal-bg: #10052e; --pal-screen: #10052e;
                 --sky-dawn: #4a3a7e; --sky-morn: #3a4a9e; --sky-noon: #5e7ae0; --sky-aft: #c08a8a; --sky-dusk: #6a3a8a; --sky-night: #1a0a3e;
                 --ground-day: #5e3aa8; --ground-night: #2a1a5e;
                 --sun-color: #f5cf5e; --sun2-color: #e07598; --moon-color: #c5d4ff; }
    .pal-dawn .pp-ink    { fill: #1a0a3e; }
    .pal-dawn .pp-primary{ fill: #5e3aa8; }
    .pal-dawn .pp-mid    { fill: #8a8ee0; }
    .pal-dawn .pp-light  { fill: #c5d4ff; }
    .pal-dawn .pp-cream  { fill: #f4e9c8; }
    .pal-dawn .pp-accent { fill: #f5cf5e; }
    .pal-dawn .pp-warm   { fill: #e07598; }
    .pal-dawn .pp-grass  { fill: #a8c862; }
    .pal-dawn .pp-grassD { fill: #6e9e44; }
    .pal-dawn .pp-soil   { fill: #3a2570; }
    .pal-dawn .pp-soilL  { fill: #5a3e9e; }
    .pal-dawn .pp-water  { fill: #8acfff; }
    .pal-dawn .pp-text   { fill: #c5d4ff; }
    .pal-dawn .pp-text2  { fill: #f5cf5e; }

    .pal-dusk  { --pal-bg: #2a0e2a; --pal-screen: #2a0e2a;
                 --sky-dawn: #b25a8c; --sky-morn: #d47ea0; --sky-noon: #ff8aa8; --sky-aft: #ff6e8e; --sky-dusk: #8a3a6a; --sky-night: #2a0e2a;
                 --ground-day: #b25a8c; --ground-night: #5e2a4a;
                 --sun-color: #ffce8a; --sun2-color: #ff6e8e; --moon-color: #ffe0d8; }
    .pal-dusk .pp-ink    { fill: #2a0e2a; }
    .pal-dusk .pp-primary{ fill: #b25a8c; }
    .pal-dusk .pp-mid    { fill: #f5a3c8; }
    .pal-dusk .pp-light  { fill: #ffe0d8; }
    .pal-dusk .pp-cream  { fill: #fff5e0; }
    .pal-dusk .pp-accent { fill: #ffce8a; }
    .pal-dusk .pp-warm   { fill: #ff6e8e; }
    .pal-dusk .pp-grass  { fill: #f5b078; }
    .pal-dusk .pp-grassD { fill: #c08560; }
    .pal-dusk .pp-soil   { fill: #5e2a4a; }
    .pal-dusk .pp-soilL  { fill: #8a4a6e; }
    .pal-dusk .pp-water  { fill: #ffaab8; }
    .pal-dusk .pp-text   { fill: #ffe0d8; }
    .pal-dusk .pp-text2  { fill: #ffce8a; }

    .pal-amber { --pal-bg: #2a1810; --pal-screen: #2a1810;
                 --sky-dawn: #4a2a18; --sky-morn: #6e4a30; --sky-noon: #c08e5a; --sky-aft: #d96e4a; --sky-dusk: #6e4a30; --sky-night: #1a0a05;
                 --ground-day: #6e4a30; --ground-night: #2a1810;
                 --sun-color: #f5d36e; --sun2-color: #d96e4a; --moon-color: #f5d8a8; }
    .pal-amber .pp-ink    { fill: #2a1810; }
    .pal-amber .pp-primary{ fill: #6e4a30; }
    .pal-amber .pp-mid    { fill: #c08e5a; }
    .pal-amber .pp-light  { fill: #f5d8a8; }
    .pal-amber .pp-cream  { fill: #fff0d6; }
    .pal-amber .pp-accent { fill: #f5d36e; }
    .pal-amber .pp-warm   { fill: #d96e4a; }
    .pal-amber .pp-grass  { fill: #c08e5a; }
    .pal-amber .pp-grassD { fill: #6e4a30; }
    .pal-amber .pp-soil   { fill: #6e4a30; }
    .pal-amber .pp-soilL  { fill: #c08e5a; }
    .pal-amber .pp-water  { fill: #c08e5a; }
    .pal-amber .pp-text   { fill: #f5d8a8; }
    .pal-amber .pp-text2  { fill: #f5d36e; }

    /* === sprite animations === */
    .pp-sprite { shape-rendering: crispEdges; }
    .pp-sway, .pp-sway2, .pp-sway3 {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: pp-sway 3s ease-in-out infinite alternate;
    }
    .pp-sway2 { animation-duration: 2.4s; animation-delay: -.7s; }
    .pp-sway3 { animation-duration: 3.6s; animation-delay: -1.4s; }
    @keyframes pp-sway {
      from { transform: rotate(-2.4deg); }
      to   { transform: rotate(2.4deg); }
    }

    .pp-breathe {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: pp-breathe 2.8s ease-in-out infinite;
    }
    @keyframes pp-breathe {
      0%,100% { transform: scaleY(1); }
      50%     { transform: scaleY(0.93); }
    }

    .pp-blink {
      animation: pp-blink 4.2s steps(1) infinite;
    }
    @keyframes pp-blink {
      0%, 96%, 100% { opacity: 1; }
      97%, 99% { opacity: 0; }
    }

    .pp-twinkle1 { animation: pp-tw 1.8s steps(2) infinite; }
    .pp-twinkle2 { animation: pp-tw 2.2s steps(2) infinite; animation-delay: -.7s; }
    .pp-twinkle3 { animation: pp-tw 1.4s steps(2) infinite; animation-delay: -.4s; }
    @keyframes pp-tw {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0.15; }
    }

    .pp-sparkle {
      animation: pp-sparkle 1.6s steps(4) infinite;
    }
    @keyframes pp-sparkle {
      0%   { transform: translate(0, 0); }
      25%  { transform: translate(4px, -3px); }
      50%  { transform: translate(-3px, -5px); }
      75%  { transform: translate(6px, 2px); }
      100% { transform: translate(0, 0); }
    }

    .pp-drip {
      animation: pp-drip 1.1s linear infinite;
    }
    @keyframes pp-drip {
      0%   { transform: translateY(-4px); opacity: 0; }
      20%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(7px); opacity: 0; }
    }

    .pp-cursor { animation: pp-cursor 1s steps(2) infinite; }
    @keyframes pp-cursor {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    .pp-arrow { animation: pp-arrow 0.9s steps(2) infinite; }
    @keyframes pp-arrow {
      0%   { transform: translateY(0); }
      50%  { transform: translateY(-1px); }
      100% { transform: translateY(0); }
    }

    .pp-puff {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: pp-puff 2s ease-out infinite;
    }
    @keyframes pp-puff {
      0%   { transform: translateY(0) scale(1); opacity: 1; }
      80%  { opacity: 0.4; }
      100% { transform: translateY(-6px) scale(0.6); opacity: 0; }
    }

    .pp-scanline {
      animation: pp-scan 6s linear infinite;
    }
    @keyframes pp-scan {
      from { transform: translateY(-100%); }
      to   { transform: translateY(100%); }
    }

    .pp-power { animation: pp-power 1.6s ease-in-out infinite; }
    @keyframes pp-power {
      0%,100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* === DAY-NIGHT CYCLE (32s loop) === */
    /* dawn 0-12%, morning 12-25%, noon 25-40%, afternoon 40-55%, dusk 55-70%, night 70-100% */
    .pp-sky {
      animation: pp-sky 32s linear infinite;
    }
    @keyframes pp-sky {
      0%   { fill: var(--sky-dawn); }
      12%  { fill: var(--sky-morn); }
      28%  { fill: var(--sky-noon); }
      45%  { fill: var(--sky-aft); }
      60%  { fill: var(--sky-dusk); }
      75%  { fill: var(--sky-night); }
      95%  { fill: var(--sky-night); }
      100% { fill: var(--sky-dawn); }
    }
    .pp-ground-anim {
      animation: pp-ground-anim 32s linear infinite;
    }
    @keyframes pp-ground-anim {
      0%   { fill: var(--ground-night); }
      14%  { fill: var(--ground-day); }
      55%  { fill: var(--ground-day); }
      68%  { fill: var(--ground-night); }
      100% { fill: var(--ground-night); }
    }
    /* twinkling stars only show during night */
    .pp-night-only {
      animation: pp-night-only 32s linear infinite;
    }
    @keyframes pp-night-only {
      0%, 70%, 100% { opacity: 0; }
      78%, 90%      { opacity: 1; }
    }
    /* sun arcs across the sky and sets */
    .pp-sun {
      transform-box: fill-box;
      transform-origin: 50% 50%;
      animation: pp-sun 32s linear infinite;
    }
    @keyframes pp-sun {
      0%   { transform: translate(-110px, 38px); opacity: 0; }
      8%   { transform: translate(-90px, 28px); opacity: 1; }
      28%  { transform: translate(0px, -4px); opacity: 1; }
      50%  { transform: translate(70px, 6px); opacity: 1; }
      62%  { transform: translate(95px, 30px); opacity: 1; }
      70%  { transform: translate(115px, 40px); opacity: 0; }
      100% { transform: translate(-110px, 38px); opacity: 0; }
    }
    /* second sun (smaller, follows behind) */
    .pp-sun2 {
      transform-box: fill-box;
      transform-origin: 50% 50%;
      animation: pp-sun2 32s linear infinite;
    }
    @keyframes pp-sun2 {
      0%   { transform: translate(-120px, 44px); opacity: 0; }
      14%  { transform: translate(-80px, 24px); opacity: 1; }
      35%  { transform: translate(-10px, 4px); opacity: 1; }
      55%  { transform: translate(80px, 14px); opacity: 1; }
      66%  { transform: translate(110px, 36px); opacity: 0; }
      100% { transform: translate(-120px, 44px); opacity: 0; }
    }
    /* moon rises during night */
    .pp-moon {
      transform-box: fill-box;
      transform-origin: 50% 50%;
      animation: pp-moon 32s linear infinite;
    }
    @keyframes pp-moon {
      0%, 65%   { transform: translate(-110px, 38px); opacity: 0; }
      72%       { transform: translate(-80px, 24px); opacity: 1; }
      85%       { transform: translate(0px, 0px); opacity: 1; }
      95%       { transform: translate(60px, 8px); opacity: 1; }
      100%      { transform: translate(80px, 24px); opacity: 0; }
    }

    /* phase label fades — 4 stacked labels each visible for ~8s */
    .pp-phase-dawn  { animation: pp-phase-dawn  32s linear infinite; opacity: 0; }
    .pp-phase-noon  { animation: pp-phase-noon  32s linear infinite; opacity: 0; }
    .pp-phase-dusk  { animation: pp-phase-dusk  32s linear infinite; opacity: 0; }
    .pp-phase-night { animation: pp-phase-night 32s linear infinite; opacity: 0; }
    @keyframes pp-phase-dawn  { 0%, 17%, 100% { opacity: 1; } 22%, 95% { opacity: 0; } }
    @keyframes pp-phase-noon  { 0%, 22% { opacity: 0; } 27%, 47% { opacity: 1; } 52%, 100% { opacity: 0; } }
    @keyframes pp-phase-dusk  { 0%, 52% { opacity: 0; } 57%, 70% { opacity: 1; } 75%, 100% { opacity: 0; } }
    @keyframes pp-phase-night { 0%, 75% { opacity: 0; } 80%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }

    /* clock label cycles 04:00 → 12:00 → 18:00 → 22:00 → 04:00 */
    .pp-clock-1 { animation: pp-clock-1 32s linear infinite; opacity: 0; }
    .pp-clock-2 { animation: pp-clock-2 32s linear infinite; opacity: 0; }
    .pp-clock-3 { animation: pp-clock-3 32s linear infinite; opacity: 0; }
    .pp-clock-4 { animation: pp-clock-4 32s linear infinite; opacity: 0; }
    @keyframes pp-clock-1 { 0%, 17%, 100% { opacity: 1; } 22%, 95% { opacity: 0; } }
    @keyframes pp-clock-2 { 0%, 22% { opacity: 0; } 27%, 47% { opacity: 1; } 52%, 100% { opacity: 0; } }
    @keyframes pp-clock-3 { 0%, 52% { opacity: 0; } 57%, 70% { opacity: 1; } 75%, 100% { opacity: 0; } }
    @keyframes pp-clock-4 { 0%, 75% { opacity: 0; } 80%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }

    /* === HARVEST + PLANT CYCLE (8s loop) === */
    /* 0-1s empty, 1-2s puff, 2-5s growing, 5-7s bloom+sparkle, 7-7.5s burst, 7.5-8s collected */
    .pp-cyc-empty   { animation: pp-cyc-empty   8s linear infinite; opacity: 1; }
    .pp-cyc-puff    { animation: pp-cyc-puff    8s ease-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 100%; }
    .pp-cyc-sprout  { animation: pp-cyc-sprout  8s ease-in-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 100%; }
    .pp-cyc-young   { animation: pp-cyc-young   8s ease-in-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 100%; }
    .pp-cyc-bloom   { animation: pp-cyc-bloom   8s ease-in-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 100%; }
    .pp-cyc-burst   { animation: pp-cyc-burst   8s ease-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 50%; }
    .pp-cyc-loot    { animation: pp-cyc-loot    8s ease-out infinite; opacity: 0;
                      transform-box: fill-box; transform-origin: 50% 100%; }
    .pp-cyc-ready   { animation: pp-cyc-ready   8s steps(2) infinite; opacity: 0; }

    @keyframes pp-cyc-empty  { 0%, 12% { opacity: 1; } 13%, 100% { opacity: 0; } }
    @keyframes pp-cyc-puff   { 0%, 12% { opacity: 0; transform: scale(0.4) translateY(0); }
                               16%, 22% { opacity: 1; transform: scale(1) translateY(-2px); }
                               28% { opacity: 0; transform: scale(1.4) translateY(-4px); }
                               100% { opacity: 0; } }
    @keyframes pp-cyc-sprout { 0%, 22% { opacity: 0; transform: scaleY(0); }
                               25%, 38% { opacity: 1; transform: scaleY(0.4); }
                               42% { opacity: 0; }
                               100% { opacity: 0; } }
    @keyframes pp-cyc-young  { 0%, 38% { opacity: 0; }
                               42%, 55% { opacity: 1; transform: scaleY(0.75); }
                               58% { opacity: 0; }
                               100% { opacity: 0; } }
    @keyframes pp-cyc-bloom  { 0%, 55% { opacity: 0; transform: scaleY(0.92); }
                               60%, 86% { opacity: 1; transform: scaleY(1); }
                               90%, 100% { opacity: 0; } }
    @keyframes pp-cyc-ready  { 0%, 70% { opacity: 0; }
                               72%, 86% { opacity: 1; }
                               88%, 100% { opacity: 0; } }
    @keyframes pp-cyc-burst  { 0%, 85% { opacity: 0; transform: scale(0.6); }
                               88% { opacity: 1; transform: scale(1.4); }
                               92% { opacity: 0.6; transform: scale(2.0); }
                               94%, 100% { opacity: 0; } }
    @keyframes pp-cyc-loot   { 0%, 88% { opacity: 0; transform: translateY(0); }
                               90% { opacity: 1; }
                               99% { opacity: 1; transform: translateY(-10px); }
                               100% { opacity: 0; transform: translateY(-10px); } }
  `;
  document.head.appendChild(s);
}

// ============================================================
// Pixel sprite renderer — palette-role aware
// ============================================================
const ROLE = {
  'k': 'pp-ink',     'o': 'pp-ink',
  'p': 'pp-primary',
  'b': 'pp-mid',
  'l': 'pp-light',
  'c': 'pp-cream',
  'y': 'pp-accent',
  'r': 'pp-warm',
  'g': 'pp-grass',
  'G': 'pp-grassD',
  's': 'pp-soil',
  'S': 'pp-soilL',
  'w': 'pp-water',
};

function PixSprite({pattern, x = 0, y = 0, w = 1, h = 1, className = ''}) {
  const rows = pattern.split('\n').map(r => r.replace(/^\s+|\s+$/g, '')).filter(r => r.length);
  const cells = [];
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const cls = ROLE[ch];
      if (!cls) return;
      cells.push(<rect key={`${rx}-${ry}`} x={x + rx * w} y={y + ry * h} width={w} height={h} className={cls}/>);
    });
  });
  return <g className={`pp-sprite ${className}`}>{cells}</g>;
}

// ============================================================
// SPRITES — plants, blob, icons
// ============================================================

// Blob — slightly improved, with separate eyes layer so we can blink
const SPR_BLOB_BODY = `
....oooooo......
..oollllllooo...
.ollblllllbloo..
.oblllllllllbo..
oblllllllllllo..
obllllllllblblo.
obllllblblbbblo.
obllllllllblllo.
.obllllllllllo..
.obblllbbblllbo.
.ooblllllllbboo.
..ooobllblboooo.
....oooblboo....
......obbbo.....
.....ooboo......
......ooo.......
`;

// Eyes (rendered on top of body). Two pixels for pupils.
const SPR_BLOB_EYES_OPEN = `
................
................
................
................
................
....oo..oo......
....oo..oo......
................
................
................
................
................
................
................
................
................
`;
// Closed eyes (a single horizontal line where pupils were)
const SPR_BLOB_EYES_SHUT = `
................
................
................
................
................
................
....oo..oo......
................
................
................
................
................
................
................
................
................
`;
const SPR_BLOB_MOUTH = `
................
................
................
................
................
................
................
.....oooo.......
................
................
................
................
................
................
................
................
`;

// Watering can (held off the right shoulder of the blob)
const SPR_CAN_HELD = `
.....rrrrrr.
....rrrrrrro
...rrrrrrrro
...rrrrrrrrr
.....oooooor
.............
.............
.............
`;

// === plants (14×14 unless noted) ===

const PLANT_BELL = `
.....bbbo.....
....bllllo....
...bllrrllo...
..olllrrrloo..
..ollrrrlloo..
..olllrrlloo..
...obllllo....
....omoo......
.....po.......
.....po.......
....opoo......
...opo.go.....
..opoooGoo....
..gGoGgGggo...
`.replace(/m/g, 'p'); // unify stem color

const PLANT_STAR = `
.....oyo......
....oyyyo.....
..ooyyyyyoo...
.oyyyyyyyyo...
oyyyyrroyyyoo.
.oyyyrroyyyo..
..oyyyrryoo...
....ooyooo....
.....opo......
....opoo......
....opo.go....
...opo.gGo....
..opooogggo...
.oGooggGoooo..
`;

const PLANT_CRYS = `
.......o......
......obo.....
.....obblo....
...o.obblo....
..olo.bblo.bo.
..olbo.bloblo.
..oblbo.olbblo
.obbllo.olbblo
.oblllbo.lblo.
.olllllbobblo.
.ooblllbbobo..
..oobllobboo..
...ooooooo....
....oooo......
`;

const PLANT_DREAM = `
....oooooo....
...oblllllo...
..obllllllbo..
..olloooollo..
.obloollooblo.
.obloocooblo..
.obloocoolblo.
..obllooolbo..
..obllllllbo..
...obllllbo...
.....opo......
.....opo......
....opoo......
...gGoGggo....
`;

const PLANT_ROSE = `
.....oro......
....orrro.....
...orrrro.....
....oro..oro..
....opo.orro..
....opoorrro..
....opoo.oro..
.oro.po.......
orrropo.......
.oro.po.......
.....po.go....
....opoogGo...
...opooogggo..
..oGooggGooo..
`;

// hum-fern — curly spiral fronds
const PLANT_FERN = `
.....bbo......
....bllbo.....
...bllllo.....
...obllloo....
....obbbo.....
.....opo......
....opo.......
...opo.ggo....
..opo..gGgo...
.opo..gGggo...
opo..gGggGo...
po..gGggGo....
po..gGggo.....
oGggGgoo......
`;

// moonpod — bubble cluster
const PLANT_POD = `
......bbo.....
.....blllo....
....bllbllo...
....blllllo...
..oolbllblo...
..oollllooo...
....opo.bbo...
....opoblllo..
....opolllo...
....opo.oo....
....opo.......
....opo.go....
...opoogGo....
..opooogggo...
`;

// prism-thorn — three sharp spikes
const PLANT_THORN = `
.....o........
.....bo.......
....blo.......
....bloo......
o..oblo.......
bo.oblo.ooo...
blo.oblo.oboo.
oblo.olo.olbo.
.obloolboolo..
.oblllllbblo..
..ooblllboo...
...oollloo....
....ooooo.....
.....go.......
`;

// jelly-cap — mushroom dome
const PLANT_CAP = `
.....oooo.....
...oorrrroo...
..orrrrrrrro..
.orrrrrrrrrro.
orrlllrrlllrrr
orrlllrrlllrrr
.oorrrrrrrroo.
...ocoooooc...
....occcc.....
....ocooc.....
....ocooc.....
....ocooc.....
....occcc.....
....oooo......
`;

// orb-vine — berries on a stem
const PLANT_ORB = `
......yo......
.....yo.......
.....yoyo.....
....yo..o.....
....yo.yyo....
.....yoyo.....
....yo.r......
...yo..rr.....
..yo..rro.....
..yo.rrro.....
...yo.go......
....yogGo.....
...yogggo.....
..oGoogGoo....
`;

// === tiles ===
const TILE_SOIL = `
SsSsSsSsSsSs
sSsSsSsSsSsS
SsSsSsSsSsSs
sSsSsSsSsSsS
SsSsSsSsSsSs
sSsSsSsSsSsS
SsSsSsSsSsSs
sSsSsSsSsSsS
SsSsSsSsSsSs
sSsSsSsSsSsS
`;

// ============================================================
// Animated blob — body breathes, eyes blink, separate pieces
// ============================================================
function AnimatedBlob({x, y, scale = 1}) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <g className="pp-breathe">
        <PixSprite pattern={SPR_BLOB_BODY}/>
      </g>
      {/* mouth — stays on body */}
      <g className="pp-breathe">
        <PixSprite pattern={SPR_BLOB_MOUTH}/>
      </g>
      {/* open eyes (blink off) */}
      <g className="pp-blink">
        <PixSprite pattern={SPR_BLOB_EYES_OPEN}/>
      </g>
    </g>
  );
}

// Plant wrapper that gives sway. `swayClass` rotates between pp-sway, pp-sway2, pp-sway3.
function Plant({x, y, pattern, swayClass = 'pp-sway'}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g className={swayClass}>
        <PixSprite pattern={pattern}/>
      </g>
    </g>
  );
}

// ============================================================
// The screen — animated garden scene
// Renders inside the handheld console.
// ============================================================
function PocketScreen({palette = 'pal-dawn'}) {
  const W = 192, H = 116;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className={palette}
      style={{display: 'block', imageRendering: 'pixelated', backgroundColor: 'var(--pal-screen)'}}
    >
      <defs>
        {/* twinkling stars pattern won't animate (filter caching),
            so we put stars as individual rects with twinkle classes. */}
      </defs>

      {/* sky — animated tint cycles dawn→noon→dusk→night */}
      <rect x="0" y="0" width={W} height="58" className="pp-sky"/>
      {/* horizon line */}
      <rect x="0" y="58" width={W} height="1" className="pp-primary"/>

      {/* twinkling stars — only visible at night */}
      <g className="pp-night-only">
        {[
          [8, 5, 1], [22, 12, 2], [38, 6, 3], [54, 14, 1],
          [72, 8, 2], [90, 16, 3], [108, 7, 1], [128, 12, 2],
          [148, 5, 3], [164, 16, 1], [180, 9, 2],
          [16, 22, 2], [46, 20, 3], [80, 24, 1], [120, 22, 2], [156, 26, 3],
        ].map(([x, y, t], i) => (
          <rect key={i} x={x} y={y} width="1" height="1" style={{fill: 'var(--moon-color)'}} className={`pp-twinkle${t}`}/>
        ))}
      </g>

      {/* CELESTIAL — sun + companion sun + moon, all arc across sky */}
      {/* sun (primary, larger) */}
      <g className="pp-sun" transform="translate(80, 16)">
        <rect x="-3" y="-4" width="6" height="1" style={{fill: 'var(--sun-color)'}}/>
        <rect x="-4" y="-3" width="8" height="6" style={{fill: 'var(--sun-color)'}}/>
        <rect x="-3" y="3"  width="6" height="1" style={{fill: 'var(--sun-color)'}}/>
        {/* corona pixel rays */}
        <rect x="-7" y="-1" width="1" height="2" style={{fill: 'var(--sun-color)'}} opacity="0.6"/>
        <rect x="6"  y="-1" width="1" height="2" style={{fill: 'var(--sun-color)'}} opacity="0.6"/>
      </g>
      {/* second sun (smaller, rosier) */}
      <g className="pp-sun2" transform="translate(80, 22)">
        <rect x="-2" y="-2" width="4" height="1" style={{fill: 'var(--sun2-color)'}}/>
        <rect x="-3" y="-1" width="6" height="3" style={{fill: 'var(--sun2-color)'}}/>
        <rect x="-2" y="2"  width="4" height="1" style={{fill: 'var(--sun2-color)'}}/>
      </g>
      {/* moon — crescent with crater pixels */}
      <g className="pp-moon" transform="translate(80, 14)">
        <rect x="-3" y="-3" width="6" height="1" style={{fill: 'var(--moon-color)'}}/>
        <rect x="-4" y="-2" width="8" height="4" style={{fill: 'var(--moon-color)'}}/>
        <rect x="-3" y="2"  width="6" height="1" style={{fill: 'var(--moon-color)'}}/>
        {/* dark crescent */}
        <rect x="-2" y="-2" width="3" height="3" style={{fill: 'var(--sky-night)'}} opacity="0.6"/>
        {/* craters */}
        <rect x="2"  y="-1" width="1" height="1" style={{fill: 'var(--sky-night)'}} opacity="0.4"/>
        <rect x="3"  y="1"  width="1" height="1" style={{fill: 'var(--sky-night)'}} opacity="0.4"/>
      </g>

      {/* far mountains */}
      <PixSprite x={0} y={42} w={1} h={1} pattern={`
        .................................................................................................................................................................................
        ..................ppp..................................................................ppppp...........................ppppp...........................ppp.......................
        ..............ppppppppp.........................ppppp..............................ppppppppppppp..........ppp.......ppppppppppp..............ppppp..ppppppppp....................
        .........ppppppppppppppppp.................pppppppppppppp.............pppppppp..ppppppppppppppppppppp..pppppppppppppppppppppppppp........pppppppppppppppppppppppp................
      `}/>
      <PixSprite x={0} y={50} w={1} h={1} pattern={`
        bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
        bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
        bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
      `}/>

      {/* ground band — fill animates with day-night */}
      <rect x="0" y="58" width={W} height={H - 58} className="pp-ground-anim"/>
      <rect x="0" y="58" width={W} height="2" className="pp-mid"/>

      {/* fenceposts along upper edge */}
      {Array.from({length: W / 6}).map((_, i) => (
        <rect key={i} x={i * 6} y={57} width="1" height="3" className="pp-light"/>
      ))}
      {Array.from({length: W / 6}).map((_, i) => (
        <rect key={`r-${i}`} x={i * 6 + 1} y={58} width="5" height="1" className="pp-light"/>
      ))}

      {/* soil patches — two rows of small beds */}
      {[68, 92].map((py, row) =>
        Array.from({length: 5}).map((_, c) => (
          <PixSprite key={`bed-${row}-${c}`} x={8 + c * 36} y={py} pattern={TILE_SOIL}/>
        ))
      )}

      {/* PLANTS — 10 species placed across the two rows */}
      {/* row 1 (y=68) */}
      <Plant x={6} y={56} pattern={PLANT_BELL} swayClass="pp-sway"/>
      <Plant x={42} y={56} pattern={PLANT_STAR} swayClass="pp-sway2"/>
      <Plant x={78} y={56} pattern={PLANT_FERN} swayClass="pp-sway3"/>
      {/* HARVEST CYCLE — at slot 4, replaces a static plant. Empty → puff → sprout → young → bloom → harvest burst → loot */}
      <g transform="translate(114, 56)">
        {/* base patch indicator dot */}
        <rect x="6" y="14" width="2" height="1" className="pp-soilL"/>
        {/* phase 0: empty (a single seed dot in the soil) */}
        <g className="pp-cyc-empty">
          <rect x="6" y="13" width="2" height="1" className="pp-soil"/>
          <rect x="7" y="12" width="1" height="1" className="pp-soilL"/>
        </g>
        {/* phase 1: puff cloud (planting) */}
        <g className="pp-cyc-puff">
          <PixSprite x={2} y={6} pattern={`
            ..ll.....
            .llllll..
            llllllll.
            .llllll..
            ..ll.....
          `}/>
        </g>
        {/* phase 2: tiny sprout */}
        <g className="pp-cyc-sprout">
          <PixSprite x={4} y={9} pattern={`
            ..g..
            .ggg.
            g.g.g
            ..p..
            ..p..
            .ppo.
          `}/>
        </g>
        {/* phase 3: young plant — a small version of the thorn */}
        <g className="pp-cyc-young">
          <PixSprite x={2} y={4} pattern={`
            ....bo...
            ..o.blo..
            .oblo.olo
            obloolblo
            .oblllbo.
            ..oblbo..
            ...go....
          `}/>
        </g>
        {/* phase 4: full bloom — the prism-thorn */}
        <g className="pp-cyc-bloom">
          <PixSprite pattern={PLANT_THORN}/>
        </g>
        {/* phase 4b: "READY!" tag flashing above bloom */}
        <g className="pp-cyc-ready" transform="translate(-2, -6)">
          <rect x="0" y="0" width="18" height="6" className="pp-accent"/>
          <text x="2" y="4.5" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-ink">READY!</text>
        </g>
        {/* phase 5: harvest burst (radial sparkle) */}
        <g className="pp-cyc-burst">
          <rect x="6"  y="6"  width="2" height="2" className="pp-accent"/>
          <rect x="1"  y="2"  width="1" height="1" className="pp-accent"/>
          <rect x="12" y="2"  width="1" height="1" className="pp-accent"/>
          <rect x="-1" y="7"  width="1" height="1" className="pp-light"/>
          <rect x="14" y="7"  width="1" height="1" className="pp-light"/>
          <rect x="2"  y="12" width="1" height="1" className="pp-accent"/>
          <rect x="11" y="12" width="1" height="1" className="pp-accent"/>
          <rect x="0"  y="0"  width="1" height="1" className="pp-warm"/>
          <rect x="13" y="0"  width="1" height="1" className="pp-warm"/>
        </g>
        {/* phase 6: loot — a tiny crystal flying up + "+1" */}
        <g className="pp-cyc-loot">
          <PixSprite x={5} y={4} pattern={`
            .y.
            yyy
            .y.
          `}/>
          <text x="9" y="6" fontFamily="'JetBrains Mono', monospace" fontSize="3.4" className="pp-text2">+1</text>
        </g>
      </g>
      <Plant x={150} y={56} pattern={PLANT_DREAM} swayClass="pp-sway2"/>

      {/* row 2 (y=92) */}
      <Plant x={6} y={80} pattern={PLANT_POD} swayClass="pp-sway2"/>
      <Plant x={42} y={80} pattern={PLANT_CRYS} swayClass="pp-sway"/>
      <Plant x={78} y={80} pattern={PLANT_ROSE} swayClass="pp-sway3"/>
      <Plant x={114} y={80} pattern={PLANT_CAP} swayClass="pp-sway"/>
      <Plant x={150} y={80} pattern={PLANT_ORB} swayClass="pp-sway2"/>

      {/* The blob between the rows, watering a plant */}
      <AnimatedBlob x={48} y={64} scale={1}/>
      {/* watering can in hand */}
      <g transform="translate(60, 68)">
        <PixSprite pattern={SPR_CAN_HELD}/>
      </g>
      {/* drip animation */}
      <g className="pp-drip">
        <rect x="71" y="76" width="1" height="2" className="pp-water"/>
        <rect x="71" y="79" width="1" height="1" className="pp-water"/>
      </g>

      {/* Sparkles dancing on the star-bloom */}
      <g className="pp-sparkle" transform="translate(48, 56)">
        <rect x="0" y="0" width="1" height="1" className="pp-accent"/>
        <rect x="-2" y="-2" width="1" height="1" className="pp-accent"/>
        <rect x="2" y="-3" width="1" height="1" className="pp-light"/>
        <rect x="3" y="2" width="1" height="1" className="pp-accent"/>
      </g>
      <g className="pp-sparkle" style={{animationDelay: '-0.6s'}} transform="translate(124, 60)">
        <rect x="0" y="0" width="1" height="1" className="pp-accent"/>
        <rect x="2" y="-2" width="1" height="1" className="pp-light"/>
        <rect x="-2" y="2" width="1" height="1" className="pp-accent"/>
      </g>

      {/* Puff above newly-planted seed */}
      <g className="pp-puff" transform="translate(178, 100)">
        <rect x="0" y="0" width="2" height="1" className="pp-light"/>
        <rect x="-1" y="-1" width="1" height="1" className="pp-light"/>
      </g>

      {/* Tiny bird scribble flying L→R (animated via SMIL-light: use transform) */}
      <g style={{animation: 'pp-bird 8s linear infinite'}}>
        <rect x="0" y="0" width="1" height="1" className="pp-light"/>
        <rect x="1" y="-1" width="1" height="1" className="pp-light"/>
        <rect x="2" y="0" width="1" height="1" className="pp-light"/>
      </g>
      <style>{`
        @keyframes pp-bird {
          0%   { transform: translate(-10px, 18px); }
          50%  { transform: translate(100px, 12px); }
          100% { transform: translate(${W + 10}px, 20px); }
        }
      `}</style>

      {/* === HUD === */}
      {/* top-left: love hearts */}
      <g>
        <rect x="2" y="2" width="46" height="7" className="pp-ink"/>
        <rect x="2" y="2" width="46" height="7" fill="none" stroke="currentColor" strokeWidth="0.4" style={{color: 'var(--pal-screen)'}}/>
        {[3, 11, 19, 27, 35].map((x, i) => (
          <PixSprite key={i} x={x} y={3} pattern={
            i < 4 ?
              `
                .r.r.
                rrrrr
                rrrrr
                .rrr.
                ..r..
              ` :
              `
                .o.o.
                ooooo
                ooooo
                .ooo.
                ..o..
              `
          }/>
        ))}
      </g>

      {/* top-right: animated clock that cycles through the day */}
      <g>
        <rect x={W - 50} y="2" width="48" height="7" className="pp-ink"/>
        <text x={W - 47} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text2 pp-clock-1">04:12</text>
        <text x={W - 47} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text2 pp-clock-2">12:08</text>
        <text x={W - 47} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text2 pp-clock-3">18:36</text>
        <text x={W - 47} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text2 pp-clock-4">22:48</text>
        {/* small sun/moon icon — sun during day, swaps for moon at night via opacity */}
        <g>
          <rect x={W - 22} y={3} width="5" height="3" style={{fill: 'var(--sun-color)'}} className="pp-clock-1"/>
          <rect x={W - 22} y={3} width="5" height="3" style={{fill: 'var(--sun-color)'}} className="pp-clock-2"/>
          <rect x={W - 22} y={3} width="5" height="3" style={{fill: 'var(--sun2-color)'}} className="pp-clock-3"/>
          <rect x={W - 22} y={3} width="5" height="3" style={{fill: 'var(--moon-color)'}} className="pp-clock-4"/>
        </g>
        {/* second body */}
        <g>
          <rect x={W - 12} y={3} width="3" height="3" style={{fill: 'var(--sun2-color)'}} className="pp-clock-1"/>
          <rect x={W - 12} y={3} width="3" height="3" style={{fill: 'var(--sun-color)'}} className="pp-clock-2"/>
          <rect x={W - 12} y={3} width="3" height="3" style={{fill: 'var(--sun2-color)'}} className="pp-clock-3"/>
          <rect x={W - 12} y={3} width="3" height="3" style={{fill: 'var(--moon-color)'}} className="pp-clock-4" opacity="0.5"/>
        </g>
      </g>

      {/* Dialogue box bottom — animated cursor + portrait blob */}
      <g>
        <rect x="2" y={H - 24} width={W - 4} height="22" className="pp-ink"/>
        <rect x="2" y={H - 24} width={W - 4} height="22" fill="none" stroke="currentColor" strokeWidth="0.4" style={{color: 'var(--pal-screen)'}}/>
        {/* portrait */}
        <g transform={`translate(4, ${H - 22})`}>
          <rect x="0" y="0" width="18" height="18" className="pp-ink"/>
          <rect x="0" y="0" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="0.3" style={{color: 'var(--pal-text)'}}/>
          {/* tiny blob bust */}
          <PixSprite x={1} y={1} pattern={`
            ...bbbb....
            ..bllllbo..
            .blllllbo..
            .bllblllbo.
            bllllblllbo
            blooolloolo
            bllllllllbo
            .bllllllbo.
            ..ooobbbo..
            ....oboo...
          `}/>
        </g>

        <text x="26" y={H - 14} fontFamily="'JetBrains Mono', monospace" fontSize="4" className="pp-text2">MIRA</text>
        <text x="26" y={H - 8} fontFamily="'JetBrains Mono', monospace" fontSize="3.5" className="pp-text">the prism-thorn is ready to harvest</text>
        <text x="26" y={H - 4} fontFamily="'JetBrains Mono', monospace" fontSize="3.5" className="pp-text">- press</text>
        <text x="46" y={H - 4} fontFamily="'JetBrains Mono', monospace" fontSize="3.5" className="pp-text2">A</text>
        <text x="50" y={H - 4} fontFamily="'JetBrains Mono', monospace" fontSize="3.5" className="pp-text">to take a clipping.</text>

        {/* blinking next-arrow */}
        <g className="pp-cursor">
          <rect x={W - 8} y={H - 7} width="3" height="1" className="pp-text2"/>
          <rect x={W - 7} y={H - 6} width="1" height="1" className="pp-text2"/>
        </g>
      </g>

      {/* Quest indicator top-center — replaced by day phase label */}
      <g>
        <rect x={W / 2 - 30} y={2} width="60" height="7" className="pp-ink"/>
        <g className="pp-arrow" transform={`translate(${W / 2 - 27}, 4.4)`}>
          <rect x="0" y="0" width="3" height="1" className="pp-text2"/>
          <rect x="1" y="1" width="1" height="1" className="pp-text2"/>
        </g>
        <text x={W / 2 - 22} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text pp-phase-dawn">dawn · sol 47</text>
        <text x={W / 2 - 22} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text pp-phase-noon">noon · sol 47</text>
        <text x={W / 2 - 22} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text pp-phase-dusk">dusk · sol 47</text>
        <text x={W / 2 - 22} y="7.2" fontFamily="'JetBrains Mono', monospace" fontSize="3.6" className="pp-text pp-phase-night">night · sol 47</text>
      </g>
    </svg>
  );
}

// ============================================================
// Console body — wraps the screen in the handheld shell.
// ============================================================
function PocketConsole({palette = 'pal-dawn', shell, title, palLabel}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: shell.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* faint pattern in the background */}
      <div style={{position: 'absolute', inset: 0,
        backgroundImage: shell.bgPattern,
        opacity: 0.4, pointerEvents: 'none',
      }}/>

      <div style={{
        width: 900, height: 640,
        background: shell.body,
        borderRadius: '40px 40px 60px 60px',
        border: `6px solid ${shell.bezel}`,
        boxShadow: `inset 0 -8px 0 ${shell.bodyShadow}, inset 0 4px 0 ${shell.bodyHighlight}, 0 30px 60px rgba(0,0,0,0.5)`,
        position: 'relative',
        padding: '36px 56px 30px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* top strip */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
          <div style={{fontSize: 12, letterSpacing: '0.32em', color: shell.bezel, fontWeight: 700}}>{title}</div>
          <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
            <div style={{fontSize: 10, color: shell.bezel, letterSpacing: '0.2em', opacity: 0.7}}>PALETTE</div>
            <div style={{padding: '3px 10px', fontSize: 10, letterSpacing: '0.2em', background: shell.bezel, color: shell.bodyHighlight, borderRadius: 4}}>{palLabel}</div>
            <div style={{width: 12, height: 12, borderRadius: '50%', background: shell.led, boxShadow: `0 0 8px ${shell.led}, inset 0 0 0 1px ${shell.bezel}`}} className="pp-power"/>
          </div>
        </div>

        {/* Screen bezel */}
        <div style={{
          flex: 1,
          background: shell.bezel,
          borderRadius: 14,
          padding: 22,
          position: 'relative',
          boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.5)',
        }}>
          {/* screen ridge "etched" label */}
          <div style={{position: 'absolute', top: 6, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8, letterSpacing: '0.3em', color: shell.bodyHighlight, opacity: 0.5}}>
            <div>DOT MATRIX WITH STEREO SOUND</div>
            <div>PKT-1</div>
          </div>

          <div style={{
            width: '100%', height: '100%',
            background: 'var(--pal-screen)',
            border: `2px solid ${shell.bezelInner}`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `inset 0 0 0 2px ${shell.bezel}`,
          }}>
            <PocketScreen palette={palette}/>

            {/* drifting scanline highlight */}
            <div className="pp-scanline" style={{position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 48%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 52%, transparent 100%)',
              pointerEvents: 'none',
            }}/>
            {/* scanlines */}
            <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
              mixBlendMode: 'multiply',
              opacity: 0.5,
            }}/>
            {/* glare */}
            <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)',
            }}/>
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, padding: '0 8px'}}>
          {/* D-pad */}
          <div style={{position: 'relative', width: 96, height: 96}}>
            <div style={{position: 'absolute', left: 32, top: 0, width: 32, height: 96, background: shell.bezel, borderRadius: 6, boxShadow: `inset 0 -3px 0 ${shell.bezelInner}`}}/>
            <div style={{position: 'absolute', left: 0, top: 32, width: 96, height: 32, background: shell.bezel, borderRadius: 6, boxShadow: `inset 0 -3px 0 ${shell.bezelInner}`}}/>
            <div style={{position: 'absolute', left: 40, top: 10, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `9px solid ${shell.dpadGlyph}`}}/>
            <div style={{position: 'absolute', left: 40, bottom: 10, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `9px solid ${shell.dpadGlyph}`}}/>
            <div style={{position: 'absolute', top: 40, left: 10, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `9px solid ${shell.dpadGlyph}`}}/>
            <div style={{position: 'absolute', top: 40, right: 10, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `9px solid ${shell.dpadGlyph}`}}/>
          </div>

          {/* center */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <div style={{display: 'flex', gap: 14}}>
              <div style={{padding: '4px 14px', background: shell.btnPill, borderRadius: 999, fontSize: 9, letterSpacing: '0.22em', color: shell.bodyHighlight}}>SELECT</div>
              <div style={{padding: '4px 16px', background: shell.btnPill, borderRadius: 999, fontSize: 9, letterSpacing: '0.22em', color: shell.bodyHighlight}}>START</div>
            </div>
            <div style={{fontFamily: '"DM Serif Display", serif', fontSize: 15, color: shell.bezel, fontStyle: 'italic'}}>Sol 47 · Mira's plot</div>
          </div>

          {/* A / B */}
          <div style={{display: 'flex', alignItems: 'center', gap: 14, transform: 'rotate(-16deg)'}}>
            <div style={{width: 46, height: 46, borderRadius: '50%', background: shell.btnB, boxShadow: `inset 0 -4px 0 ${shell.btnBShadow}, 0 2px 0 ${shell.bezel}`, display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: shell.bezel}}>B</div>
            <div style={{width: 46, height: 46, borderRadius: '50%', background: shell.btnA, boxShadow: `inset 0 -4px 0 ${shell.btnAShadow}, 0 2px 0 ${shell.bezel}`, display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: shell.bezel}}>A</div>
          </div>
        </div>

        {/* speaker */}
        <div style={{position: 'absolute', right: 64, bottom: 56, display: 'grid', gridTemplateColumns: 'repeat(6, 4px)', gap: 4, transform: 'rotate(-16deg)'}}>
          {Array.from({length: 24}).map((_, i) => (
            <div key={i} style={{width: 4, height: 4, borderRadius: '50%', background: shell.bezel, opacity: 0.7}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shells per palette (the console body styling, not the in-game palette)
// ============================================================
const SHELL_DAWN = {
  bg: 'radial-gradient(ellipse 70% 60% at 50% 40%, #4a3a8a 0%, #2a1a55 60%, #1a0a3e 100%)',
  bgPattern: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06) 0, transparent 50%), radial-gradient(circle at 70% 80%, rgba(245,207,94,0.05) 0, transparent 60%)',
  body: '#e6d2a8',
  bodyShadow: '#b8a07c',
  bodyHighlight: '#f4e9c8',
  bezel: '#1a0a3e',
  bezelInner: '#5a4630',
  led: '#e07598',
  dpadGlyph: '#5e3aa8',
  btnPill: '#5a4630',
  btnA: '#f5cf5e', btnAShadow: '#b8923e',
  btnB: '#e07598', btnBShadow: '#a04a6a',
};

const SHELL_DUSK = {
  bg: 'radial-gradient(ellipse 70% 60% at 50% 40%, #b25a8c 0%, #6a2a55 60%, #3a0e2a 100%)',
  bgPattern: 'radial-gradient(circle at 30% 20%, rgba(255,206,138,0.10) 0, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,110,142,0.08) 0, transparent 60%)',
  body: '#ffd0c0',
  bodyShadow: '#d49c8a',
  bodyHighlight: '#fff5e0',
  bezel: '#3a0e2a',
  bezelInner: '#6a2a55',
  led: '#ffce8a',
  dpadGlyph: '#b25a8c',
  btnPill: '#6a2a55',
  btnA: '#ff6e8e', btnAShadow: '#b25068',
  btnB: '#ffce8a', btnBShadow: '#b8923e',
};

const SHELL_AMBER = {
  bg: 'radial-gradient(ellipse 70% 60% at 50% 40%, #6e4a30 0%, #3a2010 60%, #1a0a05 100%)',
  bgPattern: 'radial-gradient(circle at 30% 20%, rgba(245,211,110,0.10) 0, transparent 50%), radial-gradient(circle at 70% 80%, rgba(217,110,74,0.08) 0, transparent 60%)',
  body: '#3e2e22',
  bodyShadow: '#1a0e08',
  bodyHighlight: '#6e4a30',
  bezel: '#1a0a05',
  bezelInner: '#3e2e22',
  led: '#f5d36e',
  dpadGlyph: '#f5d8a8',
  btnPill: '#1a0a05',
  btnA: '#d96e4a', btnAShadow: '#8a3e22',
  btnB: '#6e4a30', btnBShadow: '#3e2e22',
};

// ============================================================
// Three exposed artboards
// ============================================================
function ArtPocketDawn() {
  return <PocketConsole palette="pal-dawn" shell={SHELL_DAWN} title="HOME GARDEN · POCKET" palLabel="DAWN"/>;
}
function ArtPocketDusk() {
  return <PocketConsole palette="pal-dusk" shell={SHELL_DUSK} title="HOME GARDEN · POCKET" palLabel="DUSK"/>;
}
function ArtPocketAmber() {
  return <PocketConsole palette="pal-amber" shell={SHELL_AMBER} title="HOME GARDEN · POCKET" palLabel="AMBER"/>;
}

window.ArtPocketDawn = ArtPocketDawn;
window.ArtPocketDusk = ArtPocketDusk;
window.ArtPocketAmber = ArtPocketAmber;
