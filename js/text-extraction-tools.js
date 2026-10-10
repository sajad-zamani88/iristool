
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

  /* ✚ جدید: بستن منو با دکمه ضربدر — این یک خط را در صفحه‌های دیگر هم اضافه کنید */
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

  /* ================= THE 5 PATTERN HUNTERS =================
     Lower prio number wins an overlap:
     urls > emails > mentions > hashtags > numbers            */
  var PATTERNS = [
    { id:"urls",     prio:1, re:/\bhttps?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi },
    { id:"emails",   prio:2, re:/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { id:"mentions", prio:3, re:/(?<![\w&\/])@[A-Za-z0-9_]{2,}/g },
    { id:"hashtags", prio:4, re:/(?<![\w&\/])#[\p{L}\p{N}_]+/gu },
    { id:"numbers",  prio:5, re:/(?<![\w.])-?\d+(?:\.\d+)?/g }
  ];
  var CATS = ["urls","emails","numbers","hashtags","mentions"]; /* display order */
  var CHIP_CAP = 40;

  var state = { urls:true, emails:true, numbers:true, hashtags:true, mentions:true };
  var latest = { urls:[], emails:[], numbers:[], hashtags:[], mentions:[] };

  var src = $("#src");
  var backdrop = $("#hl-backdrop");
  var SAMPLE = src.value;

  var chanEls = {}, cntEls = {}, itemEls = {}, prevCnt = {};
  CATS.forEach(function(c){
    chanEls[c] = $("#chan-" + c);
    cntEls[c]  = $("#cnt-" + c);
    itemEls[c] = $("#items-" + c);
    prevCnt[c] = -1;
  });

  var chCount = $("#ch-count");
  var stMatches = $("#st-matches"), stChars = $("#st-chars"),
      stHits = $("#st-hits"), stDens = $("#st-dens");

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

  /* ---- one unified pass, overlaps resolved once ---- */
  function extractAll(v){
    var found = [];
    PATTERNS.forEach(function(p){
      var re = new RegExp(p.re.source, p.re.flags);
      var m;
      while ((m = re.exec(v)) !== null){
        var text = m[0];
        if (p.id === "urls"){ text = text.replace(/[.,;:!?]+$/,""); }
        if (!text){ continue; }
        found.push({ s: m.index, e: m.index + text.length, cat: p.id, prio: p.prio, text: text });
        if (re.lastIndex === m.index){ re.lastIndex++; }
      }
    });
    found.sort(function(a,b){
      return (a.s - b.s) || (a.prio - b.prio) || ((b.e - b.s) - (a.e - a.s));
    });
    var kept = [], lastEnd = -1;
    found.forEach(function(m){
      if (m.s >= lastEnd){ kept.push(m); lastEnd = m.e; }
    });
    return kept;
  }

  /* ---- backdrop with painted matches ---- */
  function escHtml(s){
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function paintBackdrop(v, kept){
    var html = "", pos = 0;
    kept.forEach(function(m){
      html += escHtml(v.slice(pos, m.s));
      html += '<mark class="mk mk-' + m.cat + '">' + escHtml(m.text) + '</mark>';
      pos = m.e;
    });
    html += escHtml(v.slice(pos));
    if (v.charAt(v.length - 1) === "\n"){ html += " "; }
    backdrop.innerHTML = html;
  }

  /* scroll sync so highlights follow the text */
  src.addEventListener("scroll", function(){
    backdrop.scrollTop = src.scrollTop;
    backdrop.scrollLeft = src.scrollLeft;
  }, {passive:true});

  /* ---- channels ---- */
  function renderChannels(kept){
    CATS.forEach(function(c){ latest[c] = []; });
    kept.forEach(function(m){ latest[m.cat].push(m.text); });

    CATS.forEach(function(c){
      var list = latest[c];

      if (prevCnt[c] !== list.length){
        cntEls[c].textContent = fmtNum(list.length);
        cntEls[c].classList.remove("bump");
        void cntEls[c].offsetWidth;
        cntEls[c].classList.add("bump");
        setTimeout(function(){ cntEls[c].classList.remove("bump"); }, 220);
        prevCnt[c] = list.length;
      }

      var box = itemEls[c];
      box.textContent = "";
      var cap = Math.min(list.length, CHIP_CAP);
      for (var i = 0; i < cap; i++){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "xitem xi-" + c;
        b.textContent = list[i];
        b.title = "Copy: " + list[i];
        b.setAttribute("data-copy", list[i]);
        box.appendChild(b);
      }
      if (list.length > cap){
        var more = document.createElement("span");
        more.className = "xmore";
        more.textContent = "+" + fmtNum(list.length - cap) + " more — use copy all";
        box.appendChild(more);
      }
      if (!list.length){
        var none = document.createElement("span");
        none.className = "xnone";
        none.textContent = "nothing found yet";
        box.appendChild(none);
      }
    });
  }

  /* ---- stats ---- */
  function updateStats(){
    var visMatches = 0, hits = 0;
    CATS.forEach(function(c){
      if (state[c]){
        visMatches += latest[c].length;
        if (latest[c].length){ hits++; }
      }
    });
    var v = src.value;
    var words = v.trim() ? v.trim().split(/\s+/).length : 0;
    var dens = words ? (visMatches / words) * 100 : 0;
    setStat(stMatches, fmtNum(visMatches));
    setStat(stChars, fmtNum(v.length));
    setStat(stHits, hits + "/5");
    setStat(stDens, dens.toFixed(1));
    chCount.textContent = fmtNum(visMatches) + " MATCHES";
  }

  /* ---- the live pipeline ---- */
  function run(){
    var v = src.value;
    var kept = extractAll(v);
    paintBackdrop(v, kept);
    renderChannels(kept);
    updateStats();
  }
  src.addEventListener("input", run);

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

  /* ---- channel interactions (delegated) ---- */
  $("#x-scroll").addEventListener("click", function(e){
    var allBtn = e.target.closest(".xall");
    if (allBtn){
      var cat = allBtn.getAttribute("data-cat");
      var list = latest[cat];
      var original = allBtn.textContent;
      if (!list.length){
        allBtn.textContent = "EMPTY";
        allBtn.classList.add("err");
        setTimeout(function(){ allBtn.textContent = original; allBtn.classList.remove("err"); }, 1100);
        return;
      }
      copyToClipboard(list.join("\n"), function(){
        allBtn.textContent = "COPIED ✓";
        allBtn.classList.add("ok");
        setTimeout(function(){ allBtn.textContent = original; allBtn.classList.remove("ok"); }, 1300);
      });
      return;
    }
    var item = e.target.closest(".xitem");
    if (item){
      var val = item.getAttribute("data-copy");
      copyToClipboard(val, function(){
        var orig = item.textContent;
        item.textContent = "COPIED ✓";
        item.classList.add("ok");
        setTimeout(function(){ item.textContent = orig; item.classList.remove("ok"); }, 1000);
      });
      return;
    }
    var tog = e.target.closest(".xchan-toggle");
    if (tog){
      var c = tog.getAttribute("data-cat");
      state[c] = !state[c];
      tog.setAttribute("aria-pressed", String(state[c]));
      chanEls[c].classList.toggle("off", !state[c]);
      updateStats();
    }
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
    run();
    src.focus();
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

  /* ---- COPY ---- */
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

  /* ---- PASTE ---- */
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
    var pState = clipPerm ? clipPerm.state : "prompt";
    if (pState === "granted"){ tryRead(); }
    else if (pState === "denied"){ clipboardDenied(); }
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

  /* ---- DOWNLOAD ---- */
  var btnDownload = $("#btn-download");
  btnDownload.addEventListener("click", function(){
    var v = src.value;
    if (!v){ flash(btnDownload, "NOTHING TO SAVE", true); return; }
    var blob = new Blob([v], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "IrisTool-source.txt";
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
    run();
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    src.value = "";
    cursorSet = false;
    run();
    src.focus();
  });

  /* ---- init ---- */
  run();
})();
