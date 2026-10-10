
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

  /* ================= CSV/TSV ENGINE ================= */
  var csvInput = $("#csv-input");
  var tableWrap = $("#csv-table-wrap");
  var outPre = $("#csv-out-pre");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { mode:"csv-view", sort:{col:-1, dir:1}, trim:true, quoteAll:false, sortRows:false, rows:[], plainOut:"" };

  var SAMPLES = {
    "csv-view": 'name,role,missions,active,notes\n"Armstrong, Neil",Commander,3,true,"First step, 1969"\nBuzz Aldrin,LM Pilot,2,true,Second on the moon\nMichael Collins,CM Pilot,1,false,"Stayed in orbit"\nYuri Gagarin,Cosmonaut,1,true,"First human in space"',
    "csv-fmt": 'name, role ,missions,active\n"Armstrong, Neil", Commander , 3 ,true\nBuzz Aldrin,LM Pilot,2,true\nMichael Collins,CM Pilot,1,false',
    "tsv-view": 'name\trole\tmissions\tactive\nNeil Armstrong\tCommander\t3\ttrue\nBuzz Aldrin\tLM Pilot\t2\ttrue\nMichael Collins\tCM Pilot\t1\tfalse\nYuri Gagarin\tCosmonaut\t1\ttrue',
    "tsv-fmt": 'id\tname\tscore\n1\tAda\t99\n2\tGrace\t97\n3\tAlan\t98'
  };

  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function escAttr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
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

  function isViewer(){ return state.mode === "csv-view" || state.mode === "tsv-view"; }
  function getDelim(){ return (state.mode === "csv-view" || state.mode === "csv-fmt") ? "," : "\t"; }
  function delimName(){ return getDelim() === "," ? "COMMA" : "TAB"; }
  function delimSym(){ return getDelim() === "," ? "," : "⇥"; }

  /* ---- parser ---- */
  function parseDelimited(text, delim){
    var rows = [], row = [], field = "", inQ = false, i = 0;
    while (i < text.length){
      var c = text[i];
      if (inQ){
        if (c === '"'){
          if (text[i+1] === '"'){ field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"'){ inQ = true; i++; continue; }
      if (c === delim){ row.push(field); field = ""; i++; continue; }
      if (c === '\n'){ row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      if (c === '\r'){ i++; continue; }
      field += c; i++;
    }
    if (field !== "" || row.length){ row.push(field); rows.push(row); }
    return rows.filter(function(r){ return r.some(function(f){ return f.trim() !== ""; }); });
  }

  function serializeRows(rows, delim, quoteAll){
    return rows.map(function(r){
      return r.map(function(f){
        var needs = f.indexOf(delim) !== -1 || f.indexOf('"') !== -1 || f.indexOf("\n") !== -1;
        if (quoteAll || needs) return '"' + f.replace(/"/g,'""') + '"';
        return f;
      }).join(delim);
    }).join("\n");
  }

  /* ---- viewer ---- */
  function sortRows(rows, col, dir){
    var headers = rows[0];
    var body = rows.slice(1);
    body.sort(function(a, b){
      var va = a[col] !== undefined ? a[col] : "";
      var vb = b[col] !== undefined ? b[col] : "";
      var na = parseFloat(va), nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb) && String(va).trim() !== "" && String(vb).trim() !== "") return (na - nb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return [headers].concat(body);
  }

  function renderViewer(rows){
    if (!rows.length){
      tableWrap.innerHTML = '<div class="dc-placeholder">Paste ' + delimName() + '-separated data on the left \u2014 a live table appears here.\nClick a column header to sort \u00B7 click again to reverse.</div>';
      return;
    }
    var headers = rows[0];
    if (state.sort.col >= headers.length) state.sort = {col:-1, dir:1};
    var sorted = (state.sort.col >= 0) ? sortRows(rows, state.sort.col, state.sort.dir) : rows;
    var body = sorted.slice(1);
    var html = '<table class="csv-table"><thead><tr>';
    headers.forEach(function(h, i){
      var arrow = state.sort.col === i ? (state.sort.dir === 1 ? "\u25B2" : "\u25BC") : "";
      html += '<th data-col="' + i + '">' + escHtml(h || "col"+(i+1)) + '<span class="th-sort">' + arrow + '</span></th>';
    });
    html += '</tr></thead><tbody>';
    body.forEach(function(r){
      html += '<tr>';
      for (var i=0;i<headers.length;i++){
        var v = r[i] !== undefined ? r[i] : "";
        html += '<td title="' + escAttr(v) + '">' + escHtml(v) + '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
    tableWrap.innerHTML = html;
  }

  /* ---- formatter ---- */
  function formatDelimited(text, delim, opts){
    var rows = parseDelimited(text, delim);
    if (!rows.length) return { ok:true, output:"", rows:0, cols:0 };
    var maxCols = Math.max.apply(null, rows.map(function(r){ return r.length; }));
    rows = rows.map(function(r){
      var nr = r.slice();
      while (nr.length < maxCols) nr.push("");
      return nr;
    });
    if (opts.trim){
      rows = rows.map(function(r){ return r.map(function(f){ return f.trim(); }); });
    }
    if (opts.sortRows && rows.length > 1){
      var headers = rows[0];
      var body = rows.slice(1).sort(function(a,b){ return String(a[0]||"").localeCompare(String(b[0]||"")); });
      rows = [headers].concat(body);
    }
    return { ok:true, output: serializeRows(rows, delim, opts.quoteAll), rows: rows.length, cols: maxCols };
  }

  /* ---- copy as table (dual-format clipboard) ---- */
  function buildHtmlTable(rows){
    var html = '<table style="border-collapse:collapse;font-family:Consolas,\'Courier New\',monospace;font-size:12px">';
    rows.forEach(function(r, i){
      html += "<tr>";
      r.forEach(function(f){
        if (i === 0){
          html += '<th style="border:1px solid #999;background:#0033FF;color:#fff;padding:5px 10px;font-weight:bold;text-align:left">' + escHtml(f) + '</th>';
        } else {
          html += '<td style="border:1px solid #ccc;padding:5px 10px">' + escHtml(f) + '</td>';
        }
      });
      html += "</tr>";
    });
    html += "</table>";
    return html;
  }

  function copyAsTable(rows, onSuccess, onFail){
    var tsv = rows.map(function(r){ return r.join("\t"); }).join("\n");
    var html = buildHtmlTable(rows);
    function fallback(){
      copyText(tsv, onSuccess, onFail);
    }
    if (navigator.clipboard && window.ClipboardItem){
      try {
        var item = new ClipboardItem({
          "text/html": new Blob([html], {type:"text/html"}),
          "text/plain": new Blob([tsv], {type:"text/plain"})
        });
        navigator.clipboard.write([item]).then(onSuccess, fallback);
      } catch(e){ fallback(); }
    } else {
      fallback();
    }
  }

  /* ================= RUNNER ================= */
  function run(){
    var input = csvInput.value;
    var delim = getDelim();
    var rows = parseDelimited(input, delim);
    state.rows = rows;
    var cols = rows.length ? Math.max.apply(null, rows.map(function(r){ return r.length; })) : 0;
    var dataRows = rows.length ? rows.length - 1 : 0;

    if (isViewer()){
      tableWrap.style.display = "";
      outPre.style.display = "none";
      $("#btn-feed").style.display = "none";
      $("#out-label").textContent = "TABLE";
      $("#out-badge").textContent = dataRows + " ROWS";
      $("#out-note").innerHTML = 'CLICK HEADERS TO SORT \u00B7 <em>COPIES AS A TABLE</em>';
      $("#btn-copy-out").textContent = "\u29C9 Copy as table";
      renderViewer(rows);
      state.plainOut = serializeRows(rows, delim, false);
      setStat(sv[0], fmtNum(dataRows));
      setStat(sv[1], fmtNum(cols));
      setStat(sv[2], fmtNum(dataRows * cols));
      setStat(sv[3], delimSym());
    } else {
      var result = formatDelimited(input, delim, {trim:state.trim, quoteAll:state.quoteAll, sortRows:state.sortRows});
      state.plainOut = result.output;
      tableWrap.style.display = "none";
      outPre.style.display = "";
      $("#btn-feed").style.display = "";
      outPre.textContent = result.output || "(empty)";
      $("#out-label").textContent = "FORMATTED";
      $("#out-badge").textContent = result.rows + " ROWS";
      $("#out-note").innerHTML = 'MINIMAL QUOTING \u00B7 <em>SAFE TO IMPORT</em>';
      $("#btn-copy-out").textContent = "\u29C9 Copy output";
      setStat(sv[0], fmtNum(result.rows));
      setStat(sv[1], fmtNum(result.cols));
      setStat(sv[2], fmtNum(input.length));
      setStat(sv[3], fmtNum(result.output.length));
    }
    sl[0].textContent = isViewer() ? "Data rows" : "Rows";
    ss[0].textContent = isViewer() ? "EXCL. HEADER" : "INCL. HEADER";
    sl[1].textContent = "Columns";
    ss[1].textContent = "FIELDS PER ROW";
    sl[2].textContent = isViewer() ? "Total fields" : "Input size";
    ss[2].textContent = isViewer() ? "ROWS \u00D7 COLS" : "CHARACTERS";
    sl[3].textContent = isViewer() ? "Delimiter" : "Output size";
    ss[3].textContent = isViewer() ? delimName() : "CHARACTERS";
  }

  /* ---- options ---- */
  function renderOpts(){
    var holder = $("#opts-holder");
    holder.innerHTML = "";
    function mkToggle(key, label){
      var b = document.createElement("button");
      b.type = "button"; b.className = "tgl";
      b.setAttribute("aria-pressed", String(state[key]));
      b.textContent = label;
      b.addEventListener("click", function(){
        state[key] = !state[key];
        b.setAttribute("aria-pressed", String(state[key]));
        run();
      });
      holder.appendChild(b);
    }
    if (isViewer()){
      holder.innerHTML = '<span class="opt-hint">CLICK A COLUMN HEADER TO SORT</span>';
    } else {
      mkToggle("trim", "\u232B TRIM FIELDS");
      mkToggle("quoteAll", '" QUOTE ALL');
      mkToggle("sortRows", "\u21C5 SORT ROWS");
    }
  }

  /* ---- mode switching ---- */
  var GLYPHS = { "csv-view":"\u25A6", "tsv-view":"\u25A4", "csv-fmt":"\u2261", "tsv-fmt":"\u2263" };
  function setMode(m){
    state.mode = m;
    state.sort = {col:-1, dir:1};
    $$(".c-tab").forEach(function(tab){
      var on = tab.getAttribute("data-mode") === m;
      tab.classList.toggle("is-on", on);
      tab.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    $("#vs-badge").textContent = GLYPHS[m];
    $("#in-label").textContent = (m === "csv-view" || m === "csv-fmt") ? "CSV" : "TSV";
    renderOpts();
    csvInput.value = SAMPLES[m];
    run();
  }
  $$(".c-tab").forEach(function(tab){
    tab.addEventListener("click", function(){ setMode(tab.getAttribute("data-mode")); });
  });

  csvInput.addEventListener("input", run);

  /* ---- table sort (event delegation) ---- */
  tableWrap.addEventListener("click", function(e){
    var th = e.target.closest("th");
    if (!th) return;
    var col = parseInt(th.getAttribute("data-col"),10);
    if (state.sort.col === col) state.sort.dir *= -1;
    else state.sort = {col:col, dir:1};
    renderViewer(state.rows);
  });

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
  function copyText(val, done, onFail){
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, function(){ if (onFail) onFail(); else done(); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch(e){ if (onFail) onFail(); }
      document.body.removeChild(ta);
    }
  }
  $("#btn-copy-in").addEventListener("click", function(){
    var b = this;
    if (!csvInput.value){ flash(b, "INPUT EMPTY", true); return; }
    copyText(csvInput.value, function(){ flash(b, "COPIED \u2713"); });
  });
  $("#btn-copy-out").addEventListener("click", function(){
    var b = this;
    if (isViewer()){
      if (!state.rows.length){ flash(b, "NO DATA", true); return; }
      copyAsTable(state.rows,
        function(){ flash(b, "COPIED AS TABLE \u2713"); },
        function(){ flash(b, "COPIED \u2713"); }
      );
    } else {
      if (!state.plainOut){ flash(b, "OUTPUT EMPTY", true); return; }
      copyText(state.plainOut, function(){ flash(b, "COPIED \u2713"); });
    }
  });
  $("#btn-clear").addEventListener("click", function(){
    csvInput.value = "";
    run();
    csvInput.focus();
  });
  $("#btn-sample").addEventListener("click", function(){
    csvInput.value = SAMPLES[state.mode];
    run();
    csvInput.focus();
  });
  $("#btn-feed").addEventListener("click", function(){
    if (!state.plainOut){ flash(this, "OUTPUT EMPTY", true); return; }
    csvInput.value = state.plainOut;
    run();
    flash(this, "FED BACK \u2713");
  });

  /* ---- init ---- */
  renderOpts();
  csvInput.value = SAMPLES["csv-view"];
  run();
})();
