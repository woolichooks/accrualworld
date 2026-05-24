// Pocket Garden — Potion Compendium
//
// A printed catalog page of 8 brewable potions. Each card lists the
// flask, ingredient plants, effects, brew time, and rarity. Uses the
// PLANT_* sprites + PixSprite from art-pocket.jsx.

if (typeof document !== 'undefined' && !document.getElementById('potions-css')) {
  const s = document.createElement('style');
  s.id = 'potions-css';
  s.textContent = `
    .potions-page {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 90% 60% at 50% 40%, #f7efde 0%, #efe5cf 70%, #e6dbc1 100%);
      color: #1a2a9c;
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
      padding: 28px 36px 24px;
    }
    .potions-page::before {
      content: '';
      position: absolute; inset: 0;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(26,42,156,0.03) 0, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(165,40,40,0.03) 0, transparent 40%),
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.16  0 0 0 0 0.6  0 0 0 0.08 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");
      pointer-events: none;
    }
    .potion-card {
      position: relative;
      background: rgba(255, 250, 232, 0.6);
      border: 1.8px solid #1a2a9c;
      border-radius: 4px;
      padding: 12px 14px 10px;
      display: flex; flex-direction: column;
      transform: rotate(var(--tilt, 0deg));
    }
    .potion-card svg.pp-sprite-svg { display: block; image-rendering: pixelated; }
    .potion-card .row { display: flex; align-items: center; gap: 6px; }
    .pp-recipe-svg { display: block; image-rendering: pixelated; flex-shrink: 0; }
  `;
  document.head.appendChild(s);
}

// shared color for handwritten ink
const POT_INK = '#1a2a9c';
const POT_INK_SOFT = 'rgba(26,42,156,0.55)';

// helper: render a small plant sprite at fixed size
function PlantIcon({pattern, size = 32}) {
  return (
    <svg className="pp-recipe-svg pal-dawn" width={size} height={size} viewBox="-1 -1 16 16">
      <PixSprite pattern={pattern}/>
    </svg>
  );
}

// pixel-art flask in a given fill color (CSS color, not a palette role)
function Flask({color, label = 'A', size = 56}) {
  // Logical: 16x20
  return (
    <svg width={size} height={size} viewBox="0 0 16 20" style={{display: 'block', imageRendering: 'pixelated'}}>
      <g shapeRendering="crispEdges">
        {/* cork */}
        <rect x="5" y="0" width="6" height="2" fill="#8a6e4a"/>
        <rect x="5" y="0" width="6" height="1" fill="#5a4630"/>
        {/* neck */}
        <rect x="6" y="2" width="4" height="3" fill={POT_INK}/>
        <rect x="7" y="2" width="2" height="3" fill="#f4e9c8"/>
        {/* shoulders */}
        <rect x="5" y="5" width="6" height="1" fill={POT_INK}/>
        <rect x="4" y="6" width="8" height="1" fill={POT_INK}/>
        <rect x="3" y="7" width="10" height="1" fill={POT_INK}/>
        {/* body outline */}
        <rect x="2" y="8" width="1" height="10" fill={POT_INK}/>
        <rect x="13" y="8" width="1" height="10" fill={POT_INK}/>
        <rect x="3" y="18" width="10" height="1" fill={POT_INK}/>
        {/* inside */}
        <rect x="3" y="8" width="10" height="10" fill="#f4e9c8"/>
        {/* liquid level (color) */}
        <rect x="3" y="11" width="10" height="7" fill={color}/>
        {/* liquid surface highlight */}
        <rect x="4" y="11" width="8" height="1" fill="#fff" opacity="0.5"/>
        <rect x="4" y="14" width="2" height="2" fill="#fff" opacity="0.25"/>
        {/* tag */}
        <rect x="5" y="14" width="6" height="3" fill="#f4e9c8"/>
        <text x="8" y="16.5" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="2.4" fill={POT_INK} fontWeight="700">{label}</text>
      </g>
    </svg>
  );
}

const POTIONS = [
  {
    name: 'Oxalis Brew',
    tag: 'A',
    color: '#a8c862',
    tier: 'I',
    rarity: 1,
    ingr: [PLANT_BELL, PLANT_FERN, PLANT_ORB],
    ingNames: ['bell-bloom', 'hum-fern', 'orb-vine'],
    effects: [
      {k: 'AIR', v: '+12', c: '#6e9e44'},
      {k: 'HP',  v: '+4',  c: '#1a2a9c'},
    ],
    note: 'heals lung scarring',
    brew: '2h',
  },
  {
    name: 'Nightseal',
    tag: 'N',
    color: '#5e7adc',
    tier: 'II',
    rarity: 2,
    ingr: [PLANT_DREAM, PLANT_CRYS, PLANT_POD],
    ingNames: ['dreamer', 'glass-moss', 'moonpod'],
    effects: [
      {k: 'SUIT', v: '+24', c: '#1a2a9c'},
      {k: 'HP',   v: '+8',  c: '#1a2a9c'},
    ],
    note: 'seals micro-tears for 6h',
    brew: '3h',
  },
  {
    name: 'Thornguard',
    tag: 'T',
    color: '#d56b7a',
    tier: 'II',
    rarity: 2,
    ingr: [PLANT_THORN, PLANT_ROSE, PLANT_BELL],
    ingNames: ['prism-thorn', 'thistle-rose', 'bell-bloom'],
    effects: [
      {k: 'STR', v: '+5', c: '#d56b7a'},
      {k: 'DEF', v: '+3', c: '#1a2a9c'},
    ],
    note: 'sharp reflexes, 90 min',
    brew: '4h',
  },
  {
    name: 'Moonmilk',
    tag: 'M',
    color: '#c5d4ff',
    tier: 'I',
    rarity: 1,
    ingr: [PLANT_POD, PLANT_CRYS, PLANT_CAP],
    ingNames: ['moonpod', 'glass-moss', 'jelly-cap'],
    effects: [
      {k: 'HP',   v: '+18', c: '#1a2a9c'},
      {k: 'CALM', v: '+1',  c: '#5e3aa8'},
    ],
    note: 'sleep restores fully',
    brew: '1h',
  },
  {
    name: 'Emberwake',
    tag: 'E',
    color: '#f5cf5e',
    tier: 'III',
    rarity: 3,
    ingr: [PLANT_STAR, PLANT_ROSE, PLANT_THORN],
    ingNames: ['star-bloom', 'thistle-rose', 'prism-thorn'],
    effects: [
      {k: 'ENRG', v: '+24', c: '#e8a83a'},
      {k: 'HEAT', v: 'res', c: '#d56b7a'},
    ],
    note: 'no sleep needed · 1 sol',
    brew: '6h',
  },
  {
    name: 'Hushwater',
    tag: 'H',
    color: '#8acfff',
    tier: 'I',
    rarity: 1,
    ingr: [PLANT_FERN, PLANT_CAP, PLANT_ORB],
    ingNames: ['hum-fern', 'jelly-cap', 'orb-vine'],
    effects: [
      {k: 'PNIC', v: '-100%', c: '#5e3aa8'},
      {k: 'FOCUS', v: '+4',   c: '#1a2a9c'},
    ],
    note: 'calms the heart',
    brew: '1h',
  },
  {
    name: 'Prismtear',
    tag: 'P',
    color: '#e9a8ff',
    tier: 'III',
    rarity: 3,
    ingr: [PLANT_CRYS, PLANT_STAR, PLANT_DREAM],
    ingNames: ['glass-moss', 'star-bloom', 'dreamer'],
    effects: [
      {k: 'SIGHT', v: 'dark', c: '#5e3aa8'},
      {k: 'MAGIC', v: '+1',   c: '#e07598'},
    ],
    note: 'see in the dark · 3h',
    brew: '8h',
  },
  {
    name: 'Redoak Root',
    tag: 'R',
    color: '#d96e4a',
    tier: 'II',
    rarity: 2,
    ingr: [PLANT_ROSE, PLANT_THORN, PLANT_CAP],
    ingNames: ['thistle-rose', 'prism-thorn', 'jelly-cap'],
    effects: [
      {k: 'WALL',  v: '+2', c: '#8a6e4a'},
      {k: 'SHLT',  v: '+1', c: '#1a2a9c'},
    ],
    note: 'repairs bunker walls',
    brew: '5h',
  },
];

function PotionCard({p, idx}) {
  const tilt = ((idx % 3) - 1) * 0.5; // -0.5, 0, 0.5 rotation
  return (
    <div className="potion-card" style={{'--tilt': `${tilt}deg`}}>
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <Flask color={p.color} label={p.tag} size={50}/>
          <div>
            <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 18, color: POT_INK, lineHeight: 1, letterSpacing: '-0.01em'}}>{p.name}</div>
            <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.22em', color: POT_INK_SOFT, marginTop: 4}}>TIER {p.tier} · {p.brew}</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 1, marginTop: 2}}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: n <= p.rarity ? '#e8a83a' : POT_INK_SOFT,
              opacity: n <= p.rarity ? 1 : 0.4,
            }}>★</div>
          ))}
        </div>
      </div>

      <div style={{height: 1, background: POT_INK_SOFT, opacity: 0.4, margin: '10px 0 8px'}}/>

      {/* Recipe row */}
      <div style={{display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-start', flexWrap: 'wrap'}}>
        {p.ingr.map((ing, i) => (
          <React.Fragment key={i}>
            <div style={{background: 'rgba(168,178,236,0.18)', border: `1.2px dashed ${POT_INK_SOFT}`, padding: 2, borderRadius: 2}}>
              <PlantIcon pattern={ing} size={24}/>
            </div>
            {i < p.ingr.length - 1 && <span style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 14, color: POT_INK_SOFT}}>+</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{fontFamily: 'Caveat', fontSize: 12, color: POT_INK, marginTop: 4, lineHeight: 1.15}}>
        {p.ingNames.join(' · ')}
      </div>

      <div style={{height: 1, background: POT_INK_SOFT, opacity: 0.3, margin: '8px 0'}}/>

      {/* Effects */}
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        {p.effects.map((e, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.18em', color: POT_INK_SOFT}}>{e.k}</div>
            <div style={{fontFamily: '"DM Serif Display", serif', fontSize: 18, color: e.c, lineHeight: 1, fontWeight: 700, fontStyle: 'italic'}}>{e.v}</div>
          </div>
        ))}
        <div style={{flex: 1}}/>
      </div>

      {/* Note */}
      <div style={{fontFamily: 'Caveat', fontSize: 14, color: POT_INK, marginTop: 8, lineHeight: 1.1, fontStyle: 'italic'}}>
        — {p.note}
      </div>
    </div>
  );
}

function ArtPocketPotions() {
  return (
    <div className="potions-page art-frame">
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, position: 'relative', zIndex: 1}}>
        <div>
          <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.32em', color: POT_INK_SOFT}}>POCKET GARDEN · APPENDIX A</div>
          <div style={{fontFamily: '"DM Serif Display", serif', fontStyle: 'italic', fontSize: 42, color: POT_INK, lineHeight: 1, marginTop: 4, letterSpacing: '-0.02em'}}>
            Potion Compendium <span style={{fontSize: 22, color: POT_INK_SOFT}}>vol. 1</span>
          </div>
          <div style={{fontFamily: 'Caveat', fontSize: 18, color: POT_INK, marginTop: 6}}>
            eight brews known so far. nine more rumored. mind the cork pressure.
          </div>
        </div>
        <div style={{textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', color: POT_INK_SOFT, lineHeight: 1.6}}>
          ★★★ legendary<br/>
          ★★  uncommon<br/>
          ★   common
        </div>
      </div>

      {/* 4×2 grid of cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        position: 'relative', zIndex: 1,
      }}>
        {POTIONS.map((p, i) => <PotionCard key={i} p={p} idx={i}/>)}
      </div>

      {/* Footer doodle */}
      <div style={{position: 'absolute', left: 36, bottom: 14, fontFamily: 'Caveat', fontSize: 16, color: POT_INK_SOFT, fontStyle: 'italic', zIndex: 1}}>
        — apothecary M. · sol 47, second moon high
      </div>
      <div style={{position: 'absolute', right: 36, bottom: 14, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.2em', color: POT_INK_SOFT, zIndex: 1}}>
        A · 01 / 02 page
      </div>
    </div>
  );
}

window.ArtPocketPotions = ArtPocketPotions;
