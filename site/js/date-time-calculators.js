
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
  var navClose = $("#nav-close");
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
  /* explicit CLOSE button inside the mobile drawer */
  navClose.addEventListener("click", function(){
    closeNav();
    burger.focus();
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

  /* ================================================================
     LIVE DATE & TIME CALCULATORS (all 5 tools)
     ================================================================ */
  var DAY = 86400000;
  function nowD(){ return new Date(); }
  function today0(){ var t=new Date(); t.setHours(0,0,0,0); return t; }
  function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function isoDT(d){ return iso(d)+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
  function pd(s){ if(!s) return null; var p=String(s).slice(0,10).split("-").map(Number); if(p.length!==3||!p[0]) return null; var d=new Date(p[0],p[1]-1,p[2]); return isNaN(d.getTime())?null:d; }
  function addD(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function df(a,b){ return Math.round((b.getTime()-a.getTime())/DAY); }
  function fd(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
  function fday(d){ return d.toLocaleDateString("en-US",{weekday:"long"}); }
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function num(s){ var n=parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function pad(n){ return String(n).padStart(2,"0"); }

  var QUART=["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];
  function quartSegs(){ return [{c:QUART[0],w:25},{c:QUART[1],w:25},{c:QUART[2],w:25},{c:QUART[3],w:25}]; }
  function quartLegend(a,b,c,d){ return [
    {c:QUART[0],l:a,v:""},{c:QUART[1],l:b,v:""},{c:QUART[2],l:c,v:""},{c:QUART[3],l:d,v:""}]; }
  function zeroGauge(label){ return {label:label,pos:0,
    segs:[{c:"#EFEFE9",w:100}],
    legend:[{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""}]}; }
  function msgResult(msg){
    var st=[["Status",msg,""]];
    for(var i=1;i<8;i++) st.push(["—","",""]);
    return {stats:st,gauge:zeroGauge(msg)};
  }

  /* exact y/m/d between two dates (b >= a) */
  function ymd(a,b){
    var y=b.getFullYear()-a.getFullYear(), m=b.getMonth()-a.getMonth(), d=b.getDate()-a.getDate();
    if(d<0){ m--; d+=new Date(b.getFullYear(),b.getMonth(),0).getDate(); }
    if(m<0){ y--; m+=12; }
    return [y,m,d];
  }

  /* ---------------- 01 DATE DIFFERENCE ---------------- */
  function calcDateDiff(s){
    var A=pd(s.start), B=pd(s.end);
    if(!A||!B) return msgResult("ENTER BOTH DATES");
    var swapped = B<A;
    var a=swapped?B:A, b=swapped?A:B;
    var days=df(a,b);
    var weeks=Math.floor(days/7), wd=days%7;
    var months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())+(b.getDate()-a.getDate())/30.44;
    var bus=0, we=0;
    if(days<=36600){
      var cur=new Date(a.getTime());
      for(var i=0;i<days;i++){
        cur=addD(cur,1);
        var w=cur.getDay();
        if(w===0||w===6) we++; else bus++;
      }
    } else {
      bus=Math.round(days*5/7); we=days-bus;
    }
    var g=ymd(a,b);
    return {
      stats:[
        ["Total days", fmt(days), swapped?"dates swapped":"end − start"],
        ["Weeks", weeks+" w "+wd+" d",""],
        ["Months", months.toFixed(1),"≈ 30.44 d / mo"],
        ["Years", (days/365.25).toFixed(2),""],
        ["Hours", fmt(days*24),""],
        ["Business days", fmt(bus),"Mon–Fri"],
        ["Weekend days", fmt(we),"Sat + Sun"],
        ["Exact", g[0]+" y "+g[1]+" m "+g[2]+" d","calendar math"]
      ],
      gauge:{
        label:"SPAN SCALE — "+fmt(days)+" DAYS",
        pos:clamp(days/1095*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–9 MO","9–18 MO","18–27 MO","27–36 MO")
      }
    };
  }

  /* ---------------- 02 TIME ---------------- */
  function fmt12(secOfDay){
    var h=Math.floor(secOfDay/3600), m=Math.floor(secOfDay%3600/60), s=secOfDay%60;
    var ap=h<12?"AM":"PM", h12=h%12; if(h12===0) h12=12;
    return pad(h12)+":"+pad(m)+":"+pad(s)+" "+ap;
  }
  function fmt24(secOfDay){
    var h=Math.floor(secOfDay/3600), m=Math.floor(secOfDay%3600/60), s=secOfDay%60;
    return pad(h)+":"+pad(m)+":"+pad(s);
  }
  function calcTime(s){
    if(!s.start) return msgResult("ENTER START TIME");
    var p=String(s.start).split(":").map(Number);
    var startSec=(p[0]||0)*3600+(p[1]||0)*60+(p[2]||0);
    var h=num(s.h)||0, m=num(s.m)||0, sec=num(s.s)||0;
    if(h<0||m<0||sec<0) return msgResult("NEGATIVE DURATIONS NOT ALLOWED");
    var dur=h*3600+m*60+sec;
    var sign = s.op==="sub" ? -1 : 1;
    var total=startSec+sign*dur;
    var shift=Math.floor(total/86400);
    var rem=((total%86400)+86400)%86400;
    var durTxt=(sign<0?"−":"+")+h+" h "+m+" m "+sec+" s";
    return {
      stats:[
        ["Start", fmt12(startSec),fmt24(startSec)],
        ["Duration", durTxt,""],
        ["Result", fmt12(rem),""],
        ["Result · 24h", fmt24(rem),""],
        ["Day shift", shift===0?"same day":(shift>0?"+"+shift+" d":shift+" d"), shift===0?"":"midnight crossed"],
        ["Total hours", (dur/3600).toFixed(2)+" h","decimal"],
        ["Total minutes", fmt(dur/60),""],
        ["Total seconds", fmt(dur),""]
      ],
      gauge:{
        label:"RESULT TIME — "+fmt12(rem),
        pos:rem/86400*100,
        segs:[{c:"#141414",w:25},{c:"#6E86FF",w:25},{c:"#0033FF",w:25},{c:"#C9C9C0",w:25}],
        legend:[{c:"#141414",l:"NIGHT",v:"0–6"},{c:"#6E86FF",l:"MORNING",v:"6–12"},{c:"#0033FF",l:"AFTERNOON",v:"12–18"},{c:"#C9C9C0",l:"EVENING",v:"18–24"}]
      }
    };
  }

  /* ---------------- 03 COUNTDOWN (live) ---------------- */
  function calcCountdown(s){
    if(!s.target) return msgResult("ENTER TARGET DATE");
    var parts=String(s.target).split("T");
    var d=pd(parts[0]);
    if(!d) return msgResult("ENTER TARGET DATE");
    var hh=0, mm=0;
    if(parts[1]){ var t=parts[1].split(":").map(Number); hh=t[0]||0; mm=t[1]||0; }
    var tgt=new Date(d.getFullYear(),d.getMonth(),d.getDate(),hh,mm,0);
    var diff=tgt.getTime()-nowD().getTime();
    var passed=diff<0;
    var abs=Math.abs(diff);
    var days=Math.floor(abs/DAY);
    var hrs=Math.floor(abs/3600000);
    var mins=Math.floor(abs/60000);
    var secs=Math.floor(abs/1000);
    var status=passed?"PASSED":(days===0?"TODAY":"UPCOMING");
    var name=(s.name||"").trim();
    return {
      stats:[
        ["Status", status, name||""],
        ["Days", fmt(days)+(passed?" ago":" to go"),""],
        ["Hours", fmt(hrs),"total"],
        ["Minutes", fmt(mins),"total"],
        ["Seconds", fmt(secs),"total · live"],
        ["Weeks", (days/7).toFixed(1),""],
        ["Target", fd(tgt),pad(hh)+":"+pad(mm)],
        ["Day of week", fday(tgt),""]
      ],
      gauge:{
        label:(passed?"COUNT-UP — ":("COUNTDOWN — "))+fmt(days)+(passed?" DAYS SINCE":" DAYS TO GO"),
        pos:clamp(days/365*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–3 MO","3–6 MO","6–9 MO","9–12 MO")
      }
    };
  }

  /* ---------------- 04 BUSINESS DAYS ---------------- */
  function calcBusDays(s){
    var start=pd(s.start); if(!start) return msgResult("ENTER START DATE");
    var n=num(s.days);
    if(n==null||n<0||!isFinite(n)) return msgResult("ENTER NUMBER OF DAYS");
    n=Math.round(n);
    if(n>36500) return msgResult("MAX 36,500 DAYS");
    var step=s.dir==="sub"?-1:1;
    var cur=new Date(start.getTime()), cal=0, wk=0, left=n;
    while(left>0){
      cur=addD(cur,step); cal++;
      var w=cur.getDay();
      if(w===0||w===6) wk++; else left--;
    }
    return {
      stats:[
        ["Result date", fd(cur), fday(cur)],
        ["Operation", (s.dir==="sub"?"−":"+")+fmt(n)+" days","business days"],
        ["Calendar days", fmt(cal),"actually elapsed"],
        ["Weeks", (cal/7).toFixed(1),""],
        ["Weekend days", fmt(wk),"skipped"],
        ["Weekends", Math.floor(wk/2)+(wk%2?" +1 d":""),"Sat + Sun"],
        ["Start date", fd(start), fday(start)],
        ["Excludes", "Sat · Sun","holidays not included"]
      ],
      gauge:{
        label:"WEEKEND SHARE — "+(cal>0?(wk/cal*100).toFixed(1):0)+"% OF CALENDAR DAYS",
        pos:cal>0?clamp(wk/cal*100*3,0,100):0,
        segs:quartSegs(),
        legend:quartLegend("0–10%","10–20%","20–30%","30%+")
      }
    };
  }

  /* ---------------- 05 AGE DIFFERENCE ---------------- */
  function calcAgeDiff(s){
    var A=pd(s.dob1), B=pd(s.dob2);
    if(!A||!B) return msgResult("ENTER BOTH BIRTH DATES");
    if(A.getTime()===B.getTime()) return msgResult("SAME DATE — ZERO DIFFERENCE");
    var older=A<B?"Person A":"Person B";
    var a=A<B?A:B, b=A<B?B:A;
    var today=today0();
    var ageA=ymd(A>B?B:A, today), ageB=ymd(A>B?A:B, today);
    var days=df(a,b);
    var g=ymd(a,b);
    var aAge=ymd(A,today), bAge=ymd(B,today);
    var combined=(df(A,today)+df(B,today))/365.25;
    return {
      stats:[
        ["Person A", aAge[0]+" y "+aAge[1]+" m "+aAge[2]+" d", fd(A)],
        ["Person B", bAge[0]+" y "+bAge[1]+" m "+bAge[2]+" d", fd(B)],
        ["Who is older", older, fmt(days)+" d apart"],
        ["Difference", g[0]+" y "+g[1]+" m "+g[2]+" d","exact gap"],
        ["Difference days", fmt(days),""],
        ["Difference weeks", fmt(Math.floor(days/7))+" w "+(days%7)+" d",""],
        ["Combined age", combined.toFixed(1)+" yr","A + B today"],
        ["Average age", (combined/2).toFixed(1)+" yr",""]
      ],
      gauge:{
        label:"AGE GAP SCALE — "+fmt(days)+" DAYS",
        pos:clamp(days/3650*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–2.5 YR","2.5–5 YR","5–7.5 YR","7.5–10 YR")
      }
    };
  }

  /* ---------------- tool registry ---------------- */
  var T0=today0();
  var TOOLS=[
    { id:"datediff", tab:"Date Diff", name:"Date Difference Calculator",
      def:function(){ return {start:iso(addD(T0,-45)),end:iso(T0)}; },
      fields:[
        {k:"start",label:"Start date",type:"date"},
        {k:"end",label:"End date",type:"date"}
      ], calc:calcDateDiff },
    { id:"time", tab:"Time", name:"Time Calculator",
      def:function(){ return {start:"09:45",op:"add",h:"2",m:"30",s:"0"}; },
      fields:[
        {k:"start",label:"Start time",type:"time"},
        {k:"op",label:"Operation",type:"seg",opts:[["add","Add +"],["sub","Subtract −"]]},
        {k:"h",label:"Hours",type:"number",min:0},
        {k:"m",label:"Minutes",type:"number",min:0},
        {k:"s",label:"Seconds",type:"number",min:0}
      ], calc:calcTime },
    { id:"countdown", tab:"Countdown", name:"Countdown Calculator",
      def:function(){ var t=new Date(nowD().getTime()+30*DAY); return {target:isoDT(t),name:""}; },
      fields:[
        {k:"target",label:"Target date & time",type:"datetime-local",full:true},
        {k:"name",label:"Event name (optional)",type:"text",ph:"e.g. Product launch",full:true}
      ], calc:calcCountdown },
    { id:"busdays", tab:"Business Days", name:"Business Days Calculator",
      def:function(){ return {start:iso(T0),days:"10",dir:"add"}; },
      fields:[
        {k:"start",label:"Start date",type:"date"},
        {k:"days",label:"Business days",type:"number",min:0},
        {k:"dir",label:"Direction",type:"seg",full:true,opts:[["add","Add days"],["sub","Subtract days"]]}
      ], calc:calcBusDays },
    { id:"agediff", tab:"Age Diff", name:"Age Difference Calculator",
      def:function(){ return {dob1:"1990-04-15",dob2:"1993-11-02"}; },
      fields:[
        {k:"dob1",label:"Person A · date of birth",type:"date"},
        {k:"dob2",label:"Person B · date of birth",type:"date"}
      ], calc:calcAgeDiff }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var lastResult=null;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
    var ctrl;
    if(f.type==="seg"){
      lab='<span class="f-label">'+f.label+'</span>';
      ctrl='<div class="seg" data-k="'+f.k+'" role="group" aria-label="'+f.label+'">'+f.opts.map(function(o){
        return '<button type="button" data-v="'+o[0]+'"'+(s[f.k]===o[0]?' class="on"':'')+'>'+o[1]+'</button>';
      }).join('')+'</div>';
    } else if(f.type==="select"){
      ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+f.opts.map(function(o){
        return '<option value="'+o[0]+'"'+(String(s[f.k])===o[0]?' selected':'')+'>'+o[1]+'</option>';
      }).join('')+'</select>';
    } else {
      ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="'+f.type+'" value="'+(s[f.k]!=null?s[f.k]:"")+'"'+
        (f.min!=null?' min="'+f.min+'"':'')+(f.max!=null?' max="'+f.max+'"':'')+(f.ph?' placeholder="'+f.ph+'"':'')+'>';
    }
    return '<div class="field'+(f.full?' full':'')+'">'+lab+ctrl+'</div>';
  }

  function renderForm(){
    var t=activeTool, s=state[t.id];
    var vis=t.fields.filter(function(f){ return !f.when||f.when(s); });
    formEl.innerHTML='<div class="f-grid">'+vis.map(function(f){ return fieldHtml(f,s); }).join('')+'</div>';
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function setStat(i,l,v,sub,quiet){
    var el=$("#st-v-"+i);
    $("#st-l-"+i).textContent=l;
    $("#st-s-"+i).textContent=sub||"";
    v=String(v);
    if(el.textContent!==v){
      el.textContent=v;
      if(!quiet){
        el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
        setTimeout(function(){ el.classList.remove("bump"); },200);
      }
    }
  }

  function renderGauge(g){
    gLabel.textContent=g.label;
    gSegs.innerHTML=g.segs.map(function(sg){ return '<i style="width:'+sg.w+'%;background:'+sg.c+'"></i>'; }).join('');
    gMark.style.left=clamp(g.pos,0,100)+"%";
    gLegend.innerHTML=g.legend.map(function(it){
      return '<span><i class="sw" style="background:'+it.c+'"></i>'+it.l+'<b>'+it.v+'</b></span>';
    }).join('');
  }

  function recalc(quiet){
    var r;
    try{ r=activeTool.calc(state[activeTool.id]); }
    catch(e){ r=msgResult("CALCULATION ERROR"); }
    lastResult=r;
    r.stats.forEach(function(st,i){ setStat(i,st[0],st[1],st[2],quiet); });
    renderGauge(r.gauge);
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); recalc();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    state[activeTool.id][k]=e.target.value;
    recalc();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); recalc();
  });

  /* live countdown tick — one global timer, updates only while the countdown tab is active */
  setInterval(function(){
    if(activeTool && activeTool.id==="countdown") recalc(true);
  },1000);

  /* guide "runs in the calculator above" jumps */
  $$(".tool-here").forEach(function(btn){
    btn.addEventListener("click", function(){
      selectTool(btn.getAttribute("data-go"));
      $("#analyzer").scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    });
  });

  /* ---- button feedback helper ---- */
  function flash(btn,text,isErr){
    var original=btn.getAttribute("data-label")||btn.textContent;
    btn.setAttribute("data-label",original);
    btn.textContent=text;
    btn.classList.add(isErr?"err":"ok");
    clearTimeout(btn._t);
    btn._t=setTimeout(function(){
      btn.textContent=original;
      btn.classList.remove("ok","err");
    },1600);
  }

  /* ================= RESULTS AS A TABLE =================
     rows = [ [Metric, Result, Note], ... ] */
  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function resultsRows(){
    if(!lastResult) return [];
    var rows=[];
    lastResult.stats.forEach(function(st,i){
      if(st[1] && st[1]!=="—"){
        rows.push([ $("#st-l-"+i).textContent, String(st[1]), st[2]||"" ]);
      }
    });
    return rows;
  }

  /* tab-separated — pastes as columns into Excel / Sheets, used by download */
  function buildTSV(rows){
    var lines=["IrisTool — Date & Time Calculators","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("All calculations in your local time zone.");
    return lines.join("\n");
  }

  /* real HTML table — pastes as a table into Word / Excel / Docs / email */
  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Date &amp; Time Calculators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
    h+='<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:13px;border-color:#E4E4DC">';
    h+='<tr style="background:#0033FF;color:#FFFFFF;text-align:left">'
      +'<th style="padding:8px 14px">Metric</th>'
      +'<th style="padding:8px 14px">Result</th>'
      +'<th style="padding:8px 14px">Note</th></tr>';
    rows.forEach(function(r,i){
      h+='<tr style="background:'+(i%2?"#FCFCFA":"#FFFFFF")+'">'
        +'<td style="padding:6px 14px;font-weight:bold">'+esc(r[0])+'</td>'
        +'<td style="padding:6px 14px;color:#0033FF;font-weight:bold">'+esc(r[1])+'</td>'
        +'<td style="padding:6px 14px;color:#6C6C64">'+esc(r[2])+'</td></tr>';
    });
    h+='</table>';
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">All calculations in your local time zone.</p></div>';
    return h;
  }

  /* ---- COPY: table first (HTML), TSV as plain text ---- */
  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var rows=resultsRows();
    if(!rows.length){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    var tsv=buildTSV(rows);
    var html=buildTableHTML(rows);

    function fallbackCopy(){
      var holder=document.createElement("div");
      holder.innerHTML=html;
      holder.style.position="fixed";
      holder.style.left="-9999px";
      holder.style.top="0";
      document.body.appendChild(holder);
      var range=document.createRange();
      range.selectNode(holder);
      var sel=window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      var ok=false;
      try{ ok=document.execCommand("copy"); }catch(err){ ok=false; }
      sel.removeAllRanges();
      document.body.removeChild(holder);
      flash(btnCopy, ok ? "TABLE COPIED ✓" : "USE CTRL+C", !ok);
    }

    if(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write){
      try{
        var item=new ClipboardItem({
          "text/html":  new Blob([html],{type:"text/html"}),
          "text/plain": new Blob([tsv],{type:"text/plain"})
        });
        navigator.clipboard.write(item).then(
          function(){ flash(btnCopy,"TABLE COPIED ✓"); },
          function(){
            if(navigator.clipboard.writeText){
              navigator.clipboard.writeText(tsv).then(
                function(){ flash(btnCopy,"TABLE COPIED ✓"); },
                fallbackCopy
              );
            } else fallbackCopy();
          }
        );
      }catch(e){ fallbackCopy(); }
    } else if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(tsv).then(
        function(){ flash(btnCopy,"TABLE COPIED ✓"); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  var btnDl=$("#btn-download");
  btnDl.addEventListener("click", function(){
    var rows=resultsRows();
    if(!rows.length){ flash(btnDl,"NOTHING TO SAVE",true); return; }
    var txt=buildTSV(rows);
    var blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download="IrisTool-datetime-results.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
    flash(btnDl,"SAVED ✓");
  });

  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); recalc();
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); recalc();
})();
