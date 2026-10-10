/* ==========================================================================
   fix-navclose.mjs — one canonical mobile-menu close (X) button styling:
   removes every old/inconsistent .nav-close rule from all page stylesheets
   and appends a single, identical block: a fixed top-right X + "Close" pill
   that is visible only when the mobile drawer is open (max-width:1120px).
   ========================================================================== */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const CANONICAL = `/* ================= NAV CLOSE (mobile drawer, site-wide) ================= */
.nav-close{display:none}
@media (max-width:1120px){
  .nav-close{
    position:fixed;top:calc(14px + env(safe-area-inset-top,0px));right:14px;z-index:120;
    display:inline-flex;align-items:center;gap:10px;
    font-family:var(--font-m);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
    border:1px solid var(--ink);background:var(--white);color:var(--ink);
    padding:11px 16px;
    opacity:0;visibility:hidden;pointer-events:none;
    transition:opacity .25s ease,visibility .25s ease,background .2s,color .2s,border-color .2s,transform .15s;
  }
  body.nav-open .nav-close{opacity:1;visibility:visible;pointer-events:auto}
  .nav-close:hover{background:#C40000;border-color:#C40000;color:#fff}
  .nav-close:active{transform:translateY(2px)}
  .nav-close svg{display:block;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
  .nav-close:hover svg{transform:rotate(90deg)}
}`;

/* strip a previously appended "site-wide identical menu" nav-close block */
const oldAppendRe = /\r?\n\s*\/\* ================= NAV CLOSE \(site-wide identical menu\) ================= \*\/[\s\S]*$/;

const cssFiles = readdirSync(join(root, "css"))
  .filter(f => f.endsWith(".css") && f !== "base.css")
  .sort();

let patched = 0;
const problems = [];

for (const f of cssFiles) {
  const file = join(root, "css", f);
  const src = readFileSync(file, "utf8");
  if (!src.includes(".nav-close") && !oldAppendRe.test(src)) {
    problems.push(`${f}: had no old nav-close rules — appended canonical block only`);
  }

  const crlf = src.includes("\r\n");

  // 1. drop previously appended block (if any)
  let out = src.replace(oldAppendRe, "");

  // 2. drop ALL existing .nav-close rules (single-line + multiline),
  //    keeping unrelated rules (incl. their media queries) intact
  const lines = out.split(/\r?\n/);
  const kept = [];
  let skipping = false;
  for (const line of lines) {
    if (!skipping && line.includes(".nav-close")) {
      const hasOpen = line.includes("{");
      const hasClose = line.includes("}");
      if (hasOpen && hasClose) {
        // single-line rule -> drop
        continue;
      }
      if (hasOpen) {
        skipping = true; // drop the opening line
        continue;
      }
      kept.push(line); // stray selector fragment, keep safe
      continue;
    }
    if (skipping) {
      if (line.includes("}")) skipping = false;
      continue;
    }
    kept.push(line);
  }
  out = kept.join("\n");

  // 3. append the canonical block
  const eol = crlf ? "\r\n" : "\n";
  out = out.trimEnd() + eol + eol + CANONICAL.replace(/\n/g, eol) + eol;

  if (out !== src) {
    writeFileSync(file, out, "utf8");
    patched++;
  }
}

console.log("CSS files normalized with the canonical nav-close block:", patched, "/", cssFiles.length);
if (problems.length) console.log(problems.join("\n"));