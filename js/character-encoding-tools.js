
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

  /* ================= ENCODING ENGINE ================= */
  var srcIn    = $("#src-in");
  var outTa    = $("#out-ta");
  var badgeIn  = $("#badge-in");
  var badgeOut = $("#badge-out");
  var vsBadge  = $("#vs-badge");
  var optsHolder = $("#opts-holder");
  var btnSwap  = $("#btn-swap");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { mode:"unicode-enc", uniAll:false, entMode:"named", entAll:true };
  var lastOut = "";

  var SAMPLES = {
    "unicode-enc": "\u0633\u0644\u0627\u0645 Hello \u4e16\u754c \ud83d\udc4b",
    "unicode-dec": "\\u0633\\u0644\\u0627\\u0645 \\u4e16\\u754c \\ud83d\\udc4b \\u{1F52D}",
    "entity-enc":  "<p>Save & sync \u2014 \"now\" \u00a9 caf\u00e9</p>",
    "entity-dec":  "&lt;b&gt;Caf&eacute;&lt;/b&gt; &amp; bar &mdash; &ldquo;quoted&rdquo; &copy; &hearts; &#10024;",
    "ascii-enc":   "ABC\nHello, World! 123",
    "ascii-dec":   "72 101 108 108 111 44 32 87 111 114 108 100 33"
  };

  var PLACEHOLDERS = {
    "unicode-enc": "Paste text \u2014 every non-ASCII character becomes a \\uXXXX escape\u2026",
    "unicode-dec": "Paste \\uXXXX or \\u{\\u2026} escapes \u2014 surrogate pairs rejoin automatically\u2026",
    "entity-enc":  "Paste text or markup \u2014 the dangerous five are always escaped\u2026",
    "entity-dec":  "Paste HTML entities \u2014 named, numeric and hex all decode\u2026",
    "ascii-enc":   "Paste text \u2014 each character becomes its decimal code\u2026",
    "ascii-dec":   "Paste codes separated by spaces, commas or newlines\u2026"
  };

  var GLYPHS = {
    "unicode-enc":"\u2192U","unicode-dec":"\u2190U",
    "entity-enc":"\u2192&","entity-dec":"\u2190&",
    "ascii-enc":"\u2192#","ascii-dec":"\u2190#"
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
  var STAT_CFG = {
    "unicode-enc": { labels:["Characters in","Characters out","Escapes written","Non-ASCII chars"], subs:["RAW TEXT","\u005CuXXXX OUTPUT","\u005CuXXXX GROUPS","FULL UNICODE"] },
    "unicode-dec": { labels:["Characters in","Characters out","Escapes decoded","Left as-is"], subs:["ESCAPED SOURCE","READABLE TEXT","MATCHED OK","UNKNOWN \u005Cu"] },
    "entity-enc":  { labels:["Characters in","Characters out","Entities written","Entity style"], subs:["RAW TEXT","ENTITY-SAFE","&\u2026; GROUPS","NAMED \u00B7 NUMERIC \u00B7 HEX"] },
    "entity-dec":  { labels:["Characters in","Characters out","Entities decoded","Left as-is"], subs:["ENCODED SOURCE","READABLE TEXT","MATCHED OK","UNKNOWN &\u2026;"] },
    "ascii-enc":   { labels:["Characters in","Codes out","Out of range","ASCII bytes"], subs:["RAW TEXT","SPACE-SEPARATED","MARKED AS ?","0\u2013127"] },
    "ascii-dec":   { labels:["Tokens in","Characters out","Invalid tokens","Range"], subs:["NUMBERS READ","PLAIN TEXT","LEFT AS-IS","0\u2013127"] }
  };

  function setModeLabels(){
    var cfg = STAT_CFG[state.mode];
    for (var i = 0; i < 4; i++){
      sl[i].textContent = cfg.labels[i];
      ss[i].textContent = cfg.subs[i];
    }
  }

  /* ---- deck options ---- */
  var ENT_MODES = ["named","numeric","hex"];
  var ENT_LABELS = { named:"STYLE \u00B7 NAMED", numeric:"STYLE \u00B7 NUMERIC", hex:"STYLE \u00B7 HEX" };

  function renderOpts(){
    optsHolder.textContent = "";

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
    function mkCycle(){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tgl cyc";
      b.setAttribute("aria-pressed","true");
      b.textContent = ENT_LABELS[state.entMode];
      b.addEventListener("click", function(){
        var idx = ENT_MODES.indexOf(state.entMode);
        state.entMode = ENT_MODES[(idx + 1) % ENT_MODES.length];
        b.textContent = ENT_LABELS[state.entMode];
        run();
      });
      optsHolder.appendChild(b);
    }

    if (state.mode === "unicode-enc"){
      mkToggle("uniAll","\u2200 escape ASCII too");
    } else if (state.mode === "entity-enc"){
      mkCycle();
      mkToggle("entAll","\u2200 escape non-ASCII");
    }
  }

  /* ---- named entity table (name -> codepoint), inverted for encoding ---- */
  var ENTITY_CP = {
    nbsp:160,iexcl:161,cent:162,pound:163,curren:164,yen:165,brvbar:166,sect:167,uml:168,copy:169,ordf:170,laquo:171,not:172,shy:173,reg:174,macr:175,deg:176,plusmn:177,sup2:178,sup3:179,acute:180,micro:181,para:182,middot:183,cedil:184,sup1:185,ordm:186,raquo:187,frac14:188,frac12:189,frac34:190,iquest:191,
    Agrave:192,Aacute:193,Acirc:194,Atilde:195,Auml:196,Aring:197,AElig:198,Ccedil:199,Egrave:200,Eacute:201,Ecirc:202,Euml:203,Igrave:204,Iacute:205,Icirc:206,Iuml:207,ETH:208,Ntilde:209,Ograve:210,Oacute:211,Ocirc:212,Otilde:213,Ouml:214,times:215,Oslash:216,Ugrave:217,Uacute:218,Ucirc:219,Uuml:220,Yacute:221,THORN:222,szlig:223,
    agrave:224,aacute:225,acirc:226,atilde:227,auml:228,aring:229,aelig:230,ccedil:231,egrave:232,eacute:233,ecirc:234,euml:235,igrave:236,iacute:237,icirc:238,iuml:239,eth:240,ntilde:241,ograve:242,oacute:243,ocirc:244,otilde:245,ouml:246,divide:247,oslash:248,ugrave:249,uacute:250,ucirc:251,uuml:252,yacute:253,thorn:254,yuml:255,
    OElig:338,oelig:339,Scaron:352,scaron:353,Yuml:376,fnof:402,circ:710,tilde:732,ensp:8194,emsp:8195,thinsp:8201,zwnj:8204,zwj:8205,lrm:8206,rlm:8207,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,sbquo:8218,ldquo:8220,rdquo:8221,bdquo:8222,dagger:8224,Dagger:8225,bull:8226,hellip:8230,permil:8240,prime:8242,Prime:8243,lsaquo:8249,rsaquo:8250,oline:8254,frasl:8260,euro:8364,
    image:8465,weierp:8472,real:8476,trade:8482,alefsym:8501,larr:8592,uarr:8593,rarr:8594,darr:8595,harr:8596,crarr:8629,lArr:8656,uArr:8657,rArr:8658,dArr:8659,hArr:8660,
    forall:8704,part:8706,exist:8707,empty:8709,nabla:8711,isin:8712,notin:8713,ni:8715,prod:8719,sum:8721,minus:8722,lowast:8727,radic:8730,prop:8733,infin:8734,ang:8736,and:8743,or:8744,cap:8745,cup:8746,int:8747,there4:8756,sim:8764,cong:8773,asymp:8776,ne:8800,equiv:8801,le:8804,ge:8805,sub:8834,sup:8835,nsub:8836,sube:8838,supe:8839,oplus:8853,otimes:8855,perp:8869,sdot:8901,
    lceil:8968,rceil:8969,lfloor:8970,rfloor:8971,lang:9001,rang:9002,loz:9674,spades:9824,clubs:9827,hearts:9829,diams:9830
  };
  var CHAR_TO_ENTITY = {};
  for (var _name in ENTITY_CP){
    if (Object.prototype.hasOwnProperty.call(ENTITY_CP, _name)){
      CHAR_TO_ENTITY[ENTITY_CP[_name]] = _name;
    }
  }

  var DANGEROUS = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" };

  /* ---- unicode ---- */
  function hex4(n){ return ("0000" + n.toString(16)).slice(-4); }

  function unicodeEncode(src, escapeAll){
    var out = "", esc = 0, nonAscii = 0;
    for (var i = 0; i < src.length; i++){
      var cp = src.codePointAt(i);
      if (cp > 0xFFFF) i++;
      if (cp > 127) nonAscii++;
      if (cp > 127 || escapeAll){
        esc++;
        if (cp > 0xFFFF){
          var v = cp - 0x10000;
          var hi = 0xD800 + (v >> 10), lo = 0xDC00 + (v & 0x3FF);
          out += "\\u" + hex4(hi) + "\\u" + hex4(lo);
        } else {
          out += "\\u" + hex4(cp);
        }
      } else {
        out += String.fromCodePoint(cp);
      }
    }
    return { out: out, esc: esc, nonAscii: nonAscii };
  }

  function unicodeDecode(src){
    var decoded = 0, left = 0;
    var out = src.replace(/\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})/g, function(m, brace, plain){
      if (brace){
        var cp = parseInt(brace, 16);
        if (isNaN(cp) || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)){ left++; return m; }
        decoded++;
        return String.fromCodePoint(cp);
      } else {
        decoded++;
        return String.fromCharCode(parseInt(plain, 16));
      }
    });
    return { out: out, decoded: decoded, left: left };
  }

  /* ---- html entities ---- */
  function entityEncode(src, mode, escapeNonAscii){
    var out = "", written = 0;
    for (var i = 0; i < src.length; i++){
      var cp = src.codePointAt(i);
      if (cp > 0xFFFF) i++;
      var ch = String.fromCodePoint(cp);
      if (DANGEROUS[ch]){ out += DANGEROUS[ch]; written++; continue; }
      if (cp > 127 && escapeNonAscii){
        written++;
        if (mode === "named" && CHAR_TO_ENTITY[cp]) out += "&" + CHAR_TO_ENTITY[cp] + ";";
        else if (mode === "hex") out += "&#x" + cp.toString(16) + ";";
        else out += "&#" + cp + ";";
        continue;
      }
      out += ch;
    }
    return { out: out, written: written };
  }

  var entityMemo = {};
  function singleEntityToChar(ent){
    if (Object.prototype.hasOwnProperty.call(entityMemo, ent)) return entityMemo[ent];
    var ta = document.createElement("textarea");
    ta.innerHTML = ent;
    var v = ta.value;
    var result = (v === ent) ? null : v;
    entityMemo[ent] = result;
    return result;
  }

  function entityDecode(src){
    var decoded = 0, left = 0;
    var out = src.replace(/&(?:#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, function(m){
      var ch = singleEntityToChar(m);
      if (ch === null){ left++; return m; }
      decoded++;
      return ch;
    });
    return { out: out, decoded: decoded, left: left };
  }

  /* ---- ascii ---- */
  function asciiEncode(src){
    var codes = [], oor = 0;
    for (var i = 0; i < src.length; i++){
      var c = src.charCodeAt(i);
      if (c > 127){ oor++; codes.push("?"); }
      else codes.push(c);
    }
    return { out: codes.join(" "), codes: codes.length, oor: oor };
  }

  function asciiDecode(src){
    var tokens = src.split(/[\s,;]+/).filter(Boolean);
    var chars = [], bad = 0;
    tokens.forEach(function(t){
      if (/^\d{1,3}$/.test(t) && +t <= 127) chars.push(String.fromCharCode(+t));
      else bad++;
    });
    return { out: chars.join(""), tokens: tokens.length, bad: bad, ok: chars.length };
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var out = "", stats = ["0","0","0","0"];

    switch (state.mode){
      case "unicode-enc": {
        if (src.length){
          var r1 = unicodeEncode(src, state.uniAll);
          out = r1.out;
          stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(r1.esc), fmtNum(r1.nonAscii)];
        }
        break;
      }
      case "unicode-dec": {
        if (src.length){
          var r2 = unicodeDecode(src);
          out = r2.out;
          stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(r2.decoded), fmtNum(r2.left)];
        }
        break;
      }
      case "entity-enc": {
        if (src.length){
          var r3 = entityEncode(src, state.entMode, state.entAll);
          out = r3.out;
          stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(r3.written), state.entMode.toUpperCase()];
        } else {
          stats = ["0","0","0", state.entMode.toUpperCase()];
        }
        break;
      }
      case "entity-dec": {
        if (src.length){
          var r4 = entityDecode(src);
          out = r4.out;
          stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(r4.decoded), fmtNum(r4.left)];
        }
        break;
      }
      case "ascii-enc": {
        if (src.length){
          var r5 = asciiEncode(src);
          out = r5.out;
          stats = [fmtNum(src.length), fmtNum(r5.codes), fmtNum(r5.oor), fmtNum(r5.codes - r5.oor)];
        }
        break;
      }
      case "ascii-dec": {
        if (src.length){
          var r6 = asciiDecode(src);
          out = r6.out;
          stats = [fmtNum(r6.tokens), fmtNum(r6.ok), fmtNum(r6.bad), "0\u2013127"];
        } else {
          stats = ["0","0","0","0\u2013127"];
        }
        break;
      }
    }

    lastOut = out;
    outTa.value = out;
    badgeOut.textContent = fmtNum(out.length) + " CHARS";
    badgeIn.textContent = fmtNum(src.length) + " CHARS";
    vsBadge.textContent = GLYPHS[state.mode];
    for (var i = 0; i < 4; i++) setStat(sv[i], stats[i]);
  }

  function setMode(m){
    state.mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    srcIn.placeholder = PLACEHOLDERS[m] || "";
    setModeLabels();
    renderOpts();
    if (srcIn.value === ""){ srcIn.value = SAMPLES[m] || ""; }
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

  /* ---- swap: round trip ---- */
  btnSwap.addEventListener("click", function(){
    if (!lastOut){ flash(btnSwap, "OUTPUT EMPTY", true); return; }
    srcIn.value = lastOut;
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
    if (!lastOut){ flash(btn, "OUTPUT EMPTY", true); return; }
    copyToClipboard(lastOut, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-clear-in").addEventListener("click", function(){
    srcIn.value = "";
    run();
    srcIn.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    srcIn.value = SAMPLES[state.mode] || "";
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLES["unicode-enc"];
  srcIn.placeholder = PLACEHOLDERS["unicode-enc"];
  setModeLabels();
  renderOpts();
  run();
})();
