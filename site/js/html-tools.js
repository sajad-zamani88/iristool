
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
     LIVE HEALTH CALCULATORS (all 9 tools)
     ================================================================ */
  var DAY = 86400000;
  function today0(){ var t = new Date(); t.setHours(0,0,0,0); return t; }
  function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function pd(s){ if(!s) return null; var p = String(s).split("-").map(Number); if(p.length!==3||!p[0]) return null; var d = new Date(p[0],p[1]-1,p[2]); return isNaN(d.getTime())?null:d; }
  function addD(d,n){ var x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function df(a,b){ return Math.round((b.getTime()-a.getTime())/DAY); }
  function fd(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
  function fday(d){ return d.toLocaleDateString("en-US",{weekday:"long"}); }
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function short(n){ return n>=1e6 ? (n/1e6).toFixed(1)+" M" : fmt(n); }
  function num(s){ var n = parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }

  var QUART = ["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];
  function quartLegend(u){ return [
    {c:QUART[0],l:"0–25%",v:u},{c:QUART[1],l:"25–50%",v:u},
    {c:QUART[2],l:"50–75%",v:u},{c:QUART[3],l:"75–100%",v:u}]; }
  function zeroGauge(label){ return {label:label,pos:0,
    segs:[{c:"#EFEFE9",w:100}],
    legend:[{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""},{c:"#EFEFE9",l:"—",v:""}]}; }
  function msgResult(msg){
    var st=[["Status",msg,""]];
    for(var i=1;i<8;i++) st.push(["—","",""]);
    return {stats:st,gauge:zeroGauge(msg)};
  }

  /* ---------------- 01 AGE ---------------- */
  function calcAge(s){
    var dob=pd(s.dob), ref=pd(s.asof)||today0();
    if(!dob) return msgResult("ENTER DATE OF BIRTH");
    if(!ref) return msgResult("ENTER REFERENCE DATE");
    if(dob>ref) return msgResult("BIRTH DATE IS AFTER REFERENCE");
    var y=ref.getFullYear()-dob.getFullYear(), m=ref.getMonth()-dob.getMonth(), d=ref.getDate()-dob.getDate();
    if(d<0){ m--; d+=new Date(ref.getFullYear(),ref.getMonth(),0).getDate(); }
    if(m<0){ y--; m+=12; }
    var total=df(dob,ref), weeks=Math.floor(total/7), hours=total*24, minutes=total*1440;
    var nb=new Date(ref.getFullYear(),dob.getMonth(),dob.getDate());
    var toB=df(ref,nb);
    if(toB<0){ nb.setFullYear(nb.getFullYear()+1); toB=df(ref,nb); }
    var turning = toB===0 ? y : y+1;
    return {
      stats:[
        ["Exact age", y+" y "+m+" m "+d+" d","years · months · days"],
        ["Born on", fday(dob), fd(dob)],
        ["Total days", fmt(total), fmt(weeks)+" weeks"],
        ["Total hours", fmt(hours),""],
        ["Total minutes", short(minutes),""],
        ["Next birthday", toB===0?"today 🎉":toB+" d","turns "+turning],
        ["Age in months", fmt(y*12+m),""],
        ["Reference", fd(ref),"as-of date"]
      ],
      gauge:{
        label:"LIFE SCALE — "+y+" YEARS OLD",
        pos:clamp(total/365.25,0,100),
        segs:[{c:"#C9C9C0",w:18},{c:"#6E86FF",w:22},{c:"#0033FF",w:25},{c:"#141414",w:35}],
        legend:[{c:"#C9C9C0",l:"YOUTH",v:"0–18"},{c:"#6E86FF",l:"ADULT",v:"18–40"},{c:"#0033FF",l:"MIDLIFE",v:"40–65"},{c:"#141414",l:"SENIOR",v:"65+"}]
      }
    };
  }

  /* ---------------- 02 BMI ---------------- */
  function bmiCat(b){ return b<18.5?"Underweight":b<25?"Healthy":b<30?"Overweight":"Obese"; }
  function calcBMI(s){
    var bmi,wKg,hM,wStr,hStr,uW;
    if(s.unit==="metric"){
      var w=num(s.w), h=num(s.h);
      if(!w||!h||w<=0||h<=0) return msgResult("ENTER WEIGHT & HEIGHT");
      hM=h/100; bmi=w/(hM*hM); wKg=w; wStr=fmt(w)+" kg"; hStr=fmt(h)+" cm"; uW="kg";
    } else {
      var lb=num(s.lb), ft=num(s.ft), inch=num(s.inch)||0;
      if(!lb||ft==null||lb<=0) return msgResult("ENTER WEIGHT & HEIGHT");
      var tin=ft*12+inch;
      if(tin<=0) return msgResult("CHECK HEIGHT");
      bmi=703*lb/(tin*tin); hM=tin*0.0254; wKg=lb*0.453592; wStr=fmt(lb)+" lb"; hStr=ft+"′ "+inch+"″"; uW="lb";
    }
    var minW=18.5*hM*hM, maxW=24.9*hM*hM;
    if(uW==="lb"){ minW*=2.20462; maxW*=2.20462; }
    var toH = bmi<18.5 ? "Gain "+(minW-wKg).toFixed(1)+" "+uW :
              bmi>24.9 ? "Lose "+(wKg-maxW).toFixed(1)+" "+uW : "In range ✓";
    var cat=bmiCat(bmi);
    return {
      stats:[
        ["BMI", bmi.toFixed(1),"kg/m²"],
        ["Category", cat,""],
        ["Healthy range", fmt(minW)+"–"+fmt(maxW)+" "+uW,"for your height"],
        ["Current weight", wStr,""],
        ["Height", hStr,""],
        ["BMI Prime", (bmi/22).toFixed(2),"1.00 = BMI 22"],
        ["To healthy", toH,""],
        ["Units", s.unit==="metric"?"Metric":"Imperial","kg·cm / lb·ft"]
      ],
      gauge:{
        label:"BMI SCALE — "+bmi.toFixed(1)+" · "+cat.toUpperCase(),
        pos:clamp((bmi-14)/26*100,0,100),
        segs:[{c:"#C9C9C0",w:17.3},{c:"#0033FF",w:25},{c:"#141414",w:19.2},{c:"#C40000",w:38.5}],
        legend:[{c:"#C9C9C0",l:"UNDER",v:"<18.5"},{c:"#0033FF",l:"HEALTHY",v:"18.5–25"},{c:"#141414",l:"OVER",v:"25–30"},{c:"#C40000",l:"OBESE",v:"30+"}]
      }
    };
  }

  /* ---------------- 03 BMR ---------------- */
  function mifflin(sex,w,h,a){ return 10*w+6.25*h-5*a+(sex==="male"?5:-161); }
  function calcBMR(s){
    var a=num(s.age), h=num(s.h), w=num(s.w);
    if(!a||!h||!w||a<=0||h<=0||w<=0) return msgResult("ENTER AGE, HEIGHT & WEIGHT");
    var m=mifflin(s.sex,w,h,a);
    var hb = s.sex==="male" ? 66.5+13.75*w+5.003*h-6.755*a : 655.1+9.563*w+1.85*h-4.676*a;
    return {
      stats:[
        ["BMR · Mifflin", fmt(m)+" kcal","per day at rest"],
        ["Harris-Benedict", fmt(hb)+" kcal","cross-check"],
        ["Formula gap", (((hb-m)/m)*100).toFixed(1)+" %",""],
        ["Kilojoules", fmt(m*4.184)+" kJ","per day"],
        ["Per hour", fmt(m/24)+" kcal",""],
        ["Per week", fmt(m*7)+" kcal",""],
        ["Sedentary ×1.2", fmt(m*1.2)+" kcal","TDEE estimate"],
        ["Active ×1.725", fmt(m*1.725)+" kcal","TDEE estimate"]
      ],
      gauge:{
        label:"BMR SCALE — "+fmt(m)+" KCAL / DAY",
        pos:clamp(m/3000*100,0,100),
        segs:[{c:QUART[0],w:25},{c:QUART[1],w:25},{c:QUART[2],w:25},{c:QUART[3],w:25}],
        legend:quartLegend("0–3K kcal")
      }
    };
  }

  /* ---------------- 04 BODY FAT ---------------- */
  function calcBF(s){
    var h=num(s.h), neck=num(s.neck), waist=num(s.waist), w=num(s.w);
    var hip = s.sex==="female" ? num(s.hip) : null;
    if(!h||!neck||!waist||!w||h<=0||neck<=0||waist<=0||w<=0) return msgResult("ENTER ALL MEASUREMENTS");
    if(s.sex==="female" && (!hip||hip<=0)) return msgResult("ENTER HIP MEASUREMENT");
    var bf;
    if(s.sex==="male"){
      var x=waist-neck; if(x<=0) return msgResult("WAIST MUST EXCEED NECK");
      bf=495/(1.0324-0.19077*Math.log10(x)+0.15456*Math.log10(h))-450;
    } else {
      var yy=waist+hip-neck; if(yy<=0) return msgResult("CHECK MEASUREMENTS");
      bf=495/(1.29579-0.35004*Math.log10(yy)+0.2210*Math.log10(h))-450;
    }
    bf=clamp(bf,2,60);
    var bounds = s.sex==="male" ? [5,13,17,24] : [13,20,24,31];
    var names=["Essential","Athletic","Fit","Average","Obese"];
    var cat=names[bounds.filter(function(b){return bf>b;}).length];
    var fat=w*bf/100, lean=w-fat;
    var range = s.sex==="male" ? "18–24 %" : "25–31 %";
    var hi = s.sex==="male"?24:31, lo = s.sex==="male"?18:25;
    var toH = bf<lo ? "Below typical" : bf>hi ? "Lose "+(w*(bf-hi)/100).toFixed(1)+" kg fat" : "In range ✓";
    return {
      stats:[
        ["Body fat", bf.toFixed(1)+" %","U.S. Navy method"],
        ["Category", cat,""],
        ["Fat mass", fat.toFixed(1)+" kg",(fat*2.20462).toFixed(1)+" lb"],
        ["Lean mass", lean.toFixed(1)+" kg",(lean*2.20462).toFixed(1)+" lb"],
        ["Typical range", range,""],
        ["To typical", toH,""],
        ["Tape used", s.sex==="male"?"neck + waist":"neck+waist+hip","cm"],
        ["Height", fmt(h)+" cm",""]
      ],
      gauge:{
        label:"BODY FAT SCALE — "+bf.toFixed(1)+" % · "+cat.toUpperCase(),
        pos:clamp(bf/45*100,0,100),
        segs:[{c:"#C9C9C0",w:22.2},{c:"#6E86FF",w:22.2},{c:"#0033FF",w:17.8},{c:"#C40000",w:37.8}],
        legend:[{c:"#C9C9C0",l:"ESSENTIAL",v:"2–10"},{c:"#6E86FF",l:"ATHLETIC",v:"10–20"},{c:"#0033FF",l:"FIT",v:"20–28"},{c:"#C40000",l:"ABOVE",v:"28+"}]
      }
    };
  }

  /* ---------------- 05 WATER ---------------- */
  function calcWater(s){
    var w=num(s.w), ex=num(s.ex)||0;
    if(!w||w<=0) return msgResult("ENTER BODY WEIGHT");
    var base=35*w, extra=Math.floor(ex/30)*350, total=base+extra, L=total/1000;
    return {
      stats:[
        ["Daily target", L.toFixed(2)+" L","≈ "+fmt(total)+" ml"],
        ["Glasses", Math.ceil(total/250)+" × 250 ml",""],
        ["500 ml bottles", Math.ceil(total/500),""],
        ["Baseline", fmt(base)+" ml","35 ml / kg"],
        ["Exercise bonus", "+"+fmt(extra)+" ml","+350 ml / 30 min"],
        ["Per waking hour", fmt(Math.round(total/16))+" ml","over 16 h"],
        ["Weekly", (total*7/1000).toFixed(1)+" L",""],
        ["Per kg", "35 ml","baseline rule"]
      ],
      gauge:{
        label:"HYDRATION SCALE — "+L.toFixed(2)+" L / DAY",
        pos:clamp(L/5*100,0,100),
        segs:[{c:QUART[0],w:25},{c:QUART[1],w:25},{c:QUART[2],w:25},{c:QUART[3],w:25}],
        legend:quartLegend("0–5 L")
      }
    };
  }

  /* ---------------- 06 CALORIE ---------------- */
  function calcCal(s){
    var a=num(s.age), h=num(s.h), w=num(s.w);
    if(!a||!h||!w||a<=0||h<=0||w<=0) return msgResult("ENTER AGE, HEIGHT & WEIGHT");
    var m=mifflin(s.sex,w,h,a), f=parseFloat(s.act)||1.55, maint=m*f;
    return {
      stats:[
        ["BMR", fmt(m)+" kcal","at complete rest"],
        ["Maintenance", fmt(maint)+" kcal","×"+f+" activity"],
        ["Mild loss", fmt(maint-250)+" kcal","−0.25 kg / wk"],
        ["Steady loss", fmt(maint-500)+" kcal","−0.5 kg / wk"],
        ["Mild gain", fmt(maint+250)+" kcal","+0.25 kg / wk"],
        ["Steady gain", fmt(maint+500)+" kcal","+0.5 kg / wk"],
        ["Protein 30%", fmt(maint*0.3/4)+" g","per day"],
        ["Carbs 40%", fmt(maint*0.4/4)+" g","per day"]
      ],
      gauge:{
        label:"ENERGY SCALE — "+fmt(maint)+" KCAL MAINTENANCE",
        pos:clamp(maint/4000*100,0,100),
        segs:[{c:QUART[0],w:25},{c:QUART[1],w:25},{c:QUART[2],w:25},{c:QUART[3],w:25}],
        legend:quartLegend("0–4K kcal")
      }
    };
  }

  /* ---------------- 07 PREGNANCY ---------------- */
  function triOf(wk){ return wk<14?"First":wk<28?"Second":"Third"; }
  function pregGauge(pos,wk,label){
    return {label:label,pos:clamp(pos,0,100),
      segs:[{c:"#C9C9C0",w:35},{c:"#6E86FF",w:35},{c:"#0033FF",w:30}],
      legend:[{c:"#C9C9C0",l:"1ST TRIM",v:"0–13 w"},{c:"#6E86FF",l:"2ND TRIM",v:"14–27 w"},{c:"#0033FF",l:"3RD TRIM",v:"28–40 w"}]};
  }
  function calcPreg(s){
    var lmp=pd(s.lmp); if(!lmp) return msgResult("ENTER LAST PERIOD DATE");
    var cyc=clamp(num(s.cycle)||28,20,45);
    var total=280+(cyc-28), due=addD(lmp,total), t=today0();
    var gd=df(lmp,t);
    var status = gd<0 ? "NOT STARTED" : gd>total ? "PAST DUE" : "PREGNANT";
    var wk=Math.max(0,Math.floor(gd/7)), dd=gd%7, rem=df(t,due);
    var conc=addD(lmp,cyc-14);
    return {
      stats:[
        ["Status", status, cyc+"-day cycle"],
        ["Gestational age", gd<0?"—":wk+" w "+dd+" d",""],
        ["Trimester", gd<0?"—":triOf(wk),""],
        ["Due date", fd(due), fday(due)],
        ["Est. conception", fd(conc),""],
        ["Days remaining", rem<0?(-rem)+" over":rem+" d",""],
        ["Progress", clamp(Math.round(gd/total*100),0,100)+" %","of "+total+" d"],
        ["Current week", gd<0?"—":"Week "+(wk+1),""]
      ],
      gauge:pregGauge(gd/total*100, wk, "PREGNANCY TIMELINE — WEEK "+Math.max(0,wk))
    };
  }

  /* ---------------- 08 OVULATION ---------------- */
  function calcOvu(s){
    var lmp=pd(s.lmp); if(!lmp) return msgResult("ENTER LAST PERIOD DATE");
    var cyc=clamp(num(s.cycle)||28,20,45), t=today0();
    var base=lmp;
    while(df(base,t)>=cyc) base=addD(base,cyc);
    var ov=addD(base,cyc-14);
    if(df(ov,t)<0){ base=addD(base,cyc); ov=addD(base,cyc-14); }
    var fS=addD(ov,-5), fE=addD(ov,1), nextP=addD(base,cyc);
    var cDay=df(base,t)+1, toOv=df(t,ov);
    var ovDay=cyc-14;
    var wM=Math.min(5,cyc), wF=Math.max(0,ovDay-5-wM), wFe=7, wL=Math.max(0,100-wM-wF-wFe);
    return {
      stats:[
        ["Ovulation date", fd(ov), fday(ov)],
        ["Days to ovulation", toOv===0?"today 🎉":toOv+" d", toOv>0?"from today":""],
        ["Fertile window", fd(fS)+" – "+fd(fE),"6 days"],
        ["Peak day", fd(ov),"ovulation day"],
        ["Next period", fd(nextP),""],
        ["Cycle day today", "Day "+cDay+" / "+cyc,""],
        ["Follicular phase", (cyc-14)+" d",""],
        ["Luteal phase", "14 d",""]
      ],
      gauge:{
        label:"CYCLE MAP — OVULATION ON DAY "+ovDay,
        pos:clamp(ovDay/cyc*100,0,100),
        segs:[{c:"#6C6C64",w:wM/cyc*100},{c:"#EFEFE9",w:wF/cyc*100},{c:"#0033FF",w:wFe/cyc*100},{c:"#C9C9C0",w:wL/cyc*100}],
        legend:[{c:"#6C6C64",l:"MENSES",v:"~5 d"},{c:"#EFEFE9",l:"FOLLICULAR",v:""},{c:"#0033FF",l:"FERTILE",v:"7 d"},{c:"#C9C9C0",l:"LUTEAL",v:"14 d"}]
      }
    };
  }

  /* ---------------- 09 DUE DATE ---------------- */
  function calcDue(s){
    var d=pd(s.date); if(!d) return msgResult("ENTER A DATE");
    var due, mLabel;
    if(s.method==="conception"){ due=addD(d,266); mLabel="Conception"; }
    else if(s.method==="ivf3"){ due=addD(d,263); mLabel="IVF · day-3"; }
    else if(s.method==="ivf5"){ due=addD(d,261); mLabel="IVF · day-5"; }
    else { due=addD(d,280); mLabel="LMP · Naegele"; }
    var eqLmp=addD(due,-280), t=today0(), gd=df(eqLmp,t);
    var wk=Math.max(0,Math.floor(gd/7)), dd=gd%7, rem=df(t,due);
    var conc=addD(due,-266);
    return {
      stats:[
        ["Due date", fd(due), fday(due)],
        ["Method", mLabel,""],
        ["Gestational age", gd<0?"not started":wk+" w "+dd+" d",""],
        ["Trimester", gd<0?"—":triOf(wk),""],
        ["Days remaining", rem<0?(-rem)+" over":rem+" d",""],
        ["Progress", clamp(Math.round(gd/280*100),0,100)+" %","of 280 d"],
        ["Equivalent LMP", fd(eqLmp),""],
        ["Est. conception", fd(conc),""]
      ],
      gauge:pregGauge(gd/280*100, wk, "DUE-DATE TIMELINE — "+fd(due).toUpperCase())
    };
  }

  /* ---------------- tool registry ---------------- */
  var T0 = today0();
  var TOOLS = [
    { id:"age", tab:"Age", name:"Age Calculator", def:function(){ return {dob:"1990-04-15", asof:iso(T0)}; },
      fields:[
        {k:"dob",label:"Date of birth",type:"date"},
        {k:"asof",label:"Age at date (as of)",type:"date"}
      ], calc:calcAge },
    { id:"bmi", tab:"BMI", name:"BMI Calculator", def:function(){ return {unit:"metric",w:"70",h:"175",lb:"154",ft:"5",inch:"9"}; },
      fields:[
        {k:"unit",label:"Units",type:"seg",opts:[["metric","Metric · kg/cm"],["imperial","Imperial · lb/ft"]]},
        {k:"w",label:"Weight (kg)",type:"number",min:1,max:400,when:function(s){return s.unit==="metric";}},
        {k:"h",label:"Height (cm)",type:"number",min:50,max:250,when:function(s){return s.unit==="metric";}},
        {k:"lb",label:"Weight (lb)",type:"number",min:1,max:900,when:function(s){return s.unit==="imperial";}},
        {k:"ft",label:"Height (ft)",type:"number",min:1,max:8,when:function(s){return s.unit==="imperial";}},
        {k:"inch",label:"+ inches",type:"number",min:0,max:11,when:function(s){return s.unit==="imperial";}}
      ], calc:calcBMI },
    { id:"bmr", tab:"BMR", name:"BMR Calculator", def:function(){ return {sex:"male",age:"30",h:"175",w:"70"}; },
      fields:[
        {k:"sex",label:"Sex",type:"seg",opts:[["male","Male"],["female","Female"]]},
        {k:"age",label:"Age (years)",type:"number",min:1,max:120},
        {k:"h",label:"Height (cm)",type:"number",min:50,max:250},
        {k:"w",label:"Weight (kg)",type:"number",min:1,max:400}
      ], calc:calcBMR },
    { id:"bodyfat", tab:"Body Fat", name:"Body Fat Calculator", def:function(){ return {sex:"male",h:"175",neck:"38",waist:"85",hip:"95",w:"70"}; },
      fields:[
        {k:"sex",label:"Sex",type:"seg",opts:[["male","Male"],["female","Female"]]},
        {k:"h",label:"Height (cm)",type:"number",min:50,max:250},
        {k:"neck",label:"Neck (cm)",type:"number",min:10,max:100},
        {k:"waist",label:"Waist (cm)",type:"number",min:20,max:250},
        {k:"hip",label:"Hip (cm)",type:"number",min:20,max:250,when:function(s){return s.sex==="female";}},
        {k:"w",label:"Weight (kg)",type:"number",min:1,max:400}
      ], calc:calcBF },
    { id:"water", tab:"Water", name:"Water Intake Calculator", def:function(){ return {w:"70",ex:"30"}; },
      fields:[
        {k:"w",label:"Body weight (kg)",type:"number",min:1,max:400},
        {k:"ex",label:"Exercise (min / day)",type:"number",min:0,max:300}
      ], calc:calcWater },
    { id:"calorie", tab:"Calories", name:"Calorie Calculator", def:function(){ return {sex:"male",age:"30",h:"175",w:"70",act:"1.55"}; },
      fields:[
        {k:"sex",label:"Sex",type:"seg",opts:[["male","Male"],["female","Female"]]},
        {k:"age",label:"Age (years)",type:"number",min:1,max:120},
        {k:"h",label:"Height (cm)",type:"number",min:50,max:250},
        {k:"w",label:"Weight (kg)",type:"number",min:1,max:400},
        {k:"act",label:"Activity level",type:"select",full:true,opts:[
          ["1.2","Sedentary — little or no exercise"],
          ["1.375","Light — exercise 1–3 days / week"],
          ["1.55","Moderate — exercise 3–5 days / week"],
          ["1.725","Active — hard exercise 6–7 days / week"],
          ["1.9","Athlete — hard exercise twice a day"]]}
      ], calc:calcCal },
    { id:"pregnancy", tab:"Pregnancy", name:"Pregnancy Calculator", def:function(){ return {lmp:iso(addD(T0,-70)),cycle:"28"}; },
      fields:[
        {k:"lmp",label:"First day of last period",type:"date"},
        {k:"cycle",label:"Cycle length (days)",type:"number",min:20,max:45}
      ], calc:calcPreg },
    { id:"ovulation", tab:"Ovulation", name:"Ovulation Calculator", def:function(){ return {lmp:iso(addD(T0,-10)),cycle:"28"}; },
      fields:[
        {k:"lmp",label:"First day of last period",type:"date"},
        {k:"cycle",label:"Cycle length (days)",type:"number",min:20,max:45}
      ], calc:calcOvu },
    { id:"duedate", tab:"Due Date", name:"Due Date Calculator", def:function(){ return {method:"lmp",date:iso(addD(T0,-70))}; },
      fields:[
        {k:"method",label:"Calculated from",type:"seg",opts:[["lmp","LMP"],["conception","Conception"],["ivf3","IVF · 3-day"],["ivf5","IVF · 5-day"]]},
        {k:"date",label:"Reference date",type:"date",full:true}
      ], calc:calcDue }
  ];

  var state = {};
  TOOLS.forEach(function(t){ state[t.id] = t.def(); });
  var activeTool = TOOLS[0];
  var lastResult = null;

  var tabsEl = $("#t-tabs"), formEl = $("#calc-form");
  var gSegs = $("#g-segs"), gMark = $("#g-mark"), gLegend = $("#g-legend"), gLabel = $("#gauge-label");

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
    tabsEl.innerHTML = TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function setStat(i,l,v,sub){
    var el=$("#st-v-"+i);
    $("#st-l-"+i).textContent=l;
    $("#st-s-"+i).textContent=sub||"";
    v=String(v);
    if(el.textContent!==v){
      el.textContent=v;
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
      setTimeout(function(){ el.classList.remove("bump"); },200);
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

  function recalc(){
    var r;
    try{ r=activeTool.calc(state[activeTool.id]); }
    catch(e){ r=msgResult("CALCULATION ERROR"); }
    lastResult=r;
    r.stats.forEach(function(st,i){ setStat(i,st[0],st[1],st[2]); });
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
    var lines=["IrisTool — Health Calculators","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Estimates only — not medical advice.");
    return lines.join("\n");
  }

  /* real HTML table — pastes as a table into Word / Excel / Docs / email */
  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Health Calculators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Estimates only — not medical advice.</p></div>';
    return h;
  }

  /* ---- COPY: table first (HTML), TSV as plain text ---- */
  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var rows=resultsRows();
    if(!rows.length){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    var tsv=buildTSV(rows);
    var html=buildTableHTML(rows);

    /* fallback: select a hidden table and let execCommand copy it as HTML */
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
            /* some browsers allow only text — retry with TSV */
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
    a.href=url; a.download="IrisTool-health-results.txt";
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
