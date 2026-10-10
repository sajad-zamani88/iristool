
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

  /* ================= JS ENGINE ================= */
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
  var state = { indent: 2, keepBlanks: true, stripComments: true, aggressive: false };

  var SAMPLE_JS = '// Night Sky Atlas \u2014 observatory client v3\nconst OBSERVATORY = {\n  name: "Calloway Ridge",\n  lat: 44.2619,\n  lng: -72.5806,\n  elevationM: 812\n};\n\nasync function fetchSkyReport(dateISO) {\n  const url = `/api/sky?date=${dateISO}&lat=${OBSERVATORY.lat}`;\n  const res = await fetch(url, { headers: { Accept: "application/json" } });\n  if (!res.ok) {\n    throw new Error("Sky report failed: " + res.status);\n  }\n  return res.json();\n}\n\nfunction visibleConstellations(report) {\n  const bright = report.stars.filter((s) => s.magnitude <= 2.5);\n  const names = bright.map((s) => s.constellation);\n  return [...new Set(names)].sort();\n}\n\n/* Build the night panel markup;\n   called once per report. */\nfunction renderPanel(report) {\n  const rows = visibleConstellations(report)\n    .map((name) => `<li class="constellation">${name}</li>`)\n    .join("");\n  document.querySelector("#night-panel").innerHTML = `<ul>${rows}</ul>`;\n}\n\nfor (let i = 0; i < 3; i++) {\n  console.log("scan", i + 1, /ra=(\\d+)/.test(location.search));\n}';

  var SAMPLE_MANGLED = 'function orbit(a,b){var t=0;while(t<a){t+=b;if(t%2===0){console.log("even",t)}else{console.log("odd",t)}}return t}\nvar probe={x:1,y:2,tag:"deep space"};const go=async()=>{let r=await fetch("/api/probe");if(!r.ok){throw new Error("no probe")};return r.json()};';

  var PLACEHOLDERS = {
    beautifier: "Paste JavaScript here \u2014 or hit \u21AF Mangled sample and watch it heal\u2026",
    minifier:   "Paste JavaScript here \u2014 watch the bytes fall away\u2026"
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
        subs:["SOURCE","SHIP IT","COMMENTS + WHITESPACE","SMALLER BY"]
      };
    }
    return {
      glyph:"\u2727",
      labels:["Characters in","Characters out","Indent","Lines out"],
      subs:["RAW SCRIPT","PRETTY-PRINTED","SET IN THE DECK","STATEMENTS BREATHE"]
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
      mkToggle("keepBlanks","\u00B6 keep blank lines");
    } else {
      mkToggle("stripComments","\u2327 strip comments");
      mkToggle("aggressive","\u26A1 aggressive");
    }
  }

  /* ---- tokenizer ---- */
  var REGEX_PREV_KW = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await|switch|with)$/;
  var PUNCT3 = [">>>","===","!==","**=","<<=",">>=","&&=","||=","??=","..."];
  var PUNCT2 = ["=>","==","!=","<=",">=","&&","||","??","++","--","+=","-=","*=","/=","%=","&=","|=","^=","<<",">>","**","?."];

  function tokenizeJS(src){
    var toks = [];
    var i = 0, n = src.length;

    function push(t, v){ toks.push({ t: t, v: v }); }

    function readString(q){
      var j = i + 1, out = q;
      while (j < n){
        var c = src[j];
        if (c === "\\"){ out += c + (src[j + 1] || ""); j += 2; continue; }
        if (c === "\n"){ out += c; j++; break; }
        out += c; j++;
        if (c === q) break;
      }
      i = j;
      return out;
    }

    function readTemplate(){
      var out = "`"; i++;
      while (i < n){
        var c = src[i];
        if (c === "\\"){ out += c + (src[i + 1] || ""); i += 2; continue; }
        if (c === "`"){ out += "`"; i++; return out; }
        if (c === "$" && src[i + 1] === "{"){
          out += "${"; i += 2;
          var depth = 1;
          while (i < n && depth > 0){
            var d = src[i];
            if (d === '"' || d === "'"){ out += readString(d); continue; }
            if (d === "`"){ out += readTemplate(); continue; }
            if (d === "{") depth++;
            else if (d === "}") depth--;
            out += d; i++;
          }
          continue;
        }
        out += c; i++;
      }
      return out;
    }

    function lastMeaningful(){
      for (var k = toks.length - 1; k >= 0; k--){
        var t = toks[k].t;
        if (t !== "ws" && t !== "nl") return toks[k];
      }
      return null;
    }

    function regexAllowed(){
      var p = lastMeaningful();
      if (!p) return true;
      if (p.t === "word") return REGEX_PREV_KW.test(p.v);
      if (p.t === "punct") return p.v !== ")" && p.v !== "]" && p.v !== "}";
      return false;
    }

    function readRegex(){
      var j = i + 1, inClass = false;
      while (j < n){
        var c = src[j];
        if (c === "\\"){ j += 2; continue; }
        if (c === "\n") return null;
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass){
          j++;
          while (j < n && /[a-z]/i.test(src[j])) j++;
          return src.slice(i, j);
        }
        j++;
      }
      return null;
    }

    while (i < n){
      var c = src[i];
      if (c === " " || c === "\t" || c === "\r" || c === "\f" || c === "\u00a0"){ push("ws"," "); i++; continue; }
      if (c === "\n"){ push("nl","\n"); i++; continue; }
      if (c === "/" && src[i + 1] === "/"){
        var j = src.indexOf("\n", i); if (j === -1) j = n;
        push("lcomment", src.slice(i, j)); i = j; continue;
      }
      if (c === "/" && src[i + 1] === "*"){
        var j2 = src.indexOf("*/", i + 2); j2 = (j2 === -1) ? n : j2 + 2;
        push("bcomment", src.slice(i, j2)); i = j2; continue;
      }
      if (c === '"' || c === "'"){ push("str", readString(c)); continue; }
      if (c === "`"){ push("tpl", readTemplate()); continue; }
      if (c === "/"){
        if (regexAllowed()){
          var re = readRegex();
          if (re){ push("regex", re); continue; }
        }
        push("punct","/"); i++; continue;
      }
      var nm = /^(0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eE][+-]?\d+)?n?)/.exec(src.substr(i, 64));
      if (nm && nm[0]){ push("word", nm[0]); i += nm[0].length; continue; }
      if (/[A-Za-z_$]/.test(c)){
        var mw = /^[A-Za-z0-9_$]+/.exec(src.substr(i, 500));
        push("word", mw[0]); i += mw[0].length; continue;
      }
      var hit = false;
      for (var p3 = 0; p3 < PUNCT3.length; p3++){
        if (src.substr(i, 3) === PUNCT3[p3]){ push("punct", PUNCT3[p3]); i += 3; hit = true; break; }
      }
      if (hit) continue;
      for (var p2 = 0; p2 < PUNCT2.length; p2++){
        if (src.substr(i, 2) === PUNCT2[p2]){ push("punct", PUNCT2[p2]); i += 2; hit = true; break; }
      }
      if (hit) continue;
      push("punct", c); i++;
    }
    return toks;
  }

  /* ---- spacing tables ---- */
  var ALL_KW = {if:1,for:1,while:1,switch:1,catch:1,function:1,class:1,with:1,async:1,return:1,typeof:1,new:1,in:1,of:1,instanceof:1,delete:1,void:1,throw:1,yield:1,await:1,do:1,else:1,case:1,const:1,let:1,var:1,export:1,import:1,default:1,extends:1,super:1,break:1,continue:1,finally:1,try:1,static:1};
  var BINOPS = {"=":1,"==":1,"===":1,"!=":1,"!==":1,"<":1,">":1,"<=":1,">=":1,"&&":1,"||":1,"??":1,"=>":1,"+=":1,"-=":1,"*=":1,"/=":1,"%=":1,"&=":1,"|=":1,"^=":1,"<<=":1,">>=":1,"**=":1,"&&=":1,"||=":1,"??=":1};
  var ARITH = {"+":1,"-":1,"*":1,"/":1,"%":1,"**":1};
  var UNARY_KW = {return:1,case:1,typeof:1,new:1,in:1,of:1,instanceof:1,delete:1,void:1,throw:1,yield:1,await:1,do:1,else:1,with:1};

  function markUnary(tok, prevM){
    if (tok.t !== "punct" || !ARITH[tok.v]) return;
    if (!prevM){ tok.unary = true; return; }
    var pv = prevM.v;
    if (prevM.t === "word"){ tok.unary = !!UNARY_KW[pv]; return; }
    if (prevM.t !== "punct"){ tok.unary = false; return; }
    tok.unary = pv === "(" || pv === "[" || pv === "{" || pv === "," || pv === ":" || pv === ";" ||
                pv === "?" || pv === "=>" || pv === "!" || pv === "~" || !!BINOPS[pv] || !!ARITH[pv];
  }

  function beautifySpace(a, b){
    if (!a || !b) return false;
    if (b.t === "lcomment" || b.t === "bcomment") return true;
    if (a.t === "bcomment") return true;
    var av = a.v, bv = b.v;
    if (av === "(" || av === "[" || av === "{") return false;
    if (bv === ")" || bv === "]" || bv === "}") return false;
    if (av === "." || av === "?." || bv === "." || bv === "?.") return false;
    if (bv === "," || bv === ";" || bv === ":") return false;
    if (av === "," || av === ";" || av === ":" || av === "?") return true;
    if (av === "=>" || bv === "=>") return true;
    if (av === "!" || av === "~" || av === "++" || av === "--") return false;
    if (bv === "++" || bv === "--") return false;
    if (av === "#") return false;
    var aW = a.t === "word" || a.t === "regex" || a.t === "str" || a.t === "tpl";
    var bW = b.t === "word" || b.t === "regex" || b.t === "str" || b.t === "tpl";
    if (av === "}") return bW;
    if (aW && bW){
      if (bv === "(" && a.t === "word" && !ALL_KW[av]) return false; /* call style */
      return true;
    }
    if (BINOPS[av] || BINOPS[bv]) return true;
    if (ARITH[bv]){
      if (a.t === "punct" && (av === "(" || av === "[" || av === "{" || av === "," || av === ":" || av === "?" || av === ";" || av === "=>" || BINOPS[av] || ARITH[av])) return false;
      return true;
    }
    if (ARITH[av]) return !a.unary;
    if (bv === "(" || bv === "["){
      if (bv === "[" && a.t === "word" && ALL_KW[av]) return true;
      return false;
    }
    if (bv === "{") return true;
    if (av === ")" || av === "]") return bW;
    if (av === "...") return bW;
    return false;
  }

  /* ---- beautifier ---- */
  function beautifyJS(tokens, opts){
    var ind = opts.indent === "tab" ? "\t" : new Array(opts.indent + 1).join(" ");
    var out = "";
    var stack = [];
    var needNL = false, softNL = false, forceSpace = false;
    var nlRun = 0;
    var prevM = null;

    function writeNL(blank){
      out += "\n" + ((blank && opts.keepBlanks) ? "\n" : "");
      out += new Array(stack.length + 1).join(ind);
    }
    function peekM(k){
      for (; k < tokens.length; k++){
        var t = tokens[k].t;
        if (t !== "ws" && t !== "nl") return tokens[k];
      }
      return null;
    }

    for (var k = 0; k < tokens.length; k++){
      var tok = tokens[k];
      if (tok.t === "ws") continue;
      if (tok.t === "nl"){ nlRun++; softNL = true; continue; }

      if (tok.t === "lcomment" || tok.t === "bcomment"){
        if (needNL || softNL || out === ""){ writeNL(nlRun >= 2 && out !== ""); }
        else if (prevM){ out += " "; }
        out += tok.v;
        needNL = tok.t === "lcomment";
        softNL = false; forceSpace = false; nlRun = 0; prevM = tok;
        continue;
      }

      if (tok.v === "}" || tok.v === ")" || tok.v === "]"){
        if (stack.length) stack.pop();
      }

      if (needNL || softNL){
        writeNL(nlRun >= 2);
      } else if (forceSpace || (prevM && beautifySpace(prevM, tok))){
        out += " ";
      }

      markUnary(tok, prevM);
      out += tok.v;

      needNL = false; softNL = false; forceSpace = false; nlRun = 0;
      prevM = tok;

      if (tok.v === "{"){
        var nxt0 = peekM(k + 1);
        if (!(nxt0 && nxt0.v === "}")) needNL = true;
        stack.push("{");
      } else if (tok.v === "(" || tok.v === "["){
        stack.push(tok.v);
      } else if (tok.v === ";"){
        if (stack[stack.length - 1] !== "(") needNL = true;
      } else if (tok.v === "}"){
        var nxt = peekM(k + 1);
        if (nxt && nxt.t === "word" && /^(else|catch|finally|while)$/.test(nxt.v)){ forceSpace = true; }
        else if (nxt && (/^[\)\],;.]$/.test(nxt.v) || nxt.v === "?.")) { /* attach tight */ }
        else needNL = true;
      }
    }
    if (out){ out = out.replace(/\s+$/, "") + "\n"; }
    return out;
  }

  /* ---- minifier ---- */
  function minSpace(a, b){
    var av = a.v, bv = b.v;
    if (b.t === "lcomment" || b.t === "bcomment") return true;
    var aW = a.t === "word" || a.t === "regex";
    var bW = b.t === "word" || b.t === "regex";
    if (aW && bW) return true;
    if (b.t === "regex") return aW;
    if (a.t === "regex") return bW;
    if ((av === "+" || av === "++") && bv[0] === "+") return true;
    if ((av === "-" || av === "--") && bv[0] === "-") return true;
    if (av === "/" && bv === "/") return true;
    return false;
  }

  function asiRisky(a, b){
    var ends = a.t === "word" || a.t === "str" || a.t === "tpl" || a.t === "regex" ||
               a.v === ")" || a.v === "]" || a.v === "++" || a.v === "--";
    var starts = b.t === "word" || b.t === "str" || b.t === "tpl" || b.t === "regex" ||
                 b.v === "(" || b.v === "[" || b.v === "+" || b.v === "-" ||
                 b.v === "++" || b.v === "--" || b.v === "!" || b.v === "~" ||
                 b.v === "*" || b.v === "/" || b.v === "`";
    return ends && starts;
  }

  function minifyJS(tokens, opts){
    var out = "";
    var prevM = null;
    var hadNL = false;
    var parenDepth = 0;

    function peekM(k){
      for (; k < tokens.length; k++){
        var t = tokens[k].t;
        if (t !== "ws" && t !== "nl" && t !== "lcomment" && t !== "bcomment") return tokens[k];
      }
      return null;
    }

    for (var k = 0; k < tokens.length; k++){
      var tok = tokens[k];
      if (tok.t === "ws") continue;
      if (tok.t === "nl"){ hadNL = true; continue; }
      if (tok.t === "lcomment"){
        if (!opts.stripComments){ out += tok.v + "\n"; prevM = tok; }
        continue;
      }
      if (tok.t === "bcomment"){
        if (!opts.stripComments){
          if (prevM && !/\s$/.test(out)) out += " ";
          out += tok.v;
          prevM = tok;
        }
        continue;
      }

      if (tok.v === "(") parenDepth++;

      if (opts.aggressive && tok.v === ";" && parenDepth === 0){
        var nxt = peekM(k + 1);
        var pv = prevM ? prevM.v : "";
        if ((nxt && nxt.v === "}") || pv === "{" || pv === ";") continue;
      }

      if (prevM){
        if (minSpace(prevM, tok)) out += " ";
        else if (hadNL && asiRisky(prevM, tok)) out += "\n";
      }
      out += tok.v;
      if (tok.v === ")") parenDepth--;
      prevM = tok;
      hadNL = false;
    }
    return out;
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var stats = ["0","0","0","0"];
    var cfg = modeCfg();
    var out = "";

    if (src.trim()){
      var toks = tokenizeJS(src);
      if (mode === "beautifier"){
        out = beautifyJS(toks, { indent: state.indent, keepBlanks: state.keepBlanks });
        stats = [fmtNum(src.length), fmtNum(out.length), indentLabel().replace("INDENT \u00B7 ",""), fmtNum(out.split("\n").length)];
      } else {
        out = minifyJS(toks, { stripComments: state.stripComments, aggressive: state.aggressive });
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
    if (srcIn.value === ""){ srcIn.value = SAMPLE_JS; }
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
    srcIn.value = SAMPLE_JS;
    run();
    srcIn.focus();
  });
  $("#btn-mangled").addEventListener("click", function(){
    srcIn.value = SAMPLE_MANGLED;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_JS;
  srcIn.placeholder = PLACEHOLDERS.beautifier;
  setModeLabels();
  renderOpts();
  run();
})();
