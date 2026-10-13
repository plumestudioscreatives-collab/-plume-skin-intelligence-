// Assembles the package for plumestudioscreatives.com (the Lovable project petal-connect-commerce):
//
//   files/    NEW files, at the paths they get in the project:
//             src/features/launch.ts  when Plume opens (October 30) and where the waitlist is
//             src/features/media/   Plume Media, from prototypes/plume-media/src (styles scoped to .plume-media)
//             src/features/travel/  Plume Travel, from prototypes/plume-travel/src/features/travel
//             src/routes/travel.*   the Travel pages under /travel
//   changes/  EXISTING project files this replaces, in full, plus a .diff for each:
//             src/routes/media.tsx, src/routes/travel.tsx, src/styles.css
//
// Run from prototypes/plume-lovable:  APP_DIR=/path/to/petal-connect-commerce node assemble.mjs
// APP_DIR is only needed to refresh changes/src/styles.css and the diffs.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scopeMediaCss } from "../plume-media/scripts/scope-css.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "files");
const changes = join(here, "changes");
const media = join(here, "../plume-media");
const travel = join(here, "../plume-travel");
const app = process.env.APP_DIR;
rmSync(out, { recursive: true, force: true });

// Plume Media: the prototype's source, minus the standalone entry and page template.
const mediaOut = join(out, "src/features/media");
const skip = new Set(["main.jsx", "index.template.html", "styles.css"]);
cpSync(join(media, "src"), mediaOut, { recursive: true, filter: (p) => !skip.has(p.split("/").pop()) });
// The project already has the official logo; use it rather than shipping a copy.
const art = join(mediaOut, "art.jsx");
writeFileSync(art, readFileSync(art, "utf8").replace("'../assets/plume-logo-320.webp'", "'@/assets/plume-logo.png'"));
writeFileSync(join(mediaOut, "media.css"), scopeMediaCss(readFileSync(join(media, "src/styles.css"), "utf8")));
cpSync(join(here, "templates/media/src"), join(out, "src"), { recursive: true });

// Plume Travel: the module unchanged, plus the site adapter and the /travel/... pages.
cpSync(join(travel, "src/features/travel"), join(out, "src/features/travel"), { recursive: true });
cpSync(join(here, "templates/travel/src"), join(out, "src"), { recursive: true });

// Shared launch setting (new file).
cpSync(join(here, "templates/site/src/features"), join(out, "src/features"), { recursive: true });

// Replaced project files.
mkdirSync(join(changes, "src/routes"), { recursive: true });
cpSync(join(here, "templates/site/src/routes"), join(changes, "src/routes"), { recursive: true });
const STYLE_LINES = [
  '@source not "./features/media";',
  '@import "./features/media/media.css";',
  '@import "./features/travel/travel.css";',
];
if (app) {
  const css = readFileSync(join(app, "src/styles.css"), "utf8");
  const anchor = '@import "./plume/plume-tokens.css";\n';
  if (!css.includes(anchor)) throw new Error("src/styles.css changed: add the three lines by hand");
  writeFileSync(join(changes, "src/styles.css"), css.replace(anchor, anchor + STYLE_LINES.join("\n") + "\n"));
  for (const f of ["src/routes/media.tsx", "src/routes/travel.tsx", "src/styles.css"]) {
    let diff = "";
    try { execFileSync("diff", ["-u", join(app, f), join(changes, f)]); } catch (e) { diff = e.stdout.toString(); }
    diff = diff.replace(/^--- \S+.*$/m, `--- a/${f}`).replace(/^\+\+\+ \S+.*$/m, `+++ b/${f}`);
    writeFileSync(join(changes, f.split("/").pop() + ".diff"), diff);
  }
}

const list = (d, base = d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? list(p, base) : [p.slice(base.length + 1)];
});
const files = list(out).sort();
writeFileSync(join(here, "FILES.txt"), files.join("\n") + "\n");
console.log(`files/: ${files.length} new files (FILES.txt) · changes/: ${list(changes).length} files`);
if (!existsSync(join(changes, "src/styles.css"))) console.log("note: run with APP_DIR to write changes/src/styles.css");
