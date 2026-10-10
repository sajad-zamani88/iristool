
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

  /* ================= COMPARISON ENGINE ================= */
  var analyzer = $("#analyzer");
  var srcA = $("#src-a"), srcB = $("#src-b");
  var bdA = $("#bd-a"), bdB = $("#bd-b");
  var badgeA = $("#badge-a"), badgeB = $("#badge-b");
  var vsBadge = $("#vs-badge");
  var dupScroll = $("#dup-scroll"), dupCount = $("#dup-count");
  var diffScroll = $("#diff-scroll");
  var dbAdd = $("#db-add"), dbDel = $("#db-del"), dbEq = $("#db-eq");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var SAMPLE_A = srcA.value;
  var SAMPLE_B = srcB.value;

  var mode = "compare";
  var caseMode = false;   /* case-sensitive */
  var trimMode = true;    /* trim edges */
  var suppress = false;

  var uniqAList = [], uniqBList = [];
  var plainDiff = "";

  var MODES = {
    compare: {
      labels: ["Similarity","Only in A","Only in B","Shared lines"],
      subs:   ["MULTISET OVERLAP","PAINTED RED","PAINTED BLUE","PRESENT IN BOTH"]
    },
    dup: {
      labels: ["Total lines","Unique lines","Duplicated","Extra copies"],
      subs:   ["IN TEXT A","DISTINCT CONTENT","LINES THAT REPEAT","REDUNDANT INSTANCES"]
    },
    diff: {
      labels: ["Lines in A","Lines in B","Added","Removed"],
      subs:   ["LEFT PANE","RIGHT PANE","+ IN B, NOT IN A","− IN A, NOT IN B"]
    }
  };

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function escHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

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

  function norm(l){
    var k = trimMode ? l.trim() : l;
    if (!caseMode){ k = k.toLowerCase(); }
    return k;
  }

  /* ---- backdrop painting ---- */
  function paintPane(bd, text, markSet, cls){
    var lines = text.split("\n");
    var html = "";
    for (var i = 0; i < lines.length; i++){
      var esc = escHtml(lines[i]);
      if (markSet.has(i)){
        html += '<mark class="mk ' + cls + '">' + (esc || "&nbsp;") + "</mark>";
      } else {
        html += esc;
      }
      if (i < lines.length - 1){ html += "\n"; }
    }
    bd.innerHTML = html;
  }
  srcA.addEventListener("scroll", function(){ bdA.scrollTop = srcA.scrollTop; bdA.scrollLeft = srcA.scrollLeft; }, {passive:true});
  srcB.addEventListener("scroll", function(){ bdB.scrollTop = srcB.scrollTop; bdB.scrollLeft = srcB.scrollLeft; }, {passive:true});

  /* ---- stats labels per mode ---- */
  function setModeLabels(){
    var cfg = MODES[mode];
    for (var i = 0; i < 4; i++){
      sl[i].textContent = cfg.labels[i];
      ss[i].textContent = cfg.subs[i];
    }
  }

  /* ================= TEXT COMPARE ================= */
  function runCompare(){
    var la = srcA.value.split("\n"), lb = srcB.value.split("\n");
    var ka = la.map(norm), kb = lb.map(norm);
    var setA = new Set(ka), setB = new Set(kb);

    var cA = {}, cB = {};
    ka.forEach(function(k){ cA[k] = (cA[k] || 0) + 1; });
    kb.forEach(function(k){ cB[k] = (cB[k] || 0) + 1; });

    var inter = 0, union = 0, k;
    for (k in cA){
      var cb = cB[k] || 0;
      inter += Math.min(cA[k], cb);
      union += Math.max(cA[k], cb);
    }
    for (k in cB){ if (!(k in cA)){ union += cB[k]; } }
    var sim = union ? Math.round((inter / union) * 100) : 100;

    var markA = new Set(), markB = new Set();
    var onlyA = 0, onlyB = 0, shared = 0;
    uniqAList = []; uniqBList = [];
    ka.forEach(function(key, i){
      if (!setB.has(key)){ markA.add(i); onlyA++; uniqAList.push(la[i]); }
    });
    kb.forEach(function(key, i){
      if (!setA.has(key)){ markB.add(i); onlyB++; uniqBList.push(lb[i]); }
    });
    setA.forEach(function(key){ if (setB.has(key)){ shared++; } });

    paintPane(bdA, srcA.value, markA, "mk-a");
    paintPane(bdB, srcB.value, markB, "mk-b");

    badgeA.textContent = fmtNum(onlyA) + " UNIQUE";
    badgeB.textContent = fmtNum(onlyB) + " UNIQUE";
    vsBadge.textContent = sim + "%";

    setStat(sv[0], sim + "%");
    setStat(sv[1], fmtNum(onlyA));
    setStat(sv[2], fmtNum(onlyB));
    setStat(sv[3], fmtNum(shared));
  }

  /* ================= DUPLICATE FINDER ================= */
  function selectLineA(oneBased){
    var lines = srcA.value.split("\n");
    var idx = Math.min(oneBased, lines.length) - 1;
    var start = 0;
    for (var i = 0; i < idx; i++){ start += lines[i].length + 1; }
    var end = start + (lines[idx] ? lines[idx].length : 0);
    srcA.focus();
    srcA.setSelectionRange(start, end);
    var lh = parseFloat(getComputedStyle(srcA).lineHeight) || 24;
    srcA.scrollTop = Math.max(0, idx * lh - srcA.clientHeight / 2 + lh);
  }

  function runDup(){
    var lines = srcA.value.split("\n");
    var map = Object.create(null), order = [];
    lines.forEach(function(l, i){
      var key = norm(l);
      if (key === ""){ return; } /* blanks never count as duplicates */
      if (!map[key]){
        map[key] = { text: l, count: 0, pos: [] };
        order.push(key);
      }
      map[key].count++;
      map[key].pos.push(i + 1);
    });

    var dups = order.map(function(key){ return map[key]; })
      .filter(function(d){ return d.count > 1; })
      .sort(function(a, b){ return (b.count - a.count) || (a.pos[0] - b.pos[0]); });

    var dupKeys = new Set(order.filter(function(key){ return map[key].count > 1; }));
    var markA = new Set();
    lines.forEach(function(l, i){
      if (dupKeys.has(norm(l))){ markA.add(i); }
    });
    paintPane(bdA, srcA.value, markA, "mk-a");
    bdB.innerHTML = "";

    var extra = dups.reduce(function(s, d){ return s + d.count - 1; }, 0);
    dupCount.textContent = fmtNum(dups.length) + " FOUND";
    badgeA.textContent = fmtNum(lines.length) + " LINES";
    vsBadge.textContent = "⧉";

    /* panel rows */
    dupScroll.textContent = "";
    if (!dups.length){
      var none = document.createElement("span");
      none.className = "dup-empty";
      none.textContent = "no duplicates — every line in A is unique";
      dupScroll.appendChild(none);
    }
    var CAP = 80;
    dups.slice(0, CAP).forEach(function(d){
      var row = document.createElement("div");
      row.className = "dup-row";
      row.title = "Select the first occurrence in Text A";

      var n = document.createElement("span");
      n.className = "dup-n";
      n.textContent = "×" + d.count;

      var t = document.createElement("span");
      t.className = "dup-t";
      t.textContent = d.text === "" ? "·" : d.text;

      var p = document.createElement("span");
      p.className = "dup-p";
      var shown = d.pos.slice(0, 5).map(function(x){ return "#" + x; }).join(" · ");
      if (d.pos.length > 5){ shown += " +" + (d.pos.length - 5); }
      p.textContent = shown;

      var go = document.createElement("button");
      go.type = "button";
      go.className = "dup-go";
      go.textContent = "→";
      go.setAttribute("aria-label", "Jump to first occurrence");

      row.appendChild(n); row.appendChild(t); row.appendChild(p); row.appendChild(go);
      row.addEventListener("click", function(){ selectLineA(d.pos[0]); });
      dupScroll.appendChild(row);
    });
    if (dups.length > CAP){
      var more = document.createElement("span");
      more.className = "dup-more";
      more.textContent = "+ " + fmtNum(dups.length - CAP) + " more duplicated lines";
      dupScroll.appendChild(more);
    }

    setStat(sv[0], fmtNum(lines.length));
    setStat(sv[1], fmtNum(order.length));
    setStat(sv[2], fmtNum(dups.length));
    setStat(sv[3], fmtNum(extra));
  }

  /* ================= DIFF VIEWER (LCS) ================= */
  function diffLCS(a, b){
    var n = a.length, m = b.length, i, j;
    if (n * m <= 250000){
      var dp = new Array(n + 1);
      for (i = 0; i <= n; i++){ dp[i] = new Uint16Array(m + 1); }
      for (i = n - 1; i >= 0; i--){
        for (j = m - 1; j >= 0; j--){
          dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      var ops = []; i = 0; j = 0;
      while (i < n && j < m){
        if (a[i] === b[j]){ ops.push({ t:"=", a:i, b:j }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]){ ops.push({ t:"-", a:i }); i++; }
        else { ops.push({ t:"+", b:j }); j++; }
      }
      for (; i < n; i++){ ops.push({ t:"-", a:i }); }
      for (; j < m; j++){ ops.push({ t:"+", b:j }); }
      return ops;
    }
    /* fast fallback for very large inputs: multiset matching */
    var avail = {};
    b.forEach(function(l, idx){ (avail[l] = avail[l] || []).push(idx); });
    var ops2 = [], matchedB = {};
    a.forEach(function(l, idx){
      if (avail[l] && avail[l].length){
        var bj = avail[l].shift();
        matchedB[bj] = true;
        ops2.push({ t:"=", a:idx, b:bj });
      } else {
        ops2.push({ t:"-", a:idx });
      }
    });
    b.forEach(function(l, idx){ if (!matchedB[idx]){ ops2.push({ t:"+", b:idx }); } });
    return ops2;
  }

  function runDiff(){
    var a = srcA.value.split("\n"), b = srcB.value.split("\n");
    var ops = diffLCS(a, b);

    var add = 0, del = 0, eq = 0;
    var markA = new Set(), markB = new Set();
    var plain = [];

    diffScroll.textContent = "";
    var CAP = 600, rendered = 0;
    ops.forEach(function(op){
      if (op.t === "+"){ add++; markB.add(op.b); }
      else if (op.t === "-"){ del++; markA.add(op.a); }
      else { eq++; }

      if (rendered < CAP){
        rendered++;
        var row = document.createElement("div");
        var noA = "", noB = "", mk = " ", tx = "", cls = "d-eq";
        if (op.t === "="){
          noA = op.a + 1; noB = op.b + 1; tx = a[op.a];
          plain.push("  " + tx);
        } else if (op.t === "-"){
          cls = "d-del"; mk = "−"; noA = op.a + 1; tx = a[op.a];
          plain.push("- " + tx);
        } else {
          cls = "d-add"; mk = "+"; noB = op.b + 1; tx = b[op.b];
          plain.push("+ " + tx);
        }
        row.className = "drow " + cls;

        var c1 = document.createElement("span"); c1.className = "d-no"; c1.textContent = noA;
        var c2 = document.createElement("span"); c2.className = "d-no"; c2.textContent = noB;
        var c3 = document.createElement("span"); c3.className = "d-mk"; c3.textContent = mk;
        var c4 = document.createElement("span"); c4.className = "d-tx";
        if (tx === ""){ c4.textContent = "·"; c4.classList.add("d-empty"); }
        else { c4.textContent = tx; }
        row.appendChild(c1); row.appendChild(c2); row.appendChild(c3); row.appendChild(c4);
        diffScroll.appendChild(row);
      }
    });
    if (ops.length > CAP){
      var note = document.createElement("div");
      note.className = "diff-note";
      note.textContent = "… +" + fmtNum(ops.length - CAP) + " more lines — narrow the texts for a full walk";
      diffScroll.appendChild(note);
    }
    plainDiff = plain.join("\n");

    paintPane(bdA, srcA.value, markA, "mk-a");
    paintPane(bdB, srcB.value, markB, "mk-b");

    dbAdd.textContent = "+" + fmtNum(add) + " added";
    dbDel.textContent = "−" + fmtNum(del) + " removed";
    dbEq.textContent = "=" + fmtNum(eq) + " kept";
    badgeA.textContent = fmtNum(a.length) + " LINES";
    badgeB.textContent = fmtNum(b.length) + " LINES";
    vsBadge.textContent = "±";

    setStat(sv[0], fmtNum(a.length));
    setStat(sv[1], fmtNum(b.length));
    setStat(sv[2], "+" + fmtNum(add));
    setStat(sv[3], "−" + fmtNum(del));
  }

  /* ---- dispatcher ---- */
  function runAll(){
    if (mode === "compare"){ runCompare(); }
    else if (mode === "dup"){ runDup(); }
    else { runDiff(); }
  }

  function setMode(m){
    mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    analyzer.setAttribute("data-mode", m);
    setModeLabels();
    runAll();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- toggles ---- */
  function bindTgl(btn, setter){
    btn.addEventListener("click", function(){
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      setter(on);
      runAll();
    });
  }
  bindTgl($("#tgl-case"), function(v){ caseMode = v; });
  bindTgl($("#tgl-trim"), function(v){ trimMode = v; });

  /* ---- swap ---- */
  var btnSwap = $("#btn-swap");
  btnSwap.addEventListener("click", function(){
    suppress = true;
    var t = srcA.value;
    srcA.value = srcB.value;
    srcB.value = t;
    suppress = false;
    runAll();
    flash(btnSwap, "SWAPPED ✓");
  });

  /* ---- live typing ---- */
  srcA.addEventListener("input", function(){ if (!suppress){ runAll(); } });
  srcB.addEventListener("input", function(){ if (!suppress){ runAll(); } });

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

  /* ---- unique copy buttons ---- */
  $("#copy-uniq-a").addEventListener("click", function(){
    var btn = $("#copy-uniq-a");
    if (!uniqAList.length){ flash(btn, "NONE", true); return; }
    copyToClipboard(uniqAList.join("\n"), function(){ flash(btn, "COPIED ✓"); });
  });
  $("#copy-uniq-b").addEventListener("click", function(){
    var btn = $("#copy-uniq-b");
    if (!uniqBList.length){ flash(btn, "NONE", true); return; }
    copyToClipboard(uniqBList.join("\n"), function(){ flash(btn, "COPIED ✓"); });
  });

  /* ---- copy diff ---- */
  $("#copy-diff").addEventListener("click", function(){
    var btn = $("#copy-diff");
    if (!plainDiff){ flash(btn, "EMPTY", true); return; }
    copyToClipboard(plainDiff, function(){ flash(btn, "COPIED ✓"); });
  });

  /* ---- pane actions ---- */
  $("#btn-copy-a").addEventListener("click", function(){
    var btn = $("#btn-copy-a");
    if (!srcA.value){ flash(btn, "A IS EMPTY", true); return; }
    copyToClipboard(srcA.value, function(){ flash(btn, "COPIED ✓"); });
  });
  $("#btn-copy-b").addEventListener("click", function(){
    var btn = $("#btn-copy-b");
    if (!srcB.value){ flash(btn, "B IS EMPTY", true); return; }
    copyToClipboard(srcB.value, function(){ flash(btn, "COPIED ✓"); });
  });
  $("#btn-clear-a").addEventListener("click", function(){
    srcA.value = "";
    runAll();
    srcA.focus();
  });
  $("#btn-clear-b").addEventListener("click", function(){
    srcB.value = "";
    runAll();
    srcB.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    suppress = true;
    srcA.value = SAMPLE_A;
    srcB.value = SAMPLE_B;
    suppress = false;
    runAll();
    srcA.focus();
  });

  /* ---- init ---- */
  setModeLabels();
  runAll();
})();
