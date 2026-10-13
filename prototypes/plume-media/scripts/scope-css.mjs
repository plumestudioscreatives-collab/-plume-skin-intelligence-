// Turns src/styles.css (written for a standalone page) into media.css for plumestudioscreatives.com:
// every rule is scoped under .plume-media so nothing leaks into the rest of the site, browser
// defaults that Tailwind's reset removes are put back inside it, and the SITE block adapts it to
// the site's AppShell (Cormorant everywhere, the phone tab bar).
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const ROOT = '.plume-media';

// Rewrites one selector list. Returns null when the rule doesn't apply inside the app.
function scope(selector, root) {
  const out = [];
  selectorParser((list) => {
    list.each((sel) => {
      const text = sel.toString().trim();
      if (text === ':root:not([data-theme="light"])') return; // OS dark mode: the app uses .dark
      if (text === ':root[data-theme="dark"]') {
        out.push(`.dark ${root}`, `${root}[data-theme="dark"]`);
        return;
      }
      if (text === ':root' || text === 'html' || text === 'body') { out.push(root); return; }
      out.push(`${root} ${text}`);
    });
  }).processSync(selector);
  return out.length ? out.join(',\n') : null;
}

const RESTORE = `
/* Tailwind's reset (in the app's base layer) removes some browser defaults Plume Media relies on.
   Put them back inside .plume-media only. :where() keeps these weaker than Plume Media's own rules. */
${ROOT} :where(*, ::before, ::after) { border-style: revert; }
${ROOT} :where(img, svg, video, canvas, audio, iframe, embed, object) { vertical-align: revert; }
${ROOT} :where(h1, h2, h3, h4, h5, h6) { font-size: revert; font-weight: revert; }
${ROOT} :where(ul, ol, menu) { list-style: revert; }
${ROOT} :where(a) { color: revert; text-decoration: revert; }
${ROOT} :where(p, blockquote, pre, hr, dl, dd, figure) { margin: revert; }
${ROOT} :where(hr) { border-style: revert; border-width: revert; color: revert; height: revert; }
${ROOT} :where(input, select, textarea) { padding: revert; border: revert; border-radius: revert; background-color: revert; }
${ROOT} :where(button, input, select, textarea) { letter-spacing: revert; font-feature-settings: revert; }
${ROOT} :where(table) { border-collapse: revert; border-color: revert; text-indent: revert; }
${ROOT} :where(th, td) { padding: revert; }
${ROOT} :where(img, video) { height: revert; }
${ROOT} ::placeholder { color: revert; opacity: revert; }
`;

const SITE = `
/* On plumestudioscreatives.com Plume Media sits inside the site's AppShell (.plume-site), whose
   rule is Cormorant Garamond for everything. Plume Media follows it. Cormorant runs smaller and
   lighter than the sans Media was drawn with, so body text is set 15% larger and at medium
   weight; display headings keep their sizes. */
.plume-site ${ROOT} { --pm-type: 1.15; --pm-w-regular: 500; font-weight: 500; }

/* On phones the site's tab bar is fixed to the bottom of the screen, so Plume Media's section
   tabs move up under its header instead of stacking a second bar at the bottom. */
@media (max-width: 899.98px) {
  .plume-site ${ROOT} .shell > .skip { order: -3; }
  .plume-site ${ROOT} .shell > .site-header { order: -2; }
  .plume-site ${ROOT} .shell > .mobile-tabs { order: -1; position: static; border-top: 0; border-bottom: 1px solid var(--line); }
}
`;

export function scopeMediaCss(css) {
  const root = postcss.parse(css);
  const keyframes = new Set();
  root.walkAtRules('keyframes', (at) => { keyframes.add(at.params); at.params = `pm-${at.params}`; });

  const rules = [];
  root.walkRules((rule) => { rules.push(rule); });
  // Selectors drawn in the display face (often set in a separate rule from their size).
  const displaySelectors = new Set();
  for (const rule of rules) {
    rule.walkDecls('font-family', (d) => {
      if (d.value.includes('--font-display')) rule.selectors.forEach((x) => displaySelectors.add(x.trim()));
    });
  }
  // Classes on the element itself (the last compound selector), e.g. "card-title" in ".card-video .card-title".
  const ownClasses = (sel) => (sel.trim().split(/\s*[ >+~]\s*/).pop().match(/\.[\w-]+/g) || []);
  const displayClasses = new Set([...displaySelectors].flatMap(ownClasses));
  const isDisplay = (sel) => displaySelectors.has(sel.trim()) || ownClasses(sel).some((c) => displayClasses.has(c));
  for (const rule of rules) {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) continue;
    const original = rule.selector;
    const scoped = scope(original, ROOT);
    if (!scoped) { rule.remove(); continue; }
    rule.selector = scoped;
    const fonts = [];
    rule.walkDecls((d) => {
      if (d.prop === 'container' || d.prop === 'container-name') d.value = d.value.replace(/\bapp\b/, 'pm-app');
      if (d.prop === 'animation' || d.prop === 'animation-name') {
        for (const k of keyframes) d.value = d.value.replace(new RegExp(`\\b${k}\\b`), `pm-${k}`);
      }
      if (d.prop === 'font-family') fonts.push(d.value);
    });
    // Type scale for the site (see SITE): body sizes follow --pm-type, display sizes don't.
    const display = fonts.some((f) => f.includes('--font-display'))
      || postcss.list.comma(original).every(isDisplay);
    rule.walkDecls((d) => {
      if (d.prop === 'font-size' && !display) d.value = d.value.replace(/(-?\d*\.?\d+)(rem|px)\b/g, 'calc($1$2 * var(--pm-type, 1))');
      if (d.prop === 'font-weight' && (d.value === '400' || d.value === '300' || d.value === 'normal')) d.value = 'var(--pm-w-regular, ' + (d.value === 'normal' ? '400' : d.value) + ')';
    });
  }
  root.walkAtRules('container', (at) => { at.params = at.params.replace(/^app\b/, 'pm-app'); });
  // Drop at-rules left empty (the OS dark-mode block).
  root.walkAtRules((at) => { if (at.nodes && at.nodes.length === 0) at.remove(); });

  const header = '/* Generated from prototypes/plume-media/src/styles.css by prototypes/plume-lovable/assemble.mjs.\n   Edit the source and re-run the script rather than editing this file. */\n';
  // Tokens first, then the restored browser defaults, then Plume Media's rules, then app fixes.
  const out = root.toString();
  const firstBase = out.indexOf('/* ------------------------------------------------------------ base */');
  const body = firstBase > 0 ? out.slice(0, firstBase) + RESTORE.trim() + '\n\n' + out.slice(firstBase) : RESTORE + out;
  return header + body + '\n' + SITE.trim() + '\n';
}
