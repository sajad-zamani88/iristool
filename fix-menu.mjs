/* ==========================================================================
   fix-menu.mjs — normalizes the site header/nav menu to ONE canonical,
   byte-identical version on every *.html page, and adds the matching
   nav-close CSS / JS to the pages that were missing it.
   ========================================================================== */
import { readdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const HEADER = `<!-- ================= HEADER ================= -->
<header id="site-header">
  <div class="wrap bar">
    <a class="logo" href="index.html" aria-label="IrisTool — home">
      <span class="logo-mark" aria-hidden="true">✱</span>
      <span class="logo-word">IrisTool</span>
      <span class="logo-tag">278 tools</span>
    </a>

    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav">
      <span></span><span></span>
    </button>

    <nav class="nav" id="primary-nav" aria-label="Primary">
      <button class="nav-close" id="nav-close" type="button" aria-label="Close menu">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M1.5 1.5l12 12M13.5 1.5l-12 12" stroke="currentColor" stroke-width="2"/>
        </svg>
        Close
      </button>

      <ul class="nav-list">
        <li><a class="m-link" href="index.html">Home</a></li>

        <!-- ============ TEXT TOOLS ============ -->
        <li class="m-item">
          <button class="m-trigger" type="button" aria-expanded="false" aria-haspopup="true">Text Tools
            <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <div class="mega">
            <div class="mega-scroll">
              <div class="mega-head">
                <div><span class="mega-kicker">Text Tools</span><p class="mega-sub">55 tools to analyze, clean, sort, extract, compare, convert and encode text.</p></div>
                <a class="mega-all" href="text-tools.html">View all 55 →</a>
              </div>
              <div class="mega-grid">
                <div class="mgroup"><a class="mgroup-t" href="text-analysis-tools.html">Text Analysis</a></div>
                <div class="mgroup"><a class="mgroup-t" href="case-converter.html">Case Converter</a></div>
                <div class="mgroup"><a class="mgroup-t" href="text-cleanup-tools.html">Text Cleanup</a></div>
                <div class="mgroup"><a class="mgroup-t" href="sorting-tools.html">Sorting &amp; Reordering</a></div>
                <div class="mgroup"><a class="mgroup-t" href="text-extraction-tools.html">Text Extraction</a></div>
                <div class="mgroup"><a class="mgroup-t" href="find-replace-tools.html">Find &amp; Replace</a></div>
                <div class="mgroup"><a class="mgroup-t" href="text-generators.html">Text Generators</a></div>
                <div class="mgroup"><a class="mgroup-t" href="text-comparison-tools.html">Comparison &amp; Diff</a></div>
                <div class="mgroup"><a class="mgroup-t" href="text-conversion-tools.html">Conversion &amp; Encoding</a></div>
              </div>
            </div>
          </div>
        </li>

        <!-- ============ DEVELOPER TOOLS ============ -->
        <li class="m-item">
          <button class="m-trigger" type="button" aria-expanded="false" aria-haspopup="true">Developer Tools
            <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <div class="mega">
            <div class="mega-scroll">
              <div class="mega-head">
                <div><span class="mega-kicker">Developer Tools</span><p class="mega-sub">94 tools for JSON, XML, HTML, CSS, JS, encoding, hashing, colors, timestamps, regex, cron and full SEO suite.</p></div>
                <a class="mega-all" href="developer-tools.html">View all 94 →</a>
              </div>
              <div class="mega-grid">
                <div class="mgroup"><a class="mgroup-t" href="json-tools.html">JSON</a></div>
                <div class="mgroup"><a class="mgroup-t" href="xml-tools.html">XML</a></div>
                <div class="mgroup"><a class="mgroup-t" href="html-tools.html">HTML</a></div>
                <div class="mgroup"><a class="mgroup-t" href="css-tools.html">CSS</a></div>
                <div class="mgroup"><a class="mgroup-t" href="javascript-tools.html">JavaScript</a></div>
                <div class="mgroup"><a class="mgroup-t" href="url-tools.html">URL</a></div>
                <div class="mgroup"><a class="mgroup-t" href="base64-tools.html">Base64</a></div>
                <div class="mgroup"><a class="mgroup-t" href="jwt-decoder.html">JWT</a></div>
                <div class="mgroup"><a class="mgroup-t" href="hash-tools.html">Hash</a></div>
                <div class="mgroup"><a class="mgroup-t" href="character-encoding-tools.html">Character Encoding</a></div>
                <div class="mgroup"><a class="mgroup-t" href="color-tools.html">Color</a></div>
                <div class="mgroup"><a class="mgroup-t" href="timestamp-tools.html">Timestamp</a></div>
                <div class="mgroup"><a class="mgroup-t" href="uuid-tools.html">UUID</a></div>
                <div class="mgroup"><a class="mgroup-t" href="regex-tools.html">Regex</a></div>
                <div class="mgroup"><a class="mgroup-t" href="cron-tools.html">Cron</a></div>
                <div class="mgroup"><a class="mgroup-t" href="escape-unescape-tools.html">Escape &amp; Unescape</a></div>
                <div class="mgroup"><a class="mgroup-t" href="data-conversion-tools.html">Data Conversion</a></div>
                <div class="mgroup"><a class="mgroup-t" href="csv-tsv-tools.html">CSV &amp; TSV</a></div>
                <div class="mgroup"><a class="mgroup-t" href="seo-tools.html">SEO</a></div>
              </div>
            </div>
          </div>
        </li>

        <!-- ============ CALCULATORS ============ -->
        <li class="m-item">
          <button class="m-trigger" type="button" aria-expanded="false" aria-haspopup="true">Calculators
            <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <div class="mega">
            <div class="mega-scroll">
              <div class="mega-head">
                <div><span class="mega-kicker">Calculators</span><p class="mega-sub">60 calculators for health, money, dates, grades, math, units and everyday numbers.</p></div>
                <a class="mega-all" href="calculators.html">View all 60 →</a>
              </div>
              <div class="mega-grid">
                <div class="mgroup"><a class="mgroup-t" href="health-calculators.html">Health</a></div>
                <div class="mgroup"><a class="mgroup-t" href="finance-calculators.html">Finance</a></div>
                <div class="mgroup"><a class="mgroup-t" href="date-time-calculators.html">Date &amp; Time</a></div>
                <div class="mgroup"><a class="mgroup-t" href="education-statistics-calculators.html">Education &amp; Statistics</a></div>
                <div class="mgroup"><a class="mgroup-t" href="math-calculators.html">Math</a></div>
                <div class="mgroup"><a class="mgroup-t" href="unit-converters.html">Unit Converters</a></div>
                <div class="mgroup"><a class="mgroup-t" href="number-converters.html">Number Converters</a></div>
                <div class="mgroup"><a class="mgroup-t" href="fitness-tools.html">Fitness</a></div>
              </div>
            </div>
          </div>
        </li>

        <!-- ============ GENERATORS ============ -->
        <li class="m-item">
          <button class="m-trigger" type="button" aria-expanded="false" aria-haspopup="true">Generators
            <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <div class="mega">
            <div class="mega-scroll">
              <div class="mega-head">
                <div><span class="mega-kicker">Generators</span><p class="mega-sub">39 generators for names, random picks, IDs, QR codes, CSS effects, palettes and test data.</p></div>
                <a class="mega-all" href="generators.html">View all 39 →</a>
              </div>
              <div class="mega-grid">
                <div class="mgroup"><a class="mgroup-t" href="identity-name-generators.html">Identity &amp; Name</a></div>
                <div class="mgroup"><a class="mgroup-t" href="random-generators.html">Random</a></div>
                <div class="mgroup"><a class="mgroup-t" href="developer-generators.html">Developer</a></div>
                <div class="mgroup"><a class="mgroup-t" href="css-generators.html">CSS</a></div>
                <div class="mgroup"><a class="mgroup-t" href="design-generators.html">Design</a></div>
                <div class="mgroup"><a class="mgroup-t" href="password-tools.html">Password</a></div>
                <div class="mgroup"><a class="mgroup-t" href="fake-data-generators.html">Fake Data</a></div>
              </div>
            </div>
          </div>
        </li>

        <!-- ============ IMAGE TOOLS ============ -->
        <li class="m-item">
          <button class="m-trigger" type="button" aria-expanded="false" aria-haspopup="true">Image Tools
            <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <div class="mega">
            <div class="mega-scroll">
              <div class="mega-head">
                <div><span class="mega-kicker">Image Tools</span><p class="mega-sub">30 tools to edit, convert, compress and inspect images — processed entirely on your device.</p></div>
                <a class="mega-all" href="image-tools.html">View all 30 →</a>
              </div>
              <div class="mega-grid">
                <div class="mgroup"><a class="mgroup-t" href="image-editing-tools.html">Image Editing</a></div>
                <div class="mgroup"><a class="mgroup-t" href="image-converter-tools.html">Image Converter</a></div>
                <div class="mgroup"><a class="mgroup-t" href="image-optimization-tools.html">Optimization</a></div>
                <div class="mgroup"><a class="mgroup-t" href="image-inspector-tools.html">Inspector</a></div>
                <div class="mgroup"><a class="mgroup-t" href="image-design-tools.html">Image Design</a></div>
              </div>
            </div>
          </div>
        </li>

        <li><a class="m-link" href="about-us.html">About Us</a></li>
        <li><a class="m-link m-link--cta" href="contact-us.html">Contact Us</a></li>
      </ul>
    </nav>
  </div>
</header>`;

const NAVCLOSE_CSS = `
/* ================= NAV CLOSE (site-wide identical menu) ================= */
.nav-close{display:none}
@media (max-width:1120px){
  .nav-close{
    display:inline-flex;align-items:center;gap:10px;
    position:absolute;top:86px;right:22px;z-index:5;
    font-family:var(--font-m);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
    border:1px solid var(--ink);background:var(--white);color:var(--ink);
    padding:11px 16px;opacity:0;
    transition:opacity .3s .18s,background .2s,color .2s,border-color .2s,transform .15s;
  }
  body.nav-open .nav-close{opacity:1}
  .nav-close:hover{background:#C40000;border-color:#C40000;color:#fff}
  .nav-close:active{transform:translateY(2px)}
  .nav-close svg{transition:transform .35s cubic-bezier(.2,.7,.2,1)}
  .nav-close:hover svg{transform:rotate(90deg)}
}
`;

const NAVCLOSE_JS = `
/* ---- nav-close (site-wide identical menu) ---- */
(function(){
  var nc = document.getElementById("nav-close");
  if (!nc || nc.__irisNavCloseBound) return;
  nc.__irisNavCloseBound = true;
  nc.addEventListener("click", function(){
    document.body.classList.remove("nav-open");
    var b = document.getElementById("burger");
    if (b){ b.setAttribute("aria-expanded","false"); b.setAttribute("aria-label","Open menu"); }
  });
})();
`;

const markerRe = /<!-- ================= HEADER ================= -->[\s\S]*?<\/header>/;

/* ---------- 1. replace headers in all html files ---------- */
const htmlFiles = readdirSync(root).filter(f => f.endsWith(".html")).sort();
const errors = [];

for (const f of htmlFiles) {
  const file = join(root, f);
  const src = readFileSync(file, "utf8");
  const crlf = src.includes("\r\n");
  const n = (src.match(markerRe) || []).length;
  if (!n) { errors.push(`${f}: HEADER marker not found`); continue; }
  if (n > 1) { errors.push(`${f}: ${n} header blocks found`); continue; }
  const header = crlf ? HEADER.replace(/\n/g, "\r\n") : HEADER;
  writeFileSync(file, src.replace(markerRe, header), "utf8");
}

/* ---------- 2. append nav-close CSS to css files missing it ---------- */
let cssPatched = 0;
for (const f of readdirSync(join(root, "css")).filter(f => f.endsWith(".css") && f !== "base.css").sort()) {
  const file = join(root, "css", f);
  const src = readFileSync(file, "utf8");
  if (src.includes(".nav-close")) continue;
  const crlf = src.includes("\r\n");
  appendFileSync(file, (crlf ? NAVCLOSE_CSS.replace(/\n/g, "\r\n") : NAVCLOSE_CSS), "utf8");
  cssPatched++;
}

/* ---------- 3. append nav-close JS to js files missing the binding ---------- */
let jsPatched = 0;
const htmlWithJs = readdirSync(root)
  .filter(f => f.endsWith(".html"))
  .map(f => f.replace(/\.html$/, ".js"))
  .filter(f => { try { readFileSync(join(root, "js", f)); return true; } catch { return false; } });

for (const f of htmlWithJs.sort()) {
  const file = join(root, "js", f);
  const src = readFileSync(file, "utf8");
  if (src.includes("nav-close")) continue;
  const crlf = src.includes("\r\n");
  appendFileSync(file, (crlf ? NAVCLOSE_JS.replace(/\n/g, "\r\n") : NAVCLOSE_JS), "utf8");
  jsPatched++;
}

/* ---------- 4. verify all headers are now identical ---------- */
const headers = new Map();
for (const f of htmlFiles) {
  const src = readFileSync(join(root, f), "utf8");
  const m = src.match(markerRe);
  if (!m) { errors.push(`${f}: header missing after patch`); continue; }
  const key = m[0];
  if (!headers.has(key)) headers.set(key, []);
  headers.get(key).push(f);
}

console.log("HTML pages processed:", htmlFiles.length);
console.log("CSS files patched with nav-close styles:", cssPatched);
console.log("JS files patched with nav-close handler:", jsPatched);
if (headers.size === 1) {
  console.log("OK: all", htmlFiles.length, "pages share ONE identical header menu.");
} else {
  console.log("MISMATCH: found", headers.size, "distinct headers:");
  for (const [key, files] of headers) {
    console.log("  -", files.join(", "));
  }
}
if (errors.length) {
  console.log("ERRORS:");
  errors.forEach(e => console.log("  !", e));
} else {
  console.log("No errors.");
}