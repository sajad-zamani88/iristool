
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

  /* ================= SORTING WORKBENCH ================= */
  var src = $("#src");
  var SAMPLE = src.value;
  var BAR_CAP = 60;
  var suppress = false;

  /* line objects carry stable ids so the map can animate moves */
  var lineObjs = [];
  var idCounter = 0;
  var elMap = {};      /* id -> bar element */
  var barEls = [];     /* displayed bars, in order */

  var barsWrap = $("#bars");
  var moreNote = $("#more-note");
  var mapCount = $("#map-count");
  var opLog = $("#op-log");
  var opEmpty = $("#op-empty");

  var stLines = $("#st-lines"), stLongest = $("#st-longest"),
      stAvg = $("#st-avg"), stOrder = $("#st-order"), ordFill = $("#ord-fill");

  var btnUndo = $("#btn-undo"), undoN = $("#undo-n");
  var undoStack = [];

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

  /* ---- parse after typing: reuse ids where a line didn't change ---- */
  function parseFresh(){
    var raw = src.value.split("\n");
    var prev = lineObjs;
    lineObjs = raw.map(function(text, i){
      if (prev[i] && prev[i].text === text){ return prev[i]; }
      return { id: ++idCounter, text: text };
    });
  }

  /* ---- line map with FLIP animation ---- */
  function renderBars(animate){
    var shown = lineObjs.slice(0, BAR_CAP);
    var oldTops = {};
    if (animate && !reduceMotion){
      shown.forEach(function(l){
        if (elMap[l.id]){ oldTops[l.id] = elMap[l.id].getBoundingClientRect().top; }
      });
    }

    var maxLen = 1;
    shown.forEach(function(l){ if (l.text.length > maxLen){ maxLen = l.text.length; } });

    /* drop bars that no longer exist */
    var live = {};
    shown.forEach(function(l){ live[l.id] = true; });
    Object.keys(elMap).forEach(function(id){
      if (!live[id]){ elMap[id].parentNode && elMap[id].parentNode.removeChild(elMap[id]); delete elMap[id]; }
    });

    /* create / move / update in order */
    barEls = [];
    shown.forEach(function(l){
      var el = elMap[l.id];
      if (!el){
        el = document.createElement("div");
        el.className = "lbar";
        el.innerHTML = '<i class="lbar-fill"></i><span class="lbar-i"></span><span class="lbar-t"></span>';
        elMap[l.id] = el;
      }
      el._lineId = l.id;
      el.title = l.text;
      el.querySelector(".lbar-i").textContent = "00"; /* placeholder, fixed below */
      var fill = el.querySelector(".lbar-fill");
      fill.style.width = Math.max(4, Math.round((l.text.length / maxLen) * 100)) + "%";
      var tEl = el.querySelector(".lbar-t");
      var short = l.text.length > 34 ? l.text.slice(0, 34) + "…" : l.text;
      tEl.textContent = l.text ? short : "·";
      tEl.classList.toggle("is-blank", !l.text);
      barsWrap.appendChild(el); /* appendChild moves existing nodes into order */
      barEls.push(el);
    });

    /* index labels */
    barEls.forEach(function(el, i){
      el.querySelector(".lbar-i").textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    });

    /* animate the moves */
    if (animate && !reduceMotion){
      shown.forEach(function(l){
        var el = elMap[l.id];
        var oldTop = oldTops[l.id];
        if (oldTop == null){
          el.classList.add("lbar-new");
          setTimeout(function(){ el.classList.remove("lbar-new"); }, 400);
          return;
        }
        var dy = oldTop - el.getBoundingClientRect().top;
        if (dy){
          el.style.transition = "none";
          el.style.transform = "translateY(" + dy + "px)";
          void el.offsetWidth;
          el.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1)";
          el.style.transform = "";
          setTimeout(function(){ el.style.transition = ""; el.style.transform = ""; }, 560);
        }
      });
    }

    moreNote.textContent = lineObjs.length > BAR_CAP
      ? "+ " + fmtNum(lineObjs.length - BAR_CAP) + " more lines live in the editor"
      : "";
    mapCount.textContent = fmtNum(lineObjs.length) + " LINES";
  }

  /* ---- highlight the line under the cursor ---- */
  function markHere(){
    var idx = src.value.slice(0, src.selectionStart || 0).split("\n").length - 1;
    barEls.forEach(function(el, i){ el.classList.toggle("lbar-here", i === idx); });
  }
  ["keyup","click","focus","select"].forEach(function(ev){
    src.addEventListener(ev, markHere);
  });

  /* bar click → select that line in the editor */
  barsWrap.addEventListener("click", function(e){
    var el = e.target.closest(".lbar");
    if (!el) return;
    var idx = barEls.indexOf(el);
    if (idx < 0) return;
    var lines = src.value.split("\n");
    var start = 0;
    for (var i = 0; i < idx; i++){ start += lines[i].length + 1; }
    src.focus();
    src.setSelectionRange(start, start + (lines[idx] ? lines[idx].length : 0));
    markHere();
  });

  /* ---- stats ---- */
  function orderScore(){
    var n = lineObjs.length;
    if (n < 2) return 100;
    var ok = 0;
    for (var i = 0; i < n - 1; i++){
      if (lineObjs[i].text.toLowerCase().localeCompare(lineObjs[i + 1].text.toLowerCase()) <= 0){ ok++; }
    }
    return Math.round((ok / (n - 1)) * 100);
  }
  function updateStats(){
    var n = lineObjs.length, longest = 0, total = 0;
    lineObjs.forEach(function(l){
      if (l.text.length > longest){ longest = l.text.length; }
      total += l.text.length;
    });
    setStat(stLines, fmtNum(n));
    setStat(stLongest, fmtNum(longest));
    setStat(stAvg, n ? (total / n).toFixed(1) : "0.0");
    var sc = orderScore();
    setStat(stOrder, sc + "%");
    ordFill.style.width = sc + "%";
  }

  /* ---- operation log ---- */
  function logOp(label, detail){
    var t = new Date().toLocaleTimeString("en-GB");
    var row = document.createElement("div");
    row.className = "log-row";
    var b = document.createElement("b");
    b.textContent = label;
    var s = document.createElement("span");
    s.textContent = detail + " · " + t;
    row.appendChild(b);
    row.appendChild(s);
    opLog.insertBefore(row, opLog.firstChild);
    while (opLog.children.length > 5){ opLog.removeChild(opLog.lastChild); }
    opEmpty.style.display = "none";
  }

  /* ---- undo ---- */
  function syncUndo(){
    undoN.textContent = undoStack.length;
    if (undoStack.length){ btnUndo.removeAttribute("disabled"); }
    else { btnUndo.setAttribute("disabled",""); }
  }
  function pushUndo(){
    undoStack.push(src.value);
    if (undoStack.length > 50){ undoStack.shift(); }
    syncUndo();
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

  /* ---- the six operations ---- */
  function firstNum(text){
    var m = text.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }

  var OP_LABELS = {
    az:"SORT A→Z", za:"SORT Z→A", num:"SORT NUMBERS",
    shuffle:"SHUFFLE", revlines:"REVERSE LINES", revtext:"REVERSE TEXT"
  };

  function applyOp(name, btn){
    pushUndo();
    var count = lineObjs.length;

    if (name === "revtext"){
      var rev = Array.from(src.value).reverse().join("");
      setEditor(rev);
      parseFresh();
      renderBars(false);
    } else {
      var arr = lineObjs.slice();
      var indexed, i, j, tmp;
      switch (name){
        case "az":
          indexed = arr.map(function(o, i){ return { o:o, i:i }; });
          indexed.sort(function(a, b){
            return a.o.text.toLowerCase().localeCompare(b.o.text.toLowerCase()) || (a.i - b.i);
          });
          arr = indexed.map(function(x){ return x.o; });
          break;
        case "za":
          indexed = arr.map(function(o, i){ return { o:o, i:i }; });
          indexed.sort(function(a, b){
            return b.o.text.toLowerCase().localeCompare(a.o.text.toLowerCase()) || (a.i - b.i);
          });
          arr = indexed.map(function(x){ return x.o; });
          break;
        case "num":
          indexed = arr.map(function(o, i){ return { o:o, i:i, n: firstNum(o.text) }; });
          indexed.sort(function(a, b){
            if (a.n === null && b.n === null){ return a.i - b.i; }
            if (a.n === null){ return 1; }
            if (b.n === null){ return -1; }
            return (a.n - b.n) || (a.i - b.i);
          });
          arr = indexed.map(function(x){ return x.o; });
          break;
        case "shuffle":
          for (i = arr.length - 1; i > 0; i--){
            j = Math.floor(Math.random() * (i + 1));
            tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
          }
          break;
        case "revlines":
          arr.reverse();
          break;
      }
      setEditor(arr.map(function(o){ return o.text; }).join("\n"));
      lineObjs = arr;
      renderBars(true);
    }

    updateStats();
    src.setSelectionRange(0, 0);
    src.scrollTop = 0;
    markHere();
    logOp(OP_LABELS[name], fmtNum(count) + " lines");

    if (btn && !reduceMotion){
      btn.classList.remove("zap");
      void btn.offsetWidth;
      btn.classList.add("zap");
      setTimeout(function(){ btn.classList.remove("zap"); }, 300);
    }
  }

  $$(".op-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      applyOp(btn.getAttribute("data-op"), btn);
    });
  });

  btnUndo.addEventListener("click", function(){
    if (!undoStack.length) return;
    var v = undoStack.pop();
    setEditor(v);
    parseFresh();
    renderBars(false);
    updateStats();
    markHere();
    syncUndo();
    logOp("UNDO", "previous state restored");
  });

  /* ---- typing ---- */
  src.addEventListener("input", function(){
    if (suppress) return;
    parseFresh();
    renderBars(false);
    updateStats();
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
    parseFresh();
    renderBars(false);
    updateStats();
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

  /* ---- DOWNLOAD ---- */
  var btnDownload = $("#btn-download");
  btnDownload.addEventListener("click", function(){
    var v = src.value;
    if (!v){ flash(btnDownload, "NOTHING TO SAVE", true); return; }
    var blob = new Blob([v], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "IrisTool-sorted.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
    flash(btnDownload, "SAVED ✓");
  });

  /* ---- sample / clear ---- */
  function refreshAll(){
    parseFresh();
    renderBars(false);
    updateStats();
    markHere();
  }
  $("#btn-sample").addEventListener("click", function(){
    setEditor(SAMPLE);
    cursorSet = false;
    refreshAll();
    src.focus();
  });
  $("#btn-clear").addEventListener("click", function(){
    setEditor("");
    cursorSet = false;
    refreshAll();
    src.focus();
  });

  /* ---- init ---- */
  parseFresh();
  renderBars(false);
  updateStats();
  syncUndo();
  markHere();
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
