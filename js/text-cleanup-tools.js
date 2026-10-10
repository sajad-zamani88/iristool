
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

  /* ================= THE 10 FILTERS =================
     Each filter takes text and returns {text, removed}.
     "removed" counts items: chars for spaces/punct/digits/tabs,
     tags for HTML, lines for line filters, words for dup-words. */

  function fSpaces(t){
    var out = t.replace(/\u00A0/g," ").split("\n").map(function(l){
      return l.replace(/^ +/,"").replace(/ +$/,"").replace(/ {2,}/g," ");
    }).join("\n");
    return { text: out, removed: Math.max(0, t.length - out.length) };
  }
  function fTabs(t){
    var m = t.match(/\t/g);
    return { text: t.replace(/\t/g,""), removed: m ? m.length : 0 };
  }
  function fEmpty(t){
    var lines = t.split("\n");
    var kept = lines.filter(function(l){ return l.length > 0; });
    return { text: kept.join("\n"), removed: lines.length - kept.length };
  }
  function fBlank(t){
    var lines = t.split("\n");
    var kept = lines.filter(function(l){ return l.trim().length > 0; });
    return { text: kept.join("\n"), removed: lines.length - kept.length };
  }
  function fDupLines(t){
    var seen = Object.create(null), kept = [], all = t.split("\n");
    all.forEach(function(l){
      if (!(l in seen)){ seen[l] = 1; kept.push(l); }
    });
    return { text: kept.join("\n"), removed: all.length - kept.length };
  }
  function fDupWords(t){
    var seen = Object.create(null), removed = 0;
    var out = t.split("\n").map(function(line){
      var kept = [];
      line.split(/[ \t]+/).forEach(function(w){
        if (!w) return;
        var k = w.toLowerCase();
        if (k in seen){ removed++; } else { seen[k] = 1; kept.push(w); }
      });
      return kept.join(" ");
    }).join("\n");
    return { text: out, removed: removed };
  }
  function fTags(t){
    var re = /<!--[\s\S]*?-->|<[^>]*>/g;
    var m = t.match(re);
    return { text: t.replace(re,""), removed: m ? m.length : 0 };
  }
  function fPunct(t){
    var m = t.match(/\p{P}/gu);
    return { text: t.replace(/\p{P}/gu,""), removed: m ? m.length : 0 };
  }
  function fNumbers(t){
    var m = t.match(/\p{N}/gu);
    return { text: t.replace(/\p{N}/gu,""), removed: m ? m.length : 0 };
  }
  function fEmojis(t){
    var re = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{200D}\u{20E3}]/gu;
    var m = t.match(re);
    return { text: t.replace(re,""), removed: m ? m.length : 0 };
  }

  var FN = {
    spaces:fSpaces, blank:fBlank, duplines:fDupLines, dupwords:fDupWords, empty:fEmpty,
    tabs:fTabs, tags:fTags, punct:fPunct, numbers:fNumbers, emojis:fEmojis
  };
  var CHIPS = ["spaces","blank","duplines","dupwords","empty","tabs","tags","punct","numbers","emojis"]; /* display order */
  var PIPE  = ["tags","emojis","numbers","punct","tabs","spaces","empty","blank","duplines","dupwords"]; /* pipeline order */
  var CATOF = { spaces:"sp", blank:"ln", empty:"ln", duplines:"dp", dupwords:"dp", tabs:"tb", tags:"tg", punct:"pn", numbers:"nm", emojis:"em" };
  var CATS  = ["sp","ln","dp","tb","tg","pn","nm","em"];

  var active = { spaces:true, blank:true, empty:true, tabs:true,
                 duplines:false, dupwords:false, tags:false, punct:false, numbers:false, emojis:false };
  var removedNow = {};

  /* ================= DOM REFS ================= */
  var src = $("#src");
  var out = $("#out");
  var oWrap = $("#o-wrap");
  var outCount = $("#out-count");
  var SAMPLE = src.value;

  var chipEls = {}, cntEls = {};
  CHIPS.forEach(function(id){
    chipEls[id] = $("#chip-" + id);
    cntEls[id]  = $("#cnt-" + id);
  });

  var barEls = {}, scEls = {};
  CATS.forEach(function(c){
    barEls[c] = $("#bar-" + c);
    scEls[c]  = $("#sc-" + c);
  });

  var stIn = $("#st-in"), stOut = $("#st-out"),
      stSaved = $("#st-saved"), stSavedSub = $("#st-saved-sub"),
      stRemoved = $("#st-removed");

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

  /* ---- badges: what each filter finds in the raw input ---- */
  function updateBadges(){
    var v = src.value;
    CHIPS.forEach(function(id){
      var r = FN[id](v);
      var el = cntEls[id];
      var txt = r.removed > 0 ? ("\u2212" + fmtNum(r.removed)) : "0";
      if (el.textContent !== txt){ el.textContent = txt; }
      el.classList.toggle("has", r.removed > 0);
    });
  }

  /* ---- scrub bar: removals by category (active filters only) ---- */
  function updateScrub(){
    var totals = { sp:0, ln:0, dp:0, tb:0, tg:0, pn:0, nm:0, em:0 };
    PIPE.forEach(function(id){ totals[CATOF[id]] += removedNow[id] || 0; });
    var total = 0;
    CATS.forEach(function(c){ total += totals[c]; });
    CATS.forEach(function(c){
      var p = total ? Math.round((totals[c] / total) * 100) : 0;
      barEls[c].style.width = p + "%";
      scEls[c].textContent = fmtNum(totals[c]);
    });
  }

  function updateOutCount(){
    var v = out.value;
    var words = v.trim() ? v.trim().split(/\s+/).length : 0;
    outCount.textContent = fmtNum(v.length) + " CHARS · " + fmtNum(words) + " WORDS";
  }

  function updateStats(totalRemoved){
    var inLen = src.value.length, outLen = out.value.length;
    var saved = Math.max(0, inLen - outLen);
    var p = inLen ? Math.round((saved / inLen) * 100) : 0;
    setStat(stIn, fmtNum(inLen));
    setStat(stOut, fmtNum(outLen));
    setStat(stSaved, fmtNum(saved));
    stSavedSub.textContent = p + "% OF INPUT";
    setStat(stRemoved, fmtNum(totalRemoved));
  }

  function flashOut(){
    oWrap.classList.remove("flash");
    void oWrap.offsetWidth;
    oWrap.classList.add("flash");
  }

  /* ---- run the active pipeline ---- */
  function runPipeline(flashFx){
    var t = src.value, total = 0;
    PIPE.forEach(function(id){
      if (active[id]){
        var r = FN[id](t);
        removedNow[id] = r.removed;
        total += r.removed;
        t = r.text;
      } else {
        removedNow[id] = 0;
      }
    });
    out.value = t;
    updateOutCount();
    updateStats(total);
    updateScrub();
    if (flashFx && !reduceMotion){ flashOut(); }
  }

  /* ---- chip toggles ---- */
  function syncChip(id){
    chipEls[id].classList.toggle("is-on", active[id]);
    chipEls[id].setAttribute("aria-pressed", String(active[id]));
  }
  CHIPS.forEach(function(id){
    chipEls[id].addEventListener("click", function(){
      active[id] = !active[id];
      syncChip(id);
      runPipeline(true);
    });
  });

  /* ---- presets ---- */
  function applyPreset(ids){
    CHIPS.forEach(function(id){
      active[id] = ids ? ids.indexOf(id) > -1 : false;
      syncChip(id);
    });
    runPipeline(true);
  }
  $("#preset-all").addEventListener("click", function(){ applyPreset(CHIPS); });
  $("#preset-ws").addEventListener("click", function(){ applyPreset(["spaces","blank","empty","tabs"]); });
  $("#preset-off").addEventListener("click", function(){ applyPreset(null); });

  src.addEventListener("input", function(){
    updateBadges();
    runPipeline(false);
  });

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

  /* ---- cursor tracking for paste position ---- */
  var cursorSet = false;
  ["focus","keyup","click","select","input"].forEach(function(ev){
    src.addEventListener(ev, function(){ cursorSet = true; });
  });
  function getInsertPos(){
    if (cursorSet){ return { s: src.selectionStart, e: src.selectionEnd }; }
    var len = src.value.length;
    return { s: len, e: len };
  }
  function insertText(t, pos){
    src.setRangeText(t, pos.s, pos.e, "end");
    cursorSet = true;
    src.focus();
    updateBadges();
    runPipeline(false);
  }

  /* ---- clipboard permission: query once, remember ---- */
  var clipPerm = null;
  try {
    if (navigator.permissions && navigator.permissions.query){
      navigator.permissions.query({ name: "clipboard-read" }).then(function(status){
        clipPerm = status;
      }).catch(function(){ /* Firefox & others — fall back to direct read */ });
    }
  } catch(e){ /* older browsers — ignore */ }

  function clipboardDenied(){
    flash(btnPaste, "BLOCKED · CTRL+V", true);
    src.focus();
  }

  /* ---- COPY (input) ---- */
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

  /* ---- PASTE (input) ---- */
  var btnPaste = $("#btn-paste");
  btnPaste.addEventListener("click", function(){
    var pos = getInsertPos();
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
    if (state === "granted"){ tryRead(); }
    else if (state === "denied"){ clipboardDenied(); }
    else { tryRead(); }
  });

  /* ---- SELECT ALL ---- */
  var btnSelectAll = $("#btn-select-all");
  btnSelectAll.addEventListener("click", function(){
    if (!src.value){ flash(btnSelectAll, "BOX IS EMPTY", true); return; }
    src.focus();
    src.setSelectionRange(0, src.value.length);
    cursorSet = true;
    flash(btnSelectAll, "ALL SELECTED ✓");
  });

  /* ---- COPY OUTPUT ---- */
  var btnCopyOut = $("#btn-copy-out");
  btnCopyOut.addEventListener("click", function(){
    var v = out.value;
    if (!v){ flash(btnCopyOut, "NOTHING TO COPY", true); return; }
    function fallback(){
      out.focus(); out.select();
      try { document.execCommand("copy"); flash(btnCopyOut, "COPIED ✓"); }
      catch(err){ flash(btnCopyOut, "USE CTRL+C", true); }
      window.getSelection().removeAllRanges();
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(v).then(function(){ flash(btnCopyOut, "COPIED ✓"); }, fallback);
    } else { fallback(); }
  });

  /* ---- DOWNLOAD OUTPUT ---- */
  var btnDlOut = $("#btn-dl-out");
  btnDlOut.addEventListener("click", function(){
    var v = out.value;
    if (!v){ flash(btnDlOut, "NOTHING TO SAVE", true); return; }
    var blob = new Blob([v], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "IrisTool-cleaned.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDlOut, "SAVED ✓");
  });

  /* ---- USE OUTPUT AS INPUT (another pass) ---- */
  var btnToInput = $("#btn-to-input");
  btnToInput.addEventListener("click", function(){
    if (!out.value){ flash(btnToInput, "OUTPUT EMPTY", true); return; }
    src.value = out.value;
    cursorSet = false;
    updateBadges();
    runPipeline(false);
    src.focus();
    flash(btnToInput, "MOVED ✓");
  });

  /* ---- sample / clear ---- */
  $("#btn-sample").addEventListener("click", function(){
    src.value = SAMPLE;
    cursorSet = false;
    updateBadges();
    runPipeline(false);
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    src.value = "";
    cursorSet = false;
    updateBadges();
    runPipeline(false);
    src.focus();
  });

  /* ---- init ---- */
  updateBadges();
  runPipeline(false);
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
