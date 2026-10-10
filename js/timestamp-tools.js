
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

  /* ================= TIME ENGINE ================= */
  var cbControls = $("#cb-controls");
  var cbReadouts = $("#cb-readouts");
  var cbInLabel  = $("#cb-in-label");
  var cbOutLabel = $("#cb-out-label");
  var cbBadge    = $("#cb-badge");
  var vsBadge    = $("#vs-badge");
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { mode:"unix", ms: Date.now() };

  var MODES = {
    "unix":  { inLabel:"TIMESTAMP / DATE", outLabel:"EVERY FORMAT", glyph:"⇄", badge:"BIDIRECTIONAL" },
    "epoch": { inLabel:"EPOCH VALUE",      outLabel:"DECOMPOSED",   glyph:"◷", badge:"ALL FORMATS" }
  };

  var WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function fmtNum(n){ return n.toLocaleString("en-US"); }
  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function pad2(n){ return ("0"+n).slice(-2); }

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

  /* ---- parsing ---- */
  function parseEpoch(input){
    var s = String(input).trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    if (!isFinite(n)) return null;
    var isMs = Math.abs(n) > 1e11;
    var ms = isMs ? n : n * 1000;
    return { ms: ms, isMs: isMs };
  }

  function fmtLocal(d){
    try {
      return d.toLocaleString(undefined, { year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", timeZoneName:"short" });
    } catch(e){ return d.toString(); }
  }

  function relative(ms){
    var diff = ms - Date.now();
    var future = diff >= 0;
    var s = Math.abs(diff)/1000;
    if (s < 2) return "just now";
    var v, u;
    if (s < 60){ v=Math.round(s); u="second"; }
    else if (s < 3600){ v=Math.round(s/60); u="minute"; }
    else if (s < 86400){ v=Math.round(s/3600); u="hour"; }
    else if (s < 2592000){ v=Math.round(s/86400); u="day"; }
    else if (s < 31536000){ v=Math.round(s/2592000); u="month"; }
    else { v=Math.round(s/31536000); u="year"; }
    if (v !== 1) u += "s";
    return future ? "in " + v + " " + u : v + " " + u + " ago";
  }

  function dayOfYear(d){
    var start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return Math.floor((d.getTime() - start) / 86400000);
  }

  function toLocalInputValue(ms){
    var d = new Date(ms);
    return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate()) +
           "T" + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function signedHex(sec){
    return (sec < 0 ? "-0x" : "0x") + Math.abs(sec).toString(16).toUpperCase();
  }
  function signedBin(sec){
    return (sec < 0 ? "-" : "") + Math.abs(sec).toString(2);
  }

  /* ---- live clock ---- */
  function tickNow(){
    var now = Date.now();
    var sec = Math.floor(now/1000);
    $("#now-ts").textContent = sec;
    var d = new Date(now);
    $("#now-utc").textContent = d.toUTCString();
    $("#now-local").textContent = fmtLocal(d);
  }
  setInterval(tickNow, 1000);
  tickNow();

  $("#now-copy").addEventListener("click", function(){
    var btn = $("#now-copy");
    var val = $("#now-ts").textContent;
    var done = function(){
      btn.textContent = "✓ COPIED"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = "⧉ COPY"; btn.classList.remove("ok"); }, 1100);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta); done();
    }
  });

  /* ---- readout rows ---- */
  function row(label, value, active){
    return '<div class="cb-row' + (active ? " cb-active" : "") + '">' +
      '<span class="cb-rl">' + label + '</span>' +
      '<code class="cb-rv">' + escHtml(value) + '</code>' +
      '<button type="button" class="cb-copy" data-copy="' + escHtml(value) + '" aria-label="Copy ' + label + '">⧉</button>' +
    '</div>';
  }

  function renderReadouts(ms){
    var d = new Date(ms);
    var sec = Math.floor(ms/1000);
    var html = "";
    if (state.mode === "unix"){
      html += row("UNIX · SEC", String(sec), true);
      html += row("UNIX · MS", String(Math.round(ms)), false);
      html += row("ISO 8601", d.toISOString(), false);
      html += row("UTC", d.toUTCString(), false);
      html += row("LOCAL", fmtLocal(d), false);
      html += row("RELATIVE", relative(ms), false);
    } else {
      html += row("ISO 8601", d.toISOString(), false);
      html += row("UTC", d.toUTCString(), false);
      html += row("LOCAL", fmtLocal(d), false);
      html += row("RFC 2822", d.toUTCString().replace("GMT","+0000"), false);
      html += row("RELATIVE", relative(ms), false);
      html += row("HEX", signedHex(sec), true);
      html += row("BINARY", signedBin(sec), true);
    }
    cbReadouts.innerHTML = html;
  }

  function renderStats(ms){
    var d = new Date(ms);
    var sec = Math.floor(ms/1000);
    if (state.mode === "unix"){
      setStat(sv[0], String(sec));
      setStat(sv[1], WEEKDAYS[d.getUTCDay()]);
      setStat(sv[2], dayOfYear(d) + " / " + (isLeap(d.getUTCFullYear()) ? 366 : 365));
      setStat(sv[3], pad2(d.getUTCHours()) + ":" + pad2(d.getUTCMinutes()) + ":" + pad2(d.getUTCSeconds()));
      sl[0].textContent="Unix seconds"; ss[0].textContent="SINCE 1970-01-01";
      sl[1].textContent="Weekday";     ss[1].textContent="UTC";
      sl[2].textContent="Day of year"; ss[2].textContent="UTC";
      sl[3].textContent="UTC clock";   ss[3].textContent="HH:MM:SS";
    } else {
      setStat(sv[0], fmtNum(Math.floor(ms/86400000)));
      setStat(sv[1], fmtNum(Math.floor(ms/3600000)));
      setStat(sv[2], fmtNum(Math.floor(ms/60000)));
      setStat(sv[3], fmtNum(sec));
      sl[0].textContent="Days";    ss[0].textContent="SINCE EPOCH";
      sl[1].textContent="Hours";   ss[1].textContent="SINCE EPOCH";
      sl[2].textContent="Minutes"; ss[2].textContent="SINCE EPOCH";
      sl[3].textContent="Seconds"; ss[3].textContent="SINCE EPOCH";
    }
  }
  function isLeap(y){ return (y%4===0 && y%100!==0) || y%400===0; }

  function render(ms){
    renderReadouts(ms);
    renderStats(ms);
  }

  /* ---- controls ---- */
  function buildControls(){
    cbControls.innerHTML = "";
    var sec = Math.floor(state.ms/1000);

    if (state.mode === "unix"){
      cbControls.innerHTML =
        '<label class="cb-fieldlabel" for="ctl-ts">UNIX TIMESTAMP · SEC OR MS</label>' +
        '<div class="cb-tsfield-wrap">' +
          '<input type="text" id="ctl-ts" class="cb-tsfield" value="' + sec + '" inputmode="numeric" spellcheck="false" autocomplete="off">' +
          '<button type="button" class="cb-nowbtn" id="ctl-ts-now">NOW</button>' +
        '</div>' +
        '<label class="cb-fieldlabel" for="ctl-date">OR DATE &amp; TIME · LOCAL</label>' +
        '<input type="datetime-local" id="ctl-date" class="cb-datefield" value="' + toLocalInputValue(state.ms) + '">' +
        '<p class="cb-syncnote">⇅ THE TWO FIELDS STAY IN SYNC — EDIT EITHER</p>' +
        '<p class="cb-hint">Timestamps over 11 digits read as milliseconds. Negative values reach back before 1970.</p>';
      wireUnix();
    } else {
      cbControls.innerHTML =
        '<label class="cb-fieldlabel" for="ctl-epoch">EPOCH VALUE · SEC OR MS</label>' +
        '<div class="cb-tsfield-wrap">' +
          '<input type="text" id="ctl-epoch" class="cb-tsfield" value="' + sec + '" inputmode="numeric" spellcheck="false" autocomplete="off">' +
          '<button type="button" class="cb-nowbtn" id="ctl-epoch-now">NOW</button>' +
        '</div>' +
        '<div class="cb-chips">' +
          '<button type="button" class="cb-chip" data-offset="0">NOW</button>' +
          '<button type="button" class="cb-chip" data-offset="3600">+1 HOUR</button>' +
          '<button type="button" class="cb-chip" data-offset="86400">+1 DAY</button>' +
          '<button type="button" class="cb-chip" data-offset="604800">+1 WEEK</button>' +
          '<button type="button" class="cb-chip" data-iso="1969-07-20T20:17:00Z">MOON LANDING</button>' +
          '<button type="button" class="cb-chip" data-iso="2000-01-01T00:00:00Z">Y2K</button>' +
        '</div>' +
        '<p class="cb-hint">Drop in any epoch — the bench decomposes it into every format it knows.</p>';
      wireEpoch();
    }
  }

  function wireUnix(){
    var ts = $("#ctl-ts"), date = $("#ctl-date");
    ts.addEventListener("input", function(){
      var p = parseEpoch(ts.value);
      if (p){
        ts.classList.remove("cb-invalid");
        state.ms = p.ms;
        date.value = toLocalInputValue(p.ms);
        render(p.ms);
      } else ts.classList.add("cb-invalid");
    });
    date.addEventListener("input", function(){
      if (!date.value) return;
      var t = new Date(date.value).getTime();
      if (!isNaN(t)){
        state.ms = t;
        ts.value = String(Math.floor(t/1000));
        ts.classList.remove("cb-invalid");
        render(t);
      }
    });
    $("#ctl-ts-now").addEventListener("click", function(){
      state.ms = Date.now();
      ts.value = String(Math.floor(state.ms/1000));
      date.value = toLocalInputValue(state.ms);
      ts.classList.remove("cb-invalid");
      render(state.ms);
    });
  }

  function wireEpoch(){
    var ep = $("#ctl-epoch");
    ep.addEventListener("input", function(){
      var p = parseEpoch(ep.value);
      if (p){ ep.classList.remove("cb-invalid"); state.ms = p.ms; render(p.ms); }
      else ep.classList.add("cb-invalid");
    });
    $("#ctl-epoch-now").addEventListener("click", function(){
      state.ms = Date.now();
      ep.value = String(Math.floor(state.ms/1000));
      ep.classList.remove("cb-invalid");
      render(state.ms);
    });
    $$(".cb-chip").forEach(function(chip){
      chip.addEventListener("click", function(){
        var target;
        if (chip.hasAttribute("data-offset")){
          target = Date.now() + parseInt(chip.getAttribute("data-offset"),10) * 1000;
        } else {
          target = Date.parse(chip.getAttribute("data-iso"));
        }
        if (!isNaN(target)){
          state.ms = target;
          ep.value = String(Math.floor(target/1000));
          ep.classList.remove("cb-invalid");
          render(target);
        }
      });
    });
  }

  /* ---- copy delegation ---- */
  cbReadouts.addEventListener("click", function(e){
    var btn = e.target.closest(".cb-copy");
    if (!btn) return;
    var val = btn.getAttribute("data-copy");
    var done = function(){
      btn.textContent = "✓"; btn.classList.add("ok");
      setTimeout(function(){ btn.textContent = "⧉"; btn.classList.remove("ok"); }, 1000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(val).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = val; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch(e){}
      document.body.removeChild(ta); done();
    }
  });

  /* ---- mode switching ---- */
  function setMode(m){
    state.mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    var meta = MODES[m];
    cbInLabel.textContent = meta.inLabel;
    cbOutLabel.textContent = meta.outLabel;
    cbBadge.textContent = meta.badge;
    vsBadge.textContent = meta.glyph;
    buildControls();
    render(state.ms);
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- init ---- */
  setMode("unix");
})();
