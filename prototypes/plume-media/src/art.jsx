// Illustrated placeholder art. These are drawn in code so the prototype can show
// a range of skin tones and hair textures without using unlicensed photography.
// Replace with commissioned or licensed imagery before launch.
import { PALETTES } from './data.js';
import logoUrl from '../assets/plume-logo-320.webp';
import { localMedia } from './media.js';

const { useRef } = React;

export const LOGO_URL = logoUrl;

export const SKIN = {
  deep: '#4A2D20', deepWarm: '#5C3826', rich: '#73452C', brown: '#8E5A38', clayTone: '#9F663E',
  tan: '#B98157', olive: '#C9996C', light: '#E4BC9C', fair: '#F0D2BA',
};
const HUE = { coral: '#E8645F', butter: '#F3CF72', mint: '#A8DCCD', lilac: '#B8A6DA' };
const GOLD = '#D6A23F';

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16; let g = (n >> 8) & 255; let b = n & 255;
  const t = amt < 0 ? 0 : 255; const p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16); const pb = parseInt(b.slice(1), 16);
  const ch = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = ch(pa); const [r2, g2, b2] = ch(pb);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return '#' + ((1 << 24) + (m(r1, r2) << 16) + (m(g1, g2) << 8) + m(b1, b2)).toString(16).slice(1);
}
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h) || 1; }
function rng(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646; }

let seq = 0;
function useUid() { const r = useRef(null); if (r.current === null) r.current = 'art' + (++seq); return r.current; }

// Small textured "coil" marks used inside afro, puff and curl shapes.
function Texture({ cx, cy, rx, ry, n, color, rand }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2; const d = Math.sqrt(rand());
    const x = cx + Math.cos(a) * rx * d; const y = cy + Math.sin(a) * ry * d;
    out.push(<path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)} a4 4 0 1 1 6 3`} stroke={color} strokeWidth="1.4" fill="none" opacity=".5" strokeLinecap="round" />);
  }
  return <g>{out}</g>;
}

function bumps(cx, cy, rx, ry, count, r0, from, to, rand, fill) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = from + (to - from) * (i / (count - 1));
    const x = cx + Math.cos(a) * rx; const y = cy + Math.sin(a) * ry;
    out.push(<circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(r0 + rand() * 6).toFixed(1)} fill={fill} />);
  }
  return out;
}

const CAP = 'M150 170 C148 122 172 104 200 104 C228 104 252 122 250 170 C242 144 225 132 200 132 C175 132 158 144 150 170 Z';

function hairBack(s, h, rand) {
  const tex = shade(h, 0.22);
  switch (s.hair) {
    case 'coils': return (
      <g>
        <ellipse cx="200" cy="156" rx="104" ry="88" fill={h} />
        {bumps(200, 156, 104, 88, 26, 18, Math.PI * 0.86, Math.PI * 2.14, rand, h)}
        <Texture cx={200} cy={150} rx={96} ry={78} n={46} color={tex} rand={rand} />
      </g>
    );
    case 'puff': return (
      <g>
        <circle cx="200" cy="84" r="50" fill={h} />
        {bumps(200, 84, 48, 46, 16, 13, 0, Math.PI * 2, rand, h)}
        <Texture cx={200} cy={82} rx={46} ry={42} n={22} color={tex} rand={rand} />
        <ellipse cx="200" cy="150" rx="56" ry="50" fill={h} />
      </g>
    );
    case 'locs': case 'braids': {
      const braid = s.hair === 'braids'; const n = braid ? 18 : 14; const w = braid ? 10 : 13;
      const strands = [];
      for (let i = 0; i < n; i++) {
        const x = 130 + i * (140 / (n - 1)); const bottom = 304 + ((i * 37) % 5) * 9;
        strands.push(<rect key={i} x={x - w / 2} y="120" width={w} height={bottom - 120} rx={w / 2} fill={h} stroke={tex} strokeWidth="1" strokeOpacity=".5" />);
        if (braid) for (let y = 236; y < bottom - 6; y += 10) strands.push(<path key={i + '-' + y} d={`M${x - 3.5} ${y} L${x + 3.5} ${y + 5}`} stroke={tex} strokeWidth="1.2" opacity=".6" />);
      }
      return <g><ellipse cx="200" cy="152" rx="74" ry="66" fill={h} />{strands}</g>;
    }
    case 'waves': return (
      <g>
        <path d="M130 186 C116 120 156 88 200 88 C246 88 288 122 272 190 C266 236 292 282 284 332 L234 332 C244 288 238 252 234 222 L166 222 C162 252 156 288 166 332 L116 332 C108 284 134 236 130 186 Z" fill={h} />
        <path d="M140 214 C130 240 150 262 138 292" stroke={tex} strokeWidth="2" fill="none" opacity=".55" />
        <path d="M262 214 C272 240 252 262 264 292" stroke={tex} strokeWidth="2" fill="none" opacity=".55" />
      </g>
    );
    case 'bob': return <path d="M134 206 C124 128 160 98 200 98 C240 98 276 128 266 206 C264 228 254 240 242 240 L158 240 C146 240 136 228 134 206 Z" fill={h} />;
    case 'curls': {
      const cs = [];
      for (let i = 0; i < 16; i++) {
        const a = Math.PI * 0.82 + (Math.PI * 1.36) * (i / 15);
        cs.push([200 + Math.cos(a) * 82, 160 + Math.sin(a) * 74]);
      }
      [[136, 232], [150, 256], [134, 278], [264, 232], [250, 256], [266, 278], [142, 206], [258, 206]].forEach((p) => cs.push(p));
      return (
        <g>
          <ellipse cx="200" cy="160" rx="80" ry="72" fill={h} />
          {cs.map((p, i) => <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={(18 + rand() * 5).toFixed(1)} fill={h} />)}
          <Texture cx={200} cy={176} rx={84} ry={96} n={40} color={tex} rand={rand} />
        </g>
      );
    }
    case 'bun': return (
      <g>
        <circle cx="200" cy="94" r="30" fill={h} />
        <path d="M184 92 C186 78 210 76 214 92 C216 104 196 108 194 96" stroke={tex} strokeWidth="1.6" fill="none" opacity=".6" />
      </g>
    );
    default: return null;
  }
}

function hairFront(s, h, rand) {
  const tex = shade(h, 0.22);
  switch (s.hair) {
    case 'coils': return <path d={CAP} fill={h} />;
    case 'puff': return (
      <g>
        <path d="M151 170 C149 122 172 110 200 110 C228 110 251 122 249 170 C241 146 224 132 200 132 C176 132 159 146 151 170 Z" fill={h} />
        <ellipse cx="200" cy="117" rx="21" ry="4.5" fill={GOLD} />
      </g>
    );
    case 'locs': case 'braids': {
      const braid = s.hair === 'braids'; const w = braid ? 10 : 13;
      const xs = braid ? [146, 136, 254, 264] : [145, 133, 255, 267];
      return (
        <g>
          <path d={CAP} fill={h} />
          {braid && <path d="M200 106 L200 132 M176 110 L184 134 M224 110 L216 134" stroke={tex} strokeWidth="1.4" opacity=".6" />}
          {xs.map((x, i) => (
            <g key={i}>
              <rect x={x - w / 2} y="150" width={w} height={186 + (i % 2) * 10} rx={w / 2} fill={h} stroke={tex} strokeWidth="1" strokeOpacity=".5" />
              {(i === 1 || i === 2) && <rect x={x - w / 2 - 1} y={250 + i * 6} width={w + 2} height="7" rx="2" fill={GOLD} />}
            </g>
          ))}
        </g>
      );
    }
    case 'waves': return <path d="M147 178 C138 122 176 98 212 102 C246 106 262 136 254 176 C244 146 220 134 196 140 C176 146 160 160 147 178 Z" fill={h} />;
    case 'bob': return (
      <g>
        <path d="M151 160 C150 120 174 104 200 104 C226 104 250 120 249 160 L232 157 L216 161 L200 157 L184 161 L168 157 Z" fill={h} />
        <path d="M170 116 C186 108 214 108 230 116" stroke="#fff" strokeWidth="2" fill="none" opacity=".16" />
      </g>
    );
    case 'wrap': {
      const fold = shade(h, -0.22);
      return (
        <g>
          <path d="M142 176 C126 116 156 62 206 60 C258 58 286 108 262 174 C252 148 230 134 200 134 C172 134 152 150 142 176 Z" fill={h} />
          <path d="M160 120 C180 100 220 92 248 110" stroke={fold} strokeWidth="2.5" fill="none" opacity=".7" />
          <path d="M150 148 C176 124 226 118 258 140" stroke={fold} strokeWidth="2.5" fill="none" opacity=".7" />
          <ellipse cx="214" cy="68" rx="30" ry="17" transform="rotate(-20 214 68)" fill={shade(h, -0.08)} />
          <ellipse cx="186" cy="72" rx="24" ry="14" transform="rotate(24 186 72)" fill={shade(h, -0.14)} />
          {[[172, 104], [230, 96], [196, 122], [252, 132], [160, 140]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={HUE.butter} opacity=".9" />)}
        </g>
      );
    }
    case 'curls': {
      const cs = [];
      for (let i = 0; i < 9; i++) { const a = Math.PI * 1.08 + Math.PI * 0.84 * (i / 8); cs.push([200 + Math.cos(a) * 50, 166 + Math.sin(a) * 54]); }
      return <g><path d={CAP} fill={h} />{cs.map((p, i) => <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="12" fill={h} />)}</g>;
    }
    case 'short': {
      const dots = [];
      for (let i = 0; i < 40; i++) { const x = 156 + rand() * 88; const y = 110 + rand() * 30; dots.push(<circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.4" fill={tex} opacity=".6" />); }
      return <g><path d="M149 170 C147 120 172 101 200 101 C228 101 253 120 251 170 C244 142 226 128 200 128 C174 128 156 142 149 170 Z" fill={h} />{dots}</g>;
    }
    case 'bun': return (
      <g>
        <path d="M150 172 C148 122 172 104 200 104 C228 104 252 122 250 172 C244 140 226 126 200 126 C174 126 156 140 150 172 Z" fill={h} />
        <path d="M200 106 L200 126" stroke={tex} strokeWidth="1.6" opacity=".6" />
      </g>
    );
    default: return null;
  }
}

function Figure({ s, rand }) {
  const skin = SKIN[s.skin] || SKIN.brown;
  const sk2 = shade(skin, -0.14);
  const line = shade(skin, -0.55);
  const lip = mix(shade(skin, -0.28), '#8E3B4A', 0.28);
  const h = s.hairColor || '#1A1311';
  const garment = s.garment || '#45203F';
  return (
    <g>
      {hairBack(s, h, rand)}
      <path d="M176 210 L224 210 L229 300 L171 300 Z" fill={sk2} />
      <path d="M58 400 C66 326 128 292 200 290 C272 292 334 326 342 400 Z" fill={skin} />
      <path d="M58 400 C64 340 98 312 146 300 C164 326 182 336 200 336 C218 336 236 326 254 300 C302 312 336 340 342 400 Z" fill={garment} />
      <ellipse cx="153" cy="186" rx="8" ry="13" fill={sk2} />
      <ellipse cx="247" cy="186" rx="8" ry="13" fill={sk2} />
      <ellipse cx="200" cy="178" rx="47" ry="59" fill={skin} />
      <path d="M171 160 Q181 154 191 158" stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M209 158 Q219 154 229 160" stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M173 176 Q181 182 189 176" stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M211 176 Q219 182 227 176" stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M201 181 Q197 196 203 200" stroke={shade(skin, -0.3)} strokeWidth="2" fill="none" strokeLinecap="round" />
      {s.beard && <path d="M156 194 C160 238 180 246 200 246 C220 246 240 238 244 194 C236 220 222 228 200 228 C178 228 164 220 156 194 Z M186 208 Q200 202 214 208 Q200 212 186 208 Z" fill={h} opacity=".94" />}
      <path d="M186 214 Q193 209 200 212 Q207 209 214 214 Q207 223 200 223 Q193 223 186 214 Z" fill={lip} />
      {hairFront(s, h, rand)}
      {s.acc === 'gold' && <g><circle cx="153" cy="203" r="4.5" fill={GOLD} /><circle cx="247" cy="203" r="4.5" fill={GOLD} /></g>}
      {s.acc === 'hoop' && <g><circle cx="152" cy="211" r="10" stroke={GOLD} strokeWidth="3" fill="none" /><circle cx="248" cy="211" r="10" stroke={GOLD} strokeWidth="3" fill="none" /></g>}
    </g>
  );
}

function Still({ objects, pal }) {
  const has = (o) => objects.includes(o);
  return (
    <g>
      <rect x="0" y="318" width="400" height="82" fill={shade(pal[0], -0.1)} opacity=".5" />
      {has('leaf') && (
        <g transform="translate(292 236) rotate(-38)">
          <path d="M0 0 C22 -32 64 -32 88 0 C64 32 22 32 0 0 Z" fill="#6E8F6A" />
          <path d="M4 0 L84 0" stroke="#4F6B4C" strokeWidth="1.6" />
        </g>
      )}
      {has('jar') && (
        <g>
          <ellipse cx="160" cy="322" rx="64" ry="8" fill="#000" opacity=".12" />
          <rect x="110" y="236" width="100" height="86" rx="16" fill="#FBF6EE" />
          <rect x="104" y="216" width="112" height="26" rx="8" fill="#45203F" />
          <rect x="128" y="262" width="64" height="38" rx="4" fill="#F1CF7C" />
          <rect x="138" y="274" width="44" height="3" fill="#45203F" opacity=".5" />
          <rect x="138" y="283" width="28" height="3" fill="#45203F" opacity=".5" />
        </g>
      )}
      {has('bottle') && (
        <g>
          <ellipse cx="273" cy="322" rx="38" ry="6" fill="#000" opacity=".12" />
          <rect x="244" y="226" width="58" height="96" rx="14" fill="#B4683C" opacity=".94" />
          <rect x="262" y="206" width="22" height="24" fill="#2B2124" />
          <ellipse cx="273" cy="196" rx="13" ry="16" fill="#2B2124" />
          <rect x="252" y="238" width="6" height="68" rx="3" fill="#fff" opacity=".25" />
        </g>
      )}
      {has('nuts') && (
        <g>
          {[[78, 316, 13], [102, 324, 11], [60, 328, 10], [326, 326, 12], [348, 318, 10]].map((n, i) => (
            <g key={i}><circle cx={n[0]} cy={n[1]} r={n[2]} fill="#7A5236" /><circle cx={n[0] - 3} cy={n[1] - 4} r={n[2] / 3} fill="#fff" opacity=".18" /></g>
          ))}
        </g>
      )}
      {has('comb') && (
        <g transform="translate(250 296) rotate(-14)">
          <rect x="0" y="0" width="120" height="18" rx="6" fill="#45203F" />
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={8 + i * 12.5} y="14" width="5" height="34" rx="2.5" fill="#45203F" />)}
        </g>
      )}
    </g>
  );
}

function Place({ s, pal, night }) {
  return (
    <g>
      <circle cx="306" cy="108" r="36" fill={night ? '#F7F1E8' : HUE.butter} opacity={night ? 0.85 : 0.9} />
      <path d="M0 278 C80 260 140 296 220 280 C300 264 350 286 400 276 L400 400 L0 400 Z" fill={shade(pal[0], -0.16)} opacity=".55" />
      <path d="M0 318 C70 304 150 330 230 316 C310 302 360 322 400 314 L400 400 L0 400 Z" fill={shade(pal[0], -0.3)} opacity=".6" />
      {s.steam && [70, 104, 334].map((x, i) => (
        <path key={i} d={`M${x} 300 C${x - 14} 270 ${x + 14} 250 ${x} 220 C${x - 14} 194 ${x + 12} 176 ${x} 150`} stroke="#fff" strokeWidth="3" fill="none" opacity=".45" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Abstract() {
  const barbs = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13; const x = 80 + t * 250; const y = 330 - t * 240;
    barbs.push(<path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)} l${(-24 + t * 8).toFixed(1)} ${(-26 + t * 6).toFixed(1)}`} stroke="#fff" strokeWidth="1.4" opacity=".45" strokeLinecap="round" />);
  }
  return (
    <g>
      <circle cx="200" cy="200" r="132" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".35" />
      <path d="M70 340 C150 260 236 190 344 80" stroke="#fff" strokeWidth="2.2" fill="none" opacity=".6" strokeLinecap="round" />
      {barbs}
    </g>
  );
}

const CROPS = { full: '0 0 400 400', face: '108 70 184 184', bust: '60 50 280 280' };

export function Art({ spec, ratio = '4 / 3', label, className = '', alt, crop = 'full', pos }) {
  const id = useUid();
  let s = spec || { kind: 'abstract', bg: 'lilac', blooms: ['coral', 'butter'] };
  const style = { aspectRatio: ratio };
  if (s.kind === 'upload') {
    const m = localMedia.get(s.localKey);
    if (m) s = { src: m.url };
    else { s = { kind: 'abstract', bg: 'sand', blooms: ['lilac'] }; label = label || 'Uploaded image not kept after reload'; }
  }
  if (s.src) {
    return (
      <div className={'art ' + className} style={style}>
        <img src={s.src} alt={alt || ''} />
        {label && <span className="art-label">{label}</span>}
      </div>
    );
  }
  if (s.kind === 'logo') {
    return <div className={'art art-logo ' + className} style={style}><img src={LOGO_URL} alt={alt || 'Plume logo'} /></div>;
  }
  const pal = PALETTES[s.bg] || PALETTES.lilac;
  const night = s.bg === 'night' || s.bg === 'plum' || s.bg === 'dusk';
  const seed = hashStr(JSON.stringify(s));
  const rand = rng(seed);
  const blooms = (s.blooms || []).map((hname, i) => ({ c: HUE[hname] || HUE.lilac, cx: 40 + rand() * 320, cy: 30 + rand() * 260, r: 120 + rand() * 80, i }));
  const randFig = rng(seed + 7);
  const dx = pos === 'right' ? 80 : pos === 'left' ? -80 : 0;

  let scene = null;
  if (s.kind === 'portrait') scene = <g transform={`translate(${dx} 0)`}><Figure s={s} rand={randFig} /></g>;
  else if (s.kind === 'place') scene = <g><Place s={s} pal={pal} night={night} />{s.skin && <g transform={`translate(${dx - 20} 14)`}><Figure s={s} rand={randFig} /></g>}</g>;
  else if (s.kind === 'still') scene = <Still objects={s.objects || ['jar']} pal={pal} />;
  else if (s.kind === 'abstract') scene = <Abstract />;
  else if (s.kind === 'mark') {
    const ch = s.text || '';
    scene = <text x="200" y="236" textAnchor="middle" fontFamily="'Cormorant Garamond', Garamond, serif" fontSize={ch.length > 1 ? 120 : 170} fontWeight="500" fill={s.fg || '#45203F'}>{ch}</text>;
  }

  return (
    <div className={'art ' + className} style={style} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : 'true'}>
      <svg viewBox={CROPS[crop] || CROPS.full} preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={id + 'bg'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={pal[1]} />
            <stop offset="1" stopColor={pal[0]} />
          </linearGradient>
          {blooms.map((b) => (
            <radialGradient key={b.i} id={id + 'b' + b.i}>
              <stop offset="0" stopColor={b.c} stopOpacity={night ? 0.55 : 0.75} />
              <stop offset="1" stopColor={b.c} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <rect x="0" y="0" width="400" height="400" fill={`url(#${id}bg)`} />
        {blooms.map((b) => <circle key={b.i} cx={b.cx.toFixed(1)} cy={b.cy.toFixed(1)} r={b.r.toFixed(1)} fill={`url(#${id}b${b.i})`} />)}
        {scene}
      </svg>
      {label && <span className="art-label">{label}</span>}
    </div>
  );
}
