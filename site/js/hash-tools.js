
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

  /* ================= HASH ENGINE ================= */
  var srcIn    = $("#src-in");
  var hashOut  = $("#hash-out");
  var badgeIn  = $("#badge-in");
  var badgeOut = $("#badge-out");
  var vsBadge  = $("#vs-badge");
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];

  var state = { algo:"md5", upper:false };
  var lastDigest = "";

  var FOX = "The quick brown fox jumps over the lazy dog";
  var SAMPLE_UNICODE = "\u0633\u062A\u0627\u0631\u0647\u200C\u0647\u0627 \u0647\u0631\u06AF\u0632 \u062E\u0627\u0645\u0648\u0634 \u0646\u0645\u06CC\u200C\u0634\u0648\u0646\u062F \u2605";

  var KNOWN = {
    md5:    "9e107d9d372bb6826bd81d3542a419d6",
    sha1:   "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12",
    sha256: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
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

  /* ---- UTF-8 ---- */
  function strToUtf8(s){
    var bytes = [];
    for (var i = 0; i < s.length; i++){
      var cp = s.codePointAt(i);
      if (cp > 0xFFFF) i++;
      if (cp < 0x80) bytes.push(cp);
      else if (cp < 0x800) bytes.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
      else if (cp < 0x10000) bytes.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      else bytes.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
    }
    return bytes;
  }

  /* ---- MD5 (RFC 1321) ---- */
  var MD5_K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
  ];
  var MD5_S = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
  ];

  function md5Bytes(bytes){
    function rotl(x, c){ return (x << c) | (x >>> (32 - c)); }
    var bitLen = bytes.length * 8;
    var p = bytes.slice();
    p.push(0x80);
    while (p.length % 64 !== 56) p.push(0);
    p.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff, 0, 0, 0, 0);

    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var M = new Array(16);

    for (var chunk = 0; chunk < p.length; chunk += 64){
      for (var j = 0; j < 16; j++){
        M[j] = p[chunk + j*4] | (p[chunk + j*4 + 1] << 8) | (p[chunk + j*4 + 2] << 16) | (p[chunk + j*4 + 3] << 24);
      }
      var A = a0, B = b0, C = c0, D = d0;
      for (var k = 0; k < 64; k++){
        var F, g;
        if (k < 16){ F = (B & C) | (~B & D); g = k; }
        else if (k < 32){ F = (D & B) | (~D & C); g = (5*k + 1) % 16; }
        else if (k < 48){ F = B ^ C ^ D; g = (3*k + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7*k) % 16; }
        F = (F + A + MD5_K[k] + M[g]) | 0;
        A = D; D = C; C = B;
        B = (B + rotl(F, MD5_S[k])) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }

    function leHex(w){
      var s = "";
      for (var b = 0; b < 4; b++){
        var byte = (w >>> (b * 8)) & 0xff;
        s += (byte >>> 4).toString(16) + (byte & 15).toString(16);
      }
      return s;
    }
    return leHex(a0) + leHex(b0) + leHex(c0) + leHex(d0);
  }

  /* ---- SHA-1 (FIPS 180-1) ---- */
  function sha1Bytes(bytes){
    function rotl(x, n){ return (x << n) | (x >>> (32 - n)); }
    var bitLen = bytes.length * 8;
    var p = bytes.slice();
    p.push(0x80);
    while (p.length % 64 !== 56) p.push(0);
    p.push(0,0,0,0);
    p.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

    var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    var w = new Array(80);

    for (var chunk = 0; chunk < p.length; chunk += 64){
      for (var t = 0; t < 16; t++){
        w[t] = (p[chunk + t*4] << 24) | (p[chunk + t*4 + 1] << 16) | (p[chunk + t*4 + 2] << 8) | p[chunk + t*4 + 3];
      }
      for (var t2 = 16; t2 < 80; t2++){
        w[t2] = rotl(w[t2-3] ^ w[t2-8] ^ w[t2-14] ^ w[t2-16], 1);
      }
      var a=H[0], b=H[1], c=H[2], d=H[3], e=H[4];
      for (var t3 = 0; t3 < 80; t3++){
        var f, k;
        if (t3 < 20){ f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (t3 < 40){ f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t3 < 60){ f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        var temp = (rotl(a,5) + f + e + k + w[t3]) | 0;
        e = d; d = c; c = rotl(b,30); b = a; a = temp;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0; H[4]=(H[4]+e)|0;
    }

    var hex = "";
    for (var i = 0; i < 5; i++){
      for (var b2 = 0; b2 < 4; b2++){
        var byte = (H[i] >>> (24 - b2*8)) & 0xff;
        hex += (byte >>> 4).toString(16) + (byte & 15).toString(16);
      }
    }
    return hex;
  }

  /* ---- SHA-256 (FIPS 180-4) ---- */
  var SHA256_K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  function sha256Bytes(bytes){
    function rotr(x, n){ return (x >>> n) | (x << (32 - n)); }
    var bitLen = bytes.length * 8;
    var p = bytes.slice();
    p.push(0x80);
    while (p.length % 64 !== 56) p.push(0);
    p.push(0,0,0,0);
    p.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var w = new Array(64);

    for (var chunk = 0; chunk < p.length; chunk += 64){
      for (var t = 0; t < 16; t++){
        w[t] = (p[chunk + t*4] << 24) | (p[chunk + t*4 + 1] << 16) | (p[chunk + t*4 + 2] << 8) | p[chunk + t*4 + 3];
      }
      for (var t2 = 16; t2 < 64; t2++){
        var s0 = rotr(w[t2-15],7) ^ rotr(w[t2-15],18) ^ (w[t2-15] >>> 3);
        var s1 = rotr(w[t2-2],17) ^ rotr(w[t2-2],19) ^ (w[t2-2] >>> 10);
        w[t2] = (w[t2-16] + s0 + w[t2-7] + s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t3 = 0; t3 < 64; t3++){
        var S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + SHA256_K[t3] + w[t3]) | 0;
        var S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h=g; g=f; f=e; e=(d+temp1)|0; d=c; c=b; b=a; a=(temp1+temp2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }

    var hex = "";
    for (var i = 0; i < 8; i++){
      for (var b2 = 0; b2 < 4; b2++){
        var byte = (H[i] >>> (24 - b2*8)) & 0xff;
        hex += (byte >>> 4).toString(16) + (byte & 15).toString(16);
      }
    }
    return hex;
  }

  /* ---- algorithm registry ---- */
  var ALGOS = {
    md5: {
      name:"MD5", bits:128, fn:md5Bytes,
      note:"<strong>Collision-broken since 2004</strong> and trivially forgeable today. Fine for checksums, cache keys and dedup where no attacker is involved \u2014 never for passwords, signatures or certificates."
    },
    sha1: {
      name:"SHA-1", bits:160, fn:sha1Bytes,
      note:"A real collision was demonstrated in 2017 (<strong>SHAttered</strong>) and it has been deprecated since. Keep it only for legacy compatibility and non-adversarial fingerprints \u2014 SHA-256 everywhere else."
    },
    sha256: {
      name:"SHA-256", bits:256, fn:sha256Bytes,
      note:"The current workhorse of the SHA-2 family \u2014 <strong>no practical attacks</strong> after two decades of scrutiny. The right default for signatures, integrity checks, blockchain and anything an attacker might care about."
    }
  };

  /* ---- deck option ---- */
  (function renderOpts(){
    var holder = $("#opts-holder");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tgl";
    b.setAttribute("aria-pressed", String(state.upper));
    b.textContent = "AA uppercase";
    b.addEventListener("click", function(){
      state.upper = !state.upper;
      b.setAttribute("aria-pressed", String(state.upper));
      run();
    });
    holder.appendChild(b);
  })();

  /* ---- digest rendering ---- */
  function renderDigest(hex){
    var html = "";
    for (var i = 0; i < hex.length; i += 2){
      if (i > 0 && i % 8 === 0) html += '<span class="h-gap"></span>';
      var pair = hex.substr(i, 2);
      var byteVal = parseInt(pair, 16);
      var cls = (i/2) % 2 ? "h-b1" : "h-b0";
      html += '<span class="h-byte ' + cls + '" title="byte ' + (i/2) + ' \u00B7 0x' + pair + ' \u00B7 ' + byteVal + '">' + pair + '</span>';
    }
    return html;
  }

  function renderOutput(src, bytes, algoKey, algo, hex, ms){
    var blocks = Math.floor((bytes.length + 8) / 64) + 1;
    var isFox = src === FOX;
    var matches = isFox && hex.toLowerCase() === KNOWN[algoKey];
    var empty = src.length === 0;
    var msStr = ms < 0.005 ? "&lt;0.01" : ms.toFixed(2);

    var html = "";
    html += '<div class="h-verdict"><span class="h-vmark">' + algo.bits + '</span><div><b>' + algo.name + ' DIGEST</b><span>' +
      algo.bits + '-bit \u00B7 ' + (algo.bits/8) + ' bytes \u00B7 ' + blocks + ' block' + (blocks === 1 ? '' : 's') + ' \u00B7 ' + msStr + ' ms</span></div>' +
      (matches ? '<span class="h-vector">\u2713 CLASSIC TEST VECTOR</span>' : '') + '</div>';

    html += '<div class="h-digestbox"><div class="h-dhead">HEX DIGEST \u00B7 ' + hex.length + ' CHARS \u00B7 ' + (state.upper ? "UPPERCASE" : "LOWERCASE") + '</div>' +
      '<div class="h-digest">' + renderDigest(hex) + '</div></div>';

    html += '<div class="h-readout">' +
      '<div class="h-ro"><small>Width</small><b>' + algo.bits + ' <em>bits</em></b></div>' +
      '<div class="h-ro"><small>Digest</small><b>' + (algo.bits/8) + ' <em>bytes</em></b></div>' +
      '<div class="h-ro"><small>Hex</small><b>' + hex.length + ' <em>chars</em></b></div>' +
      '<div class="h-ro"><small>Input</small><b>' + fmtNum(bytes.length) + ' <em>bytes</em></b></div>' +
    '</div>';

    html += '<p class="h-note">' + algo.note + '</p>';
    if (empty){
      html += '<p class="h-empty">input is empty \u2014 this is the digest of the empty string, a famous vector in its own right.</p>';
    }

    badgeOut.textContent = "\u25C9 " + algo.name;
    hashOut.innerHTML = html;
  }

  /* ================= RUNNER ================= */
  function run(){
    var src = srcIn.value;
    var bytes = strToUtf8(src);
    var algoKey = state.algo;
    var algo = ALGOS[algoKey];

    var t0 = performance.now();
    var hex = algo.fn(bytes);
    var ms = performance.now() - t0;
    if (state.upper) hex = hex.toUpperCase();

    lastDigest = hex;
    renderOutput(src, bytes, algoKey, algo, hex, ms);

    setStat(sv[0], fmtNum(bytes.length));
    setStat(sv[1], algo.bits);
    setStat(sv[2], algo.bits / 4);
    setStat(sv[3], ms < 0.005 ? "<0.01" : ms.toFixed(2));
    badgeIn.textContent = fmtNum(src.length) + " CHARS \u00B7 " + fmtNum(bytes.length) + " B";
    vsBadge.textContent = algo.bits;
  }

  function setMode(m){
    state.algo = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
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

  /* ---- swap: hash of a hash ---- */
  $("#btn-swap").addEventListener("click", function(){
    var btn = $("#btn-swap");
    if (!lastDigest){ flash(btn, "NO DIGEST", true); return; }
    srcIn.value = lastDigest;
    run();
    flash(btn, "FED BACK \u2713");
    srcIn.focus();
  });

  /* ---- pane actions ---- */
  $("#btn-copy-in").addEventListener("click", function(){
    var btn = $("#btn-copy-in");
    if (!srcIn.value){ flash(btn, "INPUT EMPTY", true); return; }
    copyToClipboard(srcIn.value, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-copy-digest").addEventListener("click", function(){
    var btn = $("#btn-copy-digest");
    if (!lastDigest){ flash(btn, "NO DIGEST", true); return; }
    copyToClipboard(lastDigest, function(){ flash(btn, "COPIED \u2713"); });
  });
  $("#btn-clear-in").addEventListener("click", function(){
    srcIn.value = "";
    run();
    srcIn.focus();
  });
  $("#btn-fox").addEventListener("click", function(){
    srcIn.value = FOX;
    run();
    srcIn.focus();
  });
  $("#btn-unicode").addEventListener("click", function(){
    srcIn.value = SAMPLE_UNICODE;
    run();
    srcIn.focus();
  });

  /* ---- init ---- */
  srcIn.value = FOX;
  run();
})();
