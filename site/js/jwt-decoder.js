
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

  /* ================= JWT ENGINE ================= */
  var srcIn    = $("#src-in");
  var bdIn     = $("#bd-in");
  var jwtOut   = $("#jwt-out");
  var badgeIn  = $("#badge-in");
  var badgeOut = $("#badge-out");
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];

  var state = { pretty: true };
  var lastHeaderJSON = "";
  var lastPayloadJSON = "";

  var SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrZWVwZXItMDEiLCJzaXRlIjoiQ2FsbG93YXkgUmlkZ2UiLCJpYXQiOjE3NTEzMjgwMDAsImV4cCI6MTgxNDQwMDAwMH0.k7Qx0J3mVtRz8wYpLq2Ns5HdGfBcXaEiOu1ZvT4jMnW";

  var SAMPLE_CLASSIC = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

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

  /* ---- deck option ---- */
  (function renderOpts(){
    var holder = $("#opts-holder");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tgl";
    b.setAttribute("aria-pressed", String(state.pretty));
    b.textContent = "\u00B6 pretty JSON";
    b.addEventListener("click", function(){
      state.pretty = !state.pretty;
      b.setAttribute("aria-pressed", String(state.pretty));
      run();
    });
    holder.appendChild(b);
  })();

  /* ---- base64url + utf-8 ---- */
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

  function b64urlDecode(seg){
    var s = seg.replace(/-/g,"+").replace(/_/g,"/");
    var rem = s.length % 4;
    if (rem === 1) return null;
    if (rem === 2) s += "==";
    else if (rem === 3) s += "=";
    if (!/^[A-Za-z0-9+\/]*={0,2}$/.test(s)) return null;
    var bin;
    try { bin = atob(s); } catch(err){ return null; }
    var bytes = [];
    for (var i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
    var text = utf8ToString(bytes);
    if (text === null){
      text = "";
      for (var j = 0; j < bytes.length; j++) text += String.fromCharCode(bytes[j]);
    }
    return text;
  }

  function tryJSON(text){
    if (text === null) return { ok:false };
    try {
      var v = JSON.parse(text);
      if (v && typeof v === "object" && !Array.isArray(v)) return { ok:true, value:v };
      return { ok:false };
    } catch(err){ return { ok:false }; }
  }

  /* ---- token analysis ---- */
  function analyzeToken(src){
    var r = { ok:false, segmentCount:0, error:null, header:null, payload:null,
              headerText:null, payloadText:null, sig:null, alg:null, ms:0 };
    var trimmed = src.replace(/\s+/g,"");
    if (!trimmed) return r;
    var t0 = performance.now();
    var parts = trimmed.split(".");
    r.segmentCount = parts.length;

    if (parts.length !== 3){
      r.error = "expected 3 base64url segments joined by dots \u2014 found " + parts.length;
      if (parts[0]){
        var h0 = b64urlDecode(parts[0]);
        var hj = tryJSON(h0);
        if (hj.ok){ r.header = hj.value; r.headerText = h0; r.alg = hj.value.alg || null; }
      }
      if (parts.length > 1 && parts[1]){
        var p0 = b64urlDecode(parts[1]);
        var pj = tryJSON(p0);
        if (pj.ok){ r.payload = pj.value; r.payloadText = p0; }
      }
      r.ms = performance.now() - t0;
      return r;
    }

    var hText = b64urlDecode(parts[0]);
    if (hText === null){ r.error = "the header segment is not valid base64url"; r.ms = performance.now() - t0; return r; }
    var pText = b64urlDecode(parts[1]);
    if (pText === null){ r.error = "the payload segment is not valid base64url"; r.headerText = hText; var hj2 = tryJSON(hText); if (hj2.ok){ r.header = hj2.value; r.alg = hj2.value.alg || null; } r.ms = performance.now() - t0; return r; }

    var hj = tryJSON(hText);
    var pj = tryJSON(pText);
    if (!hj.ok){ r.error = "the header decodes but is not valid JSON"; r.ms = performance.now() - t0; return r; }
    if (!pj.ok){ r.error = "the payload decodes but is not valid JSON"; r.header = hj.value; r.headerText = hText; r.alg = hj.value.alg || null; r.ms = performance.now() - t0; return r; }

    r.ok = true;
    r.header = hj.value; r.headerText = hText;
    r.payload = pj.value; r.payloadText = pText;
    r.sig = parts[2];
    r.alg = hj.value.alg || null;
    r.ms = performance.now() - t0;
    return r;
  }

  /* ---- time helpers ---- */
  function longRel(ms){
    var diff = ms - Date.now();
    var future = diff > 0;
    var s = Math.abs(diff) / 1000;
    var v, u;
    if (s < 90){ v = Math.round(s); u = "second"; }
    else if (s < 5400){ v = Math.round(s / 60); u = "minute"; }
    else if (s < 129600){ v = Math.round(s / 3600); u = "hour"; }
    else if (s < 3888000){ v = Math.round(s / 86400); u = "day"; }
    else if (s < 47304000){ v = Math.round(s / 2592000); u = "month"; }
    else { v = Math.round(s / 31536000); u = "year"; }
    if (v !== 1) u += "s";
    return future ? "in " + v + " " + u : v + " " + u + " ago";
  }

  function shortRel(ms){
    var diff = ms - Date.now();
    var future = diff > 0;
    var s = Math.abs(diff) / 1000;
    var v, u;
    if (s < 90){ v = Math.round(s); u = "s"; }
    else if (s < 5400){ v = Math.round(s / 60); u = "m"; }
    else if (s < 129600){ v = Math.round(s / 3600); u = "h"; }
    else if (s < 3888000){ v = Math.round(s / 86400); u = "d"; }
    else if (s < 47304000){ v = Math.round(s / 2592000); u = "mo"; }
    else { v = Math.round(s / 31536000); u = "y"; }
    return future ? "in " + v + u : v + u + " ago";
  }

  function utcDate(sec){
    return new Date(sec * 1000).toUTCString().slice(0, 16) + " UTC";
  }

  /* ---- claim rendering ---- */
  var CLAIM_NAMES = { iss:"Issuer", sub:"Subject", aud:"Audience", jti:"JWT ID" };

  function claimHuman(key, val){
    if (key === "exp" || key === "nbf" || key === "iat"){
      if (typeof val === "number" && isFinite(val)){
        var ms = val * 1000;
        if (key === "exp"){
          var expired = ms < Date.now();
          return "Expires " + utcDate(val) + " \u00B7 " +
            (expired ? '<b class="cl-bad">EXPIRED ' + longRel(ms) + '</b>'
                     : '<b class="cl-ok">VALID \u00B7 ' + longRel(ms) + '</b>');
        }
        if (key === "nbf"){
          var notYet = ms > Date.now();
          return "Not before " + utcDate(val) + " \u00B7 " +
            (notYet ? '<b class="cl-bad">NOT YET VALID</b>' : '<b class="cl-ok">ACTIVE</b>');
        }
        return "Issued " + utcDate(val) + " \u00B7 " + longRel(ms);
      }
      return "Unix seconds expected \u2014 this value is not a number";
    }
    if (CLAIM_NAMES[key]) return CLAIM_NAMES[key];
    return "custom claim";
  }

  function claimsTable(payload){
    var rows = "";
    for (var key in payload){
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
      var val = payload[key];
      var raw = typeof val === "string" ? val : JSON.stringify(val);
      rows += "<tr><td>" + escHtml(key) + "</td><td>" + escHtml(raw) + "</td><td>" + claimHuman(key, val) + "</td></tr>";
    }
    return '<table class="j-claims">' + rows + "</table>";
  }

  /* ---- segment painting ---- */
  function paintSegments(src){
    if (!src){ bdIn.innerHTML = ""; return; }
    var parts = src.split(".");
    var colors = ["seg-h","seg-p","seg-s"];
    var html = "";
    for (var i = 0; i < parts.length; i++){
      var cls = i < 3 ? colors[i] : "seg-x";
      html += '<mark class="' + cls + '">' + escHtml(parts[i]) + "</mark>";
      if (i < parts.length - 1) html += '<span class="seg-dot">.</span>';
    }
    bdIn.innerHTML = html;
  }
  srcIn.addEventListener("scroll", function(){
    bdIn.scrollTop = srcIn.scrollTop;
    bdIn.scrollLeft = srcIn.scrollLeft;
  }, {passive:true});

  /* ---- output rendering ---- */
  function jsonBlock(obj){
    return state.pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }

  function renderOutput(src, r){
    lastHeaderJSON = r.header ? jsonBlock(r.header) : "";
    lastPayloadJSON = r.payload ? jsonBlock(r.payload) : "";

    if (!src.trim()){
      badgeOut.textContent = "\u2014 IDLE";
      badgeOut.classList.remove("bad");
      jwtOut.innerHTML = '<div class="j-empty">paste a token on the left \u2014<br>header, payload and signature decode as you type,<br>two dots are all it takes to split the story</div>';
      return;
    }

    var html = "";
    var algNone = r.alg && String(r.alg).toLowerCase() === "none";

    if (r.ok){
      html += '<div class="j-verdict"><span class="j-vmark">\u2713</span><div><b>STRUCTURE VALID</b><span>' +
        '3 segments \u00B7 ' + fmtNum(src.trim().length) + ' chars \u00B7 parsed in ' + r.ms.toFixed(2) + ' ms</span></div>' +
        (r.alg ? '<span class="j-alg' + (algNone ? ' j-alg-none' : '') + '">' + escHtml(String(r.alg)) + (algNone ? ' \u00B7 UNSIGNED!' : '') + '</span>' : '') +
        '</div>';
    } else {
      html += '<div class="j-verdict j-bad"><span class="j-vmark">\u2715</span><div><b>NOT A VALID JWT</b><span>' + escHtml(r.error || "could not decode") + '</span></div>' +
        (r.alg ? '<span class="j-alg">' + escHtml(String(r.alg)) + '</span>' : '') + '</div>';
    }

    if (r.header){
      html += '<div class="j-block"><div class="j-bhead"><span class="j-dot j-dot-h"></span>HEADER \u00B7 ALGORITHM &amp; TOKEN TYPE<span class="j-copy" data-copy="header">\u29C9 copy</span></div>' +
        '<pre class="j-json">' + escHtml(jsonBlock(r.header)) + "</pre></div>";
    }

    if (r.payload){
      html += '<div class="j-block"><div class="j-bhead"><span class="j-dot j-dot-p"></span>PAYLOAD \u00B7 CLAIMS<span class="j-copy" data-copy="payload">\u29C9 copy</span></div>' +
        '<pre class="j-json">' + escHtml(jsonBlock(r.payload)) + "</pre>" +
        claimsTable(r.payload) + "</div>";
    }

    if (r.ok && r.sig !== null){
      var sigNote = r.sig === ""
        ? "The signature segment is <b>empty</b> \u2014 consistent with alg: none, an unsigned token. Any server should reject it."
        : "Verifying this signature requires the secret or public key. This bench checks structure only \u2014 it never asks for your secret and never sends the token anywhere.";
      html += '<div class="j-block"><div class="j-bhead"><span class="j-dot j-dot-s"></span>SIGNATURE \u00B7 ' + (r.sig === "" ? "EMPTY" : "UNVERIFIED") + '</div>' +
        '<pre class="j-sig">' + (r.sig === "" ? "\u2205 \u2014 zero bytes" : escHtml(r.sig)) + "</pre>" +
        '<p class="j-snote">' + sigNote + "</p></div>";
    }

    badgeOut.textContent = r.ok ? "\u2713 VALID" : "\u2715 INVALID";
    badgeOut.classList.toggle("bad", !r.ok);
    jwtOut.innerHTML = html;
  }

  /* copy buttons inside the output */
  jwtOut.addEventListener("click", function(e){
    var btn = e.target.closest(".j-copy");
    if (!btn) return;
    var which = btn.getAttribute("data-copy");
    var text = which === "header" ? lastHeaderJSON : lastPayloadJSON;
    var original = btn.textContent;
    function done(){
      btn.textContent = "COPIED \u2713";
      setTimeout(function(){ btn.textContent = original; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, done);
    } else { done(); }
  });

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    paintSegments(src);
    var r = analyzeToken(src);
    renderOutput(src, r);

    sv[1].classList.remove("bad");
    sv[3].classList.remove("good","bad");

    var segStat = src.trim() ? (r.ok ? "3/3" : Math.min(r.segmentCount, 3) + "/3") : "0/3";
    var algStat = r.alg ? String(r.alg) : "\u2014";
    if (r.alg && String(r.alg).toLowerCase() === "none"){ algStat = "NONE!"; sv[1].classList.add("bad"); }

    var iatStat = "\u2014";
    var expStat = "\u2014";
    if (r.payload){
      if (typeof r.payload.iat === "number" && isFinite(r.payload.iat)) iatStat = shortRel(r.payload.iat * 1000);
      if (typeof r.payload.exp === "number" && isFinite(r.payload.exp)){
        var expired = r.payload.exp * 1000 < Date.now();
        expStat = expired ? "EXPIRED" : shortRel(r.payload.exp * 1000);
        sv[3].classList.add(expired ? "bad" : "good");
      } else if (r.ok){
        expStat = "NEVER";
      }
    }

    setStat(sv[0], segStat);
    setStat(sv[1], algStat);
    setStat(sv[2], iatStat);
    setStat(sv[3], expStat);
    badgeIn.textContent = fmtNum(src.length) + " CHARS";
  }

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

  /* ---- pane actions ---- */
  $("#btn-copy-in").addEventListener("click", function(){
    var btn = $("#btn-copy-in");
    if (!srcIn.value){ flash(btn, "INPUT EMPTY", true); return; }
    copyToClipboard(srcIn.value, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-copy-header").addEventListener("click", function(){
    var btn = $("#btn-copy-header");
    if (!lastHeaderJSON){ flash(btn, "NO HEADER", true); return; }
    copyToClipboard(lastHeaderJSON, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-copy-payload").addEventListener("click", function(){
    var btn = $("#btn-copy-payload");
    if (!lastPayloadJSON){ flash(btn, "NO PAYLOAD", true); return; }
    copyToClipboard(lastPayloadJSON, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-clear-in").addEventListener("click", function(){
    srcIn.value = "";
    run();
    srcIn.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    srcIn.value = SAMPLE_TOKEN;
    run();
    srcIn.focus();
  });
  $("#btn-classic").addEventListener("click", function(){
    srcIn.value = SAMPLE_CLASSIC;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = SAMPLE_TOKEN;
  run();
})();
