
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
     LIVE EDUCATION & STATISTICS CALCULATORS (all 8 tools)
     ================================================================ */
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function fx(n,d){ return Number(n).toFixed(d==null?2:d); }
  function num(s){ var n=parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }

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

  /* parse "12, 15 18; 21" style lists */
  function parseList(str){
    if(!str) return null;
    var toks=String(str).split(/[\s,;]+/).filter(function(t){ return t.length>0; });
    var out=[];
    for(var i=0;i<toks.length;i++){
      var n=parseFloat(toks[i]);
      if(!isFinite(n)) return null;
      out.push(n);
    }
    return out.length?out:null;
  }
  function sortAsc(a){ return a.slice().sort(function(x,y){ return x-y; }); }
  function sum(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s; }
  function medianOf(sorted){
    var n=sorted.length;
    if(!n) return NaN;
    var mid=Math.floor(n/2);
    return n%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2;
  }
  function trimmedMean(sorted,fraction){
    var k=Math.floor(sorted.length*fraction);
    if(sorted.length-2*k<1) k=0;
    var core=sorted.slice(k, sorted.length-k);
    return core.length?sum(core)/core.length:NaN;
  }

  /* letter grade machinery */
  var LETTER_PTS={"A+":4,"A":4,"A-":3.7,"B+":3.3,"B":3,"B-":2.7,"C+":2.3,"C":2,"C-":1.7,"D+":1.3,"D":1,"D-":0.7,"F":0};
  function parseGrades(str){
    if(!str) return null;
    var toks=String(str).split(/[,;\n]+/).map(function(t){ return t.replace(/\s+/g,"").toUpperCase().replace(/−/g,"-"); }).filter(function(t){ return t.length>0; });
    var pts=[];
    for(var i=0;i<toks.length;i++){
      var t=toks[i];
      if(LETTER_PTS.hasOwnProperty(t)){ pts.push(LETTER_PTS[t]); continue; }
      var n=parseFloat(t);
      if(!isFinite(n)||n<0||n>4) return null;
      pts.push(n);
    }
    return pts.length?pts:null;
  }
  function letterOf(g){
    return g>=3.85?"A":g>=3.5?"A−":g>=3.15?"B+":g>=2.85?"B":g>=2.5?"B−":
           g>=2.15?"C+":g>=1.85?"C":g>=1.5?"C−":g>=1.15?"D+":g>=0.85?"D":g>0.35?"D−":"F";
  }
  function letterOfPct(p){ return p>=90?"A":p>=80?"B":p>=70?"C":p>=60?"D":"F"; }
  function honors(g){ return g>=3.9?"Summa cum laude":g>=3.7?"Magna cum laude":g>=3.5?"Cum laude":"—"; }

  function rangeGauge(pos,min,max,label){
    var span=max-min;
    var q=function(f){ return fx(min+span*f, span<4?2:1); };
    return {label:label,pos:clamp(pos,0,100),segs:quartSegs(),
      legend:[{c:QUART[0],l:"MIN",v:fx(min,1)},{c:QUART[1],l:"25%",v:q(0.25)},{c:QUART[2],l:"75%",v:q(0.75)},{c:QUART[3],l:"MAX",v:fx(max,1)}]};
  }

  /* ---------------- 01 GPA ---------------- */
  function calcGPA(s){
    var pts=parseGrades(s.grades);
    if(!pts) return msgResult("ENTER GRADES (A, B+ … OR 0–4)");
    var crds=parseList(s.credits);
    if(!crds) return msgResult("ENTER CREDIT HOURS");
    if(pts.length!==crds.length) return msgResult(pts.length+" GRADES VS "+crds.length+" CREDITS — COUNTS MUST MATCH");
    var qp=0, tc=0, hi=pts[0], lo=pts[0];
    for(var i=0;i<pts.length;i++){
      if(crds[i]<0) return msgResult("CREDITS MUST BE ≥ 0");
      qp+=pts[i]*crds[i]; tc+=crds[i];
      if(pts[i]>hi) hi=pts[i];
      if(pts[i]<lo) lo=pts[i];
    }
    if(tc<=0) return msgResult("TOTAL CREDITS MUST BE > 0");
    var gpa=qp/tc;
    return {
      stats:[
        ["GPA", fx(gpa),"on a 4.0 scale"],
        ["Letter", letterOf(gpa),honors(gpa)],
        ["Credits", fmt(tc), pts.length+" courses"],
        ["Quality points", fx(qp,1),"Σ points × credits"],
        ["Best course", fx(hi,1),letterOf(hi)],
        ["Weakest course", fx(lo,1),letterOf(lo)],
        ["Spread", fx(hi-lo,1),"best − weakest"],
        ["Honors", honors(gpa),"common U.S. bands"]
      ],
      gauge:{
        label:"GPA SCALE — "+fx(gpa)+" OF 4.0",
        pos:clamp(gpa/4*100,0,100),
        segs:[{c:"#C40000",w:25},{c:"#C9C9C0",w:25},{c:"#6E86FF",w:25},{c:"#0033FF",w:25}],
        legend:[{c:"#C40000",l:"0–1",v:""},{c:"#C9C9C0",l:"1–2",v:""},{c:"#6E86FF",l:"2–3",v:""},{c:"#0033FF",l:"3–4",v:""}]
      }
    };
  }

  /* ---------------- 02 GPA ↔ PERCENTAGE ---------------- */
  function calcGpaPct(s){
    var g=num(s.gpa), p=num(s.pct);
    var gOK=g!=null&&g>=0&&g<=4;
    var pOK=p!=null&&p>=0&&p<=100;
    if(!gOK&&!pOK) return msgResult("ENTER A GPA (0–4) OR A PERCENTAGE");
    var pctOfG=gOK?(g/4*100):null;
    var gpaOfP=pOK?(p/25):null;
    return {
      stats:[
        ["GPA input", gOK?fx(g):"—","0–4 scale"],
        ["→ Percentage", pctOfG==null?"—":fx(pctOfG,1)+" %","linear, ÷4 ×100"],
        ["→ Letter", gOK?letterOf(g):"—",""],
        ["GPA honors", gOK?honors(g):"—",""],
        ["% input", pOK?fx(p,1)+" %":"—","0–100"],
        ["→ GPA", gpaOfP==null?"—":fx(gpaOfP),"linear, ÷25"],
        ["→ Letter", pOK?letterOfPct(p):"—",""],
        ["Grade band", pOK?(p>=60?"Passing":"Below passing"):(gOK?(g>=2?"Passing":"Academic risk"):"—"),""]
      ],
      gauge:{
        label:"PERCENTAGE SCALE — "+(pctOfG!=null?fx(pctOfG,1):(p!=null?fx(p,1):0))+"%",
        pos:pctOfG!=null?clamp(pctOfG,0,100):clamp(p||0,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75–100%")
      }
    };
  }

  /* ---------------- 03 CGPA ---------------- */
  function calcCGPA(s){
    var v=num(s.value);
    if(v==null||v<0) return msgResult("ENTER A VALUE");
    var cg10,cg4,pct95,pctLin;
    if(s.scale==="10"){
      if(v>10) return msgResult("10-POINT CGPA MAXES AT 10");
      cg10=v; cg4=v*0.4; pct95=v*9.5; pctLin=v*10;
    } else if(s.scale==="4"){
      if(v>4) return msgResult("4-POINT GPA MAXES AT 4");
      cg4=v; cg10=v*2.5; pctLin=v/4*100; pct95=cg10*9.5;
    } else {
      if(v>100) return msgResult("PERCENTAGE MAXES AT 100");
      pctLin=v; pct95=v; cg4=v/25; cg10=v/9.5;
    }
    var band=pctLin>=75?"Distinction":pctLin>=60?"First class":pctLin>=50?"Second class":pctLin>=40?"Pass":"Below pass";
    return {
      stats:[
        ["Input", fx(v)+" "+(s.scale==="pct"?"%":"/"+s.scale),s.scale==="10"?"10-point CGPA":s.scale==="4"?"4-point GPA":"percentage"],
        ["CGPA /10", fx(cg10),""],
        ["CGPA /4", fx(cg4),""],
        ["Percentage ×9.5", fx(pct95,1)+" %","CBSE convention"],
        ["Percentage linear", fx(pctLin,1)+" %",""],
        ["Letter", letterOf(cg4),""],
        ["Grade band", band,""],
        ["Out of 20", fx(cg10*2),"French-style scale"]
      ],
      gauge:{
        label:"PERCENTAGE SCALE — "+fx(pctLin,1)+"%",
        pos:clamp(pctLin,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75–100%")
      }
    };
  }

  /* ---------------- 04 AVERAGE ---------------- */
  function calcAverage(s){
    var xs=parseList(s.nums);
    if(!xs) return msgResult("ENTER A LIST OF NUMBERS");
    var sorted=sortAsc(xs), n=xs.length, total=sum(xs), avg=total/n;
    var min=sorted[0], max=sorted[n-1];
    var trimmed = n>2 ? sum(sorted.slice(1,n-1))/(n-2) : avg;
    var sq=0; for(var i=0;i<n;i++) sq+=xs[i]*xs[i];
    return {
      stats:[
        ["Average", fx(avg),"sum ÷ count"],
        ["Sum", fmt(total),""],
        ["Count", fmt(n),"values"],
        ["Minimum", fx(min),""],
        ["Maximum", fx(max),""],
        ["Range", fx(max-min),"max − min"],
        ["Trimmed average", fx(trimmed),"drops min + max"],
        ["Sum of squares", fmt(sq),"Σ x²"]
      ],
      gauge:rangeGauge(max>min?(avg-min)/(max-min)*100:50,min,max,"AVERAGE POSITION — "+fx(avg)+" BETWEEN "+fx(min)+" AND "+fx(max))
    };
  }

  /* ---------------- 05 MEAN ---------------- */
  function calcMean(s){
    var xs=parseList(s.nums);
    if(!xs) return msgResult("ENTER A LIST OF NUMBERS");
    var sorted=sortAsc(xs), n=xs.length;
    var am=sum(xs)/n;
    var allPos=xs.every(function(x){ return x>0; });
    var gm=NaN,hm=NaN;
    if(allPos){
      var lp=0; for(var i=0;i<n;i++) lp+=Math.log(xs[i]);
      gm=Math.exp(lp/n);
      var inv=0; for(var j=0;j<n;j++) inv+=1/xs[j];
      hm=n/inv;
    }
    var sq=0; for(var k=0;k<n;k++) sq+=xs[k]*xs[k];
    var rms=Math.sqrt(sq/n);
    var sortedMin=sorted[0], sortedMax=sorted[n-1];
    return {
      stats:[
        ["Arithmetic mean", fx(am),"sum ÷ n"],
        ["Geometric mean", allPos?fx(gm):"—",allPos?"nth root of product":"positive values only"],
        ["Harmonic mean", allPos?fx(hm):"—",allPos?"n ÷ Σ(1/x)":"positive values only"],
        ["RMS", fx(rms),"root mean square"],
        ["Trimmed mean 10%", fx(trimmedMean(sorted,0.1)),""],
        ["Midrange", fx((sortedMin+sortedMax)/2),"(min + max) ÷ 2"],
        ["Count", fmt(n),""],
        ["Sum", fmt(sum(xs)),""]
      ],
      gauge:rangeGauge(sortedMax>sortedMin?(am-sortedMin)/(sortedMax-sortedMin)*100:50,sortedMin,sortedMax,"ARITHMETIC MEAN — "+fx(am))
    };
  }

  /* ---------------- 06 MEDIAN ---------------- */
  function calcMedian(s){
    var xs=parseList(s.nums);
    if(!xs) return msgResult("ENTER A LIST OF NUMBERS");
    var sorted=sortAsc(xs), n=xs.length;
    var med=medianOf(sorted);
    var half=Math.floor(n/2);
    var q1=medianOf(sorted.slice(0,half));
    var q3=medianOf(sorted.slice(n%2?half+1:half));
    var min=sorted[0], max=sorted[n-1];
    return {
      stats:[
        ["Median", fx(med),"middle value"],
        ["Q1 · 25th", fx(q1),"first quartile"],
        ["Q3 · 75th", fx(q3),"third quartile"],
        ["IQR", fx(q3-q1),"Q3 − Q1"],
        ["Minimum", fx(min),""],
        ["Maximum", fx(max),""],
        ["Count", fmt(n),"values"],
        ["Sorted middle", n%2?"position "+((n+1)/2):"avg of "+(n/2)+" & "+(n/2+1),""]
      ],
      gauge:rangeGauge(max>min?(med-min)/(max-min)*100:50,min,max,"MEDIAN POSITION — "+fx(med))
    };
  }

  /* ---------------- 07 MODE ---------------- */
  function calcMode(s){
    var xs=parseList(s.nums);
    if(!xs) return msgResult("ENTER A LIST OF NUMBERS");
    var counts={};
    xs.forEach(function(x){ counts[x]=(counts[x]||0)+1; });
    var entries=Object.keys(counts).map(function(k){ return [parseFloat(k),counts[k]]; });
    var best=0; entries.forEach(function(e){ if(e[1]>best) best=e[1]; });
    var modes=entries.filter(function(e){ return e[1]===best; }).sort(function(a,b){ return a[0]-b[0]; });
    var noMode=best===1;
    var kind=noMode?"no mode":modes.length===1?"unique":modes.length===2?"bimodal":"multimodal";
    var min=Infinity,max=-Infinity;
    xs.forEach(function(x){ if(x<min)min=x; if(x>max)max=x; });
    return {
      stats:[
        ["Mode", noMode?"none":modes.map(function(m){ return fx(m[0], Math.abs(m[0])%1?2:0); }).join(" · "),kind],
        ["Occurrences", String(best), noMode?"every value once":"per mode"],
        ["Dominance", fx(best/xs.length*100,1)+" %","share of data"],
        ["Unique values", fmt(entries.length),""],
        ["Count", fmt(xs.length),"values"],
        ["Minimum", fx(min),""],
        ["Maximum", fx(max),""],
        ["Range", fx(max-min),""]
      ],
      gauge:{
        label:"DOMINANCE — TOP VALUE COVERS "+fx(best/xs.length*100,1)+"% OF THE SET",
        pos:clamp(best/xs.length*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75–100%")
      }
    };
  }

  /* ---------------- 08 STANDARD DEVIATION ---------------- */
  function calcSD(s){
    var xs=parseList(s.nums);
    if(!xs) return msgResult("ENTER A LIST OF NUMBERS");
    var n=xs.length;
    if(n<2) return msgResult("NEED AT LEAST 2 VALUES");
    var mean=sum(xs)/n;
    var ss=0; for(var i=0;i<n;i++){ var d=xs[i]-mean; ss+=d*d; }
    var sVar=ss/(n-1), pVar=ss/n;
    var sDev=Math.sqrt(sVar), pDev=Math.sqrt(pVar);
    var se=sDev/Math.sqrt(n);
    var cv=mean!==0?(sDev/Math.abs(mean))*100:null;
    var sorted=sortAsc(xs), min=sorted[0], max=sorted[n-1];
    return {
      stats:[
        ["Sample SD · s", fx(sDev),"÷ (n−1)"],
        ["Population SD · σ", fx(pDev),"÷ n"],
        ["Sample variance", fx(sVar),"s²"],
        ["Population variance", fx(pVar),"σ²"],
        ["Mean", fx(mean),""],
        ["Standard error", fx(se),"s ÷ √n"],
        ["CV", cv==null?"—":fx(cv,1)+" %","s ÷ |mean|"],
        ["Range", fx(max-min), fmt(n)+" values"]
      ],
      gauge:{
        label:"COEFFICIENT OF VARIATION — "+(cv==null?"∅":fx(cv,1)+"%")+" SPREAD RELATIVE TO MEAN",
        pos:cv==null?0:clamp(cv,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75%+")
      }
    };
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"gpa", tab:"GPA", name:"GPA Calculator",
      def:function(){ return {grades:"A, A-, B+, B, A",credits:"3, 4, 3, 2, 3"}; },
      fields:[
        {k:"grades",label:"Grades — letters or 0–4 points",type:"text",ph:"A, A-, B+, B …",full:true},
        {k:"credits",label:"Credit hours — same order",type:"text",ph:"3, 4, 3, 2 …",full:true}
      ], calc:calcGPA },
    { id:"gpapct", tab:"GPA ↔ %", name:"GPA Percentage Converter",
      def:function(){ return {gpa:"3.6",pct:"85"}; },
      fields:[
        {k:"gpa",label:"GPA — 0 to 4",type:"number",min:0,max:4},
        {k:"pct",label:"Percentage — 0 to 100",type:"number",min:0,max:100}
      ], calc:calcGpaPct },
    { id:"cgpa", tab:"CGPA", name:"CGPA Converter",
      def:function(){ return {value:"8.2",scale:"10"}; },
      fields:[
        {k:"value",label:"Value",type:"number",min:0},
        {k:"scale",label:"Scale",type:"select",opts:[["10","Out of 10 (CGPA)"],["4","Out of 4 (GPA)"],["pct","Percentage (%)"]]}
      ], calc:calcCGPA },
    { id:"average", tab:"Average", name:"Average Calculator",
      def:function(){ return {nums:"12, 15, 18, 21, 24"}; },
      fields:[
        {k:"nums",label:"Numbers — commas, spaces or new lines",type:"text",ph:"12, 15, 18 …",full:true}
      ], calc:calcAverage },
    { id:"mean", tab:"Mean", name:"Mean Calculator",
      def:function(){ return {nums:"2, 4, 8"}; },
      fields:[
        {k:"nums",label:"Numbers — commas, spaces or new lines",type:"text",ph:"2, 4, 8 …",full:true}
      ], calc:calcMean },
    { id:"median", tab:"Median", name:"Median Calculator",
      def:function(){ return {nums:"7, 3, 9, 1, 5"}; },
      fields:[
        {k:"nums",label:"Numbers — commas, spaces or new lines",type:"text",ph:"7, 3, 9 …",full:true}
      ], calc:calcMedian },
    { id:"mode", tab:"Mode", name:"Mode Calculator",
      def:function(){ return {nums:"4, 7, 2, 7, 9, 7, 2"}; },
      fields:[
        {k:"nums",label:"Numbers — commas, spaces or new lines",type:"text",ph:"4, 7, 2 …",full:true}
      ], calc:calcMode },
    { id:"stdev", tab:"Std Dev", name:"Standard Deviation Calculator",
      def:function(){ return {nums:"10, 12, 14, 16, 18"}; },
      fields:[
        {k:"nums",label:"Numbers — commas, spaces or new lines",type:"text",ph:"10, 12, 14 …",full:true}
      ], calc:calcSD }
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
    var lines=["IrisTool — Education & Statistics Calculators","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Estimates for study and reference purposes.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Education &amp; Statistics Calculators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Estimates for study and reference purposes.</p></div>';
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
    a.href=url; a.download="IrisTool-education-results.txt";
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
