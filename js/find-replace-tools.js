
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

  /* ================= FIND & REPLACE ENGINE ================= */
  var src = $("#src");
  var backdrop = $("#hl-backdrop");
  var SAMPLE = src.value;

  var findInp = $("#find-inp"), repInp = $("#rep-inp");
  var findCount = $("#find-count"), posBadge = $("#pos-badge"), mCount = $("#m-count");
  var mScroll = $("#m-scroll");
  var navPrev = $("#nav-prev"), navNext = $("#nav-next");
  var btnRepOne = $("#btn-rep-one"), btnRepAll = $("#btn-rep-all"), btnUndo = $("#btn-undo");
  var undoN = $("#undo-n");
  var togCase = $("#tog-case"), togRegex = $("#tog-regex"), togWord = $("#tog-word");
  var rpLog = $("#rp-log"), rpEmpty = $("#rp-empty");
  var stMatches = $("#st-matches"), stChars = $("#st-chars"),
      stSwaps = $("#st-swaps"), stUndo = $("#st-undo");

  var caseSensitive = false, regexMode = false, wholeWord = false;
  var matches = [];      /* {s, e, text} */
  var curIdx = -1;
  var mrowEls = [];
  var sessionSwaps = 0;
  var undoStack = [];
  var suppress = false;
  var LIST_CAP = 60, MATCH_CAP = 2000;

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

  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function escHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function interpRep(s){
    return s.replace(/\\(n|t|r|\\)/g, function(_, c){
      return c === "n" ? "\n" : c === "t" ? "\t" : c === "r" ? "\r" : "\\";
    });
  }
  function quote(s){
    var t = s.length > 14 ? s.slice(0, 14) + "…" : s;
    return "\u201C" + t.replace(/\r/g,"").replace(/\n/g,"↵").replace(/\t/g,"⇥") + "\u201D";
  }

  function buildMatcher(){
    var f = findInp.value;
    var flags = "g" + (caseSensitive ? "" : "i");
    var pat = regexMode ? f : escRe(f);
    if (wholeWord){ pat = regexMode ? ("\\b(?:" + pat + ")\\b") : ("\\b" + pat + "\\b"); }
    try { return new RegExp(pat, flags); }
    catch(err){ return "bad"; }
  }

  /* ---- set editor content while keeping the native undo stack ---- */
  function setEditor(t){
    if (src.value === t) return;
    suppress = true;
    src.focus();
    src.setSelectionRange(0, src.value.length);
    var done = false;
    try {
      done = (t === "") ? document.execCommand("delete") : document.execCommand("insertText", false, t);
    } catch(err){ done = false; }
    if (!done || src.value !== t){ src.value = t; }
    suppress = false;
  }

  /* ---- paint matches into the backdrop ---- */
  function paintAll(){
    var v = src.value;
    var html = "", pos = 0;
    matches.forEach(function(m, i){
      html += escHtml(v.slice(pos, m.s));
      html += '<mark class="mk ' + (i === curIdx ? "mk-cur" : "mk-hit") + '">' + escHtml(m.text) + '</mark>';
      pos = m.e;
    });
    html += escHtml(v.slice(pos));
    if (v.charAt(v.length - 1) === "\n"){ html += " "; }
    backdrop.innerHTML = html;
  }
  src.addEventListener("scroll", function(){
    backdrop.scrollTop = src.scrollTop;
    backdrop.scrollLeft = src.scrollLeft;
  }, {passive:true});

  /* ---- match list ---- */
  function syncListCur(){
    mrowEls.forEach(function(r, i){
      var on = (i === curIdx);
      r.classList.toggle("is-cur", on);
      if (on && r.scrollIntoView){ r.scrollIntoView({ block: "nearest" }); }
    });
  }
  function renderMatchList(){
    var v = src.value;
    mScroll.textContent = "";
    mrowEls = [];

    function msg(cls, txt){
      var s = document.createElement("span");
      s.className = cls;
      s.textContent = txt;
      mScroll.appendChild(s);
    }

    if (!findInp.value){ msg("m-empty", "type in the FIND box to start hunting"); return; }
    if (findInp.classList.contains("bad")){ msg("m-empty", "invalid regular expression — fix the pattern first"); return; }
    if (!matches.length){ msg("m-empty", "0 matches — nothing in the source looks like that"); return; }

    var cap = Math.min(matches.length, LIST_CAP);
    for (var i = 0; i < cap; i++){
      (function(i){
        var m = matches[i];
        var row = document.createElement("div");
        row.className = "mrow";

        var idx = document.createElement("span");
        idx.className = "mrow-i";
        idx.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);

        var mt = document.createElement("span");
        mt.className = "mrow-t";
        mt.textContent = m.text.length > 20 ? m.text.slice(0, 20) + "…" : m.text;

        var ctx = document.createElement("span");
        ctx.className = "mrow-c";
        var before = v.slice(Math.max(0, m.s - 16), m.s).replace(/\s+/g, " ");
        var after  = v.slice(m.e, m.e + 16).replace(/\s+/g, " ");
        if (before){ ctx.appendChild(document.createTextNode("…" + before)); }
        var b = document.createElement("b");
        b.textContent = m.text.length > 20 ? m.text.slice(0, 20) + "…" : m.text;
        ctx.appendChild(b);
        if (after){ ctx.appendChild(document.createTextNode(after + "…")); }

        row.appendChild(idx); row.appendChild(mt); row.appendChild(ctx);
        row.addEventListener("click", function(){ jumpTo(i, true); });
        mScroll.appendChild(row);
        mrowEls.push(row);
      })(i);
    }
    if (matches.length > cap){
      msg("m-more", "+ " + fmtNum(matches.length - cap) + " more matches — refine the pattern");
    }
    syncListCur();
  }

  /* ---- deck / stats ---- */
  function updateDeck(){
    var bad = findInp.classList.contains("bad");
    var n = matches.length;
    findCount.textContent = bad ? "BAD REGEX" : (fmtNum(n) + (n === 1 ? " MATCH" : " MATCHES"));
    findCount.classList.toggle("bad", bad);
    posBadge.textContent = n ? ((curIdx + 1) + " / " + fmtNum(n)) : "0 / 0";
    mCount.textContent = fmtNum(n) + " FOUND";
    var none = bad || !n;
    navPrev.disabled = none;
    navNext.disabled = none;
    btnRepOne.disabled = none;
    btnRepAll.disabled = none;
  }
  function updateStats(){
    setStat(stMatches, fmtNum(matches.length));
    setStat(stChars, fmtNum(src.value.length));
    setStat(stSwaps, fmtNum(sessionSwaps));
    setStat(stUndo, fmtNum(undoStack.length));
  }

  /* ---- quick tool counters ---- */
  var qcEls = { lines: $("#qc-lines"), spaces: $("#qc-spaces"), tabs: $("#qc-tabs") };
  function setQCount(id, n){
    var el = qcEls[id];
    el.textContent = fmtNum(n) + " found";
    el.classList.toggle("has", n > 0);
  }
  function updateQuickCounts(){
    var v = src.value;
    setQCount("lines",  (v.match(/\r\n?|\n/g) || []).length);
    setQCount("spaces", (v.match(/[ \u00A0]/g) || []).length);
    setQCount("tabs",   (v.match(/\t/g) || []).length);
  }

  /* ---- the live pipeline ---- */
  function runFind(){
    var v = src.value;
    matches = [];
    curIdx = -1;
    var f = findInp.value;
    if (f){
      var m = buildMatcher();
      if (m === "bad"){
        findInp.classList.add("bad");
      } else {
        findInp.classList.remove("bad");
        var mm, guard = 0;
        while ((mm = m.exec(v)) !== null && guard < 20000){
          guard++;
          if (mm[0].length === 0){ m.lastIndex++; continue; }
          matches.push({ s: mm.index, e: mm.index + mm[0].length, text: mm[0] });
          if (matches.length >= MATCH_CAP) break;
        }
        if (matches.length) curIdx = 0;
      }
    } else {
      findInp.classList.remove("bad");
    }
    paintAll();
    renderMatchList();
    updateDeck();
    updateStats();
    updateQuickCounts();
  }

  /* ---- match navigation ---- */
  function jumpTo(i, focusEditor){
    if (!matches.length) return;
    curIdx = ((i % matches.length) + matches.length) % matches.length;
    var m = matches[curIdx];
    paintAll();
    syncListCur();
    src.setSelectionRange(m.s, m.e);
    var lh = parseFloat(getComputedStyle(src).lineHeight) || 24;
    var line = src.value.slice(0, m.s).split("\n").length - 1;
    src.scrollTop = Math.max(0, line * lh - src.clientHeight / 2 + lh);
    updateDeck();
    if (focusEditor) src.focus();
  }
  navPrev.addEventListener("click", function(){ jumpTo(curIdx - 1, true); });
  navNext.addEventListener("click", function(){ jumpTo(curIdx + 1, true); });
  findInp.addEventListener("keydown", function(e){
    if (e.key === "Enter"){
      e.preventDefault();
      jumpTo(curIdx + (e.shiftKey ? -1 : 1), true);
    }
  });

  /* ---- replacement log ---- */
  function logOp(label, detail, n){
    var t = new Date().toLocaleTimeString("en-GB");
    var row = document.createElement("div");
    row.className = "log-row";
    var b = document.createElement("b");
    b.textContent = label;
    var s = document.createElement("span");
    s.textContent = n > 0
      ? (detail + " · " + fmtNum(n) + (n === 1 ? " swap" : " swaps") + " · " + t)
      : (detail + " · " + t);
    row.appendChild(b); row.appendChild(s);
    rpLog.insertBefore(row, rpLog.firstChild);
    while (rpLog.children.length > 5){ rpLog.removeChild(rpLog.lastChild); }
    rpEmpty.style.display = "none";
  }

  /* ---- undo ---- */
  function syncUndo(){
    undoN.textContent = undoStack.length;
    btnUndo.disabled = !undoStack.length;
  }
  function pushUndo(){
    undoStack.push(src.value);
    if (undoStack.length > 60){ undoStack.shift(); }
    syncUndo();
  }
  btnUndo.addEventListener("click", function(){
    if (!undoStack.length) return;
    setEditor(undoStack.pop());
    syncUndo();
    logOp("UNDO", "previous state restored", 0);
    runFind();
  });

  /* ---- button flash ---- */
  function flashBtn(btn, text){
    var orig = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", orig);
    btn.textContent = text;
    btn.classList.add("ok");
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){
      btn.textContent = orig;
      btn.classList.remove("ok");
    }, 1300);
  }

  /* ---- replace one / all ---- */
  btnRepOne.addEventListener("click", function(){
    if (curIdx < 0 || !matches.length) return;
    pushUndo();
    var m = matches[curIdx];
    var r = interpRep(repInp.value);
    var v = src.value;
    var nextStart = m.s + r.length;
    setEditor(v.slice(0, m.s) + r + v.slice(m.e));
    sessionSwaps += 1;
    logOp("REPLACE", quote(m.text) + " → " + quote(r), 1);
    runFind();
    if (matches.length){
      var target = -1;
      for (var i = 0; i < matches.length; i++){
        if (matches[i].s >= nextStart){ target = i; break; }
      }
      jumpTo(target === -1 ? matches.length - 1 : target, false);
    }
    flashBtn(btnRepOne, "SWAPPED ✓");
  });

  btnRepAll.addEventListener("click", function(){
    if (!matches.length) return;
    pushUndo();
    var r = interpRep(repInp.value);
    var v = src.value, out = "", pos = 0, n = matches.length;
    matches.forEach(function(m){ out += v.slice(pos, m.s) + r; pos = m.e; });
    out += v.slice(pos);
    var first = matches[0].text;
    setEditor(out);
    sessionSwaps += n;
    logOp("REPLACE ALL", quote(first) + " → " + quote(r), n);
    runFind();
    flashBtn(btnRepAll, fmtNum(n) + " SWAPPED ✓");
  });

  /* ---- mode toggles ---- */
  function bindTog(btn, setter){
    btn.addEventListener("click", function(){
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      setter(on);
      runFind();
    });
  }
  bindTog(togCase,  function(v){ caseSensitive = v; });
  bindTog(togRegex, function(v){ regexMode = v; });
  bindTog(togWord,  function(v){ wholeWord = v; });

  /* ---- quick tools ---- */
  var QUICK = {
    lines:  { re: function(){ return /\r\n?|\n/g; },   def: " ",    label: "QUICK · ↵" },
    spaces: { re: function(){ return /[\u00A0 ]+/g; }, def: " ",    label: "QUICK · ␣" },
    tabs:   { re: function(){ return /\t/g; },         def: "    ", label: "QUICK · ⇥" }
  };
  var qInputs = { lines: $("#qr-lines"), spaces: $("#qr-spaces"), tabs: $("#qr-tabs") };
  var qPrevs  = { lines: $("#qp-lines"), spaces: $("#qp-spaces"), tabs: $("#qp-tabs") };
  var qRows   = { lines: $("#q-lines"),  spaces: $("#q-spaces"),  tabs: $("#q-tabs") };

  function vis(s){
    if (s === ""){ return "∅"; }
    return s.replace(/ /g, "␣").replace(/\t/g, "⇥").replace(/\r/g, "").replace(/\n/g, "↵");
  }
  ["lines","spaces","tabs"].forEach(function(id){
    qInputs[id].addEventListener("input", function(){
      qPrevs[id].textContent = vis(qInputs[id].value);
    });
  });

  $$(".q-apply").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-q");
      var q = QUICK[id];
      var v = src.value;
      var probe = v.match(q.re());
      if (!probe || !probe.length){
        flashBtn(btn, "0 FOUND");
        return;
      }
      var raw = qInputs[id].value;
      var r = (raw === "") ? q.def : interpRep(raw);
      pushUndo();
      var n = 0;
      var out = v.replace(q.re(), function(){ n++; return r; });
      setEditor(out);
      sessionSwaps += n;
      logOp(q.label, "→ " + quote(r), n);
      runFind();
      flashBtn(btn, "DONE ✓");
      var row = qRows[id];
      row.classList.remove("zap");
      void row.offsetWidth;
      row.classList.add("zap");
      setTimeout(function(){ row.classList.remove("zap"); }, 550);
    });
  });

  /* ---- typing ---- */
  src.addEventListener("input", function(){
    if (suppress) return;
    runFind();
  });
  findInp.addEventListener("input", runFind);

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

  /* ---- action bar feedback ---- */
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
    runFind();
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
    a.download = "IrisTool-edited.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDownload, "SAVED ✓");
  });

  /* ---- sample / clear ---- */
  $("#btn-sample").addEventListener("click", function(){
    setEditor(SAMPLE);
    cursorSet = false;
    runFind();
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    setEditor("");
    cursorSet = false;
    runFind();
    src.focus();
  });

  /* ---- init ---- */
  syncUndo();
  runFind();
})();
