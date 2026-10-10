
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
  navClose.addEventListener("click", function(){
    closeNav();
    burger.focus();
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

  /* ================================================================
     LIVE FITNESS TOOLS (2 tools)
     ================================================================ */
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function fx2(n){ return Number(n).toFixed(2); }
  function fx1(n){ return Number(n).toFixed(1); }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function money(n){ return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fmtDur(totalSec){
    totalSec=Math.round(totalSec);
    var h=Math.floor(totalSec/3600), m=Math.floor(totalSec%3600/60), s=totalSec%60;
    function p(n){ return String(n).padStart(2,"0"); }
    return h>0 ? h+":"+p(m)+":"+p(s) : m+":"+p(s);
  }
  function fmtPace(secPerKm){
    var t=Math.round(secPerKm);
    var m=Math.floor(t/60), s=t%60;
    return m+":"+String(s).padStart(2,"0");
  }

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

  /* ---------------- 01 FUEL CONSUMPTION ---------------- */
  function calcFuel(s){
    var dist=parseFloat(s.dist), fuel=parseFloat(s.fuel), price=parseFloat(s.price);
    if(!isFinite(dist)||dist<=0) return msgResult("ENTER DISTANCE IN KM");
    if(!isFinite(fuel)||fuel<=0) return msgResult("ENTER FUEL USED IN LITRES");
    var l100=fuel/dist*100;
    var kml=dist/fuel;
    var mpgUS=235.2145/l100;
    var mpgUK=282.4809/l100;
    var hasPrice=isFinite(price)&&price>0;
    var trip=hasPrice?fuel*price:null;
    var rating=l100<=5?"Excellent":l100<=7?"Good":l100<=9?"Average":l100<=12?"Poor":"Very thirsty";
    return {
      stats:[
        ["Consumption", fx2(l100)+" l/100km","lower is better"],
        ["Efficiency", fx2(kml)+" km/l","distance per litre"],
        ["MPG · US", fx1(mpgUS)+" mpg","higher is better"],
        ["MPG · imperial", fx1(mpgUK)+" mpg","UK gallon"],
        ["Trip cost", hasPrice?money(trip):"—", hasPrice?"at "+money(price)+"/l":"enter fuel price"],
        ["Cost per km", hasPrice?money(trip/dist):"—",""],
        ["Cost per 100 km", hasPrice?money(trip/dist*100):"—",""],
        ["Rating", rating,"for this trip"]
      ],
      gauge:{
        label:"FUEL ECONOMY — "+fx2(l100)+" L/100 KM · "+rating.toUpperCase(),
        pos:clamp(l100/15*100,0,100),
        segs:[{c:"#0033FF",w:33.3},{c:"#6E86FF",w:20},{c:"#C9C9C0",w:20},{c:"#C40000",w:26.7}],
        legend:[{c:"#0033FF",l:"EFFICIENT",v:"≤5"},{c:"#6E86FF",l:"GOOD",v:"5–7"},{c:"#C9C9C0",l:"AVERAGE",v:"7–9"},{c:"#C40000",l:"THIRSTY",v:"9+"}]
      }
    };
  }

  /* ---------------- 02 PACE ---------------- */
  function calcPace(s){
    var d=parseFloat(s.dist);
    var pm=parseFloat(s.pm)||0, ps=parseFloat(s.ps)||0;
    if(!isFinite(d)||d<=0) return msgResult("ENTER A DISTANCE");
    var paceSec=pm*60+ps;
    if(paceSec<=0) return msgResult("ENTER A PACE > 0:00");
    if(s.dunit==="mi") d=d*1.609344;
    var totalSec=paceSec*d;
    var kmh=3600/paceSec;
    var mph=kmh/1.609344;
    var paceMi=paceSec*1.609344;
    return {
      stats:[
        ["Finish time", fmtDur(totalSec), fx2(d)+" km"],
        ["Pace /km", fmtPace(paceSec),"min per kilometre"],
        ["Pace /mile", fmtPace(paceMi),"min per mile"],
        ["Speed", fx2(kmh)+" km/h",""],
        ["Speed", fx2(mph)+" mph",""],
        ["5K finish", fmtDur(paceSec*5),"5 km"],
        ["Half marathon", fmtDur(paceSec*21.0975),"21.0975 km"],
        ["Marathon", fmtDur(paceSec*42.195),"42.195 km"]
      ],
      gauge:{
        label:"SPEED — "+fx2(kmh)+" KM/H",
        pos:clamp(kmh/30*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–7.5","7.5–15","15–22.5","22.5–30")
      }
    };
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"fuel", tab:"Fuel", name:"Fuel Consumption Calculator",
      def:function(){ return {dist:"450",fuel:"32",price:"1.6"}; },
      fields:[
        {k:"dist",label:"Distance driven (km)",type:"number",min:0},
        {k:"fuel",label:"Fuel used (litres)",type:"number",min:0},
        {k:"price",label:"Fuel price per litre ($, optional)",type:"number",min:0,full:true}
      ], calc:calcFuel },
    { id:"pace", tab:"Pace", name:"Pace Calculator",
      def:function(){ return {dist:"10",dunit:"km",pm:"5",ps:"30"}; },
      fields:[
        {k:"dist",label:"Distance",type:"number",min:0},
        {k:"dunit",label:"Distance unit",type:"select",opts:[["km","Kilometres"],["mi","Miles"]]},
        {k:"pm",label:"Pace · minutes per km",type:"number",min:0},
        {k:"ps",label:"Pace · seconds",type:"number",min:0,max:59}
      ], calc:calcPace }
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

  /* ================= RESULTS AS A TABLE ================= */
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

  function buildTSV(rows){
    var lines=["IrisTool — Fitness Tools","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Computed locally in the browser.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Fitness Tools · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Computed locally in the browser.</p></div>';
    return h;
  }

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
    a.href=url; a.download="IrisTool-fitness-results.txt";
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
