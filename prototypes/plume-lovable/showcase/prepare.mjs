// Gathers what the preview build needs:
//   site/    the site's own sidebar, pages, tokens and photos, copied from APP_DIR (not committed:
//            this repository is public and those belong to the site)
//   routes/  the site's routes exactly as they will be after the change: /media and /travel from
//            changes/, the /travel/... pages from files/, /about, /marketplace and /community from
//            the site, plus this preview's root and a "/" that opens Plume Media
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..");
const app = process.env.APP_DIR;
if (!app || !existsSync(join(app, "src/plume/components/AppShell.tsx"))) {
  throw new Error("Set APP_DIR to a checkout of petal-connect-commerce (the site).");
}
const site = join(here, "site");
const routes = join(here, "routes");
rmSync(site, { recursive: true, force: true });
rmSync(routes, { recursive: true, force: true });
mkdirSync(join(site, "assets"), { recursive: true });
cpSync(join(app, "src/plume"), join(site, "plume"), { recursive: true });
cpSync(join(app, "src/assets/plume"), join(site, "assets/plume"), { recursive: true });

mkdirSync(routes, { recursive: true });
cpSync(join(pkg, "changes/src/routes"), routes, { recursive: true });
cpSync(join(pkg, "files/src/routes"), routes, { recursive: true });
for (const f of ["about.tsx", "marketplace.tsx", "community.tsx"]) cpSync(join(app, "src/routes", f), join(routes, f));
cpSync(join(here, "app/__root.tsx"), join(routes, "__root.tsx"));
cpSync(join(here, "app/index.tsx"), join(routes, "index.tsx"));
console.log("showcase: site and routes ready");
