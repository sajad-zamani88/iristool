
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
     LIVE UNIT CONVERTERS (all 9 tools)
     ================================================================ */
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function num(s){ var n=parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function fmtConv(n){
    if(!isFinite(n)) return "—";
    if(n===0) return "0";
    var a=Math.abs(n);
    if(a>=1e12||a<1e-7) return n.toExponential(5);
    return String(Number(n.toFixed(6)));
  }
  function fmtRound2(n){ return Number(n).toLocaleString("en-US",{maximumFractionDigits:2}); }

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
  function magGauge(res,label){
    return {label:label,pos:clamp(Math.log10(Math.abs(res)+1)/12*100,0,100),
      segs:quartSegs(),legend:quartLegend("≤1","10³","10⁶","10⁹+")};
  }

  /* ---------------- unit tables ---------------- */
  var CATS={
    length:{label:"Length",baseLabel:"metre (m)",units:{
      mm:["mm · Millimetre",0.001], cm:["cm · Centimetre",0.01], m:["m · Metre",1],
      km:["km · Kilometre",1000], in:["in · Inch",0.0254], ft:["ft · Foot",0.3048],
      yd:["yd · Yard",0.9144], mi:["mi · Mile",1609.344], nmi:["nmi · Nautical mile",1852]}},
    weight:{label:"Weight",baseLabel:"kilogram (kg)",units:{
      mg:["mg · Milligram",0.000001], g:["g · Gram",0.001], kg:["kg · Kilogram",1],
      t:["t · Tonne",1000], oz:["oz · Ounce",0.028349523125], lb:["lb · Pound",0.45359237],
      st:["st · Stone",6.35029318], ust:["US ton",907.18474]}},
    area:{label:"Area",baseLabel:"square metre (m²)",units:{
      mm2:["mm² · Square millimetre",0.000001], cm2:["cm² · Square centimetre",0.0001],
      m2:["m² · Square metre",1], ha:["ha · Hectare",10000], km2:["km² · Square kilometre",1000000],
      in2:["in² · Square inch",0.00064516], ft2:["ft² · Square foot",0.09290304],
      yd2:["yd² · Square yard",0.83612736], acre:["acre · Acre",4046.8564224],
      mi2:["mi² · Square mile",2589988.110336]}},
    volume:{label:"Volume",baseLabel:"litre (l)",units:{
      ml:["ml · Millilitre",0.001], l:["l · Litre",1], m3:["m³ · Cubic metre",1000],
      tsp:["tsp · Teaspoon (US)",0.00492892159375], tbsp:["tbsp · Tablespoon (US)",0.01478676478125],
      foz:["fl oz · Fluid ounce (US)",0.0295735295625], cup:["cup · Cup (US)",0.2365882365],
      pt:["pt · Pint (US)",0.473176473], qt:["qt · Quart (US)",0.946352946],
      gal:["gal · Gallon (US)",3.785411784]}},
    speed:{label:"Speed",baseLabel:"metre/second (m/s)",units:{
      ms:["m/s · Metre per second",1], kmh:["km/h · Kilometre per hour",0.2777777777777778],
      mph:["mph · Mile per hour",0.44704], fts:["ft/s · Foot per second",0.3048],
      kn:["kn · Knot",0.5144444444444445]}},
    temperature:{label:"Temperature",baseLabel:"Celsius (°C)",units:{
      c:["°C · Celsius",1], f:["°F · Fahrenheit",1], k:["K · Kelvin",1], r:["°R · Rankine",1]}},
    pressure:{label:"Pressure",baseLabel:"pascal (Pa)",units:{
      pa:["Pa · Pascal",1], kpa:["kPa · Kilopascal",1000], bar:["bar",100000],
      psi:["psi · Pound per sq. inch",6894.757293168], atm:["atm · Atmosphere",101325],
      mmhg:["mmHg · Torr",133.322387415]}}
  };
  var CAT_KEYS=["length","weight","area","volume","speed","temperature","pressure"];
  var T2C={c:function(x){return x;}, f:function(x){return (x-32)*5/9;}, k:function(x){return x-273.15;}, r:function(x){return (x-491.67)*5/9;}};
  var C2T={c:function(x){return x;}, f:function(x){return x*9/5+32;}, k:function(x){return x+273.15;}, r:function(x){return (x+273.15)*9/5;}};

  function optsOf(cat){
    return Object.keys(CATS[cat].units).map(function(k){ return [k, CATS[cat].units[k][0]]; });
  }
  function unitLabel(cat,u){ return CATS[cat].units[u]?CATS[cat].units[u][0]:u; }
  function shortU(cat,u){ var l=unitLabel(cat,u); return l.split(" · ")[0]; }
  function convCore(cat,fromU,toU,v){
    if(cat==="temperature") return C2T[toU](T2C[fromU](v));
    var U=CATS[cat].units;
    if(!U[fromU]||!U[toU]) return NaN;
    return v*U[fromU][1]/U[toU][1];
  }

  /* shared result builder for all linear/temperature converters */
  function makeConvResult(cat,v,fromU,toU,extras){
    var U=CATS[cat].units;
    if(!U[fromU]||!U[toU]) return msgResult("UNKNOWN UNIT");
    var res=convCore(cat,fromU,toU,v);
    if(!isFinite(res)) return msgResult("INVALID VALUE");
    var linear=cat!=="temperature";
    var factor=linear?U[fromU][1]/U[toU][1]:null;
    var baseVal=cat==="temperature"?T2C[fromU](v):v*U[fromU][1];
    var stats=[
      ["Result", fmtConv(res)+" "+shortU(cat,toU), fmtConv(v)+" "+shortU(cat,fromU)+" →"],
      ["Input", fmtConv(v), unitLabel(cat,fromU)],
      linear?["Factor", fmtConv(factor), "1 "+shortU(cat,fromU)+" ="]:["Scale", "Non-linear", "offsets via °C"],
      linear?["Reciprocal", fmtConv(1/factor), "1 "+shortU(cat,toU)+" ="]:["Pivot", "Celsius", "Δ1°C = 1.8°F = 1 K"]
    ];
    extras.forEach(function(pair){
      stats.push(["In "+shortU(cat,pair[1]), fmtConv(convCore(cat,fromU,pair[1],v)), pair[0]]);
    });
    return {
      stats:stats,
      gauge:magGauge(res,"RESULT — "+fmtConv(res)+" "+shortU(cat,toU).toUpperCase()+" · BASE "+fmtConv(baseVal))
    };
  }

  function convCalcFactory(cat,extras){
    return function(s){
      var v=num(s.value);
      if(v==null) return msgResult("ENTER A VALUE");
      return makeConvResult(cat,v,s.from,s.to,extras);
    };
  }

  /* ---------------- universal converter ---------------- */
  function calcUnit(s){
    var v=num(s.value);
    if(v==null) return msgResult("ENTER A VALUE");
    var r=makeConvResult(s.cat,v,s.from,s.to,[["Base unit",CATS[s.cat].units?Object.keys(CATS[s.cat].units)[2]:s.cat]]);
    if(r.stats.length>8) r.stats=r.stats.slice(0,8);
    /* replace last extra with category info */
    r.stats[7]=["Category", CATS[s.cat].label, "base: "+CATS[s.cat].baseLabel];
    return r;
  }

  /* ---------------- pace ---------------- */
  function fmtDur(totalSec){
    totalSec=Math.round(totalSec);
    var h=Math.floor(totalSec/3600), m=Math.floor(totalSec%3600/60), s=totalSec%60;
    function p(n){ return String(n).padStart(2,"0"); }
    return h>0 ? h+":"+p(m)+":"+p(s) : m+":"+p(s);
  }
  function calcPace(s){
    var d=num(s.dist), hh=num(s.hh)||0, mm=num(s.mm)||0, ss=num(s.ss)||0;
    if(d==null||d<=0) return msgResult("ENTER A DISTANCE");
    var totalSec=hh*3600+mm*60+ss;
    if(totalSec<=0) return msgResult("ENTER A TIME > 0");
    var distKm=d*{km:1,mi:1.609344,m:0.001}[s.dunit];
    var paceKm=totalSec/distKm;             /* s per km */
    var paceMi=paceKm*1.609344;             /* s per mile */
    var kmh=distKm/(totalSec/3600);
    var mph=kmh/1.609344;
    return {
      stats:[
        ["Pace /km", fmtDur(paceKm),"min per kilometre"],
        ["Pace /mile", fmtDur(paceMi),"min per mile"],
        ["Speed", fx2(kmh)+" km/h",""],
        ["Speed", fx2(mph)+" mph",""],
        ["Distance", fmtConv(d)+" "+s.dunit,"= "+fmtConv(distKm)+" km"],
        ["Time", fmtDur(totalSec),""],
        ["5K finish", fmtDur(paceKm*5),"same pace"],
        ["Marathon", fmtDur(paceKm*42.195),"same pace"]
      ],
      gauge:{
        label:"SPEED — "+fx2(kmh)+" KM/H",
        pos:clamp(kmh/60*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–15","15–30","30–45","45–60")
      }
    };
  }
  function fx2(n){ return Number(n).toFixed(2); }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"unit", tab:"All Units", name:"Unit Converter",
      def:function(){ return {cat:"length",value:"100",from:"cm",to:"in"}; },
      fields:[
        {k:"cat",label:"Category",type:"select",full:true,opts:CAT_KEYS.map(function(c){ return [c,CATS[c].label]; })},
        {k:"value",label:"Value",type:"number"},
        {k:"from",label:"From",type:"select",opts:function(s){ return optsOf(s.cat); }},
        {k:"to",label:"To",type:"select",opts:function(s){ return optsOf(s.cat); }}
      ], calc:calcUnit },
    { id:"length", tab:"Length", name:"Length Converter",
      def:function(){ return {value:"100",from:"cm",to:"in"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("length")},
        {k:"to",label:"To",type:"select",opts:optsOf("length")}
      ], calc:convCalcFactory("length",[["Metres","m"],["Feet","ft"],["Inches","in"],["Miles","mi"]]) },
    { id:"weight", tab:"Weight", name:"Weight Converter",
      def:function(){ return {value:"70",from:"kg",to:"lb"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("weight")},
        {k:"to",label:"To",type:"select",opts:optsOf("weight")}
      ], calc:convCalcFactory("weight",[["Kilograms","kg"],["Grams","g"],["Pounds","lb"],["Ounces","oz"]]) },
    { id:"area", tab:"Area", name:"Area Converter",
      def:function(){ return {value:"1",from:"acre",to:"m2"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("area")},
        {k:"to",label:"To",type:"select",opts:optsOf("area")}
      ], calc:convCalcFactory("area",[["Square metres","m2"],["Square feet","ft2"],["Acres","acre"],["Hectares","ha"]]) },
    { id:"volume", tab:"Volume", name:"Volume Converter",
      def:function(){ return {value:"1",from:"gal",to:"l"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("volume")},
        {k:"to",label:"To",type:"select",opts:optsOf("volume")}
      ], calc:convCalcFactory("volume",[["Litres","l"],["US gallons","gal"],["Cups","cup"],["Millilitres","ml"]]) },
    { id:"speed", tab:"Speed", name:"Speed Converter",
      def:function(){ return {value:"100",from:"kmh",to:"mph"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("speed")},
        {k:"to",label:"To",type:"select",opts:optsOf("speed")}
      ], calc:convCalcFactory("speed",[["km/h","kmh"],["mph","mph"],["m/s","ms"],["Knots","kn"]]) },
    { id:"temp", tab:"Temp", name:"Temperature Converter",
      def:function(){ return {value:"25",from:"c",to:"f"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("temperature")},
        {k:"to",label:"To",type:"select",opts:optsOf("temperature")}
      ], calc:convCalcFactory("temperature",[["Celsius","c"],["Fahrenheit","f"],["Kelvin","k"],["Rankine","r"]]) },
    { id:"pressure", tab:"Pressure", name:"Pressure Converter",
      def:function(){ return {value:"1",from:"atm",to:"psi"}; },
      fields:[
        {k:"value",label:"Value",type:"number",full:true},
        {k:"from",label:"From",type:"select",opts:optsOf("pressure")},
        {k:"to",label:"To",type:"select",opts:optsOf("pressure")}
      ], calc:convCalcFactory("pressure",[["Pascals","pa"],["Kilopascals","kpa"],["Bar","bar"],["PSI","psi"]]) },
    { id:"pace", tab:"Pace", name:"Pace Converter",
      def:function(){ return {dist:"5",dunit:"km",hh:"0",mm:"25",ss:"0"}; },
      fields:[
        {k:"dist",label:"Distance",type:"number",min:0},
        {k:"dunit",label:"Distance unit",type:"select",opts:[["km","Kilometres"],["mi","Miles"],["m","Metres"]]},
        {k:"hh",label:"Hours",type:"number",min:0},
        {k:"mm",label:"Minutes",type:"number",min:0},
        {k:"ss",label:"Seconds",type:"number",min:0}
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
      var opts = typeof f.opts==="function" ? f.opts(s) : f.opts;
      ctrl='<select class="f-select" id="'+id+'" data-k="'+f.k+'">'+opts.map(function(o){
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
    /* universal converter: switching category resets from/to to valid units */
    if(activeTool.id==="unit" && k==="cat"){
      var keys=Object.keys(CATS[e.target.value].units);
      state.unit.from=keys[0];
      state.unit.to=keys[1];
      renderForm();
    }
    recalc();
  });
  formEl.addEventListener("click", function(e){
    var b=e.target.closest(".seg button"); if(!b) return;
    state[activeTool.id][b.closest(".seg").getAttribute("data-k")]=b.getAttribute("data-v");
    renderForm(); recalc();
  });

  /* guide "runs in the converter above" jumps */
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
    var lines=["IrisTool — Unit Converters","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Metric + US customary · exact definitions.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Unit Converters · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Metric + US customary · exact definitions.</p></div>';
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
    a.href=url; a.download="IrisTool-unit-results.txt";
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
