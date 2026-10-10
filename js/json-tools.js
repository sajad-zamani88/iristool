
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

  /* ================= JSON ENGINE ================= */
  var analyzer   = $("#analyzer");
  var srcIn      = $("#src-in");
  var outTa      = $("#out-ta");
  var valReport  = $("#val-report");
  var treeView   = $("#tree-view");
  var badgeIn    = $("#badge-in");
  var badgeOut   = $("#badge-out");
  var vsBadge    = $("#vs-badge");
  var optsHolder = $("#opts-holder");
  var btnSwap    = $("#btn-swap");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var mode = "formatter";
  var lastOutText = "";
  var state = { indent: 2, sortKeys: false, expandAll: false };
  var NODE_CAP = 2500;

  var SAMPLE_VALID = '{\n  "mission": "Apollo 11",\n  "launched": "1969-07-16T13:32:00Z",\n  "crew": [\n    { "name": "Neil Armstrong", "role": "Commander", "walkedFirst": true },\n    { "name": "Buzz Aldrin", "role": "LM Pilot", "walkedFirst": false },\n    { "name": "Michael Collins", "role": "CM Pilot", "walkedFirst": false }\n  ],\n  "telemetry": {\n    "altitudeKm": 111.1,\n    "velocityKmh": 38940,\n    "fuelFraction": 0.214,\n    "signalLost": null\n  },\n  "landing": {\n    "site": "Sea of Tranquility",\n    "coordinates": { "lat": 0.67409, "lng": 23.47298 },\n    "eagleDown": true\n  },\n  "quotes": ["That\'s one small step for man, one giant leap for mankind."],\n  "durationDays": 8.14,\n  "samplesKg": 21.55\n}';

  var SAMPLE_BROKEN = "{\n  \"status\": \"deploying\",\n  \"servers\": [\"alpha\", \"beta\", \"gamma\",],\n  \"config\": {\n    \"retries\": 3,\n    'timeout': 5000,\n    \"verbose\": true\n  },\n  \"eta_minutes\": 12.5\n}";

  var PLACEHOLDER = "Paste JSON here — every tool updates as you type…";

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function escHtml(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

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
    switch(mode){
      case "validator": return {
        glyph:"✓",
        labels:["Verdict","Total keys","Max depth","Error line"],
        subs:["VALID OR INVALID","COUNTED RECURSIVELY","NESTING LEVELS","— WHEN CLEAN"]
      };
      case "beautifier": return {
        glyph:"✧",
        labels:["Characters in","Characters out","Key sort","Indent"],
        subs:["RAW JSON","PRETTY-PRINTED","A→Z EVERY LEVEL","SET IN THE DECK"]
      };
      case "minifier": return {
        glyph:"≪",
        labels:["Bytes in","Bytes out","Bytes saved","Reduction"],
        subs:["PRETTY SOURCE","SINGLE LINE","WHITESPACE CUT","SMALLER BY"]
      };
      case "viewer": return {
        glyph:"⊞",
        labels:["Total nodes","Objects","Arrays","Max depth"],
        subs:["KEYS + VALUES","{ } BRANCHES","[ ] BRANCHES","NESTING LEVELS"]
      };
      default: return {
        glyph:"{}",
        labels:["Characters in","Characters out","Indent","Errors found"],
        subs:["RAW JSON","PRETTY-PRINTED","SET IN THE DECK","0 MEANS CLEAN"]
      };
    }
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
    return state.indent === "tab" ? "INDENT · TAB" : "INDENT · " + state.indent + " SP";
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

    if (mode === "formatter"){ mkCycle(); }
    else if (mode === "beautifier"){ mkCycle(); mkToggle("sortKeys","⇅ sort keys A→Z"); }
    else if (mode === "viewer"){ mkToggle("expandAll","⊞ expand all"); }
  }

  /* ---- parsing core ---- */
  function tryParse(src){
    var t0 = performance.now();
    try {
      var val = JSON.parse(src);
      return { ok:true, value:val, ms:performance.now() - t0 };
    } catch(err){
      return { ok:false, error:err, ms:performance.now() - t0 };
    }
  }

  function errLoc(src, err){
    var msg = (err && err.message) ? err.message : "Syntax error";
    var pos = null, line = null, col = null;
    var m2 = msg.match(/line (\d+) column (\d+)/i);
    var m1 = msg.match(/position (\d+)/i);
    if (m2){ line = +m2[1]; col = +m2[2]; }
    if (m1){ pos = Math.min(+m1[1], src.length); }
    if (line === null && pos !== null){
      var before = src.slice(0, pos);
      line = before.split("\n").length;
      col = pos - before.lastIndexOf("\n");
    }
    return { msg: msg, pos: pos, line: line, col: col };
  }

  function hintsFor(src, loc){
    var hints = [];
    var p = loc.pos !== null ? loc.pos : 0;
    var around = src.slice(Math.max(0, p - 40), p + 40);
    var before = src.slice(0, p);
    var ch = src.charAt(p);
    if (ch === "'") hints.push("Strings and keys must use double quotes — swap the ' for \".");
    if (/,\s*[}\]]/.test(around) || (/,\s*$/.test(before) && /^\s*[}\]]/.test(src.slice(p)))){
      hints.push("Trailing comma before a closing } or ] — remove it.");
    }
    if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(around)) hints.push("Object keys must be quoted: \"key\": value.");
    if (/\/\//.test(around) || /\/\*/.test(around)) hints.push("Comments are not valid JSON — strip // and /* */ first.");
    if (/\bundefined\b/.test(around)) hints.push("undefined is not a JSON value — use null instead.");
    if (/\bNaN\b|\bInfinity\b/.test(around)) hints.push("NaN and Infinity are not valid JSON numbers.");
    if (!hints.length) hints.push("Check for a missing comma, bracket or quote near the marked character.");
    return hints.slice(0, 3);
  }

  function analyze(v){
    var c = { objects:0, arrays:0, strings:0, numbers:0, booleans:0, nulls:0, keys:0, depth:0, nodes:0 };
    (function walk(x, d){
      c.nodes++;
      if (d > c.depth) c.depth = d;
      if (x === null){ c.nulls++; return; }
      var t = typeof x;
      if (t === "string"){ c.strings++; return; }
      if (t === "number"){ c.numbers++; return; }
      if (t === "boolean"){ c.booleans++; return; }
      if (Array.isArray(x)){ c.arrays++; for (var i = 0; i < x.length; i++) walk(x[i], d + 1); return; }
      if (t === "object"){ c.objects++; for (var k in x){ c.keys++; walk(x[k], d + 1); } }
    })(v, 1);
    return c;
  }

  function sortDeep(v){
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object"){
      var o = {};
      Object.keys(v).sort().forEach(function(k){ o[k] = sortDeep(v[k]); });
      return o;
    }
    return v;
  }

  function rootLabel(v){
    if (Array.isArray(v)) return "an array[" + v.length + "]";
    if (v === null) return "null";
    var t = typeof v;
    if (t === "object") return "an object{" + Object.keys(v).length + " keys}";
    return "a " + t;
  }

  function indentVal(){ return state.indent === "tab" ? "\t" : state.indent; }

  /* ---- validator report ---- */
  function snippetHtml(src, loc){
    if (!loc.line) return "";
    var lines = src.split("\n");
    var L = Math.min(loc.line, lines.length);
    var from = Math.max(1, L - 1), to = Math.min(lines.length, L + 1);
    var pad = String(to).length;
    var out = "";
    for (var i = from; i <= to; i++){
      var num = (" ".repeat(pad) + i).slice(-pad);
      var marker = i === L ? "&gt;" : "·";
      out += '<span class="v-ln">' + marker + ' ' + num + ' |</span> ' + escHtml(lines[i - 1]) + "\n";
      if (i === L && loc.col){
        var caretPad = new Array(Math.max(1, loc.col)).join(" ");
        out += '<span class="v-ln">' + " ".repeat(pad + 4) + '|</span> ' + caretPad + '<b class="v-caret">^</b>\n';
      }
    }
    return '<pre class="v-snip">' + out + '</pre>';
  }

  function buildReport(src){
    if (!src.trim()){
      return '<div class="v-verdict v-idle"><span class="v-mark">·</span><div><b>NOTHING TO PARSE</b><span>paste JSON on the left to run the check</span></div></div>';
    }
    var pr = tryParse(src);
    if (pr.ok){
      var c = analyze(pr.value);
      var cells = [
        ["objects", c.objects], ["arrays", c.arrays], ["strings", c.strings], ["numbers", c.numbers],
        ["booleans", c.booleans], ["nulls", c.nulls], ["keys", c.keys], ["max depth", c.depth]
      ];
      var html = '<div class="v-verdict v-ok"><span class="v-mark">✓</span><div><b>VALID JSON</b><span>parsed cleanly in ' + pr.ms.toFixed(2) + ' ms · no errors found</span></div></div>';
      html += '<div class="v-census">' + cells.map(function(x){
        return '<div class="vcell"><small>' + x[0] + '</small><b>' + fmtNum(x[1]) + '</b></div>';
      }).join("") + '</div>';
      html += '<div class="v-note">root is ' + rootLabel(pr.value) + ' · ' + fmtNum(c.nodes) + ' nodes total · every branch walked</div>';
      return { html: html, ok: true, census: c };
    }
    var loc = errLoc(src, pr.error);
    var hints = hintsFor(src, loc);
    var bad = '<div class="v-verdict v-bad"><span class="v-mark">✕</span><div><b>INVALID JSON</b><span>' + escHtml(loc.msg) + '</span></div></div>';
    if (loc.line) bad += '<div class="v-loc">ERROR AT LINE ' + loc.line + ' · COLUMN ' + (loc.col || "?") + '</div>';
    bad += snippetHtml(src, loc);
    bad += '<ul class="v-hints">' + hints.map(function(h){ return '<li>' + escHtml(h) + '</li>'; }).join("") + '</ul>';
    bad += '<div class="v-note">fix the marked character and the verdict flips live</div>';
    return { html: bad, ok: false, loc: loc };
  }

  /* ---- tree viewer ---- */
  function renderTree(v, expandAll){
    var count = 0, capped = 0;

    function leaf(keyHtml, valHtml, cls, raw){
      var title = (raw && raw.length > 90) ? ' title="' + escHtml(raw) + '"' : '';
      return '<div class="jrow jleaf"><span class="jdot" aria-hidden="true"></span>' + keyHtml +
             '<span class="jval j-' + cls + '"' + title + '>' + valHtml + '</span>' +
             '<span class="jtype">' + cls + '</span></div>';
    }
    function node(x, key, depth){
      count++;
      if (count > NODE_CAP){ capped++; return '<div class="jrow jleaf"><span class="jmore">… node limit reached — minify or narrow the data</span></div>'; }
      var keyHtml = key === null ? "" : '<span class="jkey">"' + escHtml(key) + '"</span><span class="jpunc">:</span> ';
      if (x === null) return leaf(keyHtml, "null", "null");
      var t = typeof x;
      if (t === "string") return leaf(keyHtml, '"' + escHtml(x) + '"', "str", x);
      if (t === "number") return leaf(keyHtml, String(x), "num");
      if (t === "boolean") return leaf(keyHtml, String(x), "bool");

      var isArr = Array.isArray(x);
      var entries = isArr
        ? x.map(function(item, i){ return [i, item]; })
        : Object.keys(x).map(function(k){ return [k, x[k]]; });
      var label = isArr ? "array[" + entries.length + "]" : "object{" + entries.length + "}";

      if (!entries.length){
        return '<div class="jrow jleaf"><span class="jdot" aria-hidden="true"></span>' + keyHtml +
               '<span class="jval jt-' + (isArr ? "arr" : "obj") + '">' + (isArr ? "[ ]" : "{ }") + '</span>' +
               '<span class="jtype jt-' + (isArr ? "arr" : "obj") + '">' + label + '</span></div>';
      }
      var open = expandAll || depth < 2;
      var kids = entries.map(function(e){ return node(e[1], isArr ? null : e[0], depth + 1); }).join("");
      return '<div class="jnode">' +
        '<div class="jrow">' +
          '<button type="button" class="jtgl" aria-expanded="' + open + '" aria-label="Toggle branch">' + (open ? "▾" : "▸") + '</button>' +
          keyHtml + '<span class="jtype jt-' + (isArr ? "arr" : "obj") + '">' + label + '</span>' +
        '</div>' +
        '<div class="jkids"' + (open ? "" : " hidden") + '>' + kids + '</div>' +
      '</div>';
    }

    var html = node(v, null, 0);
    if (capped) html += '<span class="jcap">+ ' + fmtNum(capped) + ' nodes not rendered</span>';
    return { html: html, capped: capped };
  }

  treeView.addEventListener("click", function(e){
    var btn = e.target.closest(".jtgl");
    if (!btn) return;
    var kidsEl = btn.closest(".jnode").querySelector(":scope > .jkids");
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    btn.textContent = open ? "▸" : "▾";
    if (kidsEl) kidsEl.hidden = open;
  });

  /* ================= RUNNER ================= */
  function errorOutText(loc){
    return "✕ INVALID JSON\n\n" + loc.msg +
      (loc.line ? "\nLocation: line " + loc.line + ", column " + (loc.col || "?") : "") +
      "\n\nSwitch to the Validator tab for a caret-pointed report and fix hints.";
  }

  function run(){
    var src = srcIn.value;
    var stats = ["0","0","0","0"];
    var cfg = modeCfg();

    if (mode === "formatter" || mode === "beautifier"){
      if (!src.trim()){
        lastOutText = "";
        outTa.value = "";
        badgeOut.textContent = "0 CHARS";
        stats = ["0","0", indentLabel().replace("INDENT · ",""), mode === "beautifier" ? (state.sortKeys ? "A→Z ON" : "OFF") : "0"];
      } else {
        var pr1 = tryParse(src);
        if (pr1.ok){
          var val1 = (mode === "beautifier" && state.sortKeys) ? sortDeep(pr1.value) : pr1.value;
          var out1 = JSON.stringify(val1, null, indentVal());
          lastOutText = out1;
          outTa.value = out1;
          badgeOut.textContent = fmtNum(out1.length) + " CHARS";
          stats = mode === "beautifier"
            ? [fmtNum(src.length), fmtNum(out1.length), state.sortKeys ? "A→Z ON" : "OFF", indentLabel().replace("INDENT · ","")]
            : [fmtNum(src.length), fmtNum(out1.length), indentLabel().replace("INDENT · ",""), "0"];
        } else {
          var loc1 = errLoc(src, pr1.error);
          lastOutText = "";
          outTa.value = errorOutText(loc1);
          badgeOut.textContent = "✕ ERROR";
          stats = mode === "beautifier"
            ? [fmtNum(src.length), "—", state.sortKeys ? "A→Z ON" : "OFF", indentLabel().replace("INDENT · ","")]
            : [fmtNum(src.length), "—", indentLabel().replace("INDENT · ",""), "1"];
        }
      }

    } else if (mode === "validator"){
      var rep = buildReport(src);
      valReport.innerHTML = rep.html;
      if (!src.trim()){
        badgeOut.textContent = "— IDLE";
        stats = ["IDLE","0","0","—"];
        sv[0].classList.remove("good","bad");
      } else if (rep.ok){
        badgeOut.textContent = "✓ PASS";
        stats = ["VALID", fmtNum(rep.census.keys), fmtNum(rep.census.depth), "—"];
        sv[0].classList.remove("bad"); sv[0].classList.add("good");
      } else {
        badgeOut.textContent = "✕ FAIL";
        stats = ["INVALID","0","0", rep.loc && rep.loc.line ? String(rep.loc.line) : "?"];
        sv[0].classList.remove("good"); sv[0].classList.add("bad");
      }
      lastOutText = "";

    } else if (mode === "minifier"){
      if (!src.trim()){
        lastOutText = "";
        outTa.value = "";
        badgeOut.textContent = "0 CHARS";
        stats = ["0","0","0","0%"];
      } else {
        var pr2 = tryParse(src);
        if (pr2.ok){
          var out2 = JSON.stringify(pr2.value);
          var bIn = new Blob([src]).size;
          var bOut = new Blob([out2]).size;
          var saved = Math.max(0, bIn - bOut);
          var pct = bIn ? Math.round((saved / bIn) * 100) : 0;
          lastOutText = out2;
          outTa.value = out2;
          badgeOut.textContent = fmtNum(bOut) + " BYTES";
          stats = [fmtNum(bIn), fmtNum(bOut), fmtNum(saved), pct + "%"];
        } else {
          var loc2 = errLoc(src, pr2.error);
          lastOutText = "";
          outTa.value = errorOutText(loc2);
          badgeOut.textContent = "✕ ERROR";
          stats = [fmtNum(new Blob([src]).size), "—", "—", "—"];
        }
      }

    } else { /* viewer */
      if (!src.trim()){
        treeView.innerHTML = '<span class="jmore">paste JSON on the left — the tree grows as you type</span>';
        badgeOut.textContent = "— IDLE";
        stats = ["0","0","0","0"];
      } else {
        var pr3 = tryParse(src);
        if (pr3.ok){
          var c3 = analyze(pr3.value);
          var tr = renderTree(pr3.value, state.expandAll);
          treeView.innerHTML = tr.html;
          badgeOut.textContent = fmtNum(c3.nodes) + " NODES";
          stats = [fmtNum(c3.nodes), fmtNum(c3.objects), fmtNum(c3.arrays), fmtNum(c3.depth)];
        } else {
          var loc3 = errLoc(src, pr3.error);
          treeView.innerHTML = buildReport(src).html;
          badgeOut.textContent = "✕ ERROR";
          stats = ["—","—","—", loc3.line ? String(loc3.line) : "?"];
        }
      }
      lastOutText = "";
    }

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
    sv[0].classList.remove("good","bad");
    setModeLabels();
    renderOpts();
    if (srcIn.value === ""){ srcIn.value = SAMPLE_VALID; }
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
    flash(btnSwap, "FED BACK ✓");
    srcIn.focus();
  });

  /* ---- pane actions ---- */
  $("#btn-copy-in").addEventListener("click", function(){
    var btn = $("#btn-copy-in");
    if (!srcIn.value){ flash(btn, "INPUT EMPTY", true); return; }
    copyToClipboard(srcIn.value, function(){ flash(btn, "COPIED ✓"); });
  });
  $("#btn-copy-out").addEventListener("click", function(){
    var btn = $("#btn-copy-out");
    if (!lastOutText){ flash(btn, "OUTPUT EMPTY", true); return; }
    copyToClipboard(lastOutText, function(){ flash(btn, "COPIED ✓"); });
  });
  $("#btn-clear-in").addEventListener("click", function(){
    srcIn.value = "";
    run();
    srcIn.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    srcIn.value = SAMPLE_VALID;
    run();
    srcIn.focus();
  });
  $("#btn-broken").addEventListener("click", function(){
    srcIn.value = SAMPLE_BROKEN;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_VALID;
  srcIn.placeholder = PLACEHOLDER;
  setModeLabels();
  renderOpts();
  run();
})();
