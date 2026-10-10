
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

  /* ================= ESCAPE ENGINE ================= */
  var escInput = $("#esc-input");
  var escOut   = $("#esc-out");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { tool:"text", dir:"escape", plainOut:"" };

  var SAMPLES = {
    text: {
      escape: 'He said "Hello, world!"\nThen he\ttabbed away.\nPath: C:\\Users\\test\n\u0633\u0644\u0627\u0645 \ud83d\udc4b',
      unescape: 'He said \\"Hello, world!\\"\\nThen he\\ttabbed away.\\nPath: C:\\\\Users\\\\test'
    },
    sql: {
      escape: "SELECT * FROM users\nWHERE name = 'O'Brien'\n  AND note = 'It's fine';",
      unescape: "SELECT * FROM users\nWHERE name = 'O''Brien'\n  AND note = 'It''s fine';"
    },
    xml: {
      escape: '<note author="Tom & Jerry">5 < 6 && 7 > 3</note>',
      unescape: '&lt;note author=&quot;Tom &amp; Jerry&quot;&gt;5 &lt; 6 &amp;&amp; 7 &gt; 3&lt;/note&gt;'
    }
  };

  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function hex4(n){ return ("0000" + n.toString(16)).slice(-4); }

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

  /* ---- text escape / unescape ---- */
  function textEscape(s){
    var out = "", html = "", count = 0;
    for (var i=0;i<s.length;i++){
      var c = s[i];
      var cp = s.codePointAt(i);
      if (cp > 0xFFFF){
        var v = cp - 0x10000;
        var hi = 0xD800 + (v >> 10), lo = 0xDC00 + (v & 0x3FF);
        var e2 = "\\u" + hex4(hi) + "\\u" + hex4(lo);
        out += e2; html += '<mark class="esc-seq">' + e2 + '</mark>'; count++;
        i++;
        continue;
      }
      var esc = null;
      if (c === "\\") esc = "\\\\";
      else if (c === '"') esc = '\\"';
      else if (c === "'") esc = "\\'";
      else if (c === "\n") esc = "\\n";
      else if (c === "\t") esc = "\\t";
      else if (c === "\r") esc = "\\r";
      else if (c === "\b") esc = "\\b";
      else if (c === "\f") esc = "\\f";
      else if (cp > 126 || cp < 32) esc = "\\u" + hex4(cp);
      if (esc !== null){
        out += esc; html += '<mark class="esc-seq">' + escHtml(esc) + '</mark>'; count++;
      } else {
        out += c; html += escHtml(c);
      }
    }
    return { out:out, html:html, count:count };
  }
  function textUnescape(s){
    var out = "", html = "", count = 0, i = 0;
    while (i < s.length){
      var c = s[i];
      if (c === "\\" && i+1 < s.length){
        var next = s[i+1], decoded = null, len = 2;
        if (next === "n") decoded = "\n";
        else if (next === "t") decoded = "\t";
        else if (next === "r") decoded = "\r";
        else if (next === "b") decoded = "\b";
        else if (next === "f") decoded = "\f";
        else if (next === "\\") decoded = "\\";
        else if (next === '"') decoded = '"';
        else if (next === "'") decoded = "'";
        else if (next === "u" && i+5 < s.length && /^[0-9a-fA-F]{4}$/.test(s.substr(i+2,4))){
          decoded = String.fromCharCode(parseInt(s.substr(i+2,4),16));
          len = 6;
        }
        if (decoded !== null){
          out += decoded;
          html += '<mark class="esc-char">' + escHtml(decoded) + '</mark>';
          count++; i += len;
          continue;
        }
      }
      out += c; html += escHtml(c); i++;
    }
    return { out:out, html:html, count:count };
  }

  /* ---- sql escape / unescape ---- */
  function sqlEscape(s){
    var out = "", html = "", count = 0;
    for (var i=0;i<s.length;i++){
      var c = s[i];
      if (c === "'"){ out += "''"; html += '<mark class="esc-seq">\'\'</mark>'; count++; }
      else { out += c; html += escHtml(c); }
    }
    return { out:out, html:html, count:count };
  }
  function sqlUnescape(s){
    var out = "", html = "", count = 0, i = 0;
    while (i < s.length){
      if (s[i] === "'" && i+1 < s.length && s[i+1] === "'"){
        out += "'"; html += '<mark class="esc-char">\'</mark>'; count++; i += 2;
        continue;
      }
      out += s[i]; html += escHtml(s[i]); i++;
    }
    return { out:out, html:html, count:count };
  }

  /* ---- xml escape / unescape ---- */
  var XML_MAP = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" };
  function xmlEscape(s){
    var out = "", html = "", count = 0;
    for (var i=0;i<s.length;i++){
      var c = s[i];
      if (XML_MAP[c]){ out += XML_MAP[c]; html += '<mark class="esc-seq">' + XML_MAP[c] + '</mark>'; count++; }
      else { out += c; html += escHtml(c); }
    }
    return { out:out, html:html, count:count };
  }
  function decodeEntity(ent){
    var map = { "&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"', "&apos;":"'" };
    if (map[ent]) return map[ent];
    var m = ent.match(/^&#(\d+);$/);
    if (m){ var cp = parseInt(m[1],10); if (cp <= 0x10FFFF) return String.fromCodePoint(cp); }
    var mh = ent.match(/^&#x([0-9a-fA-F]+);$/i);
    if (mh){ var cph = parseInt(mh[1],16); if (cph <= 0x10FFFF) return String.fromCodePoint(cph); }
    return null;
  }
  function xmlUnescape(s){
    var out = "", html = "", count = 0, i = 0;
    while (i < s.length){
      if (s[i] === "&"){
        var semi = s.indexOf(";", i);
        if (semi !== -1 && semi - i <= 10){
          var ent = s.substr(i, semi - i + 1);
          var decoded = decodeEntity(ent);
          if (decoded !== null){
            out += decoded; html += '<mark class="esc-char">' + escHtml(decoded) + '</mark>';
            count++; i = semi + 1;
            continue;
          }
        }
      }
      out += s[i]; html += escHtml(s[i]); i++;
    }
    return { out:out, html:html, count:count };
  }

  /* ================= RUNNER ================= */
  function run(){
    var input = escInput.value;
    var result;
    if (state.tool === "text") result = state.dir === "escape" ? textEscape(input) : textUnescape(input);
    else if (state.tool === "sql") result = state.dir === "escape" ? sqlEscape(input) : sqlUnescape(input);
    else result = state.dir === "escape" ? xmlEscape(input) : xmlUnescape(input);

    state.plainOut = result.out;
    escOut.innerHTML = input === "" ? '<span class="esc-placeholder">Type on the left \u2014 every escape sequence lights up here the moment it\u2019s made.</span>' : (result.html || "&nbsp;");

    var dirWord = state.dir === "escape" ? "ESCAPES" : "UNESCAPES";
    $("#out-count").textContent = fmtNum(result.count) + " " + dirWord;
    $("#in-label").textContent = state.dir === "escape" ? "RAW TEXT" : "ESCAPED TEXT";
    $("#out-label").textContent = state.dir === "escape" ? "ESCAPED" : "UNESCAPED";
    $("#vs-badge").textContent = state.dir === "escape" ? "\u2192" : "\u2190";

    var delta = result.out.length - input.length;
    setStat(sv[0], fmtNum(input.length));
    setStat(sv[1], fmtNum(result.out.length));
    setStat(sv[2], fmtNum(result.count));
    setStat(sv[3], (delta >= 0 ? "+" : "") + fmtNum(delta));
    sl[0].textContent="Characters in";  ss[0].textContent = state.dir === "escape" ? "RAW TEXT" : "ESCAPED";
    sl[1].textContent="Characters out"; ss[1].textContent = state.dir === "escape" ? "ESCAPED" : "UNESCAPED";
    sl[2].textContent = state.dir === "escape" ? "Escapes made" : "Escapes resolved";
    ss[2].textContent = state.dir === "escape" ? "SEQUENCES ADDED" : "SEQUENCES DECODED";
    sl[3].textContent="Size change";    ss[3].textContent = state.dir === "escape" ? "GROWTH" : "SHRINKAGE";
  }

  /* ---- tool / direction switching ---- */
  function setTool(t){
    state.tool = t;
    $$(".c-tab").forEach(function(tab){
      var on = tab.getAttribute("data-mode") === t;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", t);
    escInput.value = SAMPLES[t][state.dir];
    run();
  }
  function setDir(d){
    state.dir = d;
    $("#dir-escape").classList.toggle("dir-on", d === "escape");
    $("#dir-unescape").classList.toggle("dir-on", d === "unescape");
    run();
  }
  $$(".c-tab").forEach(function(tab){
    tab.addEventListener("click", function(){ setTool(tab.getAttribute("data-mode")); });
  });
  $("#dir-escape").addEventListener("click", function(){ setDir("escape"); });
  $("#dir-unescape").addEventListener("click", function(){ setDir("unescape"); });

  escInput.addEventListener("input", run);

  /* ---- actions ---- */
  function flash(btn, text, isErr){
    var original = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", original);
    btn.textContent = text;
    btn.classList.add(isErr ? "err" : "ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok","err");
    }, 1200);
  }
  function copyText(val, done){
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, done);
    else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta); done();
    }
  }
  $("#btn-copy-in").addEventListener("click", function(){
    var b = this;
    if (!escInput.value){ flash(b, "INPUT EMPTY", true); return; }
    copyText(escInput.value, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-copy-out").addEventListener("click", function(){
    var b = this;
    if (!state.plainOut){ flash(b, "OUTPUT EMPTY", true); return; }
    copyText(state.plainOut, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-clear").addEventListener("click", function(){
    escInput.value = "";
    run();
    escInput.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    escInput.value = SAMPLES[state.tool][state.dir];
    run();
    escInput.focus();
  });
  $("#btn-feed").addEventListener("click", function(){
    if (!state.plainOut){ flash(this, "OUTPUT EMPTY", true); return; }
    escInput.value = state.plainOut;
    setDir(state.dir === "escape" ? "unescape" : "escape");
    flash(this, "REVERSED \u2713");
  });

  /* ---- init ---- */
  escInput.value = SAMPLES.text.escape;
  run();
})();
