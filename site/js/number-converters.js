
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
     LIVE NUMBER CONVERTERS (all 8 tools)
     ================================================================ */
  function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a||1; }
  function trunc40(s){ return s.length>40 ? s.slice(0,40)+"…" : s; }

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
    return {label:label,pos:clamp(Math.log10(Math.abs(res)+1)/15*100,0,100),
      segs:quartSegs(),legend:quartLegend("≤1","10⁴","10⁸","10¹²+")};
  }

  /* ---------------- number ↔ words engine ---------------- */
  var ONES=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  var TENS=["","ten","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  var SCALES=["","thousand","million","billion","trillion","quadrillion"];
  function chunkWords(n){
    var s="", h=Math.floor(n/100), r=n%100;
    if(h) s+=ONES[h]+" hundred";
    if(r){
      if(s) s+=" ";
      if(r<20) s+=ONES[r];
      else { s+=TENS[Math.floor(r/10)]; if(r%10) s+="-"+ONES[r%10]; }
    }
    return s;
  }
  function intToWords(n){
    if(n===0) return "zero";
    var parts=[], si=0;
    while(n>0){
      var chunk=n%1000;
      if(chunk){ var w=chunkWords(chunk); if(si) w+=" "+SCALES[si]; parts.unshift(w); }
      n=Math.floor(n/1000); si++;
    }
    return parts.join(" ");
  }
  var ORD_SPECIAL={one:"first",two:"second",three:"third",four:"fourth",five:"fifth",six:"sixth",seven:"seventh",eight:"eighth",nine:"ninth",ten:"tenth",eleven:"eleventh",twelve:"twelfth",thirteen:"thirteenth",fourteen:"fourteenth",fifteen:"fifteenth",sixteen:"sixteenth",seventeen:"seventeenth",eighteen:"eighteenth",nineteen:"nineteenth",twenty:"twentieth",thirty:"thirtieth",forty:"fortieth",fifty:"fiftieth",sixty:"sixtieth",seventy:"seventieth",eighty:"eightieth",ninety:"ninetieth"};
  function ordinalOf(n){
    var w=intToWords(n), i=Math.max(w.lastIndexOf(" "),w.lastIndexOf("-"));
    var rest=w.slice(0,i+1), last=w.slice(i+1);
    if(ORD_SPECIAL[last]) return rest+ORD_SPECIAL[last];
    return rest+last+"th";
  }
  var ONES_VAL={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
  var TENS_VAL={ten:10,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
  var SCALE_VAL={thousand:1e3,million:1e6,billion:1e9,trillion:1e12,quadrillion:1e15};
  function wordsToNumber(text){
    var t=String(text).toLowerCase().replace(/[,\-]/g," ").replace(/\s+/g," ").trim();
    if(!t) return {err:"ENTER WORDS"};
    var toks=t.split(" ").filter(Boolean);
    var neg=false;
    if(toks[0]==="minus"||toks[0]==="negative"){ neg=true; toks.shift(); }
    var total=0, cur=0, decDigits=null, scaleMax="";
    for(var i=0;i<toks.length;i++){
      var tok=toks[i];
      if(tok==="point"){ decDigits=""; continue; }
      if(decDigits!==null){
        if(ONES_VAL.hasOwnProperty(tok)&&ONES_VAL[tok]<=9){ decDigits+=ONES_VAL[tok]; continue; }
        return {err:"AFTER 'POINT' USE SINGLE DIGITS"};
      }
      if(tok==="and") continue;
      if(tok==="a"||tok==="an"){ cur+=1; continue; }
      if(ONES_VAL.hasOwnProperty(tok)){ cur+=ONES_VAL[tok]; continue; }
      if(TENS_VAL.hasOwnProperty(tok)){ cur+=TENS_VAL[tok]; continue; }
      if(tok==="hundred"){ if(cur===0) cur=1; cur*=100; continue; }
      if(SCALE_VAL.hasOwnProperty(tok)){
        if(cur===0) cur=1;
        total+=cur*SCALE_VAL[tok];
        if(!scaleMax||SCALE_VAL[tok]>SCALE_VAL[scaleMax]) scaleMax=tok;
        cur=0; continue;
      }
      return {err:"UNKNOWN WORD '"+tok.toUpperCase()+"'"};
    }
    total+=cur;
    var value=neg?-total:total, isDecimal=false;
    if(decDigits!==null){
      if(decDigits==="") return {err:"NOTHING AFTER 'POINT'"};
      value=(neg?-1:1)*(total+parseInt(decDigits,10)/Math.pow(10,decDigits.length));
      isDecimal=true;
    }
    if(Math.abs(value)>9007199254740991) return {err:"NUMBER TOO LARGE"};
    return {value:value,neg:neg,isDecimal:isDecimal,tokens:toks.length,scaleMax:scaleMax,intPart:total};
  }

  /* ---------------- roman engine ---------------- */
  var ROM_PAIRS=[["M",1000],["CM",900],["D",500],["CD",400],["C",100],["XC",90],["L",50],["XL",40],["X",10],["IX",9],["V",5],["IV",4],["I",1]];
  var ROM_VAL={M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  function toRomanParts(n){
    var out=[];
    ROM_PAIRS.forEach(function(p){ while(n>=p[1]){ out.push(p[0]); n-=p[1]; } });
    return out;
  }
  function fromRoman(s){
    s=String(s).toUpperCase().replace(/\s+/g,"");
    if(!s||!/^[MDCLXVI]+$/.test(s)) return null;
    var total=0,last=0;
    for(var i=s.length-1;i>=0;i--){
      var v=ROM_VAL[s[i]];
      if(v<last) total-=v; else total+=v;
      last=v;
    }
    return total;
  }

  /* ---------------- 01 DECIMAL → FRACTION ---------------- */
  function calcD2F(s){
    var raw=String(s.value||"").trim().replace(",",".");
    var neg=/^-/.test(raw);
    var body=raw.replace(/^[+-]/,"");
    if(!/^\d*(\.\d+)?$/.test(body)||body===""||body===".") return msgResult("ENTER A DECIMAL NUMBER");
    var parts=body.split(".");
    var intStr=parts[0]||"0", fracStr=parts[1]||"";
    if(fracStr.length>12) return msgResult("MAX 12 DECIMAL PLACES");
    var num=parseInt(intStr+fracStr,10), den=Math.pow(10,fracStr.length);
    var g=gcd(num,den), sn=num/g, sd=den/g;
    var whole=Math.floor(sn/sd), rem=sn%sd;
    var val=sn/sd;
    return {
      stats:[
        ["Fraction", (neg?"−":"")+sn+"/"+sd, g>1?"reduced by gcd "+g:"lowest terms"],
        ["Mixed number", whole===0?(neg?"−":"")+sn+"/"+sd:(neg?"−":"")+whole+(rem?" "+rem+"/"+sd:""),""],
        ["Numerator", fmt(sn),""],
        ["Denominator", fmt(sd),""],
        ["Percent", (val*100).toLocaleString("en-US",{maximumFractionDigits:4})+" %",""],
        ["Decimal value", (neg?"−":"")+Number(val.toFixed(10)),""],
        ["Reciprocal", sn!==0?(neg?"−":"")+sd+"/"+sn:"—", sn!==0?"flip":"÷0 undefined"],
        ["Original input", raw,""]
      ],
      gauge:{
        label:"DENOMINATOR SIZE — "+fmt(sd)+" AFTER REDUCTION",
        pos:clamp(Math.log10(sd)/6*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–10","10²–10³","10⁴–10⁵","10⁶")
      }
    };
  }

  /* ---------------- 02 FRACTION → DECIMAL ---------------- */
  function calcF2D(s){
    var n=parseInt(s.n,10), d=parseInt(s.d,10);
    if(!isFinite(n)||!isFinite(d)) return msgResult("ENTER NUMERATOR & DENOMINATOR");
    if(d===0) return msgResult("DENOMINATOR MUST NOT BE 0");
    var neg=(n<0)!==(d<0); n=Math.abs(n); d=Math.abs(d);
    var int=Math.floor(n/d), rem=n%d;
    var digits="", repStart=null;
    if(rem!==0){
      var seen={}, pos=0;
      while(rem!==0 && !seen.hasOwnProperty(rem) && pos<500){
        seen[rem]=pos;
        rem*=10; digits+=Math.floor(rem/d); rem%=d; pos++;
      }
      if(rem!==0) repStart=seen[rem];
    }
    var text=String(int);
    if(digits) text+="."+(repStart===null?digits:digits.slice(0,repStart)+"("+digits.slice(repStart)+")");
    var term=repStart===null;
    var period=term?0:digits.length-repStart;
    var val=(neg?-1:1)*(n/d);
    var g=gcd(n,d);
    return {
      stats:[
        ["Decimal", (neg?"−":"")+trunc40(text), term?"terminating":"repeating"],
        ["Type", term?"Terminating":"Repeating · period "+period, term?"digits end":"cycle length "+period],
        ["6 decimals", val.toFixed(6),""],
        ["Percent", (val*100).toLocaleString("en-US",{maximumFractionDigits:4})+" %",""],
        ["Mixed number", int+(n%d&&g?" "+(n%d/g)+"/"+(d/g):""),""],
        ["Reduced", (neg?"−":"")+(n/g)+"/"+(d/g),""],
        ["Reciprocal", n!==0?(neg?"−":"")+d+"/"+n:"—", n!==0?"flip":"÷0 undefined"],
        ["Input", s.n+" / "+s.d,""]
      ],
      gauge:magGauge(val,"RESULT — "+val.toFixed(6))
    };
  }

  /* ---------------- 03 ROMAN ---------------- */
  function calcRoman(s){
    if(s.mode==="tor"){
      var v=parseInt(s.value,10);
      if(!isFinite(v)) return msgResult("ENTER A NUMBER");
      if(v<1||v>3999) return msgResult("RANGE IS 1–3999");
      var parts=toRomanParts(v);
      var rom=parts.join("");
      var uniq={}; rom.split("").forEach(function(c){ uniq[c]=1; });
      return {
        stats:[
          ["Roman numeral", rom,"canonical form"],
          ["Decimal", fmt(v),""],
          ["Characters", String(rom.length),""],
          ["Symbols used", Object.keys(uniq).join(" · "),"unique"],
          ["Expanded", trunc40(parts.map(function(p){ return ROM_VAL[p]; }).join("+")),""],
          ["Largest symbol", parts[0]+" = "+ROM_VAL[parts[0]],""],
          ["Smallest symbol", parts[parts.length-1]+" = "+ROM_VAL[parts[parts.length-1]],""],
          ["Valid range", "1 – 3999","no zero in roman"]
        ],
        gauge:{
          label:"ROMAN RANGE — "+fmt(v)+" OF 3999",
          pos:clamp(v/3999*100,0,100),
          segs:quartSegs(),
          legend:quartLegend("1–999","1000–1999","2000–2999","3000–3999")
        }
      };
    }
    var parsed=fromRoman(s.value);
    if(parsed===null) return msgResult("USE ROMAN DIGITS M D C L X V I");
    if(parsed<1||parsed>3999) return msgResult("RESULT OUTSIDE 1–3999");
    var canon=toRomanParts(parsed).join("");
    var input=String(s.value).toUpperCase().replace(/\s+/g,"");
    var canonical=input===canon;
    var uniq2={}; canon.split("").forEach(function(c){ uniq2[c]=1; });
    return {
      stats:[
        ["Decimal", fmt(parsed),""],
        ["Roman (canonical)", canon,""],
        ["Input canonical", canonical?"yes ✓":"no — see above", canonical?"":"reordered to standard"],
        ["Characters", String(input.length),""],
        ["Symbols used", Object.keys(uniq2).join(" · "),"unique"],
        ["Expanded", trunc40(toRomanParts(parsed).map(function(p){ return ROM_VAL[p]; }).join("+")),""],
        ["Value", fmt(parsed),"parsed total"],
        ["Valid range", "1 – 3999",""]
      ],
      gauge:{
        label:"ROMAN RANGE — "+fmt(parsed)+" OF 3999",
        pos:clamp(parsed/3999*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–999","1000–1999","2000–2999","3000–3999")
      }
    };
  }

  /* ---------------- 04 NUMBER → WORDS ---------------- */
  function calcN2W(s){
    var raw=String(s.value||"").trim().replace(/[\s,]/g,"");
    if(!/^[+-]?\d+(\.\d+)?$/.test(raw)||raw===""||raw==="-"||raw==="+") return msgResult("ENTER A NUMBER");
    var neg=raw[0]==="-";
    var body=raw.replace(/^[+-]/,"");
    var parts=body.split(".");
    if(parts[0].length>15) return msgResult("MAX 15 DIGITS BEFORE THE POINT");
    var intVal=parseInt(parts[0]||"0",10);
    var words=intToWords(intVal);
    if(parts[1]){
      if(parts[1].length>15) return msgResult("MAX 15 DIGITS AFTER THE POINT");
      words+=" point "+parts[1].split("").map(function(d){ return ONES[parseInt(d,10)]; }).join(" ");
    }
    if(neg) words="minus "+words;
    var scale="units";
    if(intVal>=1e15) scale="quadrillions"; else if(intVal>=1e12) scale="trillions";
    else if(intVal>=1e9) scale="billions"; else if(intVal>=1e6) scale="millions";
    else if(intVal>=1e3) scale="thousands";
    var dsum=body.replace(/\D/g,"").split("").reduce(function(a,c){ return a+parseInt(c,10); },0);
    return {
      stats:[
        ["Words", words,""],
        ["Ordinal", parts[1]?"—":(neg?"—":ordinalOf(intVal)), parts[1]?"integers only":""],
        ["Digits", String(parts[0].length+(parts[1]?parts[1].length:0)),""],
        ["Scale", scale,""],
        ["Digit sum", fmt(dsum),""],
        ["Parity", parts[1]?"—":(intVal%2===0?"even":"odd"),""],
        ["Sign", neg?"negative":"positive",""],
        ["Input", raw.length>20?raw.slice(0,20)+"…":raw,""]
      ],
      gauge:{
        label:"LENGTH — "+parts[0].length+" INTEGER DIGITS",
        pos:clamp(parts[0].length/15*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–4","5–8","9–12","13–15")
      }
    };
  }

  /* ---------------- 05 WORDS → NUMBER ---------------- */
  function calcW2N(s){
    var r=wordsToNumber(s.words);
    if(r.err) return msgResult(r.err);
    var v=r.value;
    var check=r.isDecimal?"—":intToWords(r.intPart);
    var dsum=String(r.intPart).split("").reduce(function(a,c){ return a+parseInt(c,10); },0);
    return {
      stats:[
        ["Number", r.isDecimal?String(v):fmt(v),""],
        ["Type", (r.neg?"negative ":"")+(r.isDecimal?"decimal":"integer"),""],
        ["Scale", r.scaleMax||"below thousand","largest scale word"],
        ["Tokens", String(r.tokens),"words parsed"],
        ["Digit sum", fmt(dsum),"of integer part"],
        ["Parity", r.isDecimal?"—":(r.intPart%2===0?"even":"odd"),""],
        ["Round-trip", r.isDecimal?"—":trunc40(check), r.isDecimal?"":"spelled back"],
        ["Input", trunc40(String(s.words||"").trim()),""]
      ],
      gauge:magGauge(Math.abs(v),"RESULT — "+(r.isDecimal?String(v):fmt(v)))
    };
  }

  /* ---------------- 06 BINARY ---------------- */
  function popcount(v){ return v.toString(2).split("0").join("").length; }
  function isPow2(v){ if(v<=0) return false; var k=Math.log2(v); return Math.abs(k-Math.round(k))<1e-9; }
  function baseStats(v,dirLabel){
    var bin=v.toString(2), hex=v.toString(16).toUpperCase(), oct=v.toString(8);
    var bits=bin.length;
    var pow=isPow2(v);
    return {
      stats:[
        ["Decimal", fmt(v), dirLabel],
        ["Binary", bin.length<=32?bin:bin.slice(0,12)+"…", bits+" bits"],
        ["Hexadecimal", "0x"+hex,""],
        ["Octal", oct+"₈",""],
        ["Bit length", String(bits),""],
        ["8-bit padded", bits<=8?bin.padStart(8,"0"):"—", bits<=8?"1 byte":"too long"],
        ["1-bits", String(popcount(v)),"popcount"],
        ["Power of 2", pow?"yes — 2^"+Math.round(Math.log2(v)):"no",""]
      ],
      gauge:{
        label:"BIT LENGTH — "+bits+" BITS",
        pos:clamp(bits/53*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–13","14–26","27–39","40–53")
      }
    };
  }
  function calcBinary(s){
    var raw=String(s.value||"").trim();
    if(!raw) return msgResult("ENTER A VALUE");
    if(s.mode==="b2d"){
      var bits=raw.replace(/\s+/g,"");
      if(!/^[01]+$/.test(bits)) return msgResult("ONLY 0 AND 1 ALLOWED");
      if(bits.length>53) return msgResult("MAX 53 BITS");
      return baseStats(parseInt(bits,2),"from binary");
    }
    var v=parseFloat(raw);
    if(!isFinite(v)||v<0||v%1!==0) return msgResult("ENTER A NON-NEGATIVE INTEGER");
    if(v>9007199254740991) return msgResult("MAX 2^53 − 1");
    return baseStats(v,"from decimal");
  }

  /* ---------------- 07 DECIMAL (multi-base) ---------------- */
  function calcDecimal(s){
    var v=parseFloat(s.value);
    if(!isFinite(v)||v<0||v%1!==0) return msgResult("ENTER A NON-NEGATIVE INTEGER");
    if(v>9007199254740991) return msgResult("MAX 2^53 − 1");
    var dsum=String(v).split("").reduce(function(a,c){ return a+parseInt(c,10); },0);
    return {
      stats:[
        ["Decimal", fmt(v),"base 10"],
        ["Binary", v.toString(2).length<=32?v.toString(2):v.toString(2).slice(0,12)+"…","base 2"],
        ["Octal", v.toString(8)+"₈","base 8"],
        ["Hexadecimal", "0x"+v.toString(16).toUpperCase(),"base 16"],
        ["Ternary", v.toString(3),"base 3"],
        ["Quinary", v.toString(5),"base 5"],
        ["Duodecimal", v.toString(12).toUpperCase(),"base 12"],
        ["Digit sum", fmt(dsum),"base 10 digits"]
      ],
      gauge:{
        label:"MAGNITUDE — "+fmt(v),
        pos:clamp(Math.log10(v+1)/16*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("≤10³","10⁴–10⁷","10⁸–10¹¹","10¹²+")
      }
    };
  }

  /* ---------------- 08 HEX ---------------- */
  function hexStats(v,dirLabel){
    var hex=v.toString(16).toUpperCase(), bin=v.toString(2), oct=v.toString(8);
    var rgb=v<=0xFFFFFF?"#"+hex.padStart(6,"0"):"—";
    var ascii=(v>=32&&v<=126)?String.fromCharCode(v):"—";
    var bytes=Math.max(1,Math.ceil(bin.length/8));
    return {
      stats:[
        ["Decimal", fmt(v), dirLabel],
        ["Hexadecimal", "0x"+hex, hex.length+" digit"+(hex.length===1?"":"s")],
        ["Binary", bin.length<=32?bin:bin.slice(0,12)+"…", bin.length+" bits"],
        ["Octal", oct+"₈",""],
        ["Byte size", bytes+" byte"+(bytes===1?"":"s"),""],
        ["CSS color", rgb, rgb!=="—"?"valid color":"above 0xFFFFFF"],
        ["ASCII char", ascii, ascii!=="—"?"printable":"not printable"],
        ["Power of 2", isPow2(v)?"yes — 2^"+Math.round(Math.log2(v)):"no",""]
      ],
      gauge:{
        label:"HEX DIGITS — "+hex.length+" DIGIT"+(hex.length===1?"":"S"),
        pos:clamp(hex.length/13*100,0,100),
        segs:quartSegs(),
        legend:quartLegend("1–3","4–6","7–9","10–13")
      }
    };
  }
  function calcHex(s){
    var raw=String(s.value||"").trim();
    if(!raw) return msgResult("ENTER A VALUE");
    if(s.mode==="h2d"){
      var h=raw.toLowerCase().replace(/^0x/,"").replace(/\s+/g,"");
      if(!/^[0-9a-f]+$/.test(h)) return msgResult("HEX DIGITS ONLY (0–9, A–F)");
      if(h.length>13) return msgResult("MAX 13 HEX DIGITS");
      return hexStats(parseInt(h,16),"from hex");
    }
    var v=parseFloat(raw);
    if(!isFinite(v)||v<0||v%1!==0) return msgResult("ENTER A NON-NEGATIVE INTEGER");
    if(v>9007199254740991) return msgResult("MAX 2^53 − 1");
    return hexStats(v,"from decimal");
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"d2f", tab:"Dec → Frac", name:"Decimal to Fraction",
      def:function(){ return {value:"0.75"}; },
      fields:[
        {k:"value",label:"Decimal number (up to 12 places)",type:"text",ph:"0.75",full:true}
      ], calc:calcD2F },
    { id:"f2d", tab:"Frac → Dec", name:"Fraction to Decimal",
      def:function(){ return {n:"1",d:"3"}; },
      fields:[
        {k:"n",label:"Numerator",type:"number"},
        {k:"d",label:"Denominator",type:"number"}
      ], calc:calcF2D },
    { id:"roman", tab:"Roman", name:"Roman Numeral Converter",
      def:function(){ return {mode:"tor",value:"2026"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["tor","Number → Roman"],["from","Roman → Number"]]},
        {k:"value",label:function(s){ return s.mode==="from"?"Roman numeral (M, D, C, L, X, V, I)":"Number (1–3999)"; },type:"text",ph:"2026",full:true}
      ], calc:calcRoman },
    { id:"n2w", tab:"Num → Words", name:"Number to Words",
      def:function(){ return {value:"1234567"}; },
      fields:[
        {k:"value",label:"Number — up to 15 digits, decimals allowed",type:"text",ph:"1234567",full:true}
      ], calc:calcN2W },
    { id:"w2n", tab:"Words → Num", name:"Words to Number",
      def:function(){ return {words:"two million five hundred thousand"}; },
      fields:[
        {k:"words",label:"English number words",type:"text",ph:"two million five hundred thousand",full:true}
      ], calc:calcW2N },
    { id:"binary", tab:"Binary", name:"Binary Converter",
      def:function(){ return {mode:"b2d",value:"1101"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["b2d","Binary → Decimal"],["d2b","Decimal → Binary"]]},
        {k:"value",label:function(s){ return s.mode==="b2d"?"Binary value (0s and 1s)":"Decimal value"; },type:"text",ph:"1101",full:true}
      ], calc:calcBinary },
    { id:"decimal", tab:"Decimal", name:"Decimal Converter",
      def:function(){ return {value:"255"}; },
      fields:[
        {k:"value",label:"Decimal integer",type:"text",ph:"255",full:true}
      ], calc:calcDecimal },
    { id:"hex", tab:"Hex", name:"Hex Converter",
      def:function(){ return {mode:"h2d",value:"FF"}; },
      fields:[
        {k:"mode",label:"Direction",type:"seg",full:true,opts:[["h2d","Hex → Decimal"],["d2h","Decimal → Hex"]]},
        {k:"value",label:function(s){ return s.mode==="h2d"?"Hex value (e.g. FF or 0xFF)":"Decimal value"; },type:"text",ph:"FF",full:true}
      ], calc:calcHex }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];
  var lastResult=null;

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");

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
    var lines=["IrisTool — Number Converters","Tool: "+activeTool.name,""];
    lines.push("Metric\tResult\tNote");
    rows.forEach(function(r){ lines.push(r.join("\t")); });
    lines.push("");
    lines.push(gLabel.textContent);
    lines.push("Computed locally in the browser.");
    return lines.join("\n");
  }

  function buildTableHTML(rows){
    var h='<div style="font-family:Arial,Helvetica,sans-serif">';
    h+='<p style="margin:0 0 8px;font-size:13px;color:#6C6C64">IrisTool — Number Converters · <b style="color:#141414">'+esc(activeTool.name)+'</b></p>';
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
    a.href=url; a.download="IrisTool-number-results.txt";
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
