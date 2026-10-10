
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
    burger.focus(); /* return focus to the opener for keyboard users */
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
     LIVE FINANCE CALCULATORS (all 12 tools)
     ================================================================ */
  function today0(){ var t=new Date(); t.setHours(0,0,0,0); return t; }
  function fd(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
  function addM(d,n){ var x=new Date(d.getTime()); x.setMonth(x.getMonth()+n); return x; }
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function num(s){ var n=parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function money(n){
    if(!isFinite(n)) return "—";
    var s = n<0 ? "−" : "";
    return s+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  var QUART=["#EFEFE9","#C9C9C0","#6E86FF","#0033FF"];
  function quartSegs(){ return [{c:QUART[0],w:25},{c:QUART[1],w:25},{c:QUART[2],w:25},{c:QUART[3],w:25}]; }
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
  function shareGauge(share,label){
    return {label:label,pos:clamp(share*100,0,100),segs:quartSegs(),
      legend:[{c:QUART[0],l:"LOW",v:"0–25%"},{c:QUART[1],l:"MID",v:"25–50%"},{c:QUART[2],l:"HIGH",v:"50–75%"},{c:QUART[3],l:"MOSTLY",v:"75%+"}]};
  }

  /* ---------------- 01 DISCOUNT ---------------- */
  function calcDiscount(s){
    var p=num(s.price), d=num(s.off), t=num(s.tax)||0;
    if(p==null||p<=0) return msgResult("ENTER ORIGINAL PRICE");
    if(d==null||d<0||d>100) return msgResult("DISCOUNT MUST BE 0–100%");
    var disc=p*d/100, after=p-disc, taxAmt=after*t/100, final=after+taxAmt;
    var eff=(1-final/p)*100;
    return {
      stats:[
        ["Original price", money(p),""],
        ["Discount", "−"+money(disc), d+"% off"],
        ["After discount", money(after),""],
        ["Sales tax", "+"+money(taxAmt), t+"%"],
        ["Final price", money(final),""],
        ["Effective discount", eff.toFixed(1)+"%","final vs original"],
        ["You pay", (final/p*100).toFixed(1)+"%","of sticker price"],
        ["Tax applied on", "Discounted","price, not original"]
      ],
      gauge:{
        label:"DISCOUNT SCALE — "+d+"% OFF",
        pos:clamp(d,0,100),segs:quartSegs(),
        legend:quartLegend("of price")
      }
    };
  }

  /* ---------------- 02 VAT ---------------- */
  function calcVAT(s){
    var a=num(s.amount), r=num(s.rate), q=num(s.qty)||1;
    if(a==null||a<=0) return msgResult("ENTER AN AMOUNT");
    if(r==null||r<0) return msgResult("ENTER VAT RATE");
    if(q<=0) q=1;
    var net,vat,gross;
    if(s.mode==="remove"){
      gross=a; net=gross/(1+r/100); vat=gross-net;
    } else {
      net=a; vat=net*r/100; gross=net+vat;
    }
    return {
      stats:[
        ["Net amount", money(net),"before VAT"],
        ["VAT rate", r+"%",""],
        ["VAT amount", money(vat),""],
        ["Gross amount", money(gross),"VAT included"],
        ["Total net ×"+q, money(net*q),""],
        ["Total VAT ×"+q, money(vat*q),""],
        ["Total gross ×"+q, money(gross*q),""],
        ["Multiplier", (1+r/100).toFixed(2)+"×","net → gross"]
      ],
      gauge:{
        label:"VAT RATE SCALE — "+r+"%",
        pos:clamp(r/30*100,0,100),
        segs:[{c:"#C9C9C0",w:16.7},{c:"#6E86FF",w:33.3},{c:"#0033FF",w:33.3},{c:"#141414",w:16.7}],
        legend:[{c:"#C9C9C0",l:"LOW",v:"0–5%"},{c:"#6E86FF",l:"MID",v:"5–15%"},{c:"#0033FF",l:"HIGH",v:"15–25%"},{c:"#141414",l:"TOP",v:"25%+"}]
      }
    };
  }

  /* ---------------- 03 TIP ---------------- */
  function calcTip(s){
    var b=num(s.bill), t=num(s.tip), p=num(s.people)||1;
    if(b==null||b<=0) return msgResult("ENTER BILL AMOUNT");
    if(t==null||t<0) return msgResult("ENTER TIP PERCENTAGE");
    if(p<1) p=1; p=Math.round(p);
    var tip=b*t/100, total=b+tip;
    return {
      stats:[
        ["Bill amount", money(b),""],
        ["Tip", t+"%",""],
        ["Tip amount", money(tip),""],
        ["Total", money(total),"bill + tip"],
        ["Each pays", money(total/p), p+" "+(p===1?"person":"people")],
        ["Tip per person", money(tip/p),""],
        ["15% / 20%", money(b*0.15)+" / "+money(b*0.2),"quick benchmarks"],
        ["No-tip share", money(b/p),"just the bill"]
      ],
      gauge:{
        label:"TIP SCALE — "+t+"%",
        pos:clamp(t/40*100,0,100),
        segs:[{c:"#C9C9C0",w:25},{c:"#6E86FF",w:12.5},{c:"#0033FF",w:12.5},{c:"#141414",w:50}],
        legend:[{c:"#C9C9C0",l:"LOW",v:"0–10%"},{c:"#6E86FF",l:"STANDARD",v:"10–15%"},{c:"#0033FF",l:"GENEROUS",v:"15–20%"},{c:"#141414",l:"GREAT",v:"20%+"}]
      }
    };
  }

  /* ---------------- 04 SPLIT BILL ---------------- */
  function calcSplit(s){
    var b=num(s.total), p=num(s.people), t=num(s.tip)||0;
    if(b==null||b<=0) return msgResult("ENTER BILL TOTAL");
    if(p==null||p<1) return msgResult("ENTER NUMBER OF PEOPLE");
    p=Math.round(p);
    var tip=b*t/100, grand=b+tip;
    return {
      stats:[
        ["Bill", money(b),""],
        ["People", String(p),""],
        ["Tip", money(tip), t+"%"],
        ["Grand total", money(grand),""],
        ["Each pays", money(grand/p),"with tip"],
        ["Bill per person", money(b/p),"before tip"],
        ["Tip per person", money(tip/p),""],
        ["Share of bill", (100/p).toFixed(1)+"%","per person"]
      ],
      gauge:{
        label:"SHARE PER PERSON — "+(100/p).toFixed(1)+"% OF BILL",
        pos:clamp(100/p,0,100),segs:quartSegs(),
        legend:quartLegend("of total")
      }
    };
  }

  /* ---------------- 05 LOAN ---------------- */
  function pmt(P,r,n){ return r===0 ? P/n : P*r/(1-Math.pow(1+r,-n)); }
  function calcLoan(s){
    var P=num(s.amount), R=num(s.rate), Y=num(s.years);
    if(P==null||P<=0) return msgResult("ENTER LOAN AMOUNT");
    if(R==null||R<0) return msgResult("ENTER INTEREST RATE");
    if(Y==null||Y<=0) return msgResult("ENTER TERM IN YEARS");
    var r=R/100/12, n=Math.round(Y*12);
    var pay=pmt(P,r,n), total=pay*n, interest=total-P;
    return {
      stats:[
        ["Monthly payment", money(pay),"for "+n+" months"],
        ["Total payment", money(total),""],
        ["Total interest", money(interest),""],
        ["Interest share", (interest/total*100).toFixed(1)+"%","of all payments"],
        ["Payments", String(n),"monthly"],
        ["Payoff", fd(addM(today0(),n)),"last payment"],
        ["Principal", money(P),""],
        ["Annual rate", R+"%","APR"]
      ],
      gauge:shareGauge(interest/total,"INTEREST SHARE — "+(interest/total*100).toFixed(1)+"% OF TOTAL PAYMENTS")
    };
  }

  /* ---------------- 06 EMI ---------------- */
  function calcEMI(s){
    var P=num(s.amount), R=num(s.rate), N=num(s.months);
    if(P==null||P<=0) return msgResult("ENTER LOAN AMOUNT");
    if(R==null||R<0) return msgResult("ENTER INTEREST RATE");
    if(N==null||N<=0) return msgResult("ENTER TERM IN MONTHS");
    N=Math.round(N);
    var r=R/100/12, emi=pmt(P,r,N), total=emi*N, interest=total-P;
    var firstInt=P*r, firstPrin=emi-firstInt;
    return {
      stats:[
        ["EMI", money(emi),"per month"],
        ["Total interest", money(interest),""],
        ["Total payment", money(total),""],
        ["Interest share", (interest/total*100).toFixed(1)+"%","of all payments"],
        ["Month 1 · interest", money(firstInt),""],
        ["Month 1 · principal", money(firstPrin),""],
        ["Cost per day", money(emi*12/365),"averaged"],
        ["Term", N+" months",""]
      ],
      gauge:shareGauge(interest/total,"INTEREST SHARE — "+(interest/total*100).toFixed(1)+"% OF TOTAL PAYMENTS")
    };
  }

  /* ---------------- 07 COMPOUND INTEREST ---------------- */
  function calcCompound(s){
    var P=num(s.principal), R=num(s.rate), Y=num(s.years), C=num(s.contrib)||0;
    if(P==null||P<0) return msgResult("ENTER PRINCIPAL");
    if(R==null||R<0) return msgResult("ENTER RATE");
    if(Y==null||Y<=0) return msgResult("ENTER YEARS");
    var m=parseInt(s.freq,10)||12, N=Math.round(Y*12);
    var i=Math.pow(1+(R/100)/m, m/12)-1;
    var g=Math.pow(1+i,N);
    var fv=P*g + (i>0 ? C*(g-1)/i : C*N);
    var put=P+C*N, earned=fv-put;
    var eff=(Math.pow(1+(R/100)/m,m)-1)*100;
    return {
      stats:[
        ["Final balance", money(fv),"after "+Y+" yr"],
        ["Principal", money(P),"starting amount"],
        ["Contributed", money(C*N), C>0?money(C)+" / month":"no additions"],
        ["Interest earned", money(earned),""],
        ["Growth", (fv/Math.max(put,0.01)).toFixed(2)+"×","on money put in"],
        ["Effective rate", eff.toFixed(2)+"%","per year"],
        ["Nominal rate", R+"%",""],
        ["Compounding", m+"× / yr",""]
      ],
      gauge:shareGauge(fv>0?earned/fv:0,"INTEREST SHARE — "+(fv>0?(earned/fv*100).toFixed(1):0)+"% OF FINAL BALANCE")
    };
  }

  /* ---------------- 08 SIMPLE INTEREST ---------------- */
  function calcInterest(s){
    var P=num(s.principal), R=num(s.rate), T=num(s.years);
    if(P==null||P<=0) return msgResult("ENTER PRINCIPAL");
    if(R==null||R<0) return msgResult("ENTER RATE");
    if(T==null||T<=0) return msgResult("ENTER DURATION");
    var I=P*(R/100)*T, total=P+I;
    return {
      stats:[
        ["Principal", money(P),""],
        ["Annual rate", R+"%","simple"],
        ["Duration", T+" years",""],
        ["Interest earned", money(I),"P × r × t"],
        ["Total at end", money(total),""],
        ["Interest per year", money(I/T),""],
        ["Interest per month", money(I/(T*12)),""],
        ["Doubles in", (72/Math.max(R,0.01)).toFixed(1)+" yr","rule of 72"]
      ],
      gauge:shareGauge(I/total,"INTEREST SHARE — "+(I/total*100).toFixed(1)+"% OF TOTAL")
    };
  }

  /* ---------------- 09 SAVINGS ---------------- */
  function calcSavings(s){
    var P=num(s.start)||0, C=num(s.monthly), R=num(s.rate), Y=num(s.years);
    if(C==null||C<0) return msgResult("ENTER MONTHLY DEPOSIT");
    if(R==null||R<0) return msgResult("ENTER RATE");
    if(Y==null||Y<=0) return msgResult("ENTER YEARS");
    if(P<0) P=0;
    var i=R/1200, N=Math.round(Y*12);
    var fv;
    if(i>0){ var g=Math.pow(1+i,N); fv=P*g+C*(g-1)/i; }
    else fv=P+C*N;
    var deposits=P+C*N, earned=fv-deposits;
    return {
      stats:[
        ["Final balance", money(fv),"after "+Y+" yr"],
        ["Total deposits", money(deposits),""],
        ["Interest earned", money(earned),""],
        ["Interest share", (fv>0?(earned/fv*100).toFixed(1):0)+"%","of final balance"],
        ["Starting balance", money(P),""],
        ["Monthly deposit", money(C),""],
        ["Deposits made", String(N),"monthly"],
        ["Growth", (fv/Math.max(deposits,0.01)).toFixed(2)+"×",""]
      ],
      gauge:shareGauge(fv>0?earned/fv:0,"INTEREST SHARE — "+(fv>0?(earned/fv*100).toFixed(1):0)+"% OF FINAL BALANCE")
    };
  }

  /* ---------------- 10 INFLATION ---------------- */
  function calcInflation(s){
    var A=num(s.amount), R=num(s.rate), T=num(s.years);
    if(A==null||A<=0) return msgResult("ENTER AN AMOUNT");
    if(R==null||R<=0) return msgResult("ENTER INFLATION RATE");
    if(T==null||T<=0) return msgResult("ENTER YEARS");
    var g=Math.pow(1+R/100,T);
    var future=A*g, power=A/g;
    var halves=Math.log(2)/Math.log(1+R/100);
    return {
      stats:[
        ["Amount today", money(A),""],
        ["Annual inflation", R+"%",""],
        ["Period", T+" years",""],
        ["Future price", money(future),"what it will cost"],
        ["Price increase", "+"+money(future-A),""],
        ["Purchasing power", money(power),"today's money, then"],
        ["Multiplier", g.toFixed(2)+"×","prices grow"],
        ["Money halves in", halves.toFixed(1)+" yr","ln2 ÷ ln(1+r)"]
      ],
      gauge:{
        label:"PRICE MULTIPLIER — ×"+g.toFixed(2)+" IN "+T+" YEARS",
        pos:clamp((g-1)/2*100,0,100),
        segs:quartSegs(),
        legend:[{c:QUART[0],l:"×1–1.5",v:""},{c:QUART[1],l:"×1.5–2",v:""},{c:QUART[2],l:"×2–2.5",v:""},{c:QUART[3],l:"×2.5–3",v:""}]
      }
    };
  }

  /* ---------------- 11 ROI ---------------- */
  function calcROI(s){
    var I=num(s.initial), F=num(s.final), Y=num(s.years)||0;
    if(I==null||I<=0) return msgResult("ENTER INITIAL INVESTMENT");
    if(F==null||F<0) return msgResult("ENTER FINAL VALUE");
    var profit=F-I, roi=profit/I*100;
    var ann = (Y>0 && F>0) ? (Math.pow(F/I,1/Y)-1)*100 : null;
    return {
      stats:[
        ["Investment", money(I),"initial"],
        ["Final value", money(F),""],
        ["Net profit", money(profit), profit>=0?"gain":"loss"],
        ["ROI", roi.toFixed(2)+"%","total return"],
        ["Annualized", ann==null?"—":ann.toFixed(2)+"%", Y>0?"geometric, "+Y+" yr":"enter years held"],
        ["Multiple", (F/I).toFixed(2)+"×",""],
        ["Years held", Y>0?String(Y):"—",""],
        ["Doubles in", ann!=null&&ann>0?(72/ann).toFixed(1)+" yr":"—","rule of 72"]
      ],
      gauge:{
        label:"ROI SCALE — "+roi.toFixed(1)+"% TOTAL RETURN",
        pos:clamp((roi+50)/2,0,100),
        segs:[{c:"#C40000",w:25},{c:"#C9C9C0",w:12.5},{c:"#6E86FF",w:25},{c:"#0033FF",w:37.5}],
        legend:[{c:"#C40000",l:"LOSS",v:"<0%"},{c:"#C9C9C0",l:"0–25%",v:""},{c:"#6E86FF",l:"25–75%",v:""},{c:"#0033FF",l:"75%+",v:""}]
      }
    };
  }

  /* ---------------- 12 BREAK-EVEN ---------------- */
  function calcBE(s){
    var FC=num(s.fixed), P=num(s.price), VC=num(s.varc), TP=num(s.target)||0;
    if(FC==null||FC<0) return msgResult("ENTER FIXED COSTS");
    if(P==null||P<=0) return msgResult("ENTER PRICE PER UNIT");
    if(VC==null||VC<0) return msgResult("ENTER VARIABLE COST");
    var margin=P-VC;
    if(margin<=0) return msgResult("PRICE MUST EXCEED VARIABLE COST");
    var units=FC/margin, rev=units*P;
    var cmr=margin/P*100, vcr=VC/P*100;
    var tu=(FC+TP)/margin;
    return {
      stats:[
        ["Break-even units", fmt(Math.ceil(units)),"units to sell"],
        ["Break-even revenue", money(rev),""],
        ["Margin per unit", money(margin),"price − variable"],
        ["Margin ratio", cmr.toFixed(1)+"%","contribution"],
        ["Fixed costs", money(FC),""],
        ["Price per unit", money(P),""],
        ["Variable cost", money(VC), vcr.toFixed(1)+"% of price"],
        ["For target profit", fmt(Math.ceil(tu))+" units", TP>0?"target "+money(TP):"target 0"]
      ],
      gauge:{
        label:"CONTRIBUTION MARGIN — "+cmr.toFixed(1)+"% OF PRICE",
        pos:clamp(cmr,0,100),segs:quartSegs(),
        legend:quartLegend("margin ratio")
      }
    };
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS = [
    { id:"discount", tab:"Discount", name:"Discount Calculator",
      def:function(){ return {price:"120",off:"25",tax:"8"}; },
      fields:[
        {k:"price",label:"Original price ($)",type:"number",min:0},
        {k:"off",label:"Discount (%)",type:"number",min:0,max:100},
        {k:"tax",label:"Sales tax (%)",type:"number",min:0,max:50}
      ], calc:calcDiscount },
    { id:"vat", tab:"VAT", name:"VAT Calculator",
      def:function(){ return {mode:"add",amount:"500",rate:"20",qty:"1"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["add","Add VAT"],["remove","Remove VAT"]]},
        {k:"amount",label:function(s){ return s.mode==="remove"?"Gross amount — VAT included ($)":"Net amount — before VAT ($)"; },type:"number",min:0},
        {k:"rate",label:"VAT rate (%)",type:"number",min:0,max:60},
        {k:"qty",label:"Quantity",type:"number",min:1}
      ], calc:calcVAT },
    { id:"tip", tab:"Tip", name:"Tip Calculator",
      def:function(){ return {bill:"80",tip:"15",people:"2"}; },
      fields:[
        {k:"bill",label:"Bill amount ($)",type:"number",min:0},
        {k:"tip",label:"Tip (%)",type:"number",min:0,max:100},
        {k:"people",label:"Number of people",type:"number",min:1}
      ], calc:calcTip },
    { id:"split", tab:"Split Bill", name:"Split Bill Calculator",
      def:function(){ return {total:"180",people:"4",tip:"10"}; },
      fields:[
        {k:"total",label:"Bill total ($)",type:"number",min:0},
        {k:"people",label:"Number of people",type:"number",min:1},
        {k:"tip",label:"Tip (%)",type:"number",min:0,max:100}
      ], calc:calcSplit },
    { id:"loan", tab:"Loan", name:"Loan Calculator",
      def:function(){ return {amount:"25000",rate:"6.5",years:"5"}; },
      fields:[
        {k:"amount",label:"Loan amount ($)",type:"number",min:0},
        {k:"rate",label:"Annual rate — APR (%)",type:"number",min:0},
        {k:"years",label:"Term (years)",type:"number",min:0}
      ], calc:calcLoan },
    { id:"emi", tab:"EMI", name:"EMI Calculator",
      def:function(){ return {amount:"12000",rate:"9",months:"24"}; },
      fields:[
        {k:"amount",label:"Loan amount ($)",type:"number",min:0},
        {k:"rate",label:"Annual rate (%)",type:"number",min:0},
        {k:"months",label:"Term (months)",type:"number",min:1}
      ], calc:calcEMI },
    { id:"compound", tab:"Compound", name:"Compound Interest Calculator",
      def:function(){ return {principal:"10000",rate:"7",years:"10",freq:"12",contrib:"100"}; },
      fields:[
        {k:"principal",label:"Principal ($)",type:"number",min:0},
        {k:"rate",label:"Annual rate (%)",type:"number",min:0},
        {k:"years",label:"Years",type:"number",min:0},
        {k:"freq",label:"Compounding",type:"select",opts:[
          ["365","Daily (365×/yr)"],["12","Monthly (12×/yr)"],
          ["4","Quarterly (4×/yr)"],["2","Semi-annual (2×/yr)"],["1","Annual (1×/yr)"]]},
        {k:"contrib",label:"Monthly contribution ($)",type:"number",min:0,full:true}
      ], calc:calcCompound },
    { id:"interest", tab:"Interest", name:"Interest Calculator",
      def:function(){ return {principal:"5000",rate:"5",years:"3"}; },
      fields:[
        {k:"principal",label:"Principal ($)",type:"number",min:0},
        {k:"rate",label:"Annual rate (%)",type:"number",min:0},
        {k:"years",label:"Duration (years)",type:"number",min:0}
      ], calc:calcInterest },
    { id:"savings", tab:"Savings", name:"Savings Calculator",
      def:function(){ return {start:"1000",monthly:"200",rate:"4",years:"10"}; },
      fields:[
        {k:"start",label:"Starting balance ($)",type:"number",min:0},
        {k:"monthly",label:"Monthly deposit ($)",type:"number",min:0},
        {k:"rate",label:"Annual rate (%)",type:"number",min:0},
        {k:"years",label:"Years",type:"number",min:0}
      ], calc:calcSavings },
    { id:"inflation", tab:"Inflation", name:"Inflation Calculator",
      def:function(){ return {amount:"1000",rate:"3",years:"20"}; },
      fields:[
        {k:"amount",label:"Amount today ($)",type:"number",min:0},
        {k:"rate",label:"Annual inflation (%)",type:"number",min:0},
        {k:"years",label:"Years",type:"number",min:0}
      ], calc:calcInflation },
    { id:"roi", tab:"ROI", name:"ROI Calculator",
      def:function(){ return {initial:"10000",final:"13500",years:"3"}; },
      fields:[
        {k:"initial",label:"Initial investment ($)",type:"number",min:0},
        {k:"final",label:"Final value ($)",type:"number",min:0},
        {k:"years",label:"Years held",type:"number",min:0}
      ], calc:calcROI },
    { id:"breakeven", tab:"Break-even", name:"Break-even Calculator",
      def:function(){ return {fixed:"10000",price:"50",varc:"30",target:"5000"}; },
      fields:[
        {k:"fixed",label:"Fixed costs ($)",type:"number",min:0},
        {k:"price",label:"Price per unit ($)",type:"number",min:0},
        {k:"varc",label:"Variable cost per unit ($)",type:"number",min:0},
        {k:"target",label:"Target profit ($)",type:"number",min:0}
      ], calc:calcBE }
  ];

  var state = {};
  TOOLS.forEach(function(t){ state[t.id] = t.def(); });
  var activeTool = TOOLS[0];
  var lastResult = null;

  var tabsEl = $("#t-tabs"), formEl = $("#calc-form");
  var gSegs = $("#g-segs"), gMark = $("#g-mark"), gLegend = $("#g-legend"), gLabel = $("#gauge-label");

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var labTxt = typeof f.label==="function" ? f.label(s) : f.label;
    var lab='<label class="f-label" for="'+id+'">'+labTxt+'</label>';
    var ctrl;
    if(f.type==="seg"){
      lab='<span class="f-label">'+labTxt+'</span>';
      ctrl='<div class="seg" data-k="'+f.k+'" role="group" aria-label="'+labTxt+'">'+f.opts.map(function(o){
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
    if(k==="mode") renderForm(); /* VAT label depends on direction */
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
    var lines=["IrisTool — Finance Calculators","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Estimates only — not financial advice.");
    return lines.join("\n");
  }

  /* real HTML table — pastes as a table into Word / Excel / Docs / email */
  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Finance Calculators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    h+='<p style="margin:8px 0 0;font-size:11px;color:#9A9A92">Estimates only — not financial advice.</p></div>';
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
    a.href=url; a.download="IrisTool-finance-results.txt";
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
