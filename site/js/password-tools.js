
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
     LIVE PASSWORD TOOLS (2 tools)
     ================================================================ */
  function clamp(v,a,b){ return Math.min(b,Math.max(a,b===undefined?100:b)); }
  function clamp2(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }

  var COMMON=["password","123456","12345678","123456789","qwerty","letmein","111111","abc123",
    "iloveyou","admin","welcome","monkey","dragon","000000","123123","1q2w3e","trustno1",
    "football","shadow","superman","qazwsx","master","hello1","freedom","whatever"];

  /* ---------------- analysis engine ---------------- */
  function analyze(pw){
    pw=String(pw||"");
    var len=pw.length;
    var lower=pw.toLowerCase();
    var hasLower=/[a-z]/.test(pw), hasUpper=/[A-Z]/.test(pw),
        hasDigit=/[0-9]/.test(pw), hasSym=/[^a-zA-Z0-9]/.test(pw);
    var pool=(hasLower?26:0)+(hasUpper?26:0)+(hasDigit?10:0)+(hasSym?33:0);
    var entropy=len&&pool?Math.round(len*Math.log2(pool)):0;

    var foundPattern="";
    for(var i=0;i<COMMON.length;i++){
      if(lower.indexOf(COMMON[i])>=0){ foundPattern=COMMON[i]; break; }
    }
    if(!foundPattern && len>1 && /^(.)\1*$/.test(pw)) foundPattern="repeated '"+pw.charAt(0)+"'";
    if(!foundPattern && /^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/.test(lower)) foundPattern="sequence";
    var isCommon=!!foundPattern;

    var score=clamp2(Math.round(entropy/70*100),0,100);
    if(isCommon) score=Math.min(score,8);
    if(len>0&&len<6) score=Math.min(score,10);

    var rating=score<20?"Very weak":score<40?"Weak":score<60?"Fair":score<80?"Strong":"Very strong";
    var log10comb=len&&pool?len*Math.log10(pool):0;

    return {
      pw:pw,len:len,pool:pool,entropy:entropy,isCommon:isCommon,foundPattern:foundPattern,
      hasLower:hasLower,hasUpper:hasUpper,hasDigit:hasDigit,hasSym:hasSym,
      score:score,rating:rating,log10comb:log10comb,
      lowerCount:(pw.match(/[a-z]/g)||[]).length,
      upperCount:(pw.match(/[A-Z]/g)||[]).length,
      digitCount:(pw.match(/[0-9]/g)||[]).length,
      symCount:(pw.match(/[^a-zA-Z0-9]/g)||[]).length
    };
  }

  function crackLabel(entropy,gps){
    if(entropy<=0) return "instant";
    var logSec=entropy*Math.log10(2)-Math.log10(gps);
    if(logSec<=0) return "instant";
    if(logSec<2) return Math.ceil(Math.pow(10,logSec))+" seconds";
    if(logSec<4.56) return Math.ceil(Math.pow(10,logSec)/60)+" minutes";
    if(logSec<6.93) return Math.ceil(Math.pow(10,logSec)/3600)+" hours";
    if(logSec<9.5) return Math.ceil(Math.pow(10,logSec)/86400)+" days";
    var logYears=logSec-Math.log10(31557600);
    if(logYears<4) return Math.ceil(Math.pow(10,logYears)).toLocaleString("en-US")+" years";
    if(logYears<7) return Math.round(Math.pow(10,logYears-3)).toLocaleString("en-US")+" thousand years";
    if(logYears<10) return Math.round(Math.pow(10,logYears-6)).toLocaleString("en-US")+" million years";
    if(logYears<13) return Math.round(Math.pow(10,logYears-9)).toLocaleString("en-US")+" billion years";
    return "beyond the universe";
  }

  function advice(a){
    if(a.isCommon) return "avoid '"+a.foundPattern+"' — attackers try it first";
    if(a.len<8) return "make it at least 8 characters";
    if(a.len<12) return "longer is stronger — aim for 12+";
    if(!a.hasSym) return "add symbols (!@#$…)";
    if(!a.hasUpper||!a.hasLower) return "mix upper and lower case";
    return "excellent — a passphrase would be even better";
  }

  /* ---------------- sample passwords ---------------- */
  var SAMPLES={
    weak:["password123","123456","qwerty1","letmein","abc123","monkey","iloveyou"],
    mid:["Hunter2","Summer2026","coffee!break","BlueSky#42","guitar_hero9"],
    strong:["Xk9#mQ2$vL7p","correct-horse-battery-staple","G7&tWq9!zR4#mN","Tide@Pool82!vex","Nimbus^22cloudbank"]
  };
  function randomSample(){
    var r=Math.random();
    return pick(r<0.33?SAMPLES.weak:r<0.66?SAMPLES.mid:SAMPLES.strong);
  }

  /* ---------------- tool registry ---------------- */
  var TOOLS=[
    { id:"checker", tab:"Checker", name:"Strong Password Checker",
      def:function(){ return {pw:"Tr0ub4dor&3"}; } },
    { id:"meter", tab:"Meter", name:"Password Strength Meter",
      def:function(){ return {pw:"hunter2"}; } }
  ];

  var state={};
  TOOLS.forEach(function(t){ state[t.id]=t.def(); });
  var activeTool=TOOLS[0];

  var tabsEl=$("#t-tabs"), formEl=$("#calc-form");
  var gSegs=$("#g-segs"), gMark=$("#g-mark"), gLegend=$("#g-legend"), gLabel=$("#gauge-label");
  var GAUSEG=[
    {c:"#C40000",w:25},{c:"#C9C9C0",w:25},{c:"#6E86FF",w:25},{c:"#0033FF",w:25}
  ];

  function fieldHtml(f,s){
    var id="fld-"+activeTool.id+"-"+f.k;
    var lab='<label class="f-label" for="'+id+'">'+f.label+'</label>';
    var ctrl='<input class="f-input" id="'+id+'" data-k="'+f.k+'" type="text" value="'+String(s[f.k]!=null?s[f.k]:"").replace(/"/g,"&quot;")+'" autocomplete="off" spellcheck="false" maxlength="64">';
    return '<div class="field'+(f.full?' full':'')+'">'+lab+ctrl+'</div>';
  }

  function renderForm(){
    var t=activeTool, s=state[t.id];
    var fields=[{k:"pw",label:"Password to analyze — never type a real one",full:true}];
    formEl.innerHTML='<div class="f-grid">'+fields.map(function(f){ return fieldHtml(f,s); }).join('')+'</div>'
      +'<p class="f-note" style="padding:0 24px 4px">ANALYZED LOCALLY AS YOU TYPE · USE ⟳ SAMPLE TO TEST SAFELY</p>';
  }

  function renderTabs(){
    tabsEl.innerHTML=TOOLS.map(function(t){
      return '<button type="button" class="t-tab'+(t===activeTool?' on':'')+'" data-tool="'+t.id+'" role="tab" aria-selected="'+(t===activeTool)+'">'+t.tab+'</button>';
    }).join('');
  }

  function putCell(i,l,v,sub,tone){
    var b=$("#st-v-"+i);
    $("#st-l-"+i).textContent=l;
    $("#st-s-"+i).textContent=sub||"";
    v=String(v);
    if(b.textContent!==v){
      b.textContent=v;
      b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
      setTimeout(function(){ b.classList.remove("bump"); },200);
    }
    b.classList.remove("pass","fail");
    if(tone==="pass") b.classList.add("pass");
    if(tone==="fail") b.classList.add("fail");
  }

  function renderGauge(score,label){
    gLabel.textContent=label;
    gSegs.innerHTML=GAUSEG.map(function(sg){ return '<i style="width:'+sg.w+'%;background:'+sg.c+'"></i>'; }).join('');
    gMark.style.left=clamp2(score,0,100)+"%";
    gLegend.innerHTML=
      '<span><i class="sw" style="background:#C40000"></i>WEAK<b>0–25</b></span>'+
      '<span><i class="sw" style="background:#C9C9C0"></i>FAIR<b>25–50</b></span>'+
      '<span><i class="sw" style="background:#6E86FF"></i>STRONG<b>50–75</b></span>'+
      '<span><i class="sw" style="background:#0033FF"></i>ELITE<b>75–100</b></span>';
  }

  function passfail(ok){ return ok?["PASS ✓","pass"]:["FAIL ✕","fail"]; }

  function generateAll(){
    var pw=state[activeTool.id].pw;
    var a=analyze(pw);
    if(!pw){
      for(var i=0;i<8;i++){ putCell(i,"AWAITING INPUT","—","type to analyze",""); }
      renderGauge(0,"STRENGTH SCALE — EMPTY INPUT");
      return;
    }

    var cells;
    if(activeTool.id==="checker"){
      var c1=passfail(a.len>=8), c2=passfail(a.len>=12),
          c3=passfail(a.hasUpper), c4=passfail(a.hasLower),
          c5=passfail(a.hasDigit), c6=passfail(a.hasSym),
          c7=passfail(!a.isCommon);
      var passes=[a.len>=8,a.len>=12,a.hasUpper,a.hasLower,a.hasDigit,a.hasSym,!a.isCommon]
        .filter(Boolean).length;
      cells=[
        ["Length ≥ 8", c1[0], "actual: "+a.len+" chars", c1[1]],
        ["Length ≥ 12", c2[0], a.len>=12?"long enough":"add "+(12-a.len)+" more", c2[1]],
        ["Uppercase", c3[0], a.upperCount+" found", c3[1]],
        ["Lowercase", c4[0], a.lowerCount+" found", c4[1]],
        ["Digits", c5[0], a.digitCount+" found", c5[1]],
        ["Symbols", c6[0], a.symCount+" found", c6[1]],
        ["Not common", c7[0], a.isCommon?("contains '"+a.foundPattern+"'"):"no known pattern", c7[1]],
        ["Entropy", a.entropy+" bits", "score "+a.score+"/100", a.score>=60?"pass":"fail"]
      ];
      renderGauge(a.score,"CHECKLIST — "+passes+"/7 PASSED · SCORE "+a.score+"/100 · "+a.rating.toUpperCase());
    } else {
      cells=[
        ["Score", a.score+" /100", a.rating, a.score>=60?"pass":a.score>=40?"":"fail"],
        ["Rating", a.rating, "strength verdict", a.score>=60?"pass":a.score>=40?"":"fail"],
        ["Entropy", a.entropy+" bits", "length × log₂(charset)"],
        ["Charset", a.pool+" symbols", "pool size"],
        ["Combinations", a.log10comb>0?("≈ 10^"+Math.round(a.log10comb)):"—", "keyspace"],
        ["Offline crack", crackLabel(a.entropy,1e10), "10B guesses/s"],
        ["Online crack", crackLabel(a.entropy,100), "100 guesses/s"],
        ["Advice", advice(a), "one concrete fix", a.score>=80?"pass":""]
      ];
      renderGauge(a.score,"STRENGTH — "+a.rating.toUpperCase()+" · "+a.score+"/100 · "+a.entropy+" BITS");
    }
    cells.forEach(function(c,i){ putCell(i,c[0],c[1],c[2],c[3]); });
  }

  function selectTool(id){
    var t=TOOLS.filter(function(x){return x.id===id;})[0];
    if(!t) return;
    activeTool=t;
    renderTabs(); renderForm(); generateAll();
    var inp=$("#fld-"+t.id+"-pw");
    if(inp) inp.focus();
  }

  tabsEl.addEventListener("click", function(e){
    var b=e.target.closest(".t-tab"); if(!b) return;
    selectTool(b.getAttribute("data-tool"));
  });

  formEl.addEventListener("input", function(e){
    var k=e.target.getAttribute("data-k"); if(!k) return;
    state[activeTool.id][k]=e.target.value;
    generateAll();
  });

  /* sample / reset */
  $("#btn-gen").addEventListener("click", function(){
    state[activeTool.id].pw=randomSample();
    renderForm(); generateAll();
  });
  $("#btn-reset").addEventListener("click", function(){
    state[activeTool.id]=activeTool.def();
    renderForm(); generateAll();
  });

  /* guide "runs in the analyzer above" jumps */
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

  /* ---- COPY — copies ONLY the password in the field ---- */
  var btnCopy=$("#btn-copy");
  btnCopy.addEventListener("click", function(){
    var pw=state[activeTool.id].pw||"";
    if(!pw){ flash(btnCopy,"NOTHING TO COPY",true); return; }
    function fallback(){
      var ta=document.createElement("textarea");
      ta.value=pw;
      ta.style.position="fixed";
      ta.style.left="-9999px";
      ta.style.top="0";
      document.body.appendChild(ta);
      ta.select();
      var ok=false;
      try{ ok=document.execCommand("copy"); }catch(err){}
      document.body.removeChild(ta);
      flash(btnCopy, ok?"COPIED ✓":"COPY FAILED", !ok);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(pw).then(
        function(){ flash(btnCopy,"COPIED ✓"); },
        fallback
      );
    } else {
      fallback();
    }
  });

  /* ---- boot ---- */
  renderTabs(); renderForm(); generateAll();
})();
