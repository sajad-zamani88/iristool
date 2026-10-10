
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

  /* ================= THE 7 TRANSFORMS ================= */
  var WORD_RE = /[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu;

  function toUpper(t){ return t.toUpperCase(); }
  function toLower(t){ return t.toLowerCase(); }

  /* Title Case: first letter of every word up, the rest forced down */
  function toTitle(t){
    return t.toLowerCase().replace(WORD_RE, function(w){
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  /* Capitalize Words: first letter of every word up, the rest untouched */
  function toCapWords(t){
    return t.replace(WORD_RE, function(w){
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  /* Sentence case: everything down, then capital after . ! ? … and new lines */
  function toSentence(t){
    return t.toLowerCase().replace(/(^\s*\p{L})|([.!?…]+\s+\p{L})|(\n\s*\p{L})/gu, function(m){
      return m.toUpperCase();
    });
  }

  /* Toggle Case: swap the case of every single letter */
  function toToggle(t){
    var out = "", i, ch, up, lo;
    for (i = 0; i < t.length; i++){
      ch = t[i]; up = ch.toUpperCase(); lo = ch.toLowerCase();
      if (up === lo){ out += ch; }
      else { out += (ch === up) ? lo : up; }
    }
    return out;
  }

  /* Invert Case: alternating case, starting lowercase; non-letters skipped */
  function toInvert(t){
    var out = "", k = 0, i, ch, up, lo;
    for (i = 0; i < t.length; i++){
      ch = t[i]; up = ch.toUpperCase(); lo = ch.toLowerCase();
      if (up === lo){ out += ch; }
      else { out += (k % 2 === 0) ? lo : up; k++; }
    }
    return out;
  }

  var ORDER = ["upper","lower","title","sentence","toggle","capwords","invert"];
  var TRANSFORMS = {
    upper:    { fn: toUpper },
    lower:    { fn: toLower },
    title:    { fn: toTitle },
    sentence: { fn: toSentence },
    toggle:   { fn: toToggle },
    capwords: { fn: toCapWords },
    invert:   { fn: toInvert }
  };

  /* ================= DOM REFS ================= */
  var src = $("#src");
  var out = $("#out");
  var oWrap = $("#o-wrap");
  var outCount = $("#out-count");
  var SAMPLE = src.value;

  var toolBtns = {}, prevEls = {};
  ORDER.forEach(function(id){
    toolBtns[id] = $('.t-btn[data-t="' + id + '"]');
    prevEls[id]  = $("#prev-" + id);
  });

  var barU = $("#bar-upper"), barL = $("#bar-lower"), barO = $("#bar-other");
  var pctU = $("#pct-upper"), pctL = $("#pct-lower"), pctO = $("#pct-other");

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function pct(part, whole){ return whole ? Math.round((part / whole) * 100) : 0; }

  /* ---- live previews: all 7 at once ---- */
  function updatePreviews(){
    var v = src.value;
    ORDER.forEach(function(id){
      var el = prevEls[id];
      if (v){
        el.classList.remove("prev-empty");
        el.textContent = TRANSFORMS[id].fn(v);
      } else {
        el.classList.add("prev-empty");
        el.textContent = "paste text above to preview";
      }
    });
  }

  /* ---- case composition of the output ---- */
  function updateComp(t){
    var total = t.length, up = 0, lo = 0, i, ch, u, l;
    for (i = 0; i < total; i++){
      ch = t[i]; u = ch.toUpperCase(); l = ch.toLowerCase();
      if (u !== l){ if (ch === u){ up++; } else { lo++; } }
    }
    var other = Math.max(0, total - up - lo);
    var pU = pct(up, total), pL = pct(lo, total), pO = pct(other, total);
    barU.style.width = pU + "%";
    barL.style.width = pL + "%";
    barO.style.width = pO + "%";
    pctU.textContent = pU + "%";
    pctL.textContent = pL + "%";
    pctO.textContent = pO + "%";
  }

  function updateOutCount(){
    var v = out.value;
    var words = v.trim() ? v.trim().split(/\s+/).length : 0;
    outCount.textContent = fmtNum(v.length) + " CHARS · " + fmtNum(words) + " WORDS";
  }

  /* ---- apply a transform to the output pane ---- */
  function applyTransform(id, silent){
    var res = TRANSFORMS[id].fn(src.value);
    out.value = res;
    ORDER.forEach(function(k){
      var on = (k === id);
      toolBtns[k].classList.toggle("is-on", on);
      toolBtns[k].setAttribute("aria-pressed", String(on));
    });
    updateOutCount();
    updateComp(res);
    if (!silent && !reduceMotion){
      oWrap.classList.remove("flash");
      void oWrap.offsetWidth;
      oWrap.classList.add("flash");
    }
  }

  ORDER.forEach(function(id){
    toolBtns[id].addEventListener("click", function(){ applyTransform(id); });
  });

  src.addEventListener("input", updatePreviews);

  /* ---- preview grid: copy / load ---- */
  function flashMini(btn, glyph){
    var original = btn.getAttribute("data-glyph") || btn.textContent;
    btn.setAttribute("data-glyph", original);
    btn.textContent = glyph;
    btn.classList.add("ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("ok");
    }, 1200);
  }

  function copyText(t, btn){
    if (!t){ flashMini(btn, "✕"); return; }
    function fallback(){
      var ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); flashMini(btn, "✓"); }
      catch(err){ flashMini(btn, "✕"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(function(){ flashMini(btn, "✓"); }, fallback);
    } else { fallback(); }
  }

  $("#prev-grid").addEventListener("click", function(e){
    var copyBtn = e.target.closest("[data-copy]");
    if (copyBtn){
      var cid = copyBtn.getAttribute("data-copy");
      var txt = src.value ? TRANSFORMS[cid].fn(src.value) : "";
      copyText(txt, copyBtn);
      return;
    }
    var loadBtn = e.target.closest("[data-load]");
    if (loadBtn){
      applyTransform(loadBtn.getAttribute("data-load"));
      return;
    }
    var card = e.target.closest(".prev-card");
    if (card){ applyTransform(card.getAttribute("data-t")); }
  });

  /* ---- button feedback helper (action bar) ---- */
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

  /* ---- track whether the user has placed the cursor in the input box ---- */
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
    updatePreviews();
  }

  /* ---- CLIPBOARD PERMISSION: query once, remember the answer ---- */
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

  /* ---- COPY (input): selected text if any, otherwise everything ---- */
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
    a.download = "IrisTool-converted.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDlOut, "SAVED ✓");
  });

  /* ---- USE OUTPUT AS INPUT (chain transforms) ---- */
  var btnToInput = $("#btn-to-input");
  btnToInput.addEventListener("click", function(){
    if (!out.value){ flash(btnToInput, "OUTPUT EMPTY", true); return; }
    src.value = out.value;
    cursorSet = false;
    updatePreviews();
    src.focus();
    flash(btnToInput, "MOVED ✓");
  });

  /* ---- sample / clear ---- */
  $("#btn-sample").addEventListener("click", function(){
    src.value = SAMPLE;
    cursorSet = false;
    updatePreviews();
    if (activeId){ applyTransform(activeId); }
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    src.value = "";
    cursorSet = false;
    updatePreviews();
    if (activeId){ applyTransform(activeId, true); }
    src.focus();
  });

  /* ---- init: previews + default transform so the page opens alive ---- */
  var activeId = "upper";
  updatePreviews();
  applyTransform("upper", true);
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
