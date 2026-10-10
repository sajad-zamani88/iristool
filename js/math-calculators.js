
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
     LIVE MATH CALCULATORS (all 7 tools)
     ================================================================ */
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function fx(n,d){ return Number(n).toFixed(d==null?2:d); }
  function num(s){ var n=parseFloat(s); return isFinite(n)?n:null; }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function fmtSmart(n){
    if(n===0) return "0";
    var a=Math.abs(n);
    if(a>=1e12||a<1e-9) return n.toExponential(6);
    return String(Number(n.toFixed(9)));
  }
  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a||1; }

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

  /* ---------------- 01 PERCENTAGE ---------------- */
  function calcPercent(s){
    var p=num(s.pct), y=num(s.of);
    if(p==null) return msgResult("ENTER A PERCENTAGE");
    if(y==null) return msgResult("ENTER A VALUE");
    var r=y*p/100;
    return {
      stats:[
        ["Result", fmtSmart(r), p+"% of "+fmtSmart(y)],
        ["Formula", "y × p ÷ 100",""],
        ["Y + "+p+"%", fmtSmart(y+r),"add"],
        ["Y − "+p+"%", fmtSmart(y-r),"subtract"],
        ["Result ÷ Y", y!==0?fmtSmart(r/y):"—","ratio"],
        ["Y ÷ Result", r!==0?fmtSmart(y/r):"—","inverse ratio"],
        ["As fraction", p+"/100",""],
        ["Doubled", fmtSmart(r*2),fmtSmart(y*2)+" at 2×Y"]
      ],
      gauge:{
        label:"PERCENTAGE SCALE — "+p+"%",
        pos:clamp(Math.abs(p),0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75–100%")
      }
    };
  }

  /* ---------------- 02 PERCENTAGE INCREASE ---------------- */
  function calcInc(s){
    var a=num(s.from), b=num(s.to);
    if(a==null||b==null) return msgResult("ENTER BOTH VALUES");
    if(a<=0) return msgResult("OLD VALUE MUST BE > 0");
    var chg=b-a, pctv=chg/a*100, mult=b/a;
    return {
      stats:[
        ["From (old)", fmtSmart(a),""],
        ["To (new)", fmtSmart(b),""],
        ["Change", (chg>=0?"+":"−")+fmtSmart(Math.abs(chg)), chg>=0?"growth":"actually a decrease"],
        ["Increase", (pctv>=0?"+":"")+fx(pctv,2)+" %","vs old value"],
        ["Multiplier", fx(mult,4)+"×","new ÷ old"],
        ["To go back", a!==0&&b!==0?"−"+fx((b-a)/b*100,2)+" %":"—","from new value"],
        ["Same growth again", fmtSmart(b*mult),"projected"],
        ["Basis points", fmt(Math.round(pctv*100))+" bp",""]
      ],
      gauge:{
        label:"INCREASE SCALE — "+(pctv>=0?"+":"")+fx(pctv,1)+"%",
        pos:clamp(pctv/200*100+0,0,100),
        segs:[{c:"#C9C9C0",w:12.5},{c:"#6E86FF",w:12.5},{c:"#0033FF",w:25},{c:"#141414",w:50}],
        legend:[{c:"#C9C9C0",l:"0–25%",v:""},{c:"#6E86FF",l:"25–50%",v:""},{c:"#0033FF",l:"50–100%",v:""},{c:"#141414",l:"100–200%",v:""}]
      }
    };
  }

  /* ---------------- 03 PERCENTAGE DECREASE ---------------- */
  function calcDec(s){
    var a=num(s.from), b=num(s.to);
    if(a==null||b==null) return msgResult("ENTER BOTH VALUES");
    if(a<=0) return msgResult("ORIGINAL VALUE MUST BE > 0");
    var chg=a-b, pctv=chg/a*100, mult=b/a;
    return {
      stats:[
        ["From (original)", fmtSmart(a),""],
        ["To (new)", fmtSmart(b),""],
        ["Drop", (chg>=0?"−":"+")+fmtSmart(Math.abs(chg)), chg>=0?"decline":"actually a rise"],
        ["Decrease", (pctv>=0?"−":"+")+fx(Math.abs(pctv),2)+" %","vs original"],
        ["Remaining", fx(mult*100,2)+" %","of original"],
        ["Multiplier", fx(mult,4)+"×","new ÷ original"],
        ["To recover", b>0?"+"+fx(chg/b*100,2)+" %":"—","back to original"],
        ["Same drop again", fmtSmart(b*mult),"projected"]
      ],
      gauge:{
        label:"DECREASE SCALE — "+(pctv>=0?"−":"")+fx(Math.abs(pctv),1)+"%",
        pos:clamp(pctv/100*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–25%","25–50%","50–75%","75–100%")
      }
    };
  }

  /* ---------------- 04 SCIENTIFIC — safe expression parser ---------------- */
  var FUNCS={sin:1,cos:1,tan:1,asin:1,acos:1,atan:1,log:1,ln:1,sqrt:1,abs:1};
  function sciEval(expr,deg){
    var src=String(expr)
      .replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-")
      .replace(/π/g," pi ").replace(/√/g,"sqrt").replace(/\s+/g,"");
    if(!src) throw "EMPTY";
    /* tokenize */
    var tokens=[],i=0;
    while(i<src.length){
      var c=src[i];
      if(/[0-9.]/.test(c)){
        var j=i; while(j<src.length && /[0-9.]/.test(src[j])) j++;
        var val=parseFloat(src.slice(i,j));
        if(!isFinite(val)) throw "BAD NUMBER";
        tokens.push({t:"num",v:val}); i=j; continue;
      }
      if(/[a-z]/i.test(c)){
        var k=i; while(k<src.length && /[a-z]/i.test(src[k])) k++;
        var name=src.slice(i,k).toLowerCase();
        if(name==="pi") tokens.push({t:"num",v:Math.PI});
        else if(name==="e") tokens.push({t:"num",v:Math.E});
        else if(FUNCS[name]) tokens.push({t:"func",v:name});
        else throw "UNKNOWN NAME";
        i=k; continue;
      }
      if("+-*/^%(),".indexOf(c)>=0){ tokens.push({t:c}); i++; continue; }
      throw "BAD CHARACTER";
    }
    if(!tokens.length) throw "EMPTY";
    /* apply bare functions to a following number: sqrt16 -> sqrt(16) */
    var tk2=[];
    for(var x=0;x<tokens.length;x++){
      var t0=tokens[x];
      if(t0.t==="func" && tokens[x+1] && tokens[x+1].t==="num"){
        tk2.push({t:"app",f:t0.v,v:tokens[x+1].v}); x++; continue;
      }
      tk2.push(t0);
    }
    tokens=tk2;
    /* shunting-yard */
    var PREC={"+":1,"-":1,"*":2,"/":2,"neg":3,"^":4};
    var RIGHT={"^":true,"neg":true};
    var out=[],stack=[],prevKind=null; /* "val" | other */
    for(var q=0;q<tokens.length;q++){
      var tk=tokens[q];
      if(tk.t==="num"){ out.push(tk); prevKind="val"; continue; }
      if(tk.t==="app"){
        var r0=applyFunc(tk.f,tk.v,deg);
        out.push({t:"num",v:r0}); prevKind="val"; continue;
      }
      if(tk.t==="func"){ stack.push(tk); prevKind="op"; continue; }
      if(tk.t==="%"){ out.push({t:"op",v:"pct"}); prevKind="val"; continue; }
      if(tk.t==="("){ stack.push(tk); prevKind="op"; continue; }
      if(tk.t===")"){
        while(stack.length && stack[stack.length-1].t!=="(") out.push(stack.pop());
        if(!stack.length) throw "UNBALANCED PARENTHESES";
        stack.pop();
        if(stack.length && stack[stack.length-1].t==="func") out.push(stack.pop());
        prevKind="val"; continue;
      }
      /* binary/unary operator */
      var op=tk.t;
      if(op==="-" && prevKind!=="val"){ op="neg"; }
      while(stack.length){
        var top=stack[stack.length-1];
        if(top.t==="(") break;
        if(top.t==="func"){ out.push(stack.pop()); continue; }
        var tv=top.v||top.t;
        if(PREC[tv]>PREC[op] || (PREC[tv]===PREC[op] && !RIGHT[op])) out.push(stack.pop());
        else break;
      }
      stack.push({t:"op",v:op});
      prevKind="op";
    }
    while(stack.length){
      var left=stack.pop();
      if(left.t==="(") throw "UNBALANCED PARENTHESES";
      out.push(left);
    }
    /* evaluate RPN */
    var st=[];
    for(var w=0;w<out.length;w++){
      var o=out[w];
      if(o.t==="num"){ st.push(o.v); continue; }
      if(o.t==="op"){
        if(o.v==="pct"){ if(!st.length) throw "SYNTAX"; st.push(st.pop()/100); continue; }
        if(o.v==="neg"){ if(!st.length) throw "SYNTAX"; st.push(-st.pop()); continue; }
        if(st.length<2) throw "SYNTAX";
        var B=st.pop(), A=st.pop();
        if(o.v==="+") st.push(A+B);
        else if(o.v==="-") st.push(A-B);
        else if(o.v==="*") st.push(A*B);
        else if(o.v==="/") st.push(A/B);
        else if(o.v==="^") st.push(Math.pow(A,B));
        continue;
      }
      if(o.t==="func"){
        if(!st.length) throw "SYNTAX";
        st.push(applyFunc(o.v,st.pop(),deg));
      }
    }
    if(st.length!==1) throw "SYNTAX";
    var res=st[0];
    if(!isFinite(res)) throw "DIVISION BY ZERO OR OVERFLOW";
    if(isNaN(res)) throw "NOT A REAL NUMBER";
    return res;
  }
  function applyFunc(f,x,deg){
    var D2R=Math.PI/180, R2D=180/Math.PI;
    switch(f){
      case "sin": return Math.sin(deg?x*D2R:x);
      case "cos": return Math.cos(deg?x*D2R:x);
      case "tan": return Math.tan(deg?x*D2R:x);
      case "asin": return deg?Math.asin(x)*R2D:Math.asin(x);
      case "acos": return deg?Math.acos(x)*R2D:Math.acos(x);
      case "atan": return deg?Math.atan(x)*R2D:Math.atan(x);
      case "log": return Math.log10(x);
      case "ln":  return Math.log(x);
      case "sqrt":return Math.sqrt(x);
      case "abs": return Math.abs(x);
    }
    throw "UNKNOWN FUNCTION";
  }
  function factorial(n){
    if(n<0||n>170||n%1!==0) return null;
    var r=1; for(var i=2;i<=n;i++) r*=i; return r;
  }
  function calcSci(s){
    var expr=String(s.expr||"").trim();
    if(!expr) return msgResult("ENTER AN EXPRESSION");
    var deg=s.mode!=="rad";
    var r;
    try{ r=sciEval(expr,deg); }
    catch(e){ return msgResult(typeof e==="string"?e:"INVALID EXPRESSION"); }
    var sq=r*r, root=r>=0?Math.sqrt(r):null, inv=r!==0?1/r:null;
    var fact=factorial(r);
    return {
      stats:[
        ["Result", fmtSmart(r),""],
        ["Expression", expr.length>22?expr.slice(0,22)+"…":expr, deg?"DEG mode":"RAD mode"],
        ["x²", fmtSmart(sq),""],
        ["√x", root==null?"—":fmtSmart(root), r>=0?"":"x must be ≥ 0"],
        ["1/x", inv==null?"—":fmtSmart(inv), r!==0?"":"÷0 undefined"],
        ["x!", fact==null?"—":fmtSmart(fact), fact==null?"integer 0–170 only":""],
        ["Scientific", r.toExponential(4),""],
        ["Angle mode", deg?"DEG":"RAD","toggle above"]
      ],
      gauge:{
        label:"MAGNITUDE — RESULT IS "+fmtSmart(r),
        pos:clamp(Math.log10(Math.abs(r)+1)/9*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("≤1","10³","10⁶","10⁹")
      }
    };
  }

  /* ---------------- 05 FRACTION ---------------- */
  var OP_SYM={add:"+",sub:"−",mul:"×",div:"÷"};
  function calcFraction(s){
    var n1=num(s.n1), d1=num(s.d1), n2=num(s.n2), d2=num(s.d2);
    if(n1==null||d1==null||n2==null||d2==null) return msgResult("ENTER ALL FOUR NUMBERS");
    if(d1===0||d2===0) return msgResult("DENOMINATORS MUST NOT BE 0");
    n1=Math.round(n1); d1=Math.round(d1); n2=Math.round(n2); d2=Math.round(d2);
    if(d1===0||d2===0) return msgResult("DENOMINATORS MUST NOT BE 0");
    var rn,rd;
    if(s.op==="add"){ rn=n1*d2+n2*d1; rd=d1*d2; }
    else if(s.op==="sub"){ rn=n1*d2-n2*d1; rd=d1*d2; }
    else if(s.op==="mul"){ rn=n1*n2; rd=d1*d2; }
    else { if(n2===0) return msgResult("CANNOT DIVIDE BY 0/…"); rn=n1*d2; rd=d1*n2; }
    if(rd<0){ rn=-rn; rd=-rd; }
    var g=gcd(rn,rd), sn=rn/g, sd=rd/g;
    var dec=sd!==0?sn/sd:NaN;
    var mixed="—";
    if(sd!==0 && Math.abs(sn)>=sd){
      var whole=Math.trunc(sn/sd), rem=Math.abs(sn%sd);
      mixed=whole+(rem?" "+rem+"/"+sd:"");
    }
    var label=n1+"/"+d1+" "+OP_SYM[s.op]+" "+n2+"/"+d2;
    return {
      stats:[
        ["Result", sn+"/"+sd, g>1?"reduced by gcd "+g:"lowest terms"],
        ["Before reduce", rn+"/"+rd,"raw"],
        ["Decimal", fx(dec,6),""],
        ["Mixed number", mixed,""],
        ["Numerator", fmt(sn),""],
        ["Denominator", fmt(sd),""],
        ["Fraction 1", fx(n1/d1,6), n1+"/"+d1],
        ["Fraction 2", fx(n2/d2,6), n2+"/"+d2+" · "+label]
      ],
      gauge:{
        label:"RESULT VALUE — "+fx(dec,4)+" ON A 0–10 SCALE",
        pos:clamp(Math.abs(dec)/10*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("0–2.5","2.5–5","5–7.5","7.5–10")
      }
    };
  }

  /* ---------------- 06 BINARY ---------------- */
  function binStats(v){
    var bin=v.toString(2), hex=v.toString(16).toUpperCase(), oct=v.toString(8);
    var bits=bin.length;
    var k=Math.max(0,Math.floor(Math.log2(Math.max(v,1))));
    return {
      stats:[
        ["Decimal", fmt(v),""],
        ["Binary", bin,bits+" bit"+(bits===1?"":"s")],
        ["Hexadecimal", "0x"+hex,""],
        ["Octal", oct+"₈",""],
        ["8-bit padded", bits<=8?bin.padStart(8,"0"):"—",bits<=8?"1 byte":"too long"],
        ["16-bit padded", bits<=16?bin.padStart(16,"0"):"—",bits<=16?"2 bytes":"too long"],
        ["Bit length", String(bits),""],
        ["Power band", "2^"+k+" ≤ n < 2^"+(k+1), v===0?"n = 0":""]
      ],
      gauge:{
        label:"BIT LENGTH — "+bits+" BITS",
        pos:clamp(bits/64*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–16","17–32","33–48","49–64")
      }
    };
  }
  function calcBinary(s){
    var raw=String(s.value||"").trim();
    if(!raw) return msgResult("ENTER A VALUE");
    if(s.mode==="bin"){
      var bitsRaw=raw.replace(/\s+/g,"");
      if(!/^[01]+$/.test(bitsRaw)) return msgResult("ONLY 0 AND 1 ALLOWED");
      if(bitsRaw.length>53) return msgResult("MAX 53 BITS");
      return binStats(parseInt(bitsRaw,2));
    }
    var v=num(raw);
    if(v==null||v<0||v%1!==0) return msgResult("ENTER A NON-NEGATIVE INTEGER");
    if(v>9007199254740991) return msgResult("MAX 2^53 − 1");
    return binStats(v);
  }

  /* ---------------- 07 HEX ---------------- */
  function hexStats(v){
    var hex=v.toString(16).toUpperCase(), bin=v.toString(2), oct=v.toString(8);
    var rgb=v<=0xFFFFFF ? "#"+hex.padStart(6,"0") : "—";
    var bytes=Math.max(1,Math.ceil(bin.length/8));
    return {
      stats:[
        ["Decimal", fmt(v),""],
        ["Hexadecimal", "0x"+hex, hex.length+" digit"+(hex.length===1?"":"s")],
        ["Binary", bin.length<=32?bin:bin.slice(0,12)+"…",bin.length+" bits"],
        ["Octal", oct+"₈",""],
        ["CSS color", rgb, rgb!=="—"?"valid color":"above 0xFFFFFF"],
        ["Byte size", bytes+" byte"+(bytes===1?"":"s"),"ceil(bits ÷ 8)"],
        ["Hex digits", String(hex.length),""],
        ["Next power of 2", "2^"+Math.ceil(Math.log2(Math.max(v,1))),"≥ value"]
      ],
      gauge:{
        label:"HEX DIGITS — "+hex.length+" DIGIT"+(hex.length===1?"":"S"),
        pos:clamp(hex.length/16*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–4","5–8","9–12","13–16")
      }
    };
  }
  function calcHex(s){
    var raw=String(s.value||"").trim();
    if(!raw) return msgResult("ENTER A VALUE");
    if(s.mode==="hex"){
      var h=raw.toLowerCase().replace(/^0x/,"").replace(/\s+/g,"");
      if(!/^[0-9a-f]+$/.test(h)) return msgResult("HEX DIGITS ONLY (0–9, A–F)");
      if(h.length>14) return msgResult("MAX 14 HEX DIGITS");
      return hexStats(parseInt(h,16));
    }
    var v=num(raw);
    if(v==null||v<0||v%1!==0) return msgResult("ENTER A NON-NEGATIVE INTEGER");
    if(v>9007199254740991) return msgResult("MAX 2^53 − 1");
    return hexStats(v);
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"percent", tab:"Percent", name:"Percentage Calculator",
      def:function(){ return {pct:"15",of:"200"}; },
      fields:[
        {k:"pct",label:"Percentage (%)",type:"number"},
        {k:"of",label:"Of value",type:"number"}
      ], calc:calcPercent },
    { id:"inc", tab:"Increase", name:"Percentage Increase Calculator",
      def:function(){ return {from:"80",to:"100"}; },
      fields:[
        {k:"from",label:"From (old value)",type:"number"},
        {k:"to",label:"To (new value)",type:"number"}
      ], calc:calcInc },
    { id:"dec", tab:"Decrease", name:"Percentage Decrease Calculator",
      def:function(){ return {from:"100",to:"80"}; },
      fields:[
        {k:"from",label:"From (original)",type:"number"},
        {k:"to",label:"To (new value)",type:"number"}
      ], calc:calcDec },
    { id:"sci", tab:"Scientific", name:"Scientific Calculator",
      def:function(){ return {mode:"deg",expr:"sin(30) + √16"}; },
      fields:[
        {k:"mode",label:"Angle mode",type:"seg",full:true,opts:[["deg","DEG — degrees"],["rad","RAD — radians"]]},
        {k:"expr",label:"Expression — use the keypad below",type:"text",ph:"sin(30) + √16",full:true}
      ], calc:calcSci },
    { id:"fraction", tab:"Fraction", name:"Fraction Calculator",
      def:function(){ return {n1:"1",d1:"2",op:"add",n2:"1",d2:"3"}; },
      fields:[
        {k:"n1",label:"Fraction 1 · numerator",type:"number"},
        {k:"d1",label:"Fraction 1 · denominator",type:"number"},
        {k:"op",label:"Operation",type:"seg",full:true,opts:[["add","+ Add"],["sub","− Sub"],["mul","× Mult"],["div","÷ Div"]]},
        {k:"n2",label:"Fraction 2 · numerator",type:"number"},
        {k:"d2",label:"Fraction 2 · denominator",type:"number"}
      ], calc:calcFraction },
    { id:"binary", tab:"Binary", name:"Binary Calculator",
      def:function(){ return {mode:"dec",value:"42"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["dec","Decimal → Binary"],["bin","Binary → Decimal"]]},
        {k:"value",label:function(s){ return s.mode==="bin"?"Binary value (0s and 1s)":"Decimal value"; },type:"text",ph:"42",full:true}
      ], calc:calcBinary },
    { id:"hex", tab:"Hex", name:"Hex Calculator",
      def:function(){ return {mode:"dec",value:"255"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["dec","Decimal → Hex"],["hex","Hex → Decimal"]]},
        {k:"value",label:function(s){ return s.mode==="hex"?"Hex value (e.g. FF or 0xFF)":"Decimal value"; },type:"text",ph:"255",full:true}
      ], calc:calcHex }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var lastResult=null;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");

  /* scientific keypad definition */
  var KEYS=[
    {t:"C",act:"clear",cls:"sci-btn--warn"},{t:"⌫",act:"back"},{t:"(",ins:"("},{t:")",ins:")"},{t:"÷",ins:"÷",cls:"sci-btn--op"},
    {t:"sin",ins:"sin("},{t:"cos",ins:"cos("},{t:"tan",ins:"tan("},{t:"xʸ",ins:"^"},{t:"×",ins:"×",cls:"sci-btn--op"},
    {t:"√",ins:"√"},{t:"log",ins:"log("},{t:"ln",ins:"ln("},{t:"π",ins:"π"},{t:"−",ins:"-",cls:"sci-btn--op"},
    {t:"7",ins:"7"},{t:"8",ins:"8"},{t:"9",ins:"9"},{t:"e",ins:"e"},{t:"+",ins:"+",cls:"sci-btn--op"},
    {t:"4",ins:"4"},{t:"5",ins:"5"},{t:"6",ins:"6"},{t:"%",ins:"%"},{t:"=",act:"eq",cls:"sci-btn--eq"},
    {t:"1",ins:"1"},{t:"2",ins:"2"},{t:"3",ins:"3"},{t:"0",ins:"0"},{t:".",ins:"."}
  ];
  var SCI_PAD='<div class="sci-pad" role="group" aria-label="Scientific keypad">'+KEYS.map(function(k){
    var attrs=' type="button" class="sci-btn'+(k.cls?' '+k.cls:'')+'"';
    if(k.ins!=null) attrs+=' data-ins="'+k.ins+'"';
    if(k.act) attrs+=' data-act="'+k.act+'"';
    return '<button'+attrs+'>'+k.t+'</button>';
  }).join('')+'</div>';

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
    if(t.id==="sci") formEl.insertAdjacentHTML("beforeend",SCI_PAD);
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

  /* scientific keypad helpers */
  function sciInsert(tok){
    var inp=$("#fld-sci-expr"); if(!inp) return;
    var s=inp.selectionStart==null?inp.value.length:inp.selectionStart;
    var e=inp.selectionEnd==null?s:inp.selectionEnd;
    inp.value=inp.value.slice(0,s)+tok+inp.value.slice(e);
    state.sci.expr=inp.value;
    var pos=s+tok.length;
    inp.focus(); try{ inp.setSelectionRange(pos,pos); }catch(err){}
    recalc();
  }
  function sciBack(){
    var inp=$("#fld-sci-expr"); if(!inp) return;
    var s=inp.selectionStart==null?inp.value.length:inp.selectionStart;
    var e=inp.selectionEnd==null?s:inp.selectionEnd;
    if(s===e){ if(s===0) return; s--; }
    inp.value=inp.value.slice(0,s)+inp.value.slice(e);
    state.sci.expr=inp.value;
    inp.focus(); try{ inp.setSelectionRange(s,s); }catch(err){}
    recalc();
  }

  formEl.addEventListener("click", function(e){
    var sciBtn=e.target.closest(".sci-btn");
    if(sciBtn){
      if(sciBtn.getAttribute("data-ins")!=null) sciInsert(sciBtn.getAttribute("data-ins"));
      else{
        var act=sciBtn.getAttribute("data-act");
        if(act==="clear"){ state.sci.expr=""; var c=$("#fld-sci-expr"); if(c){c.value="";} recalc(); }
        else if(act==="back") sciBack();
        else if(act==="eq") recalc();
      }
      return;
    }
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
    var lines=["IrisTool — Math Calculators","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Computed locally in the browser.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Math Calculators · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    a.href=url; a.download="IrisTool-math-results.txt";
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
