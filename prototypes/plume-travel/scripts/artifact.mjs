// Turns the single-file Vite build into a Claude artifact page: the artifact host supplies
// its own <!doctype>/<html>/<head>/<body>, so we keep only the title, links, styles and body.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist-artifact/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1];
const keep = head
  .split("\n")
  .filter((l) => !/<meta charset|<meta name="viewport"/i.test(l))
  .join("\n");
writeFileSync("dist-artifact/plume-travel.html", `${keep}\n${body}\n`);
console.log("dist-artifact/plume-travel.html", Math.round((keep.length + body.length) / 1024), "KB");
