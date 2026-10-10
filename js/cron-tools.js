
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

  /* ================= CRON ENGINE ================= */
  var sl = [$("#sl-1"),$("#sl-2"),$("#sl-3"),$("#sl-4")];
  var sv = [$("#sv-1"),$("#sv-2"),$("#sv-3"),$("#sv-4")];
  var ss = [$("#ss-1"),$("#ss-2"),$("#ss-3"),$("#ss-4")];

  var state = { mode:"generator" };
  var schedule = { parsed:null, raw:null, nextRuns:[] };

  var DOW_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var DOW_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MO_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
  var MO_SHORT = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var MONTH_MAP = {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
  var DAY_MAP = {SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};

  function pad2(n){ return ("0"+n).slice(-2); }
  function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
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

  /* ---- field parsing ---- */
  function resolveValue(s, names){
    s = String(s).trim();
    if (/^\d+$/.test(s)) return parseInt(s,10);
    if (names){
      var up = s.toUpperCase();
      if (names[up] !== undefined) return names[up];
    }
    return null;
  }
  function parseField(expr, min, max, names){
    var values = {};
    var parts = String(expr).split(",");
    for (var i=0;i<parts.length;i++){
      var part = parts[i].trim();
      if (part === "") return null;
      var step = 1, range = part;
      var slash = part.indexOf("/");
      if (slash !== -1){
        range = part.slice(0, slash);
        var stepStr = part.slice(slash+1);
        if (!/^\d+$/.test(stepStr)) return null;
        step = parseInt(stepStr,10);
        if (step < 1) return null;
      }
      var lo, hi;
      if (range === "*"){ lo = min; hi = max; }
      else if (range.indexOf("-") !== -1){
        var rr = range.split("-");
        if (rr.length !== 2) return null;
        lo = resolveValue(rr[0], names);
        hi = resolveValue(rr[1], names);
        if (lo === null || hi === null || lo > hi) return null;
      } else {
        lo = resolveValue(range, names);
        if (lo === null) return null;
        hi = (slash !== -1) ? max : lo;
      }
      if (lo < min || hi > max) return null;
      for (var v = lo; v <= hi; v += step) values[v] = true;
    }
    var arr = Object.keys(values).map(Number).sort(function(a,b){return a-b;});
    return arr.length ? arr : null;
  }

  function parseCron(expr){
    var fields = String(expr).trim().split(/\s+/);
    if (fields.length !== 5) return { ok:false, error:"Expected 5 fields (minute hour day month weekday), got " + fields.length + "." };
    var minute  = parseField(fields[0], 0, 59, null);
    var hour    = parseField(fields[1], 0, 23, null);
    var day     = parseField(fields[2], 1, 31, null);
    var month   = parseField(fields[3], 1, 12, MONTH_MAP);
    var weekday = parseField(fields[4], 0, 7, DAY_MAP);
    if (weekday){
      var seen = {};
      weekday = weekday.map(function(v){ return v === 7 ? 0 : v; }).filter(function(v){ if (seen[v]) return false; seen[v]=true; return true; }).sort(function(a,b){return a-b;});
    }
    if (!minute)  return { ok:false, error:"Invalid minute field: \u201C" + fields[0] + "\u201D \u2014 expected 0\u201359." };
    if (!hour)    return { ok:false, error:"Invalid hour field: \u201C" + fields[1] + "\u201D \u2014 expected 0\u201323." };
    if (!day)     return { ok:false, error:"Invalid day field: \u201C" + fields[2] + "\u201D \u2014 expected 1\u201331." };
    if (!month)   return { ok:false, error:"Invalid month field: \u201C" + fields[3] + "\u201D \u2014 expected 1\u201312 or JAN\u2013DEC." };
    if (!weekday) return { ok:false, error:"Invalid weekday field: \u201C" + fields[4] + "\u201D \u2014 expected 0\u20137 or SUN\u2013SAT." };
    return { ok:true, minute:minute, hour:hour, day:day, month:month, weekday:weekday,
             dayStar:(fields[2]==="*"), weekdayStar:(fields[4]==="*") };
  }

  /* ---- next-run computation ---- */
  function matchDay(parsed, d){
    var domMatch = parsed.day.indexOf(d.getDate()) !== -1;
    var dowMatch = parsed.weekday.indexOf(d.getDay()) !== -1;
    if (parsed.dayStar && parsed.weekdayStar) return true;
    if (parsed.dayStar) return dowMatch;
    if (parsed.weekdayStar) return domMatch;
    return domMatch || dowMatch;
  }
  function nextRuns(parsed, count, from){
    var runs = [];
    var d = new Date(from.getTime());
    d.setSeconds(0,0);
    d = new Date(d.getTime() + 60000);
    d.setSeconds(0,0);
    var limit = from.getTime() + 4*366*24*3600*1000;
    var iter = 0;
    while (runs.length < count && d.getTime() < limit && iter < 200000){
      iter++;
      if (parsed.month.indexOf(d.getMonth()+1) === -1){ d = new Date(d.getFullYear(), d.getMonth()+1, 1, 0,0,0); continue; }
      if (!matchDay(parsed, d)){ d = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1, 0,0,0); continue; }
      if (parsed.hour.indexOf(d.getHours()) === -1){ d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()+1, 0,0); continue; }
      if (parsed.minute.indexOf(d.getMinutes()) === -1){ d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()+1, 0); continue; }
      runs.push(new Date(d.getTime()));
      d = new Date(d.getTime() + 60000);
    }
    return runs;
  }

  /* ---- description ---- */
  function fmtDow(x){
    if (/^\d$/.test(x)) return DOW_NAMES[(+x) % 7];
    return String(x).replace(/\d/g, function(d){ return DOW_SHORT[(+d) % 7]; });
  }
  function fmtMonth(x){
    if (/^\d+$/.test(x)) return MO_NAMES[+x] || x;
    return String(x).replace(/\d+/g, function(d){ return MO_SHORT[+d] || d; });
  }
  function describeCron(raw){
    var m = raw[0], h = raw[1], dom = raw[2], mo = raw[3], dow = raw[4];
    var out = [];
    if (m === "*" && h === "*") out.push("Every minute");
    else if (m.indexOf("*/") === 0) out.push("Every " + m.split("/")[1] + " minutes" + (h !== "*" ? " during hour " + h : ""));
    else if (h.indexOf("/") !== -1 && (m === "0" || m === "00")) out.push("Every " + h.split("/")[1] + " hours");
    else if (m === "*" && h !== "*") out.push("Every minute during hour " + h);
    else if (m !== "*" && h === "*") out.push("At minute " + m + " of every hour");
    else if (/^\d+$/.test(m) && /^\d+$/.test(h)) out.push("At " + pad2(+h) + ":" + pad2(+m));
    else out.push("At minute " + m + " of hour " + h);
    var domR = dom !== "*", dowR = dow !== "*";
    if (domR && dowR) out.push("on day-of-month " + dom + " or on " + fmtDow(dow));
    else if (domR) out.push("on day " + dom + " of the month");
    else if (dowR) out.push("on " + fmtDow(dow));
    if (mo !== "*") out.push("in " + fmtMonth(mo));
    return out.join(" ");
  }

  function fieldDesc(name, raw){
    if (raw === "*") return {minute:"every minute",hour:"every hour",day:"every day",month:"every month",weekday:"any weekday"}[name];
    if (raw.indexOf("/") !== -1){
      var step = raw.split("/")[1];
      return {minute:"every "+step+" min",hour:"every "+step+" h",day:"every "+step+" days",month:"every "+step+" months",weekday:"every "+step+" weekdays"}[name];
    }
    if (raw.indexOf("-") !== -1){
      var parts = raw.split("-");
      if (name === "weekday") return fmtDow(parts[0]) + "\u2013" + fmtDow(parts[1]);
      if (name === "month") return fmtMonth(parts[0]) + "\u2013" + fmtMonth(parts[1]);
      return parts[0] + "\u2013" + parts[1];
    }
    if (name === "weekday") return fmtDow(raw);
    if (name === "month") return fmtMonth(raw);
    if (name === "hour") return "at " + raw + ":00";
    if (name === "minute") return "at minute " + raw;
    return raw;
  }

  /* ---- time formatting ---- */
  function fmtRun(d){
    return DOW_SHORT[d.getDay()] + ", " + MO_SHORT[d.getMonth()+1] + " " + pad2(d.getDate()) + " " + d.getFullYear() + " \u00B7 " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }
  function relShort(r){
    var diff = r.getTime() - Date.now();
    if (diff < 0) return "now";
    var s = Math.floor(diff/1000);
    var d = Math.floor(s/86400); s %= 86400;
    var h = Math.floor(s/3600); s %= 3600;
    var m = Math.floor(s/60);
    if (d > 0) return "in " + d + "d " + h + "h";
    if (h > 0) return "in " + h + "h " + m + "m";
    return "in " + m + "m " + (s % 60) + "s";
  }
  function formatDuration(ms){
    if (ms < 0) ms = 0;
    var s = Math.floor(ms/1000);
    var d = Math.floor(s/86400); s %= 86400;
    var h = Math.floor(s/3600); s %= 3600;
    var m = Math.floor(s/60); s %= 60;
    var out = "";
    if (d > 0) out += d + "d ";
    out += pad2(h) + "h " + pad2(m) + "m " + pad2(s) + "s";
    return out;
  }

  /* ================= GENERATOR ================= */
  var FIELD_ORDER = ["minute","hour","day","month","weekday"];
  var gen = {};
  FIELD_ORDER.forEach(function(f){ gen[f] = { mode:"star", v1:"", v2:"", v3:"" }; });

  function buildField(f){
    if (f.mode === "star") return "*";
    if (f.mode === "val") return (f.v1 && f.v1.trim() !== "") ? f.v1.trim() : "*";
    if (f.mode === "step") return "*/" + (f.v1 || "1");
    if (f.mode === "range") return (f.v1 || "0") + "-" + (f.v2 || "0");
    if (f.mode === "rangestep") return (f.v1 || "0") + "-" + (f.v2 || "0") + "/" + (f.v3 || "1");
    return "*";
  }
  function buildCron(){
    return FIELD_ORDER.map(function(f){ return buildField(gen[f]); }).join(" ");
  }

  var MODE_OPTIONS =
    '<option value="star">Every (*)</option>' +
    '<option value="val">At / list</option>' +
    '<option value="step">Every N</option>' +
    '<option value="range">Range</option>' +
    '<option value="rangestep">Range + step</option>';

  function renderGenControls(){
    var box = $("#gen-controls");
    box.innerHTML = "";
    FIELD_ORDER.forEach(function(name){
      var row = document.createElement("div");
      row.className = "cron-field";
      row.innerHTML =
        '<span class="cf-label">' + name.toUpperCase() + '</span>' +
        '<select class="cf-mode" data-field="' + name + '" aria-label="' + name + ' mode">' + MODE_OPTIONS + '</select>' +
        '<div class="cf-inputs" data-field="' + name + '"></div>';
      box.appendChild(row);
      row.querySelector(".cf-mode").value = gen[name].mode;
      row.querySelector(".cf-mode").addEventListener("change", function(){
        gen[name].mode = this.value;
        renderFieldInputs(name);
        renderRightPane();
      });
      renderFieldInputs(name);
    });
  }

  function renderFieldInputs(name){
    var cont = $('#gen-controls .cf-inputs[data-field="' + name + '"]');
    var f = gen[name];
    cont.innerHTML = "";
    function mkInput(key, ph, wide){
      var inp = document.createElement("input");
      inp.type = "text";
      inp.className = "cf-in" + (wide ? " cf-in--wide" : "");
      inp.value = f[key] || "";
      inp.placeholder = ph;
      inp.setAttribute("aria-label", name + " " + key);
      inp.addEventListener("input", function(){ f[key] = inp.value; renderRightPane(); });
      cont.appendChild(inp);
      return inp;
    }
    function mkSep(txt){ var s = document.createElement("span"); s.className="cf-sep"; s.textContent = txt; cont.appendChild(s); }
    if (f.mode === "star"){
      var st = document.createElement("span"); st.className = "cf-star"; st.textContent = "*"; cont.appendChild(st);
    } else if (f.mode === "val"){
      mkInput("v1", name==="month" ? "1 or JAN or 1,6" : (name==="weekday" ? "0 or MON or 1,3,5" : "0 or 0,15,30"), true);
    } else if (f.mode === "step"){
      mkInput("v1", "5");
    } else if (f.mode === "range"){
      mkInput("v1","from"); mkSep("\u2013"); mkInput("v2","to");
    } else if (f.mode === "rangestep"){
      mkInput("v1","from"); mkSep("\u2013"); mkInput("v2","to"); mkSep("/"); mkInput("v3","step");
    }
  }

  var GEN_PRESETS = [
    { name:"EVERY MINUTE", g:{ minute:{mode:"star"}, hour:{mode:"star"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"star"} } },
    { name:"EVERY 5 MIN", g:{ minute:{mode:"step",v1:"5"}, hour:{mode:"star"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"star"} } },
    { name:"HOURLY", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"star"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"star"} } },
    { name:"DAILY 00:00", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"val",v1:"0"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"star"} } },
    { name:"WEEKDAYS 09:00", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"val",v1:"9"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"range",v1:"1",v2:"5"} } },
    { name:"WEEKLY SUN", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"val",v1:"0"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"val",v1:"0"} } },
    { name:"MONTHLY 1ST", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"val",v1:"0"}, day:{mode:"val",v1:"1"}, month:{mode:"star"}, weekday:{mode:"star"} } },
    { name:"EVERY 6 HOURS", g:{ minute:{mode:"val",v1:"0"}, hour:{mode:"step",v1:"6"}, day:{mode:"star"}, month:{mode:"star"}, weekday:{mode:"star"} } }
  ];

  function renderGenPresets(){
    var box = $("#gen-presets");
    box.innerHTML = "";
    GEN_PRESETS.forEach(function(p){
      var b = document.createElement("button");
      b.type = "button"; b.className = "cron-preset"; b.textContent = p.name;
      b.addEventListener("click", function(){
        FIELD_ORDER.forEach(function(f){
          gen[f] = { mode:"star", v1:"", v2:"", v3:"" };
          if (p.g[f]) for (var k in p.g[f]) gen[f][k] = p.g[f][k];
        });
        renderGenControls();
        renderRightPane();
      });
      box.appendChild(b);
    });
  }

  /* ================= PARSER ================= */
  var PARSE_EXAMPLES = [
    { label:"EVERY MINUTE", v:"* * * * *" },
    { label:"WEEKDAYS 9AM", v:"0 9 * * 1-5" },
    { label:"EVERY 15 MIN", v:"*/15 * * * *" },
    { label:"EVERY 6 HOURS", v:"0 */6 * * *" },
    { label:"MONTHLY 1ST", v:"0 0 1 * *" },
    { label:"SUN 02:30", v:"30 2 * * 0" },
    { label:"BROKEN", v:"61 25 * * *" }
  ];
  function renderParseExamples(){
    var box = $("#parse-examples");
    box.innerHTML = "";
    PARSE_EXAMPLES.forEach(function(ex){
      var b = document.createElement("button");
      b.type = "button"; b.className = "cron-preset"; b.textContent = ex.label;
      b.addEventListener("click", function(){
        $("#parse-input").value = ex.v;
        renderRightPane();
      });
      box.appendChild(b);
    });
  }

  /* ================= RIGHT PANE ================= */
  function scheduleBlockHTML(parsed){
    if (!parsed || !parsed.ok){
      return '<div class="sched-empty">' + (parsed ? escHtml(parsed.error) : 'Build or paste a cron expression to see its schedule here \u2014 with a live countdown to the next run.') + '</div>';
    }
    var desc = describeCron(schedule.raw);
    var html = '<div class="sched-desc-wrap"><span class="sched-desc-label">IN PLAIN ENGLISH</span><p class="sched-desc">' + escHtml(desc) + '</p></div>';
    html += '<div class="sched-cd-wrap"><span class="sched-cd-label">NEXT RUN IN</span><span class="sched-cd" id="sched-countdown">\u2014</span></div>';
    html += '<div class="sched-runs-label">UPCOMING RUNS \u00B7 YOUR TIMEZONE</div><div class="sched-runs">';
    schedule.nextRuns.forEach(function(r, i){
      html += '<div class="sched-run" style="animation-delay:' + (i*40) + 'ms"><span class="sr-idx">' + pad2(i+1) + '</span><code class="sr-date">' + fmtRun(r) + '</code><span class="sr-rel">' + relShort(r) + '</span></div>';
    });
    if (!schedule.nextRuns.length) html += '<p class="sched-empty">No runs in the next 4 years \u2014 check the day / month / weekday combination.</p>';
    html += '</div>';
    return html;
  }

  function fieldBreakdownHTML(parsed, raw){
    var names = FIELD_ORDER;
    var sets = [parsed.minute, parsed.hour, parsed.day, parsed.month, parsed.weekday];
    var html = '<div class="fb-wrap">';
    for (var i=0;i<5;i++){
      var desc = fieldDesc(names[i], raw[i]);
      var set = sets[i];
      var setStr = set.slice(0,14).join(" ") + (set.length > 14 ? " \u2026(+" + (set.length-14) + ")" : "");
      html += '<div class="fb-row"><span class="fb-label">' + names[i].toUpperCase() + '</span><code class="fb-raw">' + escHtml(raw[i]) + '</code><span class="fb-desc">' + escHtml(desc) + '<br><code class="fb-set">' + escHtml(setStr) + '</code></span></div>';
    }
    html += '</div>';
    return html;
  }

  function renderRightPane(){
    var out = $("#sched-out");
    var parsed = null, raw = null, expr = "";
    if (state.mode === "generator"){
      expr = buildCron();
      parsed = parseCron(expr);
      raw = expr.split(/\s+/);
    } else {
      expr = $("#parse-input").value.trim();
      if (expr){ parsed = parseCron(expr); raw = expr.split(/\s+/); }
    }
    schedule.parsed = parsed;
    schedule.raw = raw;
    schedule.nextRuns = (parsed && parsed.ok) ? nextRuns(parsed, 6, new Date()) : [];

    var html = "";
    if (state.mode === "generator"){
      html += '<div class="expr-display"><span class="expr-label">GENERATED EXPRESSION</span><code class="expr-value">' + escHtml(expr) + '</code><button type="button" class="expr-copy" id="btn-copy-expr">\u29C9 COPY</button></div>';
    } else {
      if (!expr) html += '<div class="validity validity-idle">Paste a cron expression to parse it.</div>';
      else if (!parsed.ok) html += '<div class="validity validity-bad">\u2715 ' + escHtml(parsed.error) + '</div>';
      else html += '<div class="validity validity-ok">\u2713 VALID CRON \u2014 5 FIELDS PARSED</div>';
      if (parsed && parsed.ok) html += fieldBreakdownHTML(parsed, raw);
    }
    html += scheduleBlockHTML(parsed);
    out.innerHTML = html;

    var copyBtn = $("#btn-copy-expr");
    if (copyBtn){
      copyBtn.addEventListener("click", function(){
        var val = buildCron();
        var done = function(){
          copyBtn.textContent = "\u2713 COPIED"; copyBtn.classList.add("ok");
          setTimeout(function(){ copyBtn.textContent = "\u29C9 COPY"; copyBtn.classList.remove("ok"); }, 1100);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, done);
        else done();
      });
    }

    updateStats();
    tickCountdown();
  }

  function updateStats(){
    var p = schedule.parsed;
    if (p && p.ok){
      setStat(sv[0], fmtNum(p.minute.length * p.hour.length));
      setStat(sv[1], schedule.nextRuns.length ? relShort(schedule.nextRuns[0]) : "\u2014");
      setStat(sv[2], schedule.nextRuns.length > 1 ? relShort(schedule.nextRuns[1]) : "\u2014");
      setStat(sv[3], "VALID");
      sl[0].textContent="Fires / matching day"; ss[0].textContent="MIN \u00D7 HOUR";
      sl[1].textContent="Next run"; ss[1].textContent="FROM NOW";
      sl[2].textContent="Next after"; ss[2].textContent="THE ONE AFTER";
      sl[3].textContent="Status"; ss[3].textContent="PARSED OK";
      sv[3].classList.remove("bad"); sv[3].classList.add("good");
    } else {
      setStat(sv[0], "\u2014"); setStat(sv[1], "\u2014"); setStat(sv[2], "\u2014");
      setStat(sv[3], p ? "INVALID" : "\u2014");
      sl[0].textContent="Fires / matching day"; ss[0].textContent="MIN \u00D7 HOUR";
      sl[1].textContent="Next run"; ss[1].textContent="FROM NOW";
      sl[2].textContent="Next after"; ss[2].textContent="THE ONE AFTER";
      sl[3].textContent="Status"; ss[3].textContent = p ? "CHECK THE FIELDS" : "WAITING";
      sv[3].classList.toggle("bad", !!p);
      sv[3].classList.remove("good");
    }
  }

  /* ---- live countdown ---- */
  function tickCountdown(){
    var el = $("#sched-countdown");
    if (!el) return;
    if (!schedule.parsed || !schedule.parsed.ok || !schedule.nextRuns.length){ el.textContent = "\u2014"; return; }
    var now = Date.now();
    if (schedule.nextRuns[0].getTime() <= now){
      schedule.nextRuns = nextRuns(schedule.parsed, 6, new Date());
      renderRightPane();
      return;
    }
    el.textContent = formatDuration(schedule.nextRuns[0].getTime() - now);
  }
  setInterval(tickCountdown, 1000);

  /* ---- parser input wiring ---- */
  $("#parse-input").addEventListener("input", renderRightPane);

  /* ---- mode switching ---- */
  function setMode(m){
    state.mode = m;
    $$(".c-tab").forEach(function(t){
      var on = t.getAttribute("data-mode") === m;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", String(on));
    });
    $("#analyzer").setAttribute("data-mode", m);
    $("#gen-left").style.display = m === "generator" ? "" : "none";
    $("#parse-left").style.display = m === "parser" ? "" : "none";
    $("#cb-in-label").textContent = m === "generator" ? "BUILD" : "EXPRESSION";
    $("#cb-out-badge").textContent = m === "generator" ? "LIVE" : "PARSING";
    renderRightPane();
  }
  $$(".c-tab").forEach(function(t){
    t.addEventListener("click", function(){ setMode(t.getAttribute("data-mode")); });
  });

  /* ---- init ---- */
  renderGenControls();
  renderGenPresets();
  renderParseExamples();
  renderRightPane();
})();
