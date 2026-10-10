
(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- header state ---- */
  var header = $("#site-header");
  window.addEventListener("scroll", function(){
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, {passive:true});

  /* ---- mobile drawer ---- */
  var burger = $("#burger");
  function closeNav(){
    document.body.classList.remove("nav-open");
    burger.setAttribute("aria-expanded","false");
    burger.setAttribute("aria-label","Open menu");
  }
  burger.addEventListener("click", function(){
    var open = document.body.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $("#primary-nav").addEventListener("click", function(e){
    if (e.target.closest("a")) closeNav();
  });
  $("#nav-close").addEventListener("click", closeNav);

  /* ---- mega menu ---- */
  function closeAllMegas(except){
    $$(".m-item.open").forEach(function(item){
      if (item !== except){
        item.classList.remove("open");
        var t = $(".m-trigger", item);
        if (t) t.setAttribute("aria-expanded","false");
      }
    });
  }
  $$(".m-trigger").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var item = btn.closest(".m-item");
      var isOpen = item.classList.contains("open");
      closeAllMegas(item);
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
  document.addEventListener("click", function(e){
    if (!e.target.closest(".m-item")) closeAllMegas(null);
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){ closeAllMegas(null); closeNav(); }
  });

  /* ---- scroll reveal ---- */
  var revealEls = $$(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)){
    revealEls.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {threshold:0.1, rootMargin:"0px 0px -40px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---- ticker ---- */
  var track = $("#ticker-track");
  track.innerHTML += track.innerHTML;

  /* ---- footer year ---- */
  $("#yr").textContent = new Date().getFullYear();

  /* ================= CSS ENGINE ================= */
  var analyzer   = $("#analyzer");
  var srcIn      = $("#src-in");
  var outTa      = $("#out-ta");
  var badgeIn    = $("#badge-in");
  var badgeOut   = $("#badge-out");
  var vsBadge    = $("#vs-badge");
  var optsHolder = $("#opts-holder");
  var btnSwap    = $("#btn-swap");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var mode = "beautifier";
  var lastOutText = "";
  var state = { indent: 2, sortDecls: false, stripComments: true, aggressive: false };

  var SAMPLE_CSS = '@import url("print.css") print;\n\n/* Night Sky Atlas \u2014 theme sheet v3 */\n:root {\n  --ink: #0B0D14;\n  --paper: #F4F2EA;\n  --accent: #0033FF;\n  --star-glow: 0 0 12px rgba(110, 134, 255, 0.55);\n}\n\nbody {\n  margin: 0px;\n  background: var(--ink);\n  color: var(--paper);\n  font: 400 16px/1.6 "IBM Plex Sans", sans-serif;\n}\n\n.atlas header,\n.atlas main {\n  max-width: 960px;\n  margin: 0 auto;\n  padding: 0px 24px;\n}\n\n.constellation {\n  border: 1px solid rgba(244, 242, 234, 0.14);\n  border-radius: 4px;\n  padding: 2rem 1.5rem;\n  transition: box-shadow 0.3s ease, transform 0.3s ease;\n}\n\n.constellation:hover {\n  box-shadow: var(--star-glow);\n  transform: translateY(-2px);\n}\n\n.star::after { content: "\\2605"; color: var(--accent); margin-left: 0.5em; }\n\n@media (min-width: 700px) {\n  .atlas main { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }\n  .constellation { padding: 2.5rem 2rem; }\n}\n\n@keyframes twinkle {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.35; }\n}\n\n@font-face {\n  font-family: "Plex Mono";\n  src: url("/fonts/plex.woff2") format("woff2");\n  font-display: swap;\n}';

  var PLACEHOLDERS = {
    beautifier: "Paste CSS here \u2014 rules snap into shape as you type\u2026",
    minifier:   "Paste CSS here \u2014 watch the bytes fall away\u2026"
  };

  function fmtNum(n){ return n.toLocaleString("en-US"); }

  function setStat(el, val){
    val = String(val);
    if (el.textContent !== val){
      el.textContent = val;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); }, 200);
    }
  }

  /* ---- per-mode stat labels ---- */
  function modeCfg(){
    if (mode === "minifier"){
      return {
        glyph:"\u226A",
        labels:["Bytes in","Bytes out","Bytes saved","Reduction"],
        subs:["SOURCE","SINGLE LINE","COMMENTS + WHITESPACE","SMALLER BY"]
      };
    }
    return {
      glyph:"\u2727",
      labels:["Characters in","Characters out","Indent","Declarations"],
      subs:["RAW CSS","PRETTY-PRINTED","SET IN THE DECK","PROP: VALUE PAIRS"]
    };
  }

  function setModeLabels(){
    var cfg = modeCfg();
    for (var i = 0; i < 4; i++){
      sl[i].textContent = cfg.labels[i];
      ss[i].textContent = cfg.subs[i];
    }
  }

  /* ---- deck options ---- */
  function indentLabel(){
    return state.indent === "tab" ? "INDENT \u00B7 TAB" : "INDENT \u00B7 " + state.indent + " SP";
  }
  function cycleIndent(){
    state.indent = state.indent === 2 ? 4 : (state.indent === 4 ? "tab" : 2);
  }
  function renderOpts(){
    optsHolder.textContent = "";

    function mkCycle(){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tgl cyc";
      b.setAttribute("aria-pressed","true");
      b.textContent = indentLabel();
      b.addEventListener("click", function(){
        cycleIndent();
        b.textContent = indentLabel();
        run();
      });
      optsHolder.appendChild(b);
    }
    function mkToggle(key, label){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tgl";
      b.setAttribute("aria-pressed", String(state[key]));
      b.textContent = label;
      b.addEventListener("click", function(){
        state[key] = !state[key];
        b.setAttribute("aria-pressed", String(state[key]));
        run();
      });
      optsHolder.appendChild(b);
    }

    if (mode === "beautifier"){
      mkCycle();
      mkToggle("sortDecls","\u21C5 sort decls A\u2192Z");
    } else {
      mkToggle("stripComments","\u2327 strip comments");
      mkToggle("aggressive","\u26A1 aggressive");
    }
  }

  /* ---- tokenizer / parser ---- */
  var DECL_AT = {
    "@font-face":1, "@page":1, "@counter-style":1, "@property":1,
    "@viewport":1, "@font-palette-values":1
  };

  function parseCSS(src){
    var i = 0, n = src.length;

    function isWS(c){ return c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f"; }
    function skipWS(){ while (i < n && isWS(src[i])) i++; }

    function readComment(){
      var j = src.indexOf("*/", i + 2);
      if (j === -1){ var t = src.slice(i + 2); i = n; return t; }
      var t2 = src.slice(i + 2, j);
      i = j + 2;
      return t2;
    }

    function readString(q){
      var j = i + 1, out = q;
      while (j < n){
        var c = src[j];
        if (c === "\\"){ out += c + (src[j + 1] || ""); j += 2; continue; }
        out += c; j++;
        if (c === q) break;
      }
      i = j;
      return out;
    }

    function readUntil(stop){
      var out = "", depth = 0;
      while (i < n){
        var c = src[i];
        if (c === "/" && src[i + 1] === "*"){ out += "/*" + readComment() + "*/"; continue; }
        if (c === '"' || c === "'"){ out += readString(c); continue; }
        if (c === "("){ depth++; out += c; i++; continue; }
        if (c === ")"){ depth--; out += c; i++; continue; }
        if (depth === 0 && stop.indexOf(c) !== -1) break;
        out += c; i++;
      }
      return out;
    }

    function parseDecls(){
      var decls = [];
      while (i < n){
        skipWS();
        if (i >= n) break;
        if (src[i] === "}"){ i++; return decls; }
        if (src[i] === "/" && src[i + 1] === "*"){ decls.push({ type:"comment", text: readComment() }); continue; }
        var text = readUntil(";}").trim();
        if (i < n && src[i] === ";") i++;
        if (!text) continue;
        var ci = text.indexOf(":");
        if (ci === -1){ decls.push({ type:"stmt", text: text }); continue; }
        decls.push({ type:"decl", prop: text.slice(0, ci).trim(), value: text.slice(ci + 1).trim() });
      }
      return decls;
    }

    function parseSheet(){
      var items = [];
      while (i < n){
        skipWS();
        if (i >= n) break;
        if (src[i] === "}"){ i++; continue; }
        if (src[i] === "/" && src[i + 1] === "*"){ items.push({ type:"comment", text: readComment() }); continue; }
        var prelude = readUntil("{;}").trim();
        if (i >= n){ if (prelude) items.push({ type:"stmt", text: prelude }); break; }
        var c = src[i];
        if (c === ";"){ i++; if (prelude) items.push({ type:"stmt", text: prelude }); continue; }
        if (c === "{"){
          i++;
          var head = prelude.split(/\s+/)[0].toLowerCase();
          if (prelude[0] === "@" && DECL_AT[head]){
            items.push({ type:"atdecl", prelude: prelude, decls: parseDecls() });
          } else if (prelude[0] === "@"){
            items.push({ type:"at", prelude: prelude, children: parseSheet() });
          } else {
            items.push({ type:"rule", selector: prelude, decls: parseDecls() });
          }
          continue;
        }
        i++;
      }
      return items;
    }

    return parseSheet();
  }

  /* ---- helpers ---- */
  function collapse(s){ return s.replace(/\s+/g, " ").trim(); }

  function splitSelectors(sel){
    var parts = [], depth = 0, cur = "";
    for (var k = 0; k < sel.length; k++){
      var ch = sel[k];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0){ parts.push(cur); cur = ""; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts.map(function(s){ return s.replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }

  function countCSS(items){
    var c = { rules:0, decls:0, comments:0, ats:0 };
    (function walk(list){
      list.forEach(function(it){
        if (it.type === "comment"){ c.comments++; return; }
        if (it.type === "rule"){
          c.rules++;
          it.decls.forEach(function(d){
            if (d.type === "decl") c.decls++;
            else if (d.type === "comment") c.comments++;
          });
          return;
        }
        if (it.type === "atdecl"){
          c.ats++;
          it.decls.forEach(function(d){ if (d.type === "decl") c.decls++; });
          return;
        }
        if (it.type === "at"){ c.ats++; walk(it.children); }
      });
    })(items);
    return c;
  }

  /* ---- beautifier ---- */
  function cssBeautify(items, opts, depth){
    var ind = opts.indent === "tab" ? "\t" : new Array(opts.indent + 1).join(" ");
    var lines = [];
    var pad = new Array(depth + 1).join(ind);

    function fmtDecls(decls, padIn){
      var out = [];
      if (opts.sortDecls){
        var sorted = decls.filter(function(d){ return d.type === "decl"; })
          .slice().sort(function(a, b){ return a.prop < b.prop ? -1 : (a.prop > b.prop ? 1 : 0); });
        var si = 0;
        decls.forEach(function(d){
          if (d.type === "decl"){ out.push(padIn + sorted[si].prop + ": " + sorted[si].value + ";"); si++; }
          else if (d.type === "comment") out.push(padIn + "/*" + d.text.trim() + "*/");
          else out.push(padIn + d.text + ";");
        });
      } else {
        decls.forEach(function(d){
          if (d.type === "decl") out.push(padIn + d.prop + ": " + d.value + ";");
          else if (d.type === "comment") out.push(padIn + "/*" + d.text.trim() + "*/");
          else out.push(padIn + d.text + ";");
        });
      }
      return out;
    }

    items.forEach(function(it, idx){
      if (depth === 0 && idx > 0 && (it.type === "rule" || it.type === "at" || it.type === "atdecl")) lines.push("");
      if (it.type === "comment"){ lines.push(pad + "/*" + it.text.trim() + "*/"); return; }
      if (it.type === "stmt"){ lines.push(pad + collapse(it.text) + ";"); return; }
      if (it.type === "rule"){
        var sels = splitSelectors(it.selector);
        if (sels.length > 1){
          sels.forEach(function(s, j){ lines.push(pad + s + (j < sels.length - 1 ? "," : " {")); });
        } else {
          lines.push(pad + (sels[0] || collapse(it.selector)) + " {");
        }
        Array.prototype.push.apply(lines, fmtDecls(it.decls, pad + ind));
        lines.push(pad + "}");
        return;
      }
      if (it.type === "atdecl"){
        lines.push(pad + collapse(it.prelude) + " {");
        Array.prototype.push.apply(lines, fmtDecls(it.decls, pad + ind));
        lines.push(pad + "}");
        return;
      }
      if (it.type === "at"){
        lines.push(pad + collapse(it.prelude) + " {");
        Array.prototype.push.apply(lines, cssBeautify(it.children, opts, depth + 1));
        lines.push(pad + "}");
      }
    });
    return lines;
  }

  /* ---- minifier ---- */
  function minStmt(s){
    return s.replace(/\s+/g, " ").trim()
      .replace(/\(\s*/g, "(").replace(/\s*\)/g, ")")
      .replace(/\s*([:,])\s*/g, "$1");
  }

  function minValue(v, opts){
    var s = v.replace(/\s+/g, " ").trim();
    if (opts.aggressive && !/["']/.test(s)){
      s = s.replace(/\(\s*/g, "(").replace(/\s*\)/g, ")");
      s = s.replace(/\s*,\s*/g, ",");
      s = s.replace(/(^|[\s,(])0\.(?=\d)/g, "$1.");
      s = s.replace(/(^|[\s,(])0(?:px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|s|ms|deg|grad|rad|turn|fr|%)\b/gi, "$10");
    }
    return s;
  }

  function declBody(decls, opts){
    var ds = [];
    decls.forEach(function(d){
      if (d.type === "comment"){ if (!opts.stripComments) ds.push("/*" + d.text.trim() + "*/"); return; }
      if (d.type === "stmt"){ ds.push(minStmt(d.text) + ";"); return; }
      ds.push(d.prop + ":" + minValue(d.value, opts) + ";");
    });
    var body = ds.join("");
    if (body.charAt(body.length - 1) === ";") body = body.slice(0, -1);
    return body;
  }

  function cssMinify(items, opts){
    var parts = [];
    items.forEach(function(it){
      if (it.type === "comment"){ if (!opts.stripComments) parts.push("/*" + it.text.trim() + "*/"); return; }
      if (it.type === "stmt"){ parts.push(minStmt(it.text) + ";"); return; }
      if (it.type === "rule"){
        var sel = splitSelectors(it.selector).join(",");
        parts.push(sel + "{" + declBody(it.decls, opts) + "}");
        return;
      }
      if (it.type === "atdecl"){
        parts.push(minStmt(it.prelude) + "{" + declBody(it.decls, opts) + "}");
        return;
      }
      if (it.type === "at"){
        parts.push(minStmt(it.prelude) + "{" + cssMinify(it.children, opts) + "}");
      }
    });
    return parts.join("");
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var stats = ["0","0","0","0"];
    var cfg = modeCfg();
    var out = "";

    if (src.trim()){
      var items = parseCSS(src);
      if (mode === "beautifier"){
        out = cssBeautify(items, { indent: state.indent, sortDecls: state.sortDecls }, 0).join("\n");
        var cnt = countCSS(items);
        stats = [fmtNum(src.length), fmtNum(out.length), indentLabel().replace("INDENT \u00B7 ",""), fmtNum(cnt.decls)];
      } else {
        out = cssMinify(items, { stripComments: state.stripComments, aggressive: state.aggressive });
        var bIn = new Blob([src]).size;
        var bOut = new Blob([out]).size;
        var saved = Math.max(0, bIn - bOut);
        var pct = bIn ? Math.round((saved / bIn) * 100) : 0;
        stats = [fmtNum(bIn), fmtNum(bOut), fmtNum(saved), pct + "%"];
      }
    } else if (mode === "beautifier"){
      stats = ["0","0", indentLabel().replace("INDENT \u00B7 ",""), "0"];
    } else {
      stats = ["0","0","0","0%"];
    }

    lastOutText = out;
    outTa.value = out;
    badgeOut.textContent = (mode === "minifier" && src.trim())
      ? fmtNum(new Blob([out]).size) + " BYTES"
      : fmtNum(out.length) + " CHARS";
    badgeIn.textContent = fmtNum(src.length) + " CHARS";
    vsBadge.textContent = cfg.glyph;
    for (var i = 0; i < 4; i++) setStat(sv[i], stats[i]);
  }

  function setMode(m){
    mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    analyzer.setAttribute("data-mode", m);
    srcIn.placeholder = PLACEHOLDERS[m] || "";
    setModeLabels();
    renderOpts();
    if (srcIn.value === ""){ srcIn.value = SAMPLE_CSS; }
    run();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- live typing ---- */
  srcIn.addEventListener("input", run);

  /* ---- feedback helper ---- */
  function flash(btn, text, isErr){
    var original = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", original);
    btn.textContent = text;
    btn.classList.add(isErr ? "err" : "ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok","err");
    }, 1400);
  }

  /* ---- clipboard helper ---- */
  function copyToClipboard(t, ok){
    function fb(){
      var ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); ok(); } catch(err){ /* ignore */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(ok, fb);
    } else { fb(); }
  }

  /* ---- swap: feed output back into input ---- */
  btnSwap.addEventListener("click", function(){
    if (!lastOutText){ flash(btnSwap, "OUTPUT EMPTY", true); return; }
    srcIn.value = lastOutText;
    run();
    flash(btnSwap, "FED BACK \u2713");
    srcIn.focus();
  });

  /* ---- pane actions ---- */
  $("#btn-copy-in").addEventListener("click", function(){
    var btn = $("#btn-copy-in");
    if (!srcIn.value){ flash(btn, "INPUT EMPTY", true); return; }
    copyToClipboard(srcIn.value, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-copy-out").addEventListener("click", function(){
    var btn = $("#btn-copy-out");
    if (!lastOutText){ flash(btn, "OUTPUT EMPTY", true); return; }
    copyToClipboard(lastOutText, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-clear-in").addEventListener("click", function(){
    srcIn.value = "";
    run();
    srcIn.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    srcIn.value = SAMPLE_CSS;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_CSS;
  srcIn.placeholder = PLACEHOLDERS.beautifier;
  setModeLabels();
  renderOpts();
  run();
})();
