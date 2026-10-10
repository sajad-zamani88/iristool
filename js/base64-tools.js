
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

  /* ================= BASE64 ENGINE ================= */
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

  var mode = "encode";
  var lastOutText = "";
  var state = { wrap: false, urlSafe: false, ignoreWS: true };

  var SAMPLE_ENCODE = 'Night Sky Atlas \u2014 field notes\nObserver: M. Calloway \u00B7 Site: Calloway Ridge (44.26\u00B0N)\n22:14 \u2014 Vega overhead, seeing 3/5, humidity 61%\n23:02 \u2014 Perseid meteor, magnitude -2, trail 12\u00B0\n00:47 \u2014 Aurora! Faint green arc to the north.';

  var SAMPLE_DECODE = 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4gUGFja2VkIGJ5IG15\nIGpld2VsIGNvZmZlciB3aXRoIHF1aXR0aW5nIGJveGVzLiBCYXNlNjQgc2hpcHMgYnl0ZXMgdGhy\nb3VnaCB0ZXh0LW9ubHkgY2hhbm5lbHMg4oCUIGV2ZXJ5IDMgYnl0ZXMgYmVjb21lIDQgY2hhcmFj\ndGVycy4=\ncGF5bG9hZCAjNzogwqtuaWdodCBza3nCuyDigJQgMTAwJSBjbGVhciDinJM';

  var PLACEHOLDERS = {
    encode: "Paste text here \u2014 every character becomes UTF-8 bytes, then Base64\u2026",
    decode: "Paste Base64 here \u2014 wrapped lines, URL-safe alphabet and padding all handled\u2026"
  };

  var B64_STD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var B64_URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

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
    if (mode === "decode"){
      return {
        glyph:"\u25A5",
        labels:["Characters in","Bytes out","Discarded","UTF-8 verdict"],
        subs:["BASE64 SOURCE","DECODED TEXT","NON-ALPHABET CHARS","CLEAN \u00B7 LOSSY"]
      };
    }
    return {
      glyph:"\u25A4",
      labels:["Characters in","Characters out","Bytes encoded","Size change"],
      subs:["RAW TEXT","BASE64","UTF-8 SOURCE","+33% IS TYPICAL"]
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

    if (mode === "encode"){
      mkToggle("wrap","\u23CE wrap at 76");
      mkToggle("urlSafe","-_ URL-safe");
    } else {
      mkToggle("ignoreWS","\u2423 ignore whitespace");
    }
  }

  /* ---- UTF-8 helpers ---- */
  function utf8Bytes(cp){
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F)];
  }

  function strToUtf8(s){
    var bytes = [];
    for (var i = 0; i < s.length; i++){
      var cp = s.codePointAt(i);
      if (cp > 0xFFFF) i++;
      var b = utf8Bytes(cp);
      for (var j = 0; j < b.length; j++) bytes.push(b[j]);
    }
    return bytes;
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
  function base64Encode(bytes, urlSafe){
    var alpha = urlSafe ? B64_URL : B64_STD;
    var pad = urlSafe ? "" : "=";
    var out = "";
    var n = bytes.length;
    for (var i = 0; i < n; i += 3){
      var b1 = bytes[i];
      var b2 = (i + 1 < n) ? bytes[i + 1] : -1;
      var b3 = (i + 2 < n) ? bytes[i + 2] : -1;
      out += alpha.charAt(b1 >> 2);
      out += alpha.charAt(((b1 & 3) << 4) | (b2 === -1 ? 0 : b2 >> 4));
      out += (b2 === -1) ? pad : alpha.charAt(((b2 & 15) << 2) | (b3 === -1 ? 0 : b3 >> 6));
      out += (b3 === -1) ? pad : alpha.charAt(b3 & 63);
    }
    return out;
  }

  /* ---- decoder ---- */
  function base64Decode(src, ignoreWS){
    var s = ignoreWS ? src.replace(/\s/g, "") : src;
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    var invalid = 0;
    var clean = "";
    for (var i = 0; i < s.length; i++){
      var c = s.charAt(i);
      if (c === "=") continue;
      if (B64_STD.indexOf(c) !== -1) clean += c;
      else invalid++;
    }
    var rem = clean.length % 4;
    if (rem === 1){
      invalid++;
      clean = clean.slice(0, clean.length - 1);
    } else if (rem === 2){
      clean += "==";
    } else if (rem === 3){
      clean += "=";
    }
    var bytes = [];
    for (var j = 0; j < clean.length; j += 4){
      var c1 = B64_STD.indexOf(clean.charAt(j));
      var c2 = B64_STD.indexOf(clean.charAt(j + 1));
      var c3 = clean.charAt(j + 2);
      var c4 = clean.charAt(j + 3);
      bytes.push((c1 << 2) | (c2 >> 4));
      if (c3 !== "=") bytes.push(((c2 & 15) << 4) | (B64_STD.indexOf(c3) >> 2));
      if (c4 !== "=") bytes.push(((B64_STD.indexOf(c3) & 3) << 6) | B64_STD.indexOf(c4));
    }
    var text = utf8ToString(bytes);
    var lossy = false;
    if (text === null){
      lossy = true;
      text = "";
      for (var k = 0; k < bytes.length; k++) text += String.fromCharCode(bytes[k]);
    }
    return { out: text, bytesOut: bytes.length, invalid: invalid, lossy: lossy };
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var stats = ["0","0","0","0"];
    var cfg = modeCfg();
    var out = "";

    sv[3].classList.remove("good","bad");

    if (mode === "encode"){
      if (src.length){
        var bytes = strToUtf8(src);
        var raw = base64Encode(bytes, state.urlSafe);
        out = (state.wrap && raw.length > 76) ? raw.match(/.{1,76}/g).join("\n") : raw;
        var change = bytes.length ? "+" + Math.round(((raw.length - bytes.length) / bytes.length) * 100) + "%" : "0%";
        stats = [fmtNum(src.length), fmtNum(out.length), fmtNum(bytes.length), change];
      } else {
        stats = ["0","0","0","0%"];
      }
    } else {
      if (src.trim()){
        var dec = base64Decode(src, state.ignoreWS);
        out = dec.out;
        var verdict = dec.lossy ? "LOSSY" : "CLEAN";
        sv[3].classList.add(dec.lossy ? "bad" : "good");
        stats = [fmtNum(src.length), fmtNum(dec.bytesOut), fmtNum(dec.invalid), verdict];
      } else {
        stats = ["0","0","0","\u2014"];
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
      srcIn.value = (m === "decode") ? SAMPLE_DECODE : SAMPLE_ENCODE;
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
    srcIn.value = (mode === "decode") ? SAMPLE_DECODE : SAMPLE_ENCODE;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_ENCODE;
  srcIn.placeholder = PLACEHOLDERS.encode;
  setModeLabels();
  renderOpts();
  run();
})();
