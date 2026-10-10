
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

  /* ================= XML ENGINE ================= */
  var analyzer   = $("#analyzer");
  var srcIn      = $("#src-in");
  var outTa      = $("#out-ta");
  var valReport  = $("#val-report");
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
  var state = { indent: 2, sortAttrs: false };

  var SAMPLE_VALID = '<?xml version="1.0" encoding="UTF-8"?>\n<library branch="downtown" est="1962">\n  <!-- Night shift inventory, aisle 3 -->\n  <book id="bk-101" lang="en">\n    <title>The Lighthouse Keeper&#39;s Log</title>\n    <author>M. Calloway</author>\n    <year>1974</year>\n    <price currency="USD">12.50</price>\n    <tags>\n      <tag>maritime</tag>\n      <tag>memoir</tag>\n    </tags>\n    <inStock>true</inStock>\n  </book>\n  <book id="bk-202" lang="fa">\n    <title>\u0646\u0642\u0634\u0647\u200c\u06cc \u0633\u062a\u0627\u0631\u06af\u0627\u0646</title>\n    <author>S. Farhadi</author>\n    <year>2001</year>\n    <price currency="USD">24.00</price>\n    <excerpt><![CDATA[The stars are & always will be our oldest map.]]></excerpt>\n    <inStock>false</inStock>\n  </book>\n  <periodical id="mg-009" frequency="monthly">\n    <title>Tidal Charts Quarterly</title>\n    <issue no="47"/>\n    <year>2026</year>\n  </periodical>\n</library>';

  var SAMPLE_BROKEN = '<?xml version="1.0" encoding="UTF-8"?>\n<order id="7781">\n  <customer>Jane Doe</customer>\n  <items>\n    <item sku="A-1" qty="2">Widget</item>\n    <item sku="B-9" qty=1>Grommet</item>\n    <item sku="C-4" qty="3">Flange & Bolt</item>\n  </items>\n  <total currency="USD">41.75\n</order>';

  var PLACEHOLDER = "Paste XML here — every tool updates as you type…";

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function escHtml(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function escText(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function escAttr(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
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
      case "beautifier": return {
        glyph:"✧",
        labels:["Characters in","Characters out","Attr sort","Indent"],
        subs:["RAW XML","PRETTY-PRINTED","A→Z ON EVERY TAG","SET IN THE DECK"]
      };
      case "minifier": return {
        glyph:"≪",
        labels:["Bytes in","Bytes out","Bytes saved","Reduction"],
        subs:["PRETTY SOURCE","SINGLE LINE","WHITESPACE CUT","SMALLER BY"]
      };
      case "validator": return {
        glyph:"✓",
        labels:["Verdict","Elements","Max depth","Error line"],
        subs:["WELL-FORMED OR NOT","TAGS COUNTED","NESTING LEVELS","— WHEN CLEAN"]
      };
      default: return {
        glyph:"<>",
        labels:["Characters in","Characters out","Indent","Errors found"],
        subs:["RAW XML","PRETTY-PRINTED","SET IN THE DECK","0 MEANS CLEAN"]
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
    else if (mode === "beautifier"){ mkCycle(); mkToggle("sortAttrs","⇅ sort attrs A→Z"); }
  }

  /* ---- parsing core ---- */
  function parseXML(src){
    var doc = new DOMParser().parseFromString(src, "application/xml");
    var bad = doc.getElementsByTagName("parsererror");
    if (!bad.length && doc.documentElement && /parsererror/i.test(doc.documentElement.nodeName)){
      bad = [doc.documentElement];
    }
    if (bad.length){
      return { ok:false, err: extractParseError(bad[0]) };
    }
    return { ok:true, doc: doc };
  }

  function extractParseError(el){
    var raw = el.textContent || "XML parsing error";
    var line = null, col = null, msg = raw;
    var ml = raw.match(/line[:\s]+(\d+)/i);
    var mc = raw.match(/column[:\s]+(\d+)/i);
    if (ml) line = +ml[1];
    if (mc) col = +mc[1];
    var mChrome = raw.match(/error on line \d+ at column \d+:\s*([\s\S]*)/i);
    var mFF = raw.match(/XML Parsing Error:\s*([^\n]*)/i);
    if (mChrome) msg = mChrome[1].trim();
    else if (mFF) msg = mFF[1].trim();
    else msg = raw.split("\n")[0].trim();
    if (!msg) msg = "XML parsing error";
    return { msg: msg, line: line, col: col };
  }

  function hintsForXML(src, err){
    var hints = [];
    var m = err.msg || "";
    if (/mismatch/i.test(m)) hints.push("A closing tag doesn't match its opening tag — compare the tag names around the marked line.");
    if (/attvalue|expected ['\"]|attributes construct/i.test(m)) hints.push("Attribute values must be quoted: qty=\"1\", never qty=1.");
    if (/entityref|expecting ';'|not finished/i.test(m) || /&(?!#?\w+;)/.test(src)) hints.push("A bare & must be escaped as &amp; — and < inside text as &lt; (or wrap the block in CDATA).");
    if (/redefined/i.test(m)) hints.push("The same attribute is defined twice on one element — XML forbids duplicates.");
    if (/premature end/i.test(m)) hints.push("The document ends too early — a tag somewhere is left unclosed.");
    if (/start ?tag expected|starttag expected/i.test(m)) hints.push("The parser expected a tag to open here — check for stray text or a missing <.");
    if (/extra content/i.test(m)) hints.push("XML allows exactly one root element — everything must nest inside it.");
    if (!hints.length) hints.push("Check the marked line for an unclosed tag, a missing quote or a stray character.");
    return hints.slice(0, 3);
  }

  /* ---- serializer ---- */
  function serializeXML(doc, opts){
    var ind = opts.compact ? "" : (opts.indent === "tab" ? "\t" : new Array(opts.indent + 1).join(" "));
    var nl = opts.compact ? "" : "\n";
    var out = [];

    function attrsOf(el){
      var arr = [];
      for (var i = 0; i < el.attributes.length; i++){
        arr.push([el.attributes[i].name, el.attributes[i].value]);
      }
      if (opts.sortAttrs){
        arr.sort(function(a,b){ return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0); });
      }
      return arr.map(function(p){ return " " + p[0] + '="' + escAttr(p[1]) + '"'; }).join("");
    }
    function pad(d){ return opts.compact ? "" : new Array(d + 1).join(ind); }

    function walk(node, depth){
      var t = node.nodeType;
      if (t === 7){ /* processing instruction */
        out.push(pad(depth) + "<?" + node.target + (node.data ? " " + node.data : "") + "?>" + nl);
        return;
      }
      if (t === 8){ /* comment */
        out.push(pad(depth) + "<!--" + node.nodeValue + "-->" + nl);
        return;
      }
      if (t !== 1) return;

      var attrs = attrsOf(node);
      var kids = [];
      for (var i = 0; i < node.childNodes.length; i++){
        var k = node.childNodes[i];
        if (k.nodeType === 3 && k.nodeValue.trim() === "") continue;
        kids.push(k);
      }
      if (!kids.length){
        out.push(pad(depth) + "<" + node.tagName + attrs + "/>" + nl);
        return;
      }
      if (kids.length === 1 && kids[0].nodeType === 3){
        out.push(pad(depth) + "<" + node.tagName + attrs + ">" + escText(kids[0].nodeValue.trim()) + "</" + node.tagName + ">" + nl);
        return;
      }
      if (kids.length === 1 && kids[0].nodeType === 4){
        out.push(pad(depth) + "<" + node.tagName + attrs + "><![CDATA[" + kids[0].nodeValue + "]]></" + node.tagName + ">" + nl);
        return;
      }
      out.push(pad(depth) + "<" + node.tagName + attrs + ">" + nl);
      for (var j = 0; j < kids.length; j++){
        var c = kids[j];
        if (c.nodeType === 3) out.push(pad(depth + 1) + escText(c.nodeValue.trim()) + nl);
        else if (c.nodeType === 4) out.push(pad(depth + 1) + "<![CDATA[" + c.nodeValue + "]]>" + nl);
        else walk(c, depth + 1);
      }
      out.push(pad(depth) + "</" + node.tagName + ">" + nl);
    }

    for (var i = 0; i < doc.childNodes.length; i++) walk(doc.childNodes[i], 0);
    return out.join("").replace(/\n$/, "");
  }

  /* ---- document census ---- */
  function analyzeXML(doc){
    var c = { root:"—", elements:0, attributes:0, texts:0, comments:0, cdatas:0, pis:0, depth:0 };
    (function walk(node, d){
      for (var i = 0; i < node.childNodes.length; i++){
        var k = node.childNodes[i];
        if (k.nodeType === 1){
          c.elements++;
          if (c.depth < d) c.depth = d;
          if (d === 1 && c.root === "—") c.root = k.tagName;
          c.attributes += k.attributes.length;
          walk(k, d + 1);
        } else if (k.nodeType === 3){
          if (k.nodeValue.trim() !== "") c.texts++;
        } else if (k.nodeType === 4){ c.cdatas++; }
        else if (k.nodeType === 8){ c.comments++; }
        else if (k.nodeType === 7){ c.pis++; }
      }
    })(doc, 1);
    return c;
  }

  /* ---- validator report ---- */
  function snippetHtml(src, loc){
    if (!loc.line) return "";
    var lines = src.split("\n");
    var L = Math.min(loc.line, lines.length);
    var from = Math.max(1, L - 1), to = Math.min(lines.length, L + 1);
    var pad = String(to).length;
    var out = "";
    for (var i = from; i <= to; i++){
      var num = (new Array(pad + 1).join(" ") + i).slice(-pad);
      var marker = i === L ? "&gt;" : "·";
      out += '<span class="v-ln">' + marker + ' ' + num + ' |</span> ' + escHtml(lines[i - 1]) + "\n";
      if (i === L && loc.col){
        var caretPad = new Array(Math.max(1, loc.col)).join(" ");
        out += '<span class="v-ln">' + new Array(pad + 4).join(" ") + '|</span> ' + caretPad + '<b class="v-caret">^</b>\n';
      }
    }
    return '<pre class="v-snip">' + out + '</pre>';
  }

  function buildReport(src){
    if (!src.trim()){
      return { html:'<div class="v-verdict v-idle"><span class="v-mark">·</span><div><b>NOTHING TO PARSE</b><span>paste XML on the left to run the check</span></div></div>', ok:false, idle:true };
    }
    var t0 = performance.now();
    var pr = parseXML(src);
    var ms = performance.now() - t0;

    if (pr.ok){
      var c = analyzeXML(pr.doc);
      var cells = [
        ["root tag", c.root], ["elements", c.elements], ["attributes", c.attributes], ["text nodes", c.texts],
        ["comments", c.comments], ["cdata", c.cdatas], ["proc instrs", c.pis], ["max depth", c.depth]
      ];
      var html = '<div class="v-verdict v-ok"><span class="v-mark">✓</span><div><b>WELL-FORMED XML</b><span>parsed cleanly in ' + ms.toFixed(2) + ' ms · no syntax errors found</span></div></div>';
      html += '<div class="v-census">' + cells.map(function(x){
        return '<div class="vcell"><small>' + x[0] + '</small><b>' + (typeof x[1] === "number" ? fmtNum(x[1]) : escHtml(x[1])) + '</b></div>';
      }).join("") + '</div>';
      html += '<div class="v-note">well-formedness only — DTD / XSD schema validation is out of scope</div>';
      return { html: html, ok:true, census: c };
    }

    var err = pr.err;
    var hints = hintsForXML(src, err);
    var bad = '<div class="v-verdict v-bad"><span class="v-mark">✕</span><div><b>NOT WELL-FORMED</b><span>' + escHtml(err.msg) + '</span></div></div>';
    if (err.line) bad += '<div class="v-loc">ERROR AT LINE ' + err.line + ' · COLUMN ' + (err.col || "?") + '</div>';
    bad += snippetHtml(src, err);
    bad += '<ul class="v-hints">' + hints.map(function(h){ return '<li>' + escHtml(h) + '</li>'; }).join("") + '</ul>';
    bad += '<div class="v-note">fix the marked spot and the verdict flips live</div>';
    return { html: bad, ok:false, err: err };
  }

  /* ================= RUNNER ================= */
  function errorOutText(err){
    return "✕ NOT WELL-FORMED\n\n" + err.msg +
      (err.line ? "\nLocation: line " + err.line + ", column " + (err.col || "?") : "") +
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
        stats = ["0","0", indentLabel().replace("INDENT · ",""), mode === "beautifier" ? (state.sortAttrs ? "A→Z ON" : "OFF") : "0"];
      } else {
        var pr1 = parseXML(src);
        if (pr1.ok){
          var out1 = serializeXML(pr1.doc, {
            indent: state.indent,
            sortAttrs: mode === "beautifier" ? state.sortAttrs : false,
            compact: false
          });
          lastOutText = out1;
          outTa.value = out1;
          badgeOut.textContent = fmtNum(out1.length) + " CHARS";
          stats = mode === "beautifier"
            ? [fmtNum(src.length), fmtNum(out1.length), state.sortAttrs ? "A→Z ON" : "OFF", indentLabel().replace("INDENT · ","")]
            : [fmtNum(src.length), fmtNum(out1.length), indentLabel().replace("INDENT · ",""), "0"];
        } else {
          lastOutText = "";
          outTa.value = errorOutText(pr1.err);
          badgeOut.textContent = "✕ ERROR";
          stats = mode === "beautifier"
            ? [fmtNum(src.length), "—", state.sortAttrs ? "A→Z ON" : "OFF", indentLabel().replace("INDENT · ","")]
            : [fmtNum(src.length), "—", indentLabel().replace("INDENT · ",""), "1"];
        }
      }

    } else if (mode === "minifier"){
      if (!src.trim()){
        lastOutText = "";
        outTa.value = "";
        badgeOut.textContent = "0 CHARS";
        stats = ["0","0","0","0%"];
      } else {
        var pr2 = parseXML(src);
        if (pr2.ok){
          var out2 = serializeXML(pr2.doc, { compact:true, sortAttrs:false });
          var bIn = new Blob([src]).size;
          var bOut = new Blob([out2]).size;
          var saved = Math.max(0, bIn - bOut);
          var pct = bIn ? Math.round((saved / bIn) * 100) : 0;
          lastOutText = out2;
          outTa.value = out2;
          badgeOut.textContent = fmtNum(bOut) + " BYTES";
          stats = [fmtNum(bIn), fmtNum(bOut), fmtNum(saved), pct + "%"];
        } else {
          lastOutText = "";
          outTa.value = errorOutText(pr2.err);
          badgeOut.textContent = "✕ ERROR";
          stats = [fmtNum(new Blob([src]).size), "—", "—", "—"];
        }
      }

    } else { /* validator */
      var rep = buildReport(src);
      valReport.innerHTML = rep.html;
      if (rep.idle){
        badgeOut.textContent = "— IDLE";
        stats = ["IDLE","0","0","—"];
        sv[0].classList.remove("good","bad");
      } else if (rep.ok){
        badgeOut.textContent = "✓ PASS";
        stats = ["VALID", fmtNum(rep.census.elements), fmtNum(rep.census.depth), "—"];
        sv[0].classList.remove("bad"); sv[0].classList.add("good");
      } else {
        badgeOut.textContent = "✕ FAIL";
        stats = ["INVALID","0","0", rep.err && rep.err.line ? String(rep.err.line) : "?"];
        sv[0].classList.remove("good"); sv[0].classList.add("bad");
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
