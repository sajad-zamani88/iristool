
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

  /* ================= URL ENGINE ================= */
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

  var mode = "encoder";
  var lastOutText = "";
  var state = { encMode: "component", plusSpace: true };

  var SAMPLE_ENCODE = 'https://IrisTool.com/search?q=night sky&tags=\u0633\u062A\u0627\u0631\u0647,\u0645\u0627\u0647&note=100% in stock (today)\nplain value: price = 19.99 \u20AC \u00B7 path /api/v2?x=1#top \u00B7 telescope \uD83D\uDD2D';

  var SAMPLE_DECODE = 'https://IrisTool.com/search?q=night%20sky&tags=%D8%B3%D8%AA%D8%A7%D8%B1%D9%87%2C%D9%85%D8%A7%D9%87&emoji=%F0%9F%94%AD&note=100%25+in+stock\nemail=jane%40example.com&path=%2Fapi%2Fv2%2Freport&broken=%ZZ&half=%2';

  var PLACEHOLDERS = {
    encoder: "Paste text or a whole URL \u2014 spaces, & and Persian all get percent-safe\u2026",
    decoder: "Paste a percent-encoded URL \u2014 %D8%B3 becomes \u0633, + becomes space\u2026"
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
    if (mode === "decoder"){
      return {
        glyph:"\u21A9",
        labels:["Characters in","Characters out","Sequences decoded","Left as-is"],
        subs:["ENCODED SOURCE","READABLE TEXT","%XX RUNS + PLUS","MALFORMED %"]
      };
    }
    return {
      glyph:"%",
      labels:["Characters in","Characters out","Chars encoded","Encoding mode"],
      subs:["RAW TEXT","PERCENT-SAFE","TURNED INTO %XX","COMPONENT \u00B7 URI \u00B7 FORM"]
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
  var ENC_MODES = ["component","uri","form"];
  var ENC_LABELS = { component:"MODE \u00B7 COMPONENT", uri:"MODE \u00B7 FULL URI", form:"MODE \u00B7 FORM +" };
  var ENC_SHORT  = { component:"COMPONENT", uri:"FULL URI", form:"FORM +" };

  function renderOpts(){
    optsHolder.textContent = "";

    if (mode === "encoder"){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tgl cyc";
      b.setAttribute("aria-pressed","true");
      b.textContent = ENC_LABELS[state.encMode];
      b.addEventListener("click", function(){
        var idx = ENC_MODES.indexOf(state.encMode);
        state.encMode = ENC_MODES[(idx + 1) % ENC_MODES.length];
        b.textContent = ENC_LABELS[state.encMode];
        run();
      });
      optsHolder.appendChild(b);
    } else {
      var t = document.createElement("button");
      t.type = "button";
      t.className = "tgl";
      t.setAttribute("aria-pressed", String(state.plusSpace));
      t.textContent = "\u229E plus \u2192 space";
      t.addEventListener("click", function(){
        state.plusSpace = !state.plusSpace;
        t.setAttribute("aria-pressed", String(state.plusSpace));
        run();
      });
      optsHolder.appendChild(t);
    }
  }

  /* ---- UTF-8 helpers ---- */
  function utf8Bytes(cp){
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  }

  function pct(b){
    return "%" + ("0" + b.toString(16).toUpperCase()).slice(-2);
  }

  function utf8ToString(bytes){
    var out = "", i = 0;
    while (i < bytes.length){
      var b = bytes[i];
      var len = b < 0x80 ? 1 : (b >= 0xC2 && b <= 0xDF) ? 2 : (b >= 0xE0 && b <= 0xEF) ? 3 : (b >= 0xF0 && b <= 0xF4) ? 4 : 0;
      if (!len || i + len > bytes.length) return null;
      var cp = b & (len === 1 ? 0x7F : (0x7F >> len));
      for (var k = 1; k < len; k++){
        if ((bytes[i + k] & 0xC0) !== 0x80) return null;
        cp = (cp << 6) | (bytes[i + k] & 0x3F);
      }
      if (len === 2 && cp < 0x80) return null;
      if (len === 3 && cp < 0x800) return null;
      if (len === 4 && cp < 0x10000) return null;
      if (cp >= 0xD800 && cp <= 0xDFFF) return null;
      out += String.fromCodePoint(cp);
      i += len;
    }
    return out;
  }

  /* ---- encoder ---- */
  var COMP_KEEP = /[A-Za-z0-9\-_.!~*'()]/;
  var URI_KEEP  = /[A-Za-z0-9;,\/?:@&=+$\-_.!~*'()#\[\]]/;
  var FORM_KEEP = /[A-Za-z0-9\-_.*]/;

  function encodeURL(src, encMode){
    var out = "", encoded = 0;
    for (var i = 0; i < src.length; i++){
      var cp = src.codePointAt(i);
      if (cp > 0xFFFF) i++;
      var ch = String.fromCodePoint(cp);
      if (encMode === "component"){
        if (cp < 128 && COMP_KEEP.test(ch)){ out += ch; }
        else { out += utf8Bytes(cp).map(pct).join(""); encoded++; }
      } else if (encMode === "uri"){
        if (cp < 128 && URI_KEEP.test(ch)){ out += ch; }
        else { out += utf8Bytes(cp).map(pct).join(""); encoded++; }
      } else { /* form */
        if (ch === " "){ out += "+"; encoded++; }
        else if (cp < 128 && FORM_KEEP.test(ch)){ out += ch; }
        else { out += utf8Bytes(cp).map(pct).join(""); encoded++; }
      }
    }
    return { out: out, encoded: encoded };
  }

  /* ---- decoder ---- */
  function decodeURL(src, plusSpace){
    var HEX = /[0-9a-fA-F]/;
    var out = "", decoded = 0, bad = 0;
    var i = 0, n = src.length;
    while (i < n){
      var c = src.charAt(i);
      if (c === "%"){
        if (i + 2 < n && HEX.test(src.charAt(i + 1)) && HEX.test(src.charAt(i + 2))){
          var bytes = [];
          var j = i;
          while (j + 2 < n && src.charAt(j) === "%" && HEX.test(src.charAt(j + 1)) && HEX.test(src.charAt(j + 2))){
            bytes.push(parseInt(src.substr(j + 1, 2), 16));
            j += 3;
          }
          var s = utf8ToString(bytes);
          if (s !== null){
            out += s;
            decoded += bytes.length;
            i = j;
          } else {
            out += String.fromCharCode(bytes[0]);
            decoded++;
            i += 3;
          }
          continue;
        }
        bad++;
        out += c;
        i++;
        continue;
      }
      if (c === "+" && plusSpace){
        out += " ";
        decoded++;
        i++;
        continue;
      }
      out += c;
      i++;
    }
    return { out: out, decoded: decoded, bad: bad };
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var stats = ["0","0","0","0"];
    var cfg = modeCfg();
    var out = "";

    if (mode === "encoder"){
      if (src.length){
        var enc = encodeURL(src, state.encMode);
        out = enc.out;
        stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(enc.encoded), ENC_SHORT[state.encMode]];
      } else {
        stats = ["0","0","0", ENC_SHORT[state.encMode]];
      }
    } else {
      if (src.length){
        var dec = decodeURL(src, state.plusSpace);
        out = dec.out;
        stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(dec.decoded), fmtNum(dec.bad)];
      } else {
        stats = ["0","0","0","0"];
      }
    }

    lastOutText = out;
    outTa.value = out;
    badgeOut.textContent = fmtNum(out.length) + " CHARS";
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
    if (srcIn.value === ""){
      srcIn.value = (m === "decoder") ? SAMPLE_DECODE : SAMPLE_ENCODE;
    }
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
    srcIn.value = (mode === "decoder") ? SAMPLE_DECODE : SAMPLE_ENCODE;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_ENCODE;
  srcIn.placeholder = PLACEHOLDERS.encoder;
  setModeLabels();
  renderOpts();
  run();
})();
