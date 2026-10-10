
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

  /* ---- mega menu (click / touch + keyboard) ---- */
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

  /* ---- ticker: duplicate track for seamless loop ---- */
  var track = $("#ticker-track");
  track.innerHTML += track.innerHTML;

  /* ---- footer year ---- */
  $("#yr").textContent = new Date().getFullYear();

  /* ================= LIVE ANALYZER (all 8 metrics) ================= */
  var src = $("#src");
  var SAMPLE = src.value;

  var mWords  = $("#m-words"),  mChars  = $("#m-chars"),
      mNospace= $("#m-nospace"),mSent   = $("#m-sent"),
      mPara   = $("#m-para"),   mRead   = $("#m-read"),
      mSpeak  = $("#m-speak"),  mAvg    = $("#m-avg");

  var barL = $("#bar-letters"), barD = $("#bar-digits"),
      barS = $("#bar-spaces"),  barO = $("#bar-other");
  var pctL = $("#pct-letters"), pctD = $("#pct-digits"),
      pctS = $("#pct-spaces"),  pctO = $("#pct-other");

  function setStat(el, val){
    val = String(val);
    if (el.textContent !== val){
      el.textContent = val;
      el.classList.remove("bump");
      void el.offsetWidth; /* restart transition */
      el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); }, 200);
    }
  }
  function fmtTime(totalSec){
    totalSec = Math.round(totalSec);
    var m = Math.floor(totalSec / 60), s = totalSec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function pct(part, whole){
    return whole ? Math.round((part / whole) * 100) : 0;
  }

  function analyze(){
    var v = src.value;

    var tokens  = v.trim() ? v.trim().split(/\s+/) : [];
    var words   = tokens.length;
    var chars   = v.length;
    var noSpace = v.replace(/\s+/g, "").length;

    var sent = (v.match(/[.!?…]+/g) || []).length;
    if (!sent && v.trim()) sent = 1;

    var blocks = v.split(/\n\s*\n/).filter(function(b){ return b.trim().length > 0; });
    var paras  = blocks.length;

    var letters = (v.match(/\p{L}/gu) || []).length;
    var digits  = (v.match(/\p{N}/gu) || []).length;
    var spaces  = (v.match(/\s/g)     || []).length;
    var other   = Math.max(0, chars - letters - digits - spaces);

    var readSec  = words ? (words / 225) * 60 : 0;
    var speakSec = words ? (words / 140) * 60 : 0;
    var avg      = words ? (letters / words)  : 0;

    setStat(mWords,   words);
    setStat(mChars,   chars);
    setStat(mNospace, noSpace);
    setStat(mSent,    sent);
    setStat(mPara,    paras);
    setStat(mRead,    words ? fmtTime(readSec)  : "0:00");
    setStat(mSpeak,   words ? fmtTime(speakSec) : "0:00");
    setStat(mAvg,     avg.toFixed(1));

    var pL = pct(letters, chars), pD = pct(digits, chars),
        pS = pct(spaces,  chars), pO = pct(other,   chars);
    barL.style.width = pL + "%";
    barD.style.width = pD + "%";
    barS.style.width = pS + "%";
    barO.style.width = pO + "%";
    pctL.textContent = pL + "%";
    pctD.textContent = pD + "%";
    pctS.textContent = pS + "%";
    pctO.textContent = pO + "%";
  }

  src.addEventListener("input", analyze);
  analyze();

  /* ---- button feedback helper ---- */
  function flash(btn, text, isErr){
    var original = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", original);
    btn.textContent = text;
    btn.classList.add(isErr ? "err" : "ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok","err");
    }, 1600);
  }

  /* ---- track whether the user has placed the cursor in the box ---- */
  var cursorSet = false;
  ["focus","keyup","click","select","input"].forEach(function(ev){
    src.addEventListener(ev, function(){ cursorSet = true; });
  });

  /* where should pasted text go? cursor position if the user set one, otherwise the end */
  function getInsertPos(){
    if (cursorSet){
      return { s: src.selectionStart, e: src.selectionEnd };
    }
    var len = src.value.length;
    return { s: len, e: len };
  }

  function insertText(t, pos){
    src.setRangeText(t, pos.s, pos.e, "end"); /* replaces selection / inserts at cursor */
    cursorSet = true;
    src.focus();
    analyze();
  }

  /* ---- CLIPBOARD PERMISSION: query once, remember the answer, listen for changes ----
     After the user clicks "Allow" once, the state becomes "granted" and every
     following paste is silent — no more permission window. If access is blocked,
     we never re-trigger the prompt; we just point to Ctrl+V instead. */
  var clipPerm = null;
  try {
    if (navigator.permissions && navigator.permissions.query){
      navigator.permissions.query({ name: "clipboard-read" }).then(function(status){
        clipPerm = status; /* status.state updates automatically: prompt | granted | denied */
      }).catch(function(){ /* Firefox & others — fall back to direct read */ });
    }
  } catch(e){ /* older browsers — ignore */ }

  function clipboardDenied(){
    flash(btnPaste, "BLOCKED · CTRL+V", true);
    src.focus(); /* box is focused, so a manual Ctrl+V lands right at the cursor */
  }

  /* ---- COPY: selected text if any, otherwise everything ---- */
  var btnCopy = $("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var v = src.value;
    var selected = v.substring(src.selectionStart, src.selectionEnd);
    var toCopy = selected.length > 0 ? selected : v;
    if (!toCopy){ flash(btnCopy, "NOTHING TO COPY", true); return; }
    function fallback(){
      src.focus(); src.select();
      try { document.execCommand("copy"); flash(btnCopy, "COPIED ✓"); }
      catch(err){ flash(btnCopy, "USE CTRL+C", true); }
      window.getSelection().removeAllRanges();
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(toCopy).then(
        function(){ flash(btnCopy, selected.length > 0 ? "SELECTION COPIED ✓" : "COPIED ✓"); },
        fallback
      );
    } else { fallback(); }
  });

  /* ---- PASTE: at the cursor (or appended to the end), permission asked once at most ---- */
  var btnPaste = $("#btn-paste");
  btnPaste.addEventListener("click", function(){
    var pos = getInsertPos(); /* captured synchronously, before any dialog */

    function onPasted(t){
      if (!t){ flash(btnPaste, "CLIPBOARD EMPTY", true); src.focus(); return; }
      insertText(t, pos);
      flash(btnPaste, "PASTED ✓");
    }
    function tryRead(){
      navigator.clipboard.readText().then(onPasted, clipboardDenied);
    }

    if (!(navigator.clipboard && navigator.clipboard.readText)){
      flash(btnPaste, "PRESS CTRL+V", true);
      src.focus();
      return;
    }

    var state = clipPerm ? clipPerm.state : "prompt";
    if (state === "granted"){
      tryRead();                       /* silent — permission already given */
    } else if (state === "denied"){
      clipboardDenied();               /* never re-prompt a denied permission */
    } else {
      tryRead();                       /* first time only — "Allow" is remembered */
    }
  });

  /* ---- SELECT ALL: highlight everything in the box ---- */
  var btnSelectAll = $("#btn-select-all");
  btnSelectAll.addEventListener("click", function(){
    if (!src.value){ flash(btnSelectAll, "BOX IS EMPTY", true); return; }
    src.focus();
    src.setSelectionRange(0, src.value.length);
    cursorSet = true;
    flash(btnSelectAll, "ALL SELECTED ✓");
  });

  /* ---- DOWNLOAD: save the text as a .txt (Notepad) file ---- */
  var btnDownload = $("#btn-download");
  btnDownload.addEventListener("click", function(){
    var v = src.value;
    if (!v){ flash(btnDownload, "NOTHING TO SAVE", true); return; }
    var blob = new Blob([v], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "IrisTool-text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDownload, "SAVED ✓");
  });

  /* ---- sample / clear ---- */
  $("#btn-sample").addEventListener("click", function(){
    src.value = SAMPLE;
    cursorSet = false;
    analyze();
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    src.value = "";
    cursorSet = false;
    analyze();
    src.focus();
  });
})();

/* ---- nav-close (site-wide identical menu) ---- */
(function(){
  var nc = document.getElementById("nav-close");
  if (!nc || nc.__irisNavCloseBound) return;
  nc.__irisNavCloseBound = true;
  nc.addEventListener("click", function(){
    document.body.classList.remove("nav-open");
    var b = document.getElementById("burger");
    if (b){ b.setAttribute("aria-expanded","false"); b.setAttribute("aria-label","Open menu"); }
  });
})();
